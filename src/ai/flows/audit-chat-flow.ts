"use server";
/**
 * @fileOverview A Genkit flow for a chatbot to discuss a call audit.
 *
 * - chatAboutAudit - A function that handles chat messages about a call audit.
 * - AuditChatInput - The input type for the chatAboutAudit function.
 * - AuditChatOutput - The return type for the chatAboutAudit function.
 */

import { z } from "zod";
import { geminiRateLimiter } from "@/lib/geminiRateLimiter";
import { retryGeminiCall } from "@/lib/geminiRetry";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const AuditChatInputSchema = z.object({
  auditSummary: z.string().describe("The summary of the call audit."),
  auditTranscription: z
    .string()
    .describe("The transcription of the audited call."),
  userMessage: z
    .string()
    .min(1)
    .describe("The user's current message/question."),
  chatHistory: z
    .array(ChatMessageSchema)
    .optional()
    .describe("The history of the conversation so far."),
});
export type AuditChatInput = z.infer<typeof AuditChatInputSchema>;

const AuditChatOutputSchema = z.object({
  response: z
    .string()
    .describe("The AI-generated response to the user message."),
});
export type AuditChatOutput = z.infer<typeof AuditChatOutputSchema>;

export async function chatAboutAudit(
  input: AuditChatInput
): Promise<AuditChatOutput> {
  const { getModel } = await import("@/ai/genkit");
  const model = getModel();

  let chatHistoryText = "";
  if (input.chatHistory && input.chatHistory.length > 0) {
    chatHistoryText =
      "Chat History:\n" +
      input.chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n") +
      "\n\n";
  }

  const prompt = `You are a helpful AI assistant specializing in analyzing call center audit data.
You will be provided with a summary of a call audit, the full transcription of the call, and the ongoing chat history.
Your task is to answer the user's questions based on this information. Be concise and focus on the provided context.

Call Audit Summary:
${input.auditSummary}

Call Transcription:
${input.auditTranscription}

${chatHistoryText}User's Current Question:
${input.userMessage}

Respond ONLY with valid JSON in this exact format:
{
  "response": "your detailed answer here"
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

  const output = JSON.parse(jsonText) as AuditChatOutput;
  return output;
}
