import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// Removed VertexAI plugin as it's not used for Imagen with the direct SDK approach.

export const ai = genkit({
  plugins: [
    googleAI(),
    // vertexAI() // Removed
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for tasks like validation
});
