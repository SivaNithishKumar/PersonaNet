
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

// Placeholder __PRODUCT_NAME__ will be replaced dynamically for active calls.
const tryOnPromptText = `You are an AI virtual try-on assistant. Before generating the image, follow these thought process steps:
1.  **Identify the User Image:** This is the first image provided. It is the BASE image. Its core elements – the person's face, head, hair, body pose, and the background – MUST NOT BE ALTERED in any way.
2.  **Identify the Product Image:** This is the second image provided. It shows the clothing item (__PRODUCT_NAME__).
3.  **Isolate the Garment:** From the Product Image, you must mentally (or actually) isolate ONLY the clothing item (__PRODUCT_NAME__). Completely disregard any model, mannequin, or background elements present in the Product Image. Your focus is solely on the garment itself.
4.  **Plan the Overlay:** Determine how the isolated garment will be overlaid onto the User Image. The garment must conform to the User Image's existing pose and body contours realistically.
5.  **Verify Non-Alteration (CRITICAL):** Before proceeding, double-check that your plan involves ABSOLUTELY NO changes to the User Image's face, head, hair, body shape, or background. The ONLY change permitted is the addition of the garment. Every part of the user's original photo that is NOT covered by the new garment MUST remain pixel-for-pixel identical.

Your primary task is to take a photo of a person (first image) and a photo of a clothing item (second image, showing __PRODUCT_NAME__), and create a NEW image where the person from the first image is wearing the clothing item from the second image.

**PRIMARY GOAL: The person in the output image, especially their face, head, hair, pose, and body shape, MUST be IDENTICAL to the person in the first input image. The background of the first image MUST also be IDENTICAL in the output image.** You are ONLY adding the clothing item (__PRODUCT_NAME__). Think of it as a precise "cut and paste" or "digital overlay" of the garment onto the original, unchanged user photo.

Details:
1.  **First Image (User's Photo - The Base Canvas):**
    *   This is your foundational image. The person's face, head (including ALL facial features, expression, hair style and color), body pose, and the entire background from this image **MUST be preserved perfectly and remain IDENTICAL** in your final output.
    *   Do NOT change skin tone, lighting on the person (unless naturally and subtly affected by the new clothing's shadow), or any non-clothed body parts.

2.  **Second Image (Product Photo of __PRODUCT_NAME__ - The Garment Source):**
    *   From this image, extract **ONLY** the clothing item (__PRODUCT_NAME__).
    *   **IGNORE** any model, mannequin, or background elements in this product photo. Your focus is solely on the garment itself.

3.  **Output Image (The Virtual Try-On Result):**
    *   Realistically and precisely overlay the extracted garment (__PRODUCT_NAME__) onto the person from the First Image.
    *   The garment should fit naturally, following the person's existing pose and body contours from the First Image.
    *   The lighting on the garment should appear consistent with the lighting environment of the First Image.

**ABSOLUTE, NON-NEGOTIABLE RULE: DO NOT ALTER THE USER'S FACE, HEAD, OR HAIR IN ANY WAY, SHAPE, OR FORM. THESE FEATURES MUST BE IDENTICAL TO THE FIRST INPUT IMAGE. REPLICATE THEM EXACTLY.**
If the clothing item would naturally cover part of the hair (e.g., a hoodie), the visible parts of the hair must remain identical to how they appear in the First Image. No part of the face should be altered.

Final Check: The output image must look like the original person from the First Image has simply put on the new __PRODUCT_NAME__, while remaining in their original setting and pose. It should NOT look like a different person, a different pose, a different facial expression, or a different background.
If you cannot follow these instructions precisely, especially regarding the preservation of the user's face and original image, do not generate an altered image.
`;

