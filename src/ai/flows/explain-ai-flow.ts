
'use server';
/**
 * @fileOverview An AI flow to explain concepts.
 *
 * - explainConcept - A function that takes a text prompt and returns an explanation.
 * - ExplainConceptInput - The input type for the explainConcept function.
 * - ExplainConceptOutput - The return type for the explainConcept function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExplainConceptInputSchema = z.object({
  prompt: z.string().min(1).describe('The concept or question to be explained.'),
});
export type ExplainConceptInput = z.infer<typeof ExplainConceptInputSchema>;

const ExplainConceptOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation for the given prompt.'),
});
export type ExplainConceptOutput = z.infer<typeof ExplainConceptOutputSchema>;

export async function explainConcept(input: ExplainConceptInput): Promise<ExplainConceptOutput> {
  return explainConceptFlow(input);
}

const explainPrompt = ai.definePrompt({
  name: 'explainConceptPrompt',
  input: {schema: ExplainConceptInputSchema},
  output: {schema: ExplainConceptOutputSchema},
  prompt: `Explain the following concept or answer the question concisely:

"{{{prompt}}}"

Provide the explanation directly.`,
});

const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: ExplainConceptInputSchema,
    outputSchema: ExplainConceptOutputSchema,
  },
  async (input) => {
    const {output} = await explainPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid explanation.');
    }
    return output;
  }
);
