"use server";
/**
 * @fileOverview AI-powered QA audit flow for call center recordings.
 *
 * - qaAuditCall - A function that handles the call auditing process.
 * - QaAuditInput - The input type for the qaAuditCall function.
 * - QaAuditOutput - The return type for the qaAuditCall function.
 */

import { z } from "zod";

// A mock/placeholder for a very short silent WAV audio data URI.
// In a real scenario, this would come from an actual audio file upload.
const MOCK_AUDIO_DATA_URI =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

const SubParameterInputSchema = z.object({
  id: z.string(),
  name: z.string().describe("The name of the sub-parameter."),
  weight: z
    .number()
    .min(0)
    .max(100)
    .describe("The weight of this sub-parameter (0-100)."),
  type: z
    .enum(["Fatal", "Non-Fatal", "ZTP"])
    .describe("The type of the sub-parameter."),
});

const ParameterGroupInputSchema = z.object({
  id: z.string(),
  name: z.string().describe("The name of the parameter group."),
  subParameters: z
    .array(SubParameterInputSchema)
    .min(1)
    .describe("A list of sub-parameters within this group."),
});

const QaAuditInputSchema = z.object({
  agentUserId: z
    .string()
    .min(1)
    .describe("The user ID or employee ID of the agent being audited."),
  campaignName: z
    .string()
    .optional()
    .describe("The name of the campaign associated with this call."),
  audioDataUri: z
    .string()
    .describe(
      "A data URI of the audio call. Expected format: 'data:<mimetype>;base64,<encoded_data>'. For this version, a mock URI will be used if none is provided meaningfully."
    )
    .default(MOCK_AUDIO_DATA_URI),
  callLanguage: z
    .string()
    .min(1)
    .describe(
      "The primary language spoken in the call (e.g., Hindi, Tamil, English)."
    ),
  transcriptionLanguage: z
    .string()
    .optional()
    .describe(
      "An optional language to transcribe the call into, if a version other than the original or English is needed (e.g., Tamil if original is Hindi and English translation is also generated)."
    ),
  auditParameters: z
    .array(ParameterGroupInputSchema)
    .min(1)
    .describe("A list of audit parameter groups, each with sub-parameters."),
});
export type QaAuditInput = z.infer<typeof QaAuditInputSchema>;

const AuditResultItemSchema = z.object({
  parameter: z
    .string()
    .describe(
      'The specific audit sub-parameter evaluated, combining group and sub-parameter names (e.g., "Greeting and Professionalism - Agent used standard greeting").'
    ),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "The assessed performance score for this specific parameter, on a scale of 0-100 (0 being worst, 100 being best)."
    ),
  weightedScore: z
    .number()
    .min(0)
    .describe(
      "The calculated weighted score for this parameter (parameter_score * weight / 100). Round to two decimal places if needed."
    ),
  comments: z.string().describe("Justification or comments for the score."),
  type: z
    .enum(["Fatal", "Non-Fatal", "ZTP"])
    .optional()
    .describe(
      "The type of the sub-parameter as provided in the input (Fatal, Non-Fatal, or ZTP)."
    ),
});
export type AuditResultItem = z.infer<typeof AuditResultItemSchema>;

const QaAuditOutputSchema = z.object({
  agentUserId: z
    .string()
    .optional()
    .describe("The user ID or employee ID of the agent being audited."),
  campaignName: z
    .string()
    .optional()
    .describe("The name of the campaign associated with this call."),
  identifiedAgentName: z
    .string()
    .optional()
    .describe(
      'The name of the agent as identified from the call audio/transcription. Could be "Unknown Agent" if not inferable.'
    ),
  transcriptionInOriginalLanguage: z
    .string()
    .describe(
      "Accurate transcription of the call in its original language (as specified in callLanguage input). " +
        'Formatted with speaker labels (e.g., "Agent (Male): [IdentifiedAgentName]", "Customer (Female):"). ' +
        "If transcription from audio URI is not possible, this should contain an assumed dialogue in the original language."
    ),
  englishTranslation: z
    .string()
    .optional()
    .describe(
      "If the original call language is not English, this field contains the transcription translated into English, formatted with speaker labels. " +
        'Speaker labels should be simple and concise (e.g., "Agent (Male): [IdentifiedAgentName]", "Customer (Female):"). ' +
        "If the original call is already in English, this field is omitted. " +
        "If audio processing fails, this contains the translated assumed dialogue if applicable."
    ),
  transcriptionInRequestedLanguage: z
    .string()
    .optional()
    .describe(
      "If transcriptionLanguage input was specified AND it is different from callLanguage AND it is not English, this field contains the transcription translated into that requested language, formatted with speaker labels. " +
        "Otherwise, this field should be omitted. " +
        "If audio processing fails, this contains the translated assumed dialogue if applicable."
    ),
  callSummary: z
    .string()
    .describe(
      "A concise summary of the entire call conversation, capturing main points and outcomes."
    ),
  rootCauseAnalysis: z
    .string()
    .optional()
    .describe(
      "An analysis of the root cause if any significant issue was identified during the call, focusing on why the issue occurred. This field can be omitted if no significant issues warranting an RCA are found."
    ),
  auditResults: z
    .array(AuditResultItemSchema)
    .describe("Detailed audit results for each parameter."),
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "The overall weighted audit score for the call (0-100), calculated as the sum of individual weightedParameterScores. Ensure this sum does not exceed 100, especially if parameter weights sum to 100."
    ),
  summary: z
    .string()
    .describe(
      "A brief summary of the audit, highlighting key strengths and areas for improvement for the agent (using the identifiedAgentName)."
    ),
  callLanguage: z
    .string()
    .optional()
    .describe(
      "The primary language spoken in the call (e.g., Hindi, Tamil, English)."
    ),
});
export type QaAuditOutput = z.infer<typeof QaAuditOutputSchema>;

