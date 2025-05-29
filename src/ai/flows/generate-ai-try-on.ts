
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

const tryOnPromptText = `System Role
You are VITO (Virtual Intelligent Try-On) — an AI specialist in photorealistic garment overlay. Your purpose is to digitally dress real users in new garments without changing who they are, where they are, or how they look. You must perfectly overlay the product onto the user image without hallucinations, swaps, or replacements.

📸 INPUT RULES
Image 1: User Image (Base Image)
This is the original, real-world photo of the user. It includes their:

Face, head, hair

Body, pose, hands

Lighting and full background

✅ This image is sacred. Every pixel outside the clothing area must remain 100% unchanged.
❌ You are not allowed to generate or hallucinate a new person.
❌ You must not change lighting, face structure, skin, hair, or background.

Image 2: Product Image (Garment Source)
This image contains only the clothing item. It may be worn by a model, on a hanger, or on a mannequin.

✅ Your job is to mentally extract the garment only.
❌ Ignore everything else — the face, background, arms, etc.

👗 YOUR PRIMARY TASK
You must overlay the exact garment from the product image onto the original user image. The final result must look like the same person is now wearing the product, in the same place, same pose, with:

The face, hair, and background exactly preserved

The garment fitted naturally based on user’s body pose

The garment visually matching the product photo exactly (logos, color, wrinkles, fabric texture, sleeve style, collar shape, etc.)

🧠 HOW TO THINK ABOUT IT
Think of the user image as a locked canvas — untouchable except for the clothing area.

Think of the garment as a transparent overlay you are cutting and fitting onto the person.

You are not generating a new photo — you are editing the old one by digitally "dressing" the person.

❌ HARD RESTRICTIONS
You MUST NOT:

Change or blur the user’s face, head, hair, or skin

Replace the background with anything else

Blend the product image background into the user image

Use the face, hands, or pose from the product image

"Fit" the person into the product — you are fitting the product onto the person

✅ FINAL CHECKPOINT BEFORE OUTPUT
Only generate the output if:

The face, hair, and background are pixel-identical to the original user image

The product garment is a 1:1 visual replica of the original, with accurate color, pattern, and shape

The garment fits realistically over the body, considering folds, shadows, and body curvature

The result looks like the same photo, except the user has now changed clothes`;

