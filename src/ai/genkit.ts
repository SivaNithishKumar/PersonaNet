import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {vertexAI} from '@genkit-ai/vertexai';

export const ai = genkit({
  plugins: [
    googleAI(),
    vertexAI()
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for tasks like validation
});
