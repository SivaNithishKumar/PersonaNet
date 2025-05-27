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
import { GoogleGenerativeAI, Part, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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
  model: z.enum(['googleai/gemini-2.0-flash', 'imagen3', 'imagen4']).describe('The AI model to use for generating the try-on image. "googleai/gemini-2.0-flash" uses Genkit with Gemini Flash. "imagen3" uses the @google/generative-ai SDK directly with imagen-3.0-generate-002. "imagen4" currently falls back to Imagen 3 logic.'),
});

export type GenerateAiTryOnInput = z.infer<typeof GenerateAiTryOnInputSchema>;

const GenerateAiTryOnOutputSchema = z.object({
  generatedImage: z
    .string()
    .describe('The AI-generated image of the user wearing the selected item, as a data URI.'),
});

export type GenerateAiTryOnOutput = z.infer<typeof GenerateAiTryOnOutputSchema>;

// Helper to extract base64 data and mime type from data URI
function getImageDetailsFromDataURI(dataUri: string): { mimeType: string; data: string } {
  const match = dataUri.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    console.error("Invalid image data URI format:", dataUri.substring(0, 100) + "...");
    throw new Error('Invalid image data URI. Expected format: data:<mimetype>;base64,<encoded_data>');
  }
  return { mimeType: match[1], data: match[2] };
}


async function _callImagen3WithSDK(
  userImageUri: string,
  itemImageUri: string,
  promptText: string
): Promise<GenerateAiTryOnOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    throw new Error("API key for Imagen is not configured.");
  }

  try {
    const userImageDetails = getImageDetailsFromDataURI(userImageUri);
    const itemImageDetails = getImageDetailsFromDataURI(itemImageUri);

    const parts: Part[] = [
      { inlineData: { mimeType: userImageDetails.mimeType, data: userImageDetails.data } },
      { inlineData: { mimeType: itemImageDetails.mimeType, data: itemImageDetails.data } },
      { text: promptText },
    ];
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "imagen-3.0-generate-002", // Using the specific model name for Imagen 3
       safetySettings: [ // Default safety settings, adjust as needed
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    console.log(`Attempting AI try-on with @google/generative-ai SDK. Model: imagen-3.0-generate-002`);
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        // For Imagen, we expect an image. If the API supports `responseMimeType` or specific
        // modalities for image output with `generateContent`, they could be set here.
        // Based on typical Imagen usage, it directly outputs image bytes.
        // The example snippet for Gemini used responseModalities, but Imagen might differ.
        // Let's assume the model will return an image part if successful with this input.
        // No specific generationConfig for image output like responseMimeType is used here,
        // relying on the model's default behavior for image generation tasks.
      }
    });

    const response = result.response;
    let generatedImageDataUri: string | null = null;

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            generatedImageDataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            console.log("Image successfully generated by Imagen 3 SDK call.");
            break; 
          }
        }
      }
    }

    if (!generatedImageDataUri) {
      console.error('Imagen 3 SDK (generateContent) did not return image data. Full response:', JSON.stringify(response, null, 2));
      throw new Error('Imagen 3 SDK (generateContent) did not return image data in the expected format.');
    }
    return { generatedImage: generatedImageDataUri };

  } catch (error) {
    console.error(`Error during Imagen 3 SDK call:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during Imagen 3 SDK generation.';
    throw new Error(`Failed to generate image with Imagen 3 SDK: ${errorMessage}`);
  }
}


export async function generateAiTryOn(input: GenerateAiTryOnInput): Promise<GenerateAiTryOnOutput> {
  if (input.model === 'imagen3' || input.model === 'imagen4') { // Imagen 4 falls back to Imagen 3 logic
    console.log(`Routing to Imagen 3 SDK for model: ${input.model}`);
    return _callImagen3WithSDK(input.userImage, input.itemImage, tryOnPromptText);
  } else if (input.model === 'googleai/gemini-2.0-flash') {
    let modelId = 'googleai/gemini-2.0-flash-preview-image-generation';
    let generationParams: any = {
      model: modelId,
      prompt: [
        { media: { url: input.userImage } },
        { media: { url: input.itemImage } },
        { text: tryOnPromptText }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    };
    console.log(`Attempting AI try-on with Genkit (googleAI plugin). Model: ${modelId}`);
    try {
      const {media} = await ai.generate(generationParams);
      if (!media || !media.url) {
        console.error('Genkit AI.generate (Gemini) did not return image data. Response media:', media);
        throw new Error(`AI.generate with model ${modelId} did not return image data in the expected format.`);
      }
      return {generatedImage: media.url};
    } catch (error) {
      console.error(`Error during Genkit AI.generate try-on with model ${modelId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during AI generation.';
      throw new Error(`Failed to generate image with ${modelId}: ${errorMessage}`);
    }
  } else {
    console.error(`Unknown model selected: ${input.model}. This model is not configured for generation.`);
    throw new Error(`The selected AI model (${input.model}) is not supported for try-on generation.`);
  }
}

// Note: The ai.defineFlow and ai.definePrompt are not strictly necessary if generateAiTryOn is called directly
// and not as a registered Genkit flow. However, keeping them might be useful for future Genkit tooling/dev experience.
// For this direct SDK integration path, generateAiTryOn itself acts as the primary exported function.

const generateAiTryOnFlowDefinition = ai.defineFlow(
  {
    name: 'generateAiTryOnFlowDefinition', // Renamed to avoid conflict if not directly used
    inputSchema: GenerateAiTryOnInputSchema,
    outputSchema: GenerateAiTryOnOutputSchema,
  },
  async (input: GenerateAiTryOnInput): Promise<GenerateAiTryOnOutput> => {
    // This definition of flow now acts as a wrapper if we were to call it via Genkit's flow server,
    // but the primary logic is in the exported generateAiTryOn function.
    return generateAiTryOn(input);
  }
);

const generateAiTryOnPromptDefinition = ai.definePrompt({
  name: 'generateAiTryOnPromptDefinition',
  input: {schema: GenerateAiTryOnInputSchema},
  // Output schema for the prompt is not directly used when calling SDK, but good for documentation
  output: {schema: GenerateAiTryOnOutputSchema}, 
  prompt: `User Image: {{media url=userImage}}, Item Image: {{media url=itemImage}}. Instructions: ${tryOnPromptText}`,
});
