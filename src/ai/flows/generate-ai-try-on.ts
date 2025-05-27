
// The use server directive must come at the top of the file.
'use server';

/**
 * @fileOverview Generates an AI try-on image of a user wearing a selected item using a chosen AI model.
 *
 * - generateAiTryOn - A function that generates the AI try-on image.
 * - GenerateAiTryOnInput - The input type for the generateAiTryOn function.
 * - GenerateAiTryOnOutput - The return type for the generateAiTryOn function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiTryOnInputSchema = z.object({
  userImage: z
    .string()
    .describe(
      "The user's image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  itemImage: z
    .string()
    .describe(
      'The item image as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  model: z.enum(['googleai/gemini-2.0-flash', 'imagen3', 'imagen4']).describe('The AI model to use for generating the try-on image. Internally, "googleai/gemini-2.0-flash" maps to "googleai/gemini-2.0-flash-preview-image-generation", "imagen3" maps to "googleai/imagen-3.0-generate-002", and "imagen4" will attempt to use "googleai/imagen4".'),
});

export type GenerateAiTryOnInput = z.infer<typeof GenerateAiTryOnInputSchema>;

const GenerateAiTryOnOutputSchema = z.object({
  generatedImage: z
    .string()
    .describe('The AI-generated image of the user wearing the selected item, as a data URI.'),
});

export type GenerateAiTryOnOutput = z.infer<typeof GenerateAiTryOnOutputSchema>;

export async function generateAiTryOn(input: GenerateAiTryOnInput): Promise<GenerateAiTryOnOutput> {
  return generateAiTryOnFlow(input);
}

// Note: The 'generateAiTryOnPrompt' (ai.definePrompt) is defined but not currently used by the generateAiTryOnFlow.
// The flow uses a direct ai.generate() call for multi-modal image generation.
const generateAiTryOnPrompt = ai.definePrompt({
  name: 'generateAiTryOnPrompt',
  input: {schema: GenerateAiTryOnInputSchema},
  output: {schema: GenerateAiTryOnOutputSchema},
  prompt: `Generate an image of the user wearing the selected item, use the specified AI model.

User Image: {{media url=userImage}}
Item Image: {{media url=itemImage}}`,
});

const generateAiTryOnFlow = ai.defineFlow(
  {
    name: 'generateAiTryOnFlow',
    inputSchema: GenerateAiTryOnInputSchema,
    outputSchema: GenerateAiTryOnOutputSchema,
  },
  async input => {
    let actualModelToUse: string;

    switch (input.model) {
      case 'googleai/gemini-2.0-flash':
        actualModelToUse = 'googleai/gemini-2.0-flash-preview-image-generation';
        break;
      case 'imagen3':
        actualModelToUse = 'googleai/imagen-3.0-generate-002';
        break;
      case 'imagen4':
        actualModelToUse = 'googleai/imagen4'; // Or a more specific Imagen 4 identifier if known
        break;
      default:
        console.warn(`Unknown model selected: ${input.model}. Defaulting to Gemini Flash for image generation.`);
        actualModelToUse = 'googleai/gemini-2.0-flash-preview-image-generation';
    }
    
    console.log(`Attempting AI try-on with model: ${actualModelToUse}`);

    const {media} = await ai.generate({
      model: actualModelToUse,
      prompt: [
        {media: {url: input.userImage}}, // User image first
        {media: {url: input.itemImage}}, // Item image second
        {text: `Use the first input image of a person as the base image. This person’s face, pose, body, lighting, and background must remain completely unchanged.

Use the second input image of a costume or dress to extract only the clothing design, and overlay it realistically onto the visible parts of the person's body in the first image.

Rules and constraints:

Do not modify the face in any way. Keep the exact facial features, expression, structure, lighting, skin texture, and hair from the original image. No regeneration, smoothing, or stylistic changes.
Do not change the pose, body position, camera angle, or perspective.
Do not create or imagine hidden body parts — preserve what is visible, and leave occluded parts untouched.
Accurately wrap the costume onto the visible body parts, matching the contours, shape, and folds realistically.
Do not alter the background.
The final image must look like the original person is wearing the new outfit — not like a new person or AI-generated lookalike.
Your task is to replace clothing only. Everything else in the image must remain pixel-consistent or visually identical to the original.`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
      },
    });

    if (!media || !media.url) {
      console.error('AI model did not return an image. Response media:', media, 'Model used:', actualModelToUse);
      throw new Error(`AI model (${actualModelToUse}) did not return an image. Please try again, select a different model, or adjust the input images.`);
    }

    return {generatedImage: media.url};
  }
);

