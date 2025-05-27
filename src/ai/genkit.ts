import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// Removed VertexAI plugin as Imagen calls will be direct

export const ai = genkit({
  plugins: [
    googleAI(),
    // vertexAI() // Removed VertexAI
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for tasks like validation
});