const GenerateAiTryOnInputSchema = z.object({
  userImage: z
    .string()
    .describe(
      "The user's image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  itemImage: z
    .string()
    .describe(
      'The item image as a data URI or an HTTP/S URL. If an HTTP/S URL is provided for SDK calls, it will be fetched and converted. Genkit handles HTTP/S URLs for Gemini calls. Expected format for data URI: data:<mimetype>;base64,<encoded_data>.'
    ),
  model: z.enum(['googleai/gemini-2.0-flash', 'imagen3', 'imagen4']).describe('The AI model to use for generating the try-on image. "googleai/gemini-2.0-flash" uses Genkit with Gemini Flash. "imagen3" uses the @google/generative-ai SDK directly with imagen-3.0-generate-002. "imagen4" currently falls back to Imagen 3 logic.'),
  productName: z.string().describe('The name of the product item being tried on.'),
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
  itemImageUri: string,
  productName: string,
): Promise<GenerateAiTryOnOutput> {
  console.log("_callImagen3WithSDK invoked. UserImage (first 100):", userImageUri ? userImageUri.substring(0,100) : "EMPTY_OR_NULL");
  console.log("_callImagen3WithSDK invoked. ItemImage (first 100):", itemImageUri ? itemImageUri.substring(0,100) : "EMPTY_OR_NULL");
  console.log("_callImagen3WithSDK invoked. ProductName:", productName);


  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    throw new Error("API key for Imagen is not configured.");
  }

  // This will use the globally defined tryOnPromptText, with productName dynamically inserted.
  const currentTryOnPromptText = tryOnPromptText.replace(/__PRODUCT_NAME__/g, productName);

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
      model: "imagen-3.0-generate-002", // This is the target model
       safetySettings: [ 
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    console.log(`Attempting AI try-on with @google/generative-ai SDK. Model: imagen-3.0-generate-002, Product: ${productName}`);
    console.log("This call is expected to fail with a 404 error as 'imagen-3.0-generate-002' does not support 'generateContent' for this type of multimodal input via the Generative Language API.");
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      // generationConfig: { candidateCount: 1 } // Example, might need specific config for image output
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
    console.error(`Model ${input.model} (imagen-3.0-generate-002) is not supported for virtual try-on with the direct SDK's generateContent method.`);
    // This error is thrown because 'generateContent' is generally for Gemini-like models.
    // Imagen models typically use different endpoints/methods for image generation (e.g., edit, specific generation endpoints).
    throw new Error(`The selected Imagen model (${input.model}) is not supported for this virtual try-on task with the current SDK method (generateContent). Please use Gemini Flash instead.`);
    // If _callImagen3WithSDK were to be called for a compatible Imagen "generateContent" scenario, it would be:
    // return _callImagen3WithSDK(input.userImage, input.itemImage, input.productName);
  } else if (input.model === 'googleai/gemini-2.0-flash') {
    let modelId = 'googleai/gemini-2.0-flash-preview-image-generation'; 
    // Dynamically insert product name into the prompt for Gemini Flash
    const currentTryOnPromptText = tryOnPromptText.replace(/__PRODUCT_NAME__/g, input.productName);
    
    let generationParams: any = {
      model: modelId,
      prompt: [
        { media: { url: input.userImage } },
        { media: { url: input.itemImage } }, 
        { text: currentTryOnPromptText } // Use the updated prompt with product name
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.2, // Lower temperature for stricter adherence to prompt
      },
    };
    console.log(`Attempting AI try-on with Genkit (googleAI plugin). Model: ${modelId}, Product: ${input.productName}, Temperature: 0.2`);
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

// This ai.defineFlow is for Genkit's internal registration and potential use with Genkit tools or UI,
// but the actual logic is now dispatched within the generateAiTryOn function.
const generateAiTryOnFlowDefinition = ai.defineFlow(
  {
    name: 'generateAiTryOnFlowDefinition', 
    inputSchema: GenerateAiTryOnInputSchema,
    outputSchema: GenerateAiTryOnOutputSchema,
  },
  async (input: GenerateAiTryOnInput): Promise<GenerateAiTryOnOutput> => {
    // The main exported function 'generateAiTryOn' now contains the dispatch logic.
    return generateAiTryOn(input);
  }
);

// This ai.definePrompt is for potential direct use or as a template reference.
// The tryOnPromptText constant is what's actually used by the Gemini Flash path in generateAiTryOn.
const generateAiTryOnPromptDefinition = ai.definePrompt({
  name: 'generateAiTryOnPromptDefinition',
  input: {schema: GenerateAiTryOnInputSchema},
  output: {schema: GenerateAiTryOnOutputSchema},
  prompt: `You are an AI virtual try-on assistant. Before generating the image, follow these thought process steps:
1.  **Identify the User Image:** This is the first image provided. It is the BASE image. Its core elements – the person's face, head, hair, body pose, and the background – MUST NOT BE ALTERED in any way.
2.  **Identify the Product Image:** This is the second image provided. It shows the clothing item ({{productName}}).
3.  **Isolate the Garment:** From the Product Image, you must mentally (or actually) isolate ONLY the clothing item ({{productName}}). Completely disregard any model, mannequin, or background elements present in the Product Image. Your focus is solely on the garment itself.
4.  **Plan the Overlay:** Determine how the isolated garment will be overlaid onto the User Image. The garment must conform to the User Image's existing pose and body contours realistically.
5.  **Verify Non-Alteration (CRITICAL):** Before proceeding, double-check that your plan involves ABSOLUTELY NO changes to the User Image's face, head, hair, body shape, or background. The ONLY change permitted is the addition of the garment. Every part of the user's original photo that is NOT covered by the new garment MUST remain pixel-for-pixel identical.

Your primary task is to take a photo of a person (first image) and a photo of a clothing item (second image, showing {{productName}}), and create a NEW image where the person from the first image is wearing the clothing item from the second image.

**PRIMARY GOAL: The person in the output image, especially their face, head, hair, pose, and body shape, MUST be IDENTICAL to the person in the first input image. The background of the first image MUST also be IDENTICAL in the output image.** You are ONLY adding the clothing item ({{productName}}). Think of it as a precise "cut and paste" or "digital overlay" of the garment onto the original, unchanged user photo.

User Image (Base Canvas): {{media url=userImage}}
Product Image (Garment Source, showing {{productName}}): {{media url=itemImage}}

Details:
1.  **First Image (User's Photo - The Base Canvas):**
    *   This is your foundational image. The person's face, head (including ALL facial features, expression, hair style and color), body pose, and the entire background from this image **MUST be preserved perfectly and remain IDENTICAL** in your final output.
    *   Do NOT change skin tone, lighting on the person (unless naturally and subtly affected by the new clothing's shadow), or any non-clothed body parts.

2.  **Second Image (Product Photo of {{productName}} - The Garment Source):**
    *   From this image, extract **ONLY** the clothing item ({{productName}}).
    *   **IGNORE** any model, mannequin, or background elements in this product photo. Your focus is solely on the garment itself.

3.  **Output Image (The Virtual Try-On Result):**
    *   Realistically and precisely overlay the extracted garment ({{productName}}) onto the person from the First Image.
    *   The garment should fit naturally, following the person's existing pose and body contours from the First Image.
    *   The lighting on the garment should appear consistent with the lighting environment of the First Image.

**ABSOLUTE, NON-NEGOTIABLE RULE: DO NOT ALTER THE USER'S FACE, HEAD, OR HAIR IN ANY WAY, SHAPE, OR FORM. THESE FEATURES MUST BE IDENTICAL TO THE FIRST INPUT IMAGE. REPLICATE THEM EXACTLY.**
If the clothing item would naturally cover part of the hair (e.g., a hoodie), the visible parts of the hair must remain identical to how they appear in the First Image. No part of the face should be altered.

Final Check: The output image must look like the original person from the First Image has simply put on the new {{productName}}, while remaining in their original setting and pose. It should NOT look like a different person, a different pose, a different facial expression, or a different background.
If you cannot follow these instructions precisely, especially regarding the preservation of the user's face and original image, do not generate an altered image.`,
});

