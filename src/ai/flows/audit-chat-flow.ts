
'use server';
/**
 * @fileOverview A Genkit flow for a chatbot to discuss a call audit.
 *
 * - chatAboutAudit - A function that handles chat messages about a call audit.
 * - AuditChatInput - The input type for the chatAboutAudit function.
 * - AuditChatOutput - The return type for the chatAboutAudit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const AuditChatInputSchema = z.object({
  auditSummary: z.string().describe('The summary of the call audit.'),
  auditTranscription: z.string().describe('The transcription of the audited call.'),
  userMessage: z.string().min(1).describe("The user's current message/question."),
  chatHistory: z.array(ChatMessageSchema).optional().describe('The history of the conversation so far.'),
});
export type AuditChatInput = z.infer<typeof AuditChatInputSchema>;

const AuditChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user message.'),
});
export type AuditChatOutput = z.infer<typeof AuditChatOutputSchema>;

export async function chatAboutAudit(input: AuditChatInput): Promise<AuditChatOutput> {
  return auditChatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'auditChatPrompt',
  input: {schema: AuditChatInputSchema},
  output: {schema: AuditChatOutputSchema},
  prompt: `You are a helpful AI assistant specializing in analyzing call center audit data.
You will be provided with a summary of a call audit, the full transcription of the call, and the ongoing chat history.
Your task is to answer the user's questions based on this information. Be concise and focus on the provided context.

Call Audit Summary:
{{{auditSummary}}}

Call Transcription:
{{{auditTranscription}}}

{{#if chatHistory}}
Chat History:
{{#each chatHistory}}
{{this.role}}: {{{this.content}}}
{{/each}}
{{/if}}

User's Current Question:
{{{userMessage}}}

Your Answer:
`,
});

const auditChatFlow = ai.defineFlow(
  {
    name: 'auditChatFlow',
    inputSchema: AuditChatInputSchema,
    outputSchema: AuditChatOutputSchema,
  },
  async (input) => {
    const {output} = await chatPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid response for the chat.');
    }
    return output;
  }
);

