
'use server';
/**
 * @fileOverview An AI flow to check and correct the grammar of a given text.
 *
 * - grammarCheck - A function that takes text and returns a grammatically corrected version.
 * - GrammarCheckInput - The input type for the flow.
 * - GrammarCheckOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GrammarCheckInputSchema = z.object({
  text: z.string().describe('The text to be checked for grammar and spelling.'),
});
export type GrammarCheckInput = z.infer<typeof GrammarCheckInputSchema>;

const GrammarCheckOutputSchema = z.object({
  correctedText: z.string().describe('The grammatically corrected version of the input text.'),
});
export type GrammarCheckOutput = z.infer<typeof GrammarCheckOutputSchema>;

export async function grammarCheck(input: GrammarCheckInput): Promise<GrammarCheckOutput> {
  return grammarCheckFlow(input);
}

const grammarCheckPrompt = ai.definePrompt({
  name: 'grammarCheckPrompt',
  input: {schema: GrammarCheckInputSchema},
  output: {schema: GrammarCheckOutputSchema},
  prompt: `You are an expert in English grammar and style.
Your task is to correct the grammar and spelling mistakes in the following text.
Do not change the meaning of the text. Only correct errors.
If the text is already grammatically correct, return the original text.

Input Text:
"{{{text}}}"

Corrected Text:
`,
});

const grammarCheckFlow = ai.defineFlow(
  {
    name: 'grammarCheckFlow',
    inputSchema: GrammarCheckInputSchema,
    outputSchema: GrammarCheckOutputSchema,
  },
  async (input) => {
    // If input text is empty or very short, no need to call the model.
    if (!input.text || input.text.trim().length < 2) {
      return { correctedText: input.text };
    }

    const {output} = await grammarCheckPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid grammar correction.');
    }
    return output;
  }
);
