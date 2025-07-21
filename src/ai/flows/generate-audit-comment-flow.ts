
'use server';
/**
 * @fileOverview An AI flow to generate a constructive comment for a QA audit item.
 *
 * - generateAuditComment - A function that takes a parameter name and score to generate a comment.
 * - GenerateAuditCommentInput - The input type for the flow.
 * - GenerateAuditCommentOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateAuditCommentInputSchema = z.object({
  parameterName: z.string().describe('The name of the audit parameter being scored.'),
  score: z.number().min(0).max(100).describe('The score (out of 100) given for this parameter.'),
});
export type GenerateAuditCommentInput = z.infer<typeof GenerateAuditCommentInputSchema>;

const GenerateAuditCommentOutputSchema = z.object({
  comment: z.string().describe("The AI-generated constructive comment for the agent."),
});
export type GenerateAuditCommentOutput = z.infer<typeof GenerateAuditCommentOutputSchema>;

export async function generateAuditComment(input: GenerateAuditCommentInput): Promise<GenerateAuditCommentOutput> {
  return generateAuditCommentFlow(input);
}

const generationPrompt = ai.definePrompt({
  name: 'generateAuditCommentPrompt',
  input: {schema: GenerateAuditCommentInputSchema},
  output: {schema: GenerateAuditCommentOutputSchema},
  prompt: `You are an expert QA Manager providing feedback to a call center agent.
Your task is to write a single, concise, and constructive comment based on an audit parameter and the score it received.

The agent was evaluated on the parameter: "{{parameterName}}".
They received a score of: {{score}} out of 100.

Based on this, generate a helpful comment.
- If the score is high (e.g., > 85), the comment should be positive and encouraging.
- If the score is average (e.g., 60-85), the comment should acknowledge what was done and suggest a specific improvement.
- If the score is low (e.g., < 60), the comment should be direct but constructive, clearly stating what was missed and what needs to be done next time.

Generate only the comment text.
`,
});

const generateAuditCommentFlow = ai.defineFlow(
  {
    name: 'generateAuditCommentFlow',
    inputSchema: GenerateAuditCommentInputSchema,
    outputSchema: GenerateAuditCommentOutputSchema,
  },
  async (input) => {
    const {output} = await generationPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid comment.');
    }
    return output;
  }
);
