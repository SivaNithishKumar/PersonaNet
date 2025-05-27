
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
import {GenerateMediaOptions, GenerateMediaOutput} from 'genkit/generate';
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
  model: z.enum(['googleai/gemini-2.0-flash', 'imagen3', 'imagen4']).describe('The AI model to use for generating the try-on image. "googleai/gemini-2.0-flash" maps to Gemini Flash, "imagen3" maps to Imagen 3 (direct API call), and "imagen4" maps to Imagen 4 (currently falls back to Imagen 3 direct API call).'),
});

export type GenerateAiTryOnInput = z.infer<typeof GenerateAiTryOnInputSchema>;

const GenerateAiTryOnOutputSchema = z.object({
  generatedImage: z
    .string()
    .describe('The AI-generated image of the user wearing the selected item, as a data URI.'),
});

export type GenerateAiTryOnOutput = z.infer<typeof GenerateAiTryOnOutputSchema>;


// Helper to extract base64 data and mime type from data URI
function parseDataUri(dataUri: string): { mimeType: string; base64Data: string } | null {
  const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64Data: match[2] };
}

async function _callImagenDirectly(input: GenerateAiTryOnInput, imagenApiModel: string): Promise<GenerateAiTryOnOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const userImageParsed = parseDataUri(input.userImage);
  const itemImageParsed = parseDataUri(input.itemImage);

  if (!userImageParsed || !itemImageParsed) {
    throw new Error("Invalid user or item image data URI format.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${imagenApiModel}:predict?key=${apiKey}`;

  // Experimental: Constructing a multimodal prompt for Imagen's 'predict' endpoint.
  // This structure is a guess based on Gemini's generateContent API.
  // The standard Imagen 'predict' or 'generateImages' APIs usually take a simple text prompt.
  // Success for try-on (multi-image input) depends on this endpoint supporting such a payload.
  const requestBody = {
    instances: [
      {
        // Option 1: Simple text prompt (will likely not perform try-on correctly)
        // prompt: tryOnPromptText 
        // Option 2: Attempting a multimodal prompt structure (EXPERIMENTAL for Imagen 'predict')
        // This structure is more aligned with how Gemini's `generateContent` handles multimodal.
        // We are trying to pass the two images and the detailed text prompt.
        // The `role` field might not be applicable to Imagen predict; `contents` or a flat array of parts might be alternatives.
        // This is highly speculative for Imagen's `predict` endpoint.
         prompt: { // Using a structure similar to Vertex AI foundational model image generation payloads
          parts: [
            { text: "User photo (base image):" },
            { inline_data: { mime_type: userImageParsed.mimeType, data: userImageParsed.base64Data } },
            { text: "Product photo (extract garment from this):" },
            { inline_data: { mime_type: itemImageParsed.mimeType, data: itemImageParsed.base64Data } },
            { text: `Instructions for try-on: ${tryOnPromptText}` }
          ]
        }
      }
    ],
    parameters: {
      sampleCount: 1, // Or other relevant parameters for Imagen
      // aspect_ratio: "1:1", // Example, if supported
      // mode: "edit" or "inpaint" if such parameters exist and are known
    }
  };
  
  console.log(`Calling Imagen directly. Endpoint: ${endpoint}, Model: ${imagenApiModel}`);
  // console.log('Imagen request payload:', JSON.stringify(requestBody, null, 2));


  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Imagen API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Imagen API request failed with status ${response.status}: ${errorBody}`);
    }

    const responseData = await response.json();
    // console.log('Imagen API responseData:', JSON.stringify(responseData, null, 2));

    // Assuming the response contains predictions with base64 encoded image data
    // The exact path to the image data might vary based on Imagen's `predict` API response structure.
    // Common structures: responseData.predictions[0].bytesBase64Encoded, responseData.predictions[0].image.bytes
    // This needs to be verified against actual API response.
    const base64ImageData = responseData?.predictions?.[0]?.bytesBase64Encoded || responseData?.predictions?.[0]?.imageBytes; // Adjusted to check common paths

    if (!base64ImageData) {
      console.error('No image data found in Imagen response:', responseData);
      throw new Error('Imagen API did not return image data in the expected format.');
    }

    // Assuming PNG, adjust mime type if the API returns a different format or specifies it.
    return { generatedImage: `data:image/png;base64,${base64ImageData}` };

  } catch (error) {
    console.error(`Error calling Imagen directly (${imagenApiModel}):`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during direct Imagen call.';
    throw new Error(`Failed to generate image with Imagen (${imagenApiModel}): ${errorMessage}. Check server logs for details. This direct API call method for try-on is experimental.`);
  }
}


export async function generateAiTryOn(input: GenerateAiTryOnInput): Promise<GenerateAiTryOnOutput> {
  return generateAiTryOnFlow(input);
}

// This `ai.definePrompt` is not directly used by the flow's logic below if direct calls are made,
// but kept for potential future Genkit-native integrations or reference.
const generateAiTryOnPrompt = ai.definePrompt({
  name: 'generateAiTryOnPrompt',
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
    
    let modelToUse: string;

    if (input.model === 'googleai/gemini-2.0-flash') {
      modelToUse = 'googleai/gemini-2.0-flash-preview-image-generation';
      const generationOptions: GenerateMediaOptions = {
        model: modelToUse,
        prompt: [
          {media: {url: input.userImage}},
          {media: {url: input.itemImage}},
          {text: tryOnPromptText},
        ],
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      };
      console.log(`Attempting AI try-on with Genkit (Gemini Flash). Model: ${modelToUse}`);
      try {
        const response: GenerateMediaOutput = await ai.generate(generationOptions);
        if (!response.media || !response.media.url) {
          console.error('Genkit AI model (Gemini) did not return an image. Response:', response);
          throw new Error(`Genkit AI model (Gemini - ${modelToUse}) did not return an image.`);
        }
        return {generatedImage: response.media.url};
      } catch (error) {
        console.error(`Error during Genkit AI try-on (Gemini - ${modelToUse}):`, error);
        throw error; // Re-throw to be caught by caller
      }

    } else if (input.model === 'imagen3' || input.model === 'imagen4') {
      // For 'imagen4', we use 'imagen-3.0-generate-002' as a fallback as no specific Imagen 4 endpoint was given for direct call.
      const imagenApiModel = 'imagen-3.0-generate-002'; 
      console.log(`Attempting AI try-on with Direct API Call (Imagen). Selected UI model: ${input.model}, Actual API model: ${imagenApiModel}`);
      return _callImagenDirectly(input, imagenApiModel);
    
    } else {
      console.warn(`Unknown model selected: ${input.model}. Defaulting to Gemini Flash via Genkit.`);
       modelToUse = 'googleai/gemini-2.0-flash-preview-image-generation';
        const generationOptions: GenerateMediaOptions = {
          model: modelToUse,
          prompt: [
            {media: {url: input.userImage}},
            {media: {url: input.itemImage}},
            {text: tryOnPromptText},
          ],
          config: { responseModalities: ['TEXT', 'IMAGE'] },
        };
         try {
            const response: GenerateMediaOutput = await ai.generate(generationOptions);
            if (!response.media || !response.media.url) {
                console.error('Genkit AI model (Gemini Fallback) did not return an image. Response:', response);
                throw new Error(`Genkit AI model (Gemini Fallback - ${modelToUse}) did not return an image.`);
            }
            return {generatedImage: response.media.url};
        } catch (error) {
            console.error(`Error during Genkit AI try-on (Gemini Fallback - ${modelToUse}):`, error);
            throw error;
        }
    }
  }
);
