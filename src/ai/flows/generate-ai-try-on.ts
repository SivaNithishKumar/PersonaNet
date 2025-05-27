
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
  model: z.enum(['googleai/gemini-2.0-flash', 'imagen3', 'imagen4']).describe('The AI model to use for generating the try-on image. Note: Currently, only googleai/gemini-2.0-flash-exp is used internally for image generation regardless of this selection.'),
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
    // IMPORTANT: Per Genkit guidelines, ONLY the 'googleai/gemini-2.0-flash-exp' model
    // is currently able to generate images. We will use this model regardless of input.model.
    const imageGenerationModel = 'googleai/gemini-2.0-flash-exp';

    const {media} = await ai.generate({
      model: imageGenerationModel,
      prompt: [
        {media: {url: input.userImage}}, // User image first
        {media: {url: input.itemImage}}, // Item image second
        {text: "Create a new photorealistic image. This new image must clearly show the person from the first image (User Image) wearing the clothing item from the second image (Item Image). It is crucial to preserve the person's original appearance, face, and pose from the User Image as accurately as possible. The clothing item from the Item Image should be realistically adapted, resized, and fitted onto the person. The final output must be a single, new, combined image. Do not simply return or slightly alter one of the original input images. Generate a high-quality try-on image."},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
      },
    });

    if (!media || !media.url) {
      // This case can happen if the model decides to only return text or if generation fails.
      console.error('AI model did not return an image. Response media:', media);
      // Attempt to get text if available for more debug info
      // const response = await ai.generate(...); // This would be a re-run
      // const textContent = response.text; // Or some way to get the text from the original call
      // throw new Error(`AI model did not return an image. Text response: ${textContent || 'No text content'}`);
      throw new Error('AI model did not return an image. Please try again or adjust the input images.');
    }

    return {generatedImage: media.url};
  }
);

