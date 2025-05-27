'use server';

/**
 * @fileOverview Image validation flow for AI try-on to ensure the image is front-facing and suitable.
 *
 * - validateImage - A function that validates the image and provides suggestions.
 * - ValidateImageInput - The input type for the validateImage function.
 * - ValidateImageOutput - The return type for the validateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ValidateImageInput = z.infer<typeof ValidateImageInputSchema>;

const ValidateImageOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the image is valid for AI try-on or not.'),
  reason: z.string().describe('The reason for invalidity, if any.'),
  suggestions: z.string().describe('Suggestions to improve the image, if any.'),
});
export type ValidateImageOutput = z.infer<typeof ValidateImageOutputSchema>;

export async function validateImage(input: ValidateImageInput): Promise<ValidateImageOutput> {
  return validateImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateImagePrompt',
  input: {schema: ValidateImageInputSchema},
  output: {schema: ValidateImageOutputSchema},
  prompt: `You are an AI image validator for an AI try-on application.  You will determine if the image is suitable for AI try-on.

  Specifically, you will check if the image:
  - Is front-facing
  - Has good lighting
  - Has a clear view of the face

  If the image is not valid, you will provide a reason and suggestions for improvement.

  Here is the image:
  {{media url=photoDataUri}}
`,
});

const validateImageFlow = ai.defineFlow(
  {
    name: 'validateImageFlow',
    inputSchema: ValidateImageInputSchema,
    outputSchema: ValidateImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
