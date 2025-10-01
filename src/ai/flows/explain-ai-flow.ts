

'use server';
/**
 * @fileOverview An AI flow to explain concepts.
 *
 * - explainConcept - A function that takes a text prompt and returns an explanation.
 * - ExplainConceptInput - The input type for the explainConcept function.
 * - ExplainConceptOutput - The return type for the explainConcept function.
 */

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
  const { getModel } = await import('@/ai/genkit');
  const model = getModel();
  
  const prompt = `Explain the following concept or answer the question concisely:

"${input.prompt}"

Respond ONLY with valid JSON in this exact format:
{
  "explanation": "your detailed explanation here"
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  
  // Extract JSON from the response
  let jsonText = responseText;
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  const output = JSON.parse(jsonText) as ExplainConceptOutput;
  return output;
}
