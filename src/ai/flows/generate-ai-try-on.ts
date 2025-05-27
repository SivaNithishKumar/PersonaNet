
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

const tryOnPromptText = `The first input image is the **user's photo**. Treat this as the base: the person’s face, pose, body, lighting, and background from this image **must remain completely unchanged.**

The second input image is the **product photo**. This product photo might show the item on a model or a mannequin. Your task is to **extract *only* the clothing item/garment** from this second (product) image. You must ignore any person, mannequin, or background elements present in the product photo. Focus solely on the garment itself.

Then, realistically overlay this extracted clothing item onto the person in the first (user's) image.

Rules and constraints:

Do not modify the face in any way. Keep the exact facial features, expression, structure, lighting, skin texture, and hair from the original image. No regeneration, smoothing, or stylistic changes.
Do not change the pose, body position, camera angle, or perspective.
Do not create or imagine hidden body parts — preserve what is visible, and leave occluded parts untouched.
Accurately wrap the extracted garment onto the visible body parts of the person in the user's photo, matching the contours, shape, and folds realistically.
Do not alter the background of the user's photo.
The final image must look like the person from the user's photo is wearing the new outfit — not like a new person or AI-generated lookalike.
Your task is to replace clothing only on the person in the user's photo. Everything else in the user's photo must remain pixel-consistent or visually identical to the original.`;

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
  model: z.enum(['googleai/gemini-2.0-flash', 'imagen3', 'imagen4']).describe('The AI model to use for generating the try-on image. "googleai/gemini-2.0-flash" maps to Gemini Flash (via googleAI plugin), "imagen3" maps to Imagen 3 (via vertexAI plugin), and "imagen4" maps to Imagen 4 (via vertexAI plugin).'),
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

const generateAiTryOnPromptDefinition = ai.definePrompt({ // Renamed to avoid conflict
  name: 'generateAiTryOnPromptDefinition', // Renamed
  input: {schema: GenerateAiTryOnInputSchema},
  output: {schema: GenerateAiTryOnOutputSchema},
  prompt: `The first input image (provided as 'User Image' {{media url=userImage}}) is the **user's photo**. Treat this as the base: the person’s face, pose, body, lighting, and background from this image **must remain completely unchanged.**

The second input image (provided as 'Item Image' {{media url=itemImage}}) is the **product photo**. This product photo might show the item on a model or a mannequin. Your task is to **extract *only* the clothing item/garment** from this second (product) image. You must ignore any person, mannequin, or background elements present in the product photo. Focus solely on the garment itself.

Then, realistically overlay this extracted clothing item onto the person in the first (user's) image.

Rules and constraints:

Do not modify the face in any way. Keep the exact facial features, expression, structure, lighting, skin texture, and hair from the original image. No regeneration, smoothing, or stylistic changes.
Do not change the pose, body position, camera angle, or perspective.
Do not create or imagine hidden body parts — preserve what is visible, and leave occluded parts untouched.
Accurately wrap the extracted garment onto the visible body parts of the person in the user's photo, matching the contours, shape, and folds realistically.
Do not alter the background of the user's photo.
The final image must look like the person from the user's photo is wearing the new outfit — not like a new person or AI-generated lookalike.
Your task is to replace clothing only on the person in the user's photo. Everything else in the user's photo must remain pixel-consistent or visually identical to the original.`,
});


const generateAiTryOnFlow = ai.defineFlow(
  {
    name: 'generateAiTryOnFlow',
    inputSchema: GenerateAiTryOnInputSchema,
    outputSchema: GenerateAiTryOnOutputSchema,
  },
  async (input: GenerateAiTryOnInput): Promise<GenerateAiTryOnOutput> => {
    let modelId: string;
    let generationParams: any = { // Using 'any' for flexibility in params
      prompt: [
        { media: { url: input.userImage } },
        { media: { url: input.itemImage } },
        { text: tryOnPromptText }
      ],
    };

    if (input.model === 'googleai/gemini-2.0-flash') {
      modelId = 'googleai/gemini-2.0-flash-preview-image-generation';
      generationParams.config = {
        responseModalities: ['TEXT', 'IMAGE'],
      };
      console.log(`Attempting AI try-on with Genkit (googleAI plugin). Model: ${modelId}`);
    } else if (input.model === 'imagen3') {
      modelId = 'vertexai/imagen3'; // Using Vertex AI plugin for Imagen 3
      generationParams.output = { format: 'media' };
      // generationParams.config = { temperature: 0.7 }; // Optional: add other Imagen specific params
      console.log(`Attempting AI try-on with Genkit (vertexAI plugin). Model: ${modelId}`);
    } else if (input.model === 'imagen4') {
      modelId = 'vertexai/imagen4'; // Using Vertex AI plugin for Imagen 4 (assuming similar naming)
      generationParams.output = { format: 'media' };
      // generationParams.config = { temperature: 0.7 }; // Optional: add other Imagen specific params
      console.log(`Attempting AI try-on with Genkit (vertexAI plugin). Model: ${modelId}`);
    } else {
      console.error(`Unknown model selected: ${input.model}. This model is not configured for generation.`);
      throw new Error(`The selected AI model (${input.model}) is not supported for try-on generation.`);
    }
    
    generationParams.model = modelId;

    try {
      const {media} = await ai.generate(generationParams);

      if (!media || !media.url) {
        console.error('Genkit AI.generate did not return image data. Response media:', media);
        throw new Error(`AI.generate with model ${modelId} did not return image data in the expected format.`);
      }
      return {generatedImage: media.url};

    } catch (error) {
      console.error(`Error during Genkit AI.generate try-on with model ${modelId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during AI generation.';
      throw new Error(`Failed to generate image with ${modelId}: ${errorMessage}`);
    }
  }
);
