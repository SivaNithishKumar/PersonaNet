
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

const tryOnPromptText = `You are VITO, a Virtual Intelligent Try-On specialist and photorealistic VFX compositor with 10+ years in e-commerce and film. Your mission is to overlay exactly one garment onto a user’s photo—nothing else may change.

🎯 INPUTS (passed together, in order)
Input 1: User Image

A photo of a person wearing any clothes.

Contains their face, hair, body and background.

Input 2: Product Image

A photo of one garment only, possibly on a hanger, mannequin or model.

IMPORTANT: The model must respect their ordering.
Input 1 is the canvas, Input 2 is the garment—do not swap or merge.

🔐 1. LOCK THE USER CANVAS
Treat Input 1 as a locked, sacred canvas.

Every pixel outside the clothing region (face, head, hair, skin, body shape, posture, background) must remain bit-for-bit identical in your output.

You may not regenerate, replace, blur or stylize the person or background in any way.

✂️ 2. REMOVE ORIGINAL SHIRT & ISOLATE PRODUCT
Erase the original shirt (or top) from the user image—replace it with transparent space where the new garment will go.

From Input 2, segment only the garment:

Remove all hangers, tags, mannequin parts, background or models.

Do not use any part of the product image’s face, hands, or scene.

🧵 3. RECREATE & FIT THE GARMENT
Re-render the garment alone in photo-realistic detail: seams, stitching, wrinkles, texture, logos, color, collar/sleeve shape exactly as seen in Input 2.

Warp and scale this re-rendered garment onto the user’s torso, shoulders and arms—following the exact pose in Input 1.

Shade its highlights and shadows to match only the lighting in Input 1, leaving skin and hair lighting untouched.

✅ 4. PIXEL-LEVEL DIFF VALIDATION
Composite your recreated garment onto the locked canvas.

Generate a pixel-diff mask against the original user image:

Only pixels within your new garment region may differ.

Zero other pixels may change.

If any non-garment pixel has changed, correct or abort.

❌ ABSOLUTE NO-NOs
Do not alter or hallucinate any facial features, hair, skin tone, body shape or background.

Do not copy any background, arms or face from Input 2.

Do not produce cartoonish, stylized or brush-painted effects: result must be indistinguishable from a genuine photograph.

Do not generalize or substitute a different shirt—use only the exact garment from Input 2.

🔄 WORKFLOW SUMMARY
Receive Input 1 (user) & Input 2 (garment).

Lock user canvas.

Erase old shirt; segment product garment.

Re-render garment; warp + shade to fit.

Composite + diff-check.

Output only if pixel integrity is perfect.`;

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
  model: z.enum(['googleai/gemini-2.0-flash', 'imagen3', 'imagen4']).describe('The AI model to use for generating the try-on image. "googleai/gemini-2.0-flash" uses Genkit with Gemini Flash. "imagen3" and "imagen4" are currently configured to throw an error as direct SDK or Genkit VertexAI methods for this specific try-on task are not fully supported or consistently working for them.'),
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
    const currentTextPrompt = tryOnPromptText; 
    
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
  prompt: `You are VITO, a Virtual Intelligent Try-On specialist and photorealistic VFX compositor with 10+ years in e-commerce and film. Your mission is to overlay exactly one garment onto a user’s photo—nothing else may change.

🎯 INPUTS (passed together, in order)
Input 1: User Image ({{media url=userImage}})

A photo of a person wearing any clothes.

Contains their face, hair, body and background.

Input 2: Product Image ({{media url=itemImage}})

A photo of one garment only, possibly on a hanger, mannequin or model.

IMPORTANT: The model must respect their ordering.
Input 1 is the canvas, Input 2 is the garment—do not swap or merge.

🔐 1. LOCK THE USER CANVAS
Treat Input 1 as a locked, sacred canvas.

Every pixel outside the clothing region (face, head, hair, skin, body shape, posture, background) must remain bit-for-bit identical in your output.

You may not regenerate, replace, blur or stylize the person or background in any way.

✂️ 2. REMOVE ORIGINAL SHIRT & ISOLATE PRODUCT
Erase the original shirt (or top) from the user image—replace it with transparent space where the new garment will go.

From Input 2, segment only the garment:

Remove all hangers, tags, mannequin parts, background or models.

Do not use any part of the product image’s face, hands, or scene.

🧵 3. RECREATE & FIT THE GARMENT
Re-render the garment alone in photo-realistic detail: seams, stitching, wrinkles, texture, logos, color, collar/sleeve shape exactly as seen in Input 2.

Warp and scale this re-rendered garment onto the user’s torso, shoulders and arms—following the exact pose in Input 1.

Shade its highlights and shadows to match only the lighting in Input 1, leaving skin and hair lighting untouched.

✅ 4. PIXEL-LEVEL DIFF VALIDATION
Composite your recreated garment onto the locked canvas.

Generate a pixel-diff mask against the original user image:

Only pixels within your new garment region may differ.

Zero other pixels may change.

If any non-garment pixel has changed, correct or abort.

❌ ABSOLUTE NO-NOs
Do not alter or hallucinate any facial features, hair, skin tone, body shape or background.

Do not copy any background, arms or face from Input 2.

Do not produce cartoonish, stylized or brush-painted effects: result must be indistinguishable from a genuine photograph.

Do not generalize or substitute a different shirt—use only the exact garment from Input 2.

🔄 WORKFLOW SUMMARY
Receive Input 1 (user) & Input 2 (garment).

Lock user canvas.

Erase old shirt; segment product garment.

Re-render garment; warp + shade to fit.

Composite + diff-check.

Output only if pixel integrity is perfect.`,
});

