
'use server';
/**
 * @fileOverview AI-powered QA audit flow for call center recordings.
 *
 * - qaAuditCall - A function that handles the call auditing process.
 * - QaAuditInput - The input type for the qaAuditCall function.
 * - QaAuditOutput - The return type for the qaAuditCall function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod'; 

// A mock/placeholder for a very short silent WAV audio data URI.
// In a real scenario, this would come from an actual audio file upload.
const MOCK_AUDIO_DATA_URI = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

const SubParameterInputSchema = z.object({
  id: z.string(),
  name: z.string().describe('The name of the sub-parameter.'),
  weight: z.number().min(0).max(100).describe('The weight of this sub-parameter (0-100).'),
  type: z.enum(['Fatal', 'Non-Fatal', 'ZTP']).describe('The type of the sub-parameter.'),
});

const ParameterGroupInputSchema = z.object({
  id: z.string(),
  name: z.string().describe('The name of the parameter group.'),
  subParameters: z.array(SubParameterInputSchema).min(1).describe('A list of sub-parameters within this group.'),
});

const QaAuditInputSchema = z.object({
  agentUserId: z.string().min(1).describe("The user ID or employee ID of the agent being audited."),
  campaignName: z.string().optional().describe("The name of the campaign associated with this call."),
  audioDataUri: z
    .string()
    .describe(
      "A data URI of the audio call. Expected format: 'data:<mimetype>;base64,<encoded_data>'. For this version, a mock URI will be used if none is provided meaningfully."
    ).default(MOCK_AUDIO_DATA_URI),
  callLanguage: z.string().min(1).describe('The primary language spoken in the call (e.g., Hindi, Tamil, English).'),
  transcriptionLanguage: z.string().optional().describe('An optional language to transcribe the call into, if a version other than the original or English is needed (e.g., Tamil if original is Hindi and English translation is also generated).'),
  auditParameters: z.array(ParameterGroupInputSchema).min(1).describe('A list of audit parameter groups, each with sub-parameters.'),
});
export type QaAuditInput = z.infer<typeof QaAuditInputSchema>;

const AuditResultItemSchema = z.object({
  parameter: z.string().describe('The specific audit sub-parameter evaluated, combining group and sub-parameter names (e.g., "Greeting and Professionalism - Agent used standard greeting").'),
  score: z.number().min(0).max(100).describe('The assessed performance score for this specific parameter, on a scale of 0-100 (0 being worst, 100 being best).'),
  weightedScore: z.number().min(0).describe("The calculated weighted score for this parameter (parameter_score * weight / 100). Round to two decimal places if needed."),
  comments: z.string().describe('Justification or comments for the score.'),
  type: z.enum(['Fatal', 'Non-Fatal', 'ZTP']).optional().describe('The type of the sub-parameter as provided in the input (Fatal, Non-Fatal, or ZTP).'),
});
export type AuditResultItem = z.infer<typeof AuditResultItemSchema>;


const QaAuditOutputSchema = z.object({
  agentUserId: z.string().optional().describe("The user ID or employee ID of the agent being audited."),
  campaignName: z.string().optional().describe("The name of the campaign associated with this call."),
  identifiedAgentName: z.string().optional().describe('The name of the agent as identified from the call audio/transcription. Could be "Unknown Agent" if not inferable.'),
  transcriptionInOriginalLanguage: z.string().describe(
    'Accurate transcription of the call in its original language (as specified in callLanguage input). ' +
    'Formatted with speaker labels (e.g., "Speaker 1:", "Agent: [IdentifiedAgentName]", "Customer:"). ' +
    'If transcription from audio URI is not possible, this should contain an assumed dialogue in the original language.'
  ),
  englishTranslation: z.string().optional().describe(
    'If the original call language is not English, this field contains the transcription translated into English, formatted with speaker labels. ' +
    'Speaker labels should be simple and concise (e.g., "Agent: [IdentifiedAgentName]", "Customer:", "Speaker 1:"). Do NOT include descriptive voice characteristics (like "calm voice", "male voice", "standard voice") within the textual labels of the English translation. ' +
    'If the original call is already in English, this field is omitted. ' +
    'If audio processing fails, this contains the translated assumed dialogue if applicable.'
  ),
  transcriptionInRequestedLanguage: z.string().optional().describe(
    'If transcriptionLanguage input was specified AND it is different from callLanguage AND it is not English, this field contains the transcription translated into that requested language, formatted with speaker labels. ' +
    'Otherwise, this field should be omitted. ' +
    'If audio processing fails, this contains the translated assumed dialogue if applicable.'
  ),
  callSummary: z.string().describe('A concise summary of the entire call conversation, capturing main points and outcomes.'),
  rootCauseAnalysis: z.string().optional().describe('An analysis of the root cause if any significant issue was identified during the call, focusing on why the issue occurred. This field can be omitted if no significant issues warranting an RCA are found.'),
  auditResults: z.array(AuditResultItemSchema).describe('Detailed audit results for each parameter.'),
  overallScore: z.number().min(0).max(100).describe('The overall weighted audit score for the call (0-100), calculated as the sum of individual weightedParameterScores. Ensure this sum does not exceed 100, especially if parameter weights sum to 100.'),
  summary: z.string().describe('A brief summary of the audit, highlighting key strengths and areas for improvement for the agent (using the identifiedAgentName).'),
  callLanguage: z.string().optional().describe('The primary language spoken in the call (e.g., Hindi, Tamil, English).'),
});
export type QaAuditOutput = z.infer<typeof QaAuditOutputSchema>;


export async function qaAuditCall(input: QaAuditInput): Promise<QaAuditOutput> {
  const effectiveInput = {
    ...input,
    audioDataUri: input.audioDataUri || MOCK_AUDIO_DATA_URI,
  };
  const result = await qaAuditCallFlow(effectiveInput);
  // Add the callLanguage to the output for easier access in the UI if it's not already there.
  if (result && !result.callLanguage) {
    result.callLanguage = input.callLanguage;
  }
  return result;
}

const qaAuditPrompt = ai.definePrompt({
  name: 'qaAuditPrompt',
  input: { schema: QaAuditInputSchema },
  output: { schema: QaAuditOutputSchema },
  prompt: `You are an expert QA auditor for call centers. You are tasked with auditing a call recording.

**Tiered Analysis Strategy (Self-Learning Simulation):**
Your primary goal is to be token-efficient. To do this, you will act like a self-learning system that decides how much detail is necessary.
1.  **Initial Triage (Tier 1 - Low Token Usage):** First, quickly analyze the call's complexity. If the interaction is simple (e.g., a basic question with a direct answer, no complaints, no troubleshooting), provide a concise audit. The summary and comments should be brief.
2.  **Full Audit (Tier 2 - Gemini-level help):** If the triage reveals complexity (e.g., customer complaints, emotional language, multi-step processes, escalations), then engage your full analytical capabilities, as if calling on a more powerful model like Google Gemini for help. Provide a detailed, in-depth audit as originally instructed.
Your output must always match the required JSON schema, but the level of detail within the fields will vary based on this tiered approach.

**Audit Context:**
*   Agent User ID: {{agentUserId}}
*   Campaign Name: {{#if campaignName}}{{campaignName}}{{else}}N/A{{/if}}

**Input Details:**
*   Audio Media URI: {{media url=audioDataUri}}
*   Original Call Language: {{callLanguage}}
{{#if transcriptionLanguage}}
*   Optional Requested Transcription Language (for non-English, non-original version): {{transcriptionLanguage}}
{{/if}}
*   Audit Parameters (Parameter Name - Weight%):
    {{#each auditParameters}}
    *   **Group: "{{this.name}}"**
        {{#each this.subParameters}}
        *   Sub: "{{this.name}}" - Weight: {{this.weight}}% - Type: {{this.type}}
        {{/each}}
    {{/each}}

**Your Tasks:**

**0. Agent Identification and Consistent Naming:**
    *   You MUST analyze the call audio/transcription to identify the primary agent's name. Listen for phrases like 'My name is...', 'This is [Agent Name] from...', etc.
    *   Set the \`identifiedAgentName\` field in the output to this name.
    *   If no name can be confidently inferred from the audio, set \`identifiedAgentName\` to "Unknown Agent".
    *   **IMPORTANT: Throughout ALL subsequent tasks (Transcription, Translation, Auditing, Summaries), whenever referring to the agent being audited or their name, you MUST use the value that will be populated in the \`identifiedAgentName\` output field. For speaker labels, use "Agent: [value of identifiedAgentName] ({{agentUserId}})".**

**Speaker Labeling Guidance (applies to all transcriptions):**
Format transcriptions clearly identifying speakers. If possible, infer their roles.
*   For the agent being audited: Use "Agent: [value determined for identifiedAgentName] ({{agentUserId}}): [dialogue]"
*   For other speakers: Use "Customer: [dialogue]", "Caller: [dialogue]", or generic labels like "Speaker 1: [dialogue]", "Speaker 2: [dialogue]" if roles are unclear.

**1. Transcription in Original Language:**
    *   You are provided with an audio call in {{callLanguage}} via \`audioDataUri\`.
    *   Transcribe the conversation from \`audioDataUri\` accurately in its original language: {{callLanguage}}.
    *   Apply speaker labeling as per the guidance above, using the determined agent name for the agent.
    *   Place this transcription into the \`transcriptionInOriginalLanguage\` output field.

**2. English Translation (Conditional):**
    *   **Condition:** Only perform this task if {{callLanguage}} is NOT "English" (be case-insensitive for "English").
    *   If the condition is met (original language is not English):
        *   Translate the original transcription (from Task 1) into English.
        *   Apply speaker labeling using simple, concise labels. For the agent, use "Agent: [value determined for identifiedAgentName] ({{agentUserId}}): [dialogue]". For others, use "Customer: [dialogue]", "Speaker 1: [dialogue]". Do NOT include descriptive voice characteristics (like "calm voice", "male voice", "standard voice") within the textual labels of the English translation.
        *   Place this English translation into the \`englishTranslation\` output field.
    *   If the condition is NOT met (i.e., {{callLanguage}} is already "English"), then the \`englishTranslation\` field should be omitted (left empty/null).

**3. Requested Language Transcription (Conditional):**
    {{#if transcriptionLanguage}}
        *   An optional transcription language requested is {{transcriptionLanguage}}.
        *   **Condition for this task:** Perform this task ONLY IF {{transcriptionLanguage}} is different from {{callLanguage}} AND {{transcriptionLanguage}} is NOT "English" (be case-insensitive for both language checks).
        *   If this condition is met:
            *   Translate the original transcription (from Task 1) into {{transcriptionLanguage}}.
            *   Apply speaker labeling as per the guidance above, using the determined agent name.
            *   Place this translation into the \`transcriptionInRequestedLanguage\` output field.
        *   If this condition is NOT met, then the \`transcriptionInRequestedLanguage\` field should be omitted (left empty/null).
    {{else}}
        *   No optional \`transcriptionLanguage\` was specified. Therefore, the \`transcriptionInRequestedLanguage\` field should be omitted (left empty/null).
    {{/if}}

**4. Handling Audio Processing Issues:**
    *   If direct transcription from \`audioDataUri\` is not possible (e.g., it is a placeholder, there's a format issue, or it's too long):
        *   For \`identifiedAgentName\`: Set to "Unknown Agent (Audio Issue)".
        *   For \`transcriptionInOriginalLanguage\`: State "Transcription from audio URI was not possible. Proceeding with an assumed call scenario for agent [value of identifiedAgentName] ({{agentUserId}})." followed by a plausible, brief, sample customer service dialogue in {{callLanguage}}, with speaker labels (using "Agent: [value of identifiedAgentName] ({{agentUserId}})" for the agent).
        *   For \`englishTranslation\` (if {{callLanguage}} is not English): State "Transcription from audio URI was not possible. Proceeding with an assumed call scenario for agent [value of identifiedAgentName] ({{agentUserId}})." followed by a translation of the imagined dialogue into English, with simple speaker labels. If {{callLanguage}} is English, this field is omitted.
        {{#if transcriptionLanguage}}
        *   For \`transcriptionInRequestedLanguage\` (if the conditions in Task 3 would have been met): State "Transcription from audio URI was not possible. Proceeding with an assumed call scenario for agent [value of identifiedAgentName] ({{agentUserId}})." followed by a translation of the imagined dialogue into {{transcriptionLanguage}}, with speaker labels. Otherwise, this field is omitted.
        {{/if}}

**5. Call Summary:**
    *   Based on the available transcription (either actual or assumed), provide a concise summary of the entire call conversation in the \`callSummary\` field. This summary should capture the main purpose of the call, key discussion points, and any resolutions or outcomes. Refer to the agent as "[value of identifiedAgentName]".

**6. Auditing:** Evaluate the substance of the dialogue present in \`transcriptionInOriginalLanguage\` (or the assumed dialogue if audio failed) against the predefined audit parameters listed above, focusing on the performance of Agent [value of identifiedAgentName] ({{agentUserId}}).

**7. Scoring & Comments (For each sub-parameter in \`auditParameters\` input):**
    For each sub-parameter within each parameter group, you must generate a result object.
    *   \`parameter\`: A string combining the group name and sub-parameter name, formatted as "GroupName - SubParameterName". For example, for sub-parameter "Agent was professional and courteous" in the "Greeting and Professionalism" group, the value must be "Greeting and Professionalism - Agent was professional and courteous".
    *   \`score\`: Your assessed performance score for this specific sub-parameter, on a scale of 0 (worst) to 100 (best). Base this on how well Agent [value of identifiedAgentName] ({{agentUserId}}) performed.
    *   \`weightedScore\`: Calculate this as (\`score\` / 100) * \`weight_of_the_sub_parameter\`. Round to two decimal places if necessary.
    *   \`comments\`: Brief justification for the score, referring to specific parts of the conversation if possible.
    *   \`type\`: The type of the sub-parameter ('Fatal', 'Non-Fatal', or 'ZTP') exactly as it was provided in the input for that sub-parameter.
    *   Populate one of these objects for each sub-parameter into the \`auditResults\` array.

**8. Overall Assessment & Agent Summary:**
    *   \`overallScore\`: Calculate this as the sum of all individual \`weightedScore\` values from the \`auditResults\` array. This score should be between 0 and 100. If the sum of input parameter weights is 100, this will naturally be capped at 100.
    *   \`summary\`: Provide a concise summary of the audit focused specifically on Agent [value of identifiedAgentName]'s performance, highlighting key strengths and areas for improvement based on the weighted performance. This is the agent performance summary.
    *   \`callLanguage\`: Populate this field with the original call language provided in the input: {{callLanguage}}.

**9. Root Cause Analysis (RCA):**
    *   If any significant issues, failures in process, or critical errors by the agent ([value of identifiedAgentName]) were identified during the audit (from Task 6), provide a root cause analysis in the \`rootCauseAnalysis\` field. 
    *   This RCA should briefly explain the core reason(s) behind the identified issue(s). 
    *   If no significant issues warranting an RCA are found, this field can be omitted or set to a brief statement like "No significant issues requiring RCA identified."

Please ensure your output is strictly in the JSON format defined by the output schema. Provide thoughtful and constructive feedback.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const qaAuditCallFlow = ai.defineFlow(
  {
    name: 'qaAuditCallFlow',
    inputSchema: QaAuditInputSchema,
    outputSchema: QaAuditOutputSchema,
  },
  async (input) => {
    const { output } = await qaAuditPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid audit.');
    }
    // Fallback if the model fails to set the agent name
    if (!output.identifiedAgentName) {
      output.identifiedAgentName = "Unknown Agent (Fallback)";
    }
    return output;
  }
);
