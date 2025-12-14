"use server";
/**
 * @fileOverview An AI flow to check and correct the grammar of a given text.
 *
 * - grammarCheck - A function that takes text and returns a grammatically corrected version.
 * - GrammarCheckInput - The input type for the flow.
 * - GrammarCheckOutput - The return type for the flow.
 */

import { z } from "zod";
import { geminiRateLimiter } from "@/lib/geminiRateLimiter";
import { retryGeminiCall } from "@/lib/geminiRetry";

const GrammarCheckInputSchema = z.object({
  text: z.string().describe("The text to be checked for grammar and spelling."),
});
export type GrammarCheckInput = z.infer<typeof GrammarCheckInputSchema>;

const GrammarCheckOutputSchema = z.object({
  correctedText: z
    .string()
    .describe("The grammatically corrected version of the input text."),
});
export type GrammarCheckOutput = z.infer<typeof GrammarCheckOutputSchema>;

export async function grammarCheck(
  input: GrammarCheckInput
): Promise<GrammarCheckOutput> {
  // If input text is empty or very short, no need to call the model.
  if (!input.text || input.text.trim().length < 2) {
    return { correctedText: input.text };
  }

  const { getModel } = await import("@/ai/genkit");
  const model = getModel();

  const prompt = `You are an expert in English grammar and style.
Your task is to correct the grammar and spelling mistakes in the following text.
Do not change the meaning of the text. Only correct errors.
If the text is already grammatically correct, return the original text.

Input Text:
"${input.text}"

Respond ONLY with valid JSON in this exact format:
{
  "correctedText": "your corrected text here"
}`;

  // Apply rate limiting before calling Gemini API
  await geminiRateLimiter.waitForSlot();

  const result = await retryGeminiCall(async () => {
    return await model.generateContent(prompt);
  });
  const responseText = result.response.text().trim();

  // Extract JSON from the response
  let jsonText = responseText;
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const output = JSON.parse(jsonText) as GrammarCheckOutput;
  return output;
}