const GenerateAiTryOnInputSchema = z.object({
  userImage: z
    .string()
    .describe(
      "The user's image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  itemImage: z
    .string()
    .describe(
      'The item image as a data URI or an HTTP/S URL. Genkit handles HTTP/S URLs for Gemini calls. For direct SDK calls, HTTP/S URLs must be fetched and converted. Expected format for data URI: data:<mimetype>;base64,<encoded_data>.'
    ),
  model: z.enum(['googleai/gemini-2.0-flash', 'imagen3', 'imagen4']).describe('The AI model to use for generating the try-on image. "googleai/gemini-2.0-flash" uses Genkit with Gemini Flash (googleai/gemini-2.0-flash-preview-image-generation). "imagen3" and "imagen4" are currently configured to throw an error as the direct SDK method for this try-on task is not supported for them.'),
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
  if (!dataUri || typeof dataUri !== 'string') {
    console.error("getImageDetailsFromDataURI called with invalid input:", dataUri);
    throw new Error('Invalid input: dataUri must be a non-empty string.');
  }
  console.log("Attempting to parse data URI (first 100 chars):", dataUri.substring(0, 100));
  const match = dataUri.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    console.error("Failed to parse data URI. Input (first 100 chars):", dataUri.substring(0, 100));
    throw new Error('Invalid image data URI. Expected format: data:<mimetype>;base64,<encoded_data>');
  }
  return { mimeType: match[1], data: match[2] };
}


async function _callImagen3WithSDK(
  userImageUri: string,
  itemImageUri: string
): Promise<GenerateAiTryOnOutput> {
  console.log("_callImagen3WithSDK invoked. UserImage (first 100):", userImageUri ? userImageUri.substring(0,100) : "EMPTY_OR_NULL");
  console.log("_callImagen3WithSDK invoked. ItemImage (first 100):", itemImageUri ? itemImageUri.substring(0,100) : "EMPTY_OR_NULL");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    throw new Error("API key for Imagen is not configured.");
  }

  // Use the globally defined tryOnPromptText for consistency
  const currentTryOnPromptText = tryOnPromptText; 

  try {
    const userImageDetails = getImageDetailsFromDataURI(userImageUri);
    let finalItemImageDetails: { mimeType: string; data: string };

    if (itemImageUri.startsWith('data:')) {
      finalItemImageDetails = getImageDetailsFromDataURI(itemImageUri);
    } else if (itemImageUri.startsWith('http')) {
      try {
        console.log(`Fetching item image from URL: ${itemImageUri}`);
        const response = await fetch(itemImageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch item image from ${itemImageUri}. Status: ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`Invalid content type for item image: ${contentType}. Expected an image.`);
        }
        const imageBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(imageBuffer).toString('base64');
        finalItemImageDetails = { mimeType: contentType, data: base64Data };
        console.log(`Successfully fetched and converted item image. MimeType: ${finalItemImageDetails.mimeType}, Data length: ${finalItemImageDetails.data.length}`);
      } catch (error) {
        console.error('Error fetching or converting HTTP item image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not process item image URL.';
        throw new Error(`Failed to process item image from URL: ${errorMessage}`);
      }
    } else {
      console.error("Item image URI is not a valid data URI or HTTP/S URL (first 100 chars):", itemImageUri.substring(0,100));
      throw new Error('Invalid item image URI format. Expected a data URI or an HTTP/S URL for SDK call.');
    }

    const parts: Part[] = [
      { inlineData: { mimeType: userImageDetails.mimeType, data: userImageDetails.data } },
      { inlineData: { mimeType: finalItemImageDetails.mimeType, data: finalItemImageDetails.data } },
      { text: currentTryOnPromptText },
    ];
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "imagen-3.0-generate-002", 
       safetySettings: [ 
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    console.log(`Attempting AI try-on with @google/generative-ai SDK. Model: imagen-3.0-generate-002`);
    console.log("This call is expected to fail with a 404 error as 'imagen-3.0-generate-002' does not support 'generateContent' for this type of multimodal input via the Generative Language API.");
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
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
    return {generatedImage: generatedImageDataUri};

  } catch (error) {
    console.error(`Error during Imagen 3 SDK call:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during Imagen 3 SDK generation.';
    throw new Error(`Failed to generate image with Imagen 3 SDK: ${errorMessage}`);
  }
}


export async function generateAiTryOn(input: GenerateAiTryOnInput): Promise<GenerateAiTryOnOutput> {
  if (input.model === 'imagen3' || input.model === 'imagen4') {
    console.error(`Model ${input.model} (imagen-3.0-generate-002 or similar) is not supported for virtual try-on with the direct SDK's generateContent method for this task.`);
    // This path currently throws an error, as direct SDK calls for Imagen with generateContent for this task are not supported.
    throw new Error(`The selected Imagen model (${input.model}) is not supported for this virtual try-on task with the current SDK method (generateContent). Please use Gemini Flash instead.`);
    // If you were to attempt the SDK call here, it would be:
    // return _callImagen3WithSDK(input.userImage, input.itemImage);
  } else if (input.model === 'googleai/gemini-2.0-flash') {
    let modelId = 'googleai/gemini-2.0-flash-preview-image-generation'; 
    const currentTextPrompt = tryOnPromptText; // Use the globally defined prompt
    
    let generationParams: any = {
      model: modelId,
      prompt: [
        { media: { url: input.userImage } },
        { media: { url: input.itemImage } }, 
        { text: currentTextPrompt }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.2, 
      },
    };
    console.log(`Attempting AI try-on with Genkit (googleAI plugin). Model: ${modelId}, Temperature: ${generationParams.config.temperature}`);
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

const generateAiTryOnFlowDefinition = ai.defineFlow(
  {
    name: 'generateAiTryOnFlowDefinition', 
    inputSchema: GenerateAiTryOnInputSchema,
    outputSchema: GenerateAiTryOnOutputSchema,
  },
  async (input: GenerateAiTryOnInput): Promise<GenerateAiTryOnOutput> => {
    return generateAiTryOn(input);
  }
);

const generateAiTryOnPromptDefinition = ai.definePrompt({
  name: 'generateAiTryOnPromptDefinition',
  input: {schema: GenerateAiTryOnInputSchema}, 
  output: {schema: GenerateAiTryOnOutputSchema},
  prompt: `System Role
You are VITO (Virtual Intelligent Try-On) — an AI specialist in photorealistic garment overlay. Your purpose is to digitally dress real users in new garments without changing who they are, where they are, or how they look. You must perfectly overlay the product onto the user image without hallucinations, swaps, or replacements.

User Image (Base Image): {{media url=userImage}}
Product Image (Garment Source): {{media url=itemImage}}

📸 INPUT RULES
Image 1: User Image (Base Image)
This is the original, real-world photo of the user. It includes their:

Face, head, hair

Body, pose, hands

Lighting and full background

✅ This image is sacred. Every pixel outside the clothing area must remain 100% unchanged.
❌ You are not allowed to generate or hallucinate a new person.
❌ You must not change lighting, face structure, skin, hair, or background.

Image 2: Product Image (Garment Source)
This image contains only the clothing item. It may be worn by a model, on a hanger, or on a mannequin.

✅ Your job is to mentally extract the garment only.
❌ Ignore everything else — the face, background, arms, etc.

👗 YOUR PRIMARY TASK
You must overlay the exact garment from the product image onto the original user image. The final result must look like the same person is now wearing the product, in the same place, same pose, with:

The face, hair, and background exactly preserved

The garment fitted naturally based on user’s body pose

The garment visually matching the product photo exactly (logos, color, wrinkles, fabric texture, sleeve style, collar shape, etc.)

🧠 HOW TO THINK ABOUT IT
Think of the user image as a locked canvas — untouchable except for the clothing area.

Think of the garment as a transparent overlay you are cutting and fitting onto the person.

You are not generating a new photo — you are editing the old one by digitally "dressing" the person.

❌ HARD RESTRICTIONS
You MUST NOT:

Change or blur the user’s face, head, hair, or skin

Replace the background with anything else

Blend the product image background into the user image

Use the face, hands, or pose from the product image

"Fit" the person into the product — you are fitting the product onto the person

✅ FINAL CHECKPOINT BEFORE OUTPUT
Only generate the output if:

The face, hair, and background are pixel-identical to the original user image

The product garment is a 1:1 visual replica of the original, with accurate color, pattern, and shape

The garment fits realistically over the body, considering folds, shadows, and body curvature

The result looks like the same photo, except the user has now changed clothes`,
});