export async function qaAuditCall(input: QaAuditInput): Promise<QaAuditOutput> {
  const { getModel } = await import("@/ai/genkit");
  const model = getModel();

  const effectiveInput = {
    ...input,
    audioDataUri: input.audioDataUri || MOCK_AUDIO_DATA_URI,
  };

  // Extract the base64 audio data and mime type from the data URI
  let audioBase64 = "";
  let mimeType = "audio/wav";

  if (
    effectiveInput.audioDataUri &&
    effectiveInput.audioDataUri.startsWith("data:")
  ) {
    const matches = effectiveInput.audioDataUri.match(
      /^data:([^;]+);base64,(.+)$/
    );
    if (matches) {
      mimeType = matches[1];
      audioBase64 = matches[2];
    }
  }

  // Build the audit parameters description
  const parametersDesc = effectiveInput.auditParameters
    .map((group) => {
      const subParams = group.subParameters
        .map((sp) => `    - "${sp.name}" - ${sp.weight}% (${sp.type})`)
        .join("\n");
      return `  - **Group: "${group.name}"**\n${subParams}`;
    })
    .join("\n");

  const textPrompt = `You are an expert QA auditor for call centers. You are tasked with auditing the attached audio call recording.

**Your Goal: Maximum Accuracy**
Your primary goal is to provide the most accurate and detailed audit possible. Engage your full analytical capabilities. Your output must be valid JSON matching the specified schema.

**Audit Context:**
- Agent User ID: ${effectiveInput.agentUserId}
- Campaign Name: ${effectiveInput.campaignName || "N/A"}
- Original Call Language: ${effectiveInput.callLanguage}
${
  effectiveInput.transcriptionLanguage
    ? `- Requested Transcription Language: ${effectiveInput.transcriptionLanguage}`
    : ""
}

**Audit Parameters (Parameter Name - Weight%):**
${parametersDesc}

**Audit Instructions:**
1. **Transcription**: Provide accurate transcriptions in the original language, English (if different), and requested language (if specified). Use clear speaker labels like "Agent (Male): [AgentName]" and "Customer (Female):".
2. **Audit Scoring**: Evaluate each parameter based on the call content. Be precise and fair in your scoring.
3. **Root Cause Analysis**: If issues are found, provide thoughtful analysis of why they occurred.
4. **Summary**: Give constructive feedback highlighting strengths and areas for improvement.

**Output Requirements:**
- Ensure all transcriptions are accurate and properly formatted
- Calculate weighted scores correctly (score × weight ÷ 100)
- Overall score should be the sum of all weighted scores
- Provide detailed, actionable feedback
- Use the identified agent name in the summary

**IMPORTANT**: Respond ONLY with valid JSON matching this exact structure:
{
  "agentUserId": "string (optional)",
  "campaignName": "string (optional)",
  "identifiedAgentName": "string (optional, e.g., 'John Doe' or 'Unknown Agent')",
  "transcriptionInOriginalLanguage": "string (required, formatted with speaker labels)",
  "englishTranslation": "string (optional, if original language is not English)",
  "transcriptionInRequestedLanguage": "string (optional, if transcriptionLanguage was specified)",
  "callSummary": "string (required, concise summary of the call)",
  "rootCauseAnalysis": "string (optional, analysis of any significant issues)",
  "auditResults": [
    {
      "parameter": "string (e.g., 'Greeting - Agent used standard greeting')",
      "score": number (0-100),
      "weightedScore": number (score * weight / 100),
      "comments": "string",
      "type": "Fatal" | "Non-Fatal" | "ZTP" (optional)
    }
  ],
  "overallScore": number (0-100, sum of weightedScore values),
  "summary": "string (required, brief summary highlighting strengths and areas for improvement)",
  "callLanguage": "string (optional)"
}`;

  // Prepare the content parts with audio
  const parts: any[] = [
    {
      text: textPrompt,
    },
  ];

  // Add audio if it's not the mock placeholder
  if (audioBase64 && effectiveInput.audioDataUri !== MOCK_AUDIO_DATA_URI) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: audioBase64,
      },
    });
  } else {
    // If using mock audio, add a note that this is a simulated audit
    parts[0].text +=
      "\n\n**NOTE**: No real audio provided. Please generate a realistic sample audit based on the parameters provided.";
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
  });
  const response = result.response;
  const text = response.text();

  // Extract JSON from the response (handle cases where model adds markdown formatting)
  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const output = JSON.parse(jsonText) as QaAuditOutput;

  // Validate and set defaults
  if (!output.identifiedAgentName) {
    output.identifiedAgentName = "Unknown Agent";
  }
  if (!output.callLanguage) {
    output.callLanguage = effectiveInput.callLanguage;
  }

  return output;
}
