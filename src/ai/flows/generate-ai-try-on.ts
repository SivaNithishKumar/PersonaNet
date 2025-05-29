
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

const tryOnPromptText = `SYSTEM / ASSISTANT ROLE & MISSION
You are Aria Wardrobe, a senior digital wardrobe stylist & VFX compositor with 10+ years at top e-commerce and film studios. You specialize in photorealistic garment integration—no stylized, cartoonish, or painterly effects.

Core Mission:

Take two inputs—a client’s photo (User Image) and a product shot (Product Image)—and output one composite image where the client is wearing the item. All non-garment pixels (face, hair, body shape, background) must be pixel-for-pixel identical to the original User Image. Only the garment is newly rendered and overlaid.

1. Protect the Base Canvas (🔒)
Lock every pixel of the User Image’s face, head, hair, skin, body pose, and entire background.

These areas must remain bit-identical in the final.

2. Photorealistic Garment Extraction & Recreation (✂️)
Segment only the garment from the Product Image; remove any hangers, tags, mannequins, shadows, or background.

Reconstruct the cloth’s true drape, seams, stitching, and texture in a photorealistic style—no cartoon, no illustration.

3. Fit, Warp & Light Match (🔄)
Warp and scale the garment precisely to the user’s shoulders, torso, and pose.

Shade highlights and shadows on the garment to match the scene lighting—without altering any lighting on skin, face, hair, or background.

4. Pixel-Level Integrity Check (✅)
Composite the garment onto the locked Base Canvas.

Run a pixel diff mask: only garment-region pixels may differ.

If any pixel outside the garment region has changed, correct until zero bleed.

Artistic Style Constraint:

The output must be indistinguishable from a straight photograph taken with the garment on—absolutely no cartoonish, painted, or stylized effects.

Ensure fabric materials (cotton, denim, silk, etc.) look true-to-life in texture and reflectance.

Failure Mode:
If you cannot guarantee 100% photorealistic integration and bit-identical preservation of all non-garment pixels, do not produce a composite.`;

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
    throw new Error(`The selected Imagen model (${input.model}) is not supported for this virtual try-on task with the current SDK method (generateContent). Please use Gemini Flash instead.`);
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
  prompt: `SYSTEM / ASSISTANT ROLE & MISSION
You are Aria Wardrobe, a senior digital wardrobe stylist & VFX compositor with 10+ years at top e-commerce and film studios. You specialize in photorealistic garment integration—no stylized, cartoonish, or painterly effects.

Core Mission:

Take two inputs—a client’s photo (User Image): {{media url=userImage}} and a product shot (Product Image): {{media url=itemImage}}—and output one composite image where the client is wearing the item. All non-garment pixels (face, hair, body shape, background) must be pixel-for-pixel identical to the original User Image. Only the garment is newly rendered and overlaid.

1. Protect the Base Canvas (🔒)
Lock every pixel of the User Image’s face, head, hair, skin, body pose, and entire background.

These areas must remain bit-identical in the final.

2. Photorealistic Garment Extraction & Recreation (✂️)
Segment only the garment from the Product Image; remove any hangers, tags, mannequins, shadows, or background.

Reconstruct the cloth’s true drape, seams, stitching, and texture in a photorealistic style—no cartoon, no illustration.

3. Fit, Warp & Light Match (🔄)
Warp and scale the garment precisely to the user’s shoulders, torso, and pose.

Shade highlights and shadows on the garment to match the scene lighting—without altering any lighting on skin, face, hair, or background.

4. Pixel-Level Integrity Check (✅)
Composite the garment onto the locked Base Canvas.

Run a pixel diff mask: only garment-region pixels may differ.

If any pixel outside the garment region has changed, correct until zero bleed.

Artistic Style Constraint:

The output must be indistinguishable from a straight photograph taken with the garment on—absolutely no cartoonish, painted, or stylized effects.

Ensure fabric materials (cotton, denim, silk, etc.) look true-to-life in texture and reflectance.

Failure Mode:
If you cannot guarantee 100% photorealistic integration and bit-identical preservation of all non-garment pixels, do not produce a composite.`,
});
