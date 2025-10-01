"use server";
/**
 * @fileOverview An AI flow to generate a constructive comment for a QA audit item.
 *
 * - generateAuditComment - A function that takes a parameter name and score to generate a comment.
 * - GenerateAuditCommentInput - The input type for the flow.
 * - GenerateAuditCommentOutput - The return type for the flow.
 */

import { z } from "zod";

const GenerateAuditCommentInputSchema = z.object({
  parameterName: z
    .string()
    .describe("The name of the audit parameter being scored."),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("The score (out of 100) given for this parameter."),
});
export type GenerateAuditCommentInput = z.infer<
  typeof GenerateAuditCommentInputSchema
>;

const GenerateAuditCommentOutputSchema = z.object({
  comment: z
    .string()
    .describe("The AI-generated constructive comment for the agent."),
});
export type GenerateAuditCommentOutput = z.infer<
  typeof GenerateAuditCommentOutputSchema
>;

export async function generateAuditComment(
  input: GenerateAuditCommentInput
): Promise<GenerateAuditCommentOutput> {
  const { getModel } = await import("@/ai/genkit");
  const model = getModel();

  const prompt = `You are an expert QA Manager providing feedback to a call center agent.
Your task is to write a single, concise, and constructive comment based on an audit parameter and the score it received.

The agent was evaluated on the parameter: "${input.parameterName}".
They received a score of: ${input.score} out of 100.

Based on this, generate a helpful comment.
- If the score is high (e.g., > 85), the comment should be positive and encouraging.
- If the score is average (e.g., 60-85), the comment should acknowledge what was done and suggest a specific improvement.
- If the score is low (e.g., < 60), the comment should be direct but constructive, clearly stating what was missed and what needs to be done next time.

Respond ONLY with valid JSON in this exact format:
{
  "comment": "your comment here"
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // Extract JSON from the response
  let jsonText = responseText;
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const output = JSON.parse(jsonText) as GenerateAuditCommentOutput;
  return output;
}
