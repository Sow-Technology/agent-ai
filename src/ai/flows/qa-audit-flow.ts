"use server";
/**
 * @fileOverview AI-powered QA audit flow for call center recordings.
 *
 * - qaAuditCall - A function that handles the call auditing process.
 * - QaAuditInput - The input type for the qaAuditCall function.
 * - QaAuditOutput - The return type for the qaAuditCall function.
 */

import { z } from "zod";
import { geminiRateLimiter } from "@/lib/geminiRateLimiter";
import { retryGeminiCall } from "@/lib/geminiRetry";

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
  applyRateLimit: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to apply rate limiting to the Gemini API call."),
});
export type QaAuditInput = z.infer<typeof QaAuditInputSchema>;

const AuditResultItemSchema = z.object({
  parameter: z
    .string()
    .describe(
      'The specific audit sub-parameter evaluated, combining group and sub-parameter names in format "GroupName - SubParameterName" (e.g., "Greeting and Professionalism - Agent used standard greeting"). MUST use exact names from input parameters. NEVER use "Unknown".'
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
        'Formatted with speaker labels: use "Agent: [IdentifiedAgentName]" for the agent, and "[CustomerName]:" if customer name is mentioned in the call, otherwise "Customer:". ' +
        "Do NOT include gender in speaker labels. " +
        "IMPORTANT: Mask ALL customer private details - replace phone numbers with [PHONE MASKED], addresses with [ADDRESS MASKED], account numbers with [ACCOUNT MASKED], email with [EMAIL MASKED], etc. " +
        "If transcription from audio URI is not possible, this should contain an assumed dialogue in the original language."
    ),
  englishTranslation: z
    .string()
    .describe(
      "The transcription translated into English, formatted with speaker labels. " +
        'Use simple labels: "Agent: [IdentifiedAgentName]" and "[CustomerName]:" or "Customer:" (no gender). ' +
        "Mask all private details the same way as in the original transcription. " +
        "This field is ALWAYS required - if the original call is already in English, this should be the same as transcriptionInOriginalLanguage. " +
        "If audio processing fails, this contains the translated assumed dialogue."
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
  // Token usage and duration tracking (added by system, not AI)
  tokenUsage: z
    .object({
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional()
    .describe("Token usage statistics for the AI call."),
  auditDurationMs: z
    .number()
    .optional()
    .describe("Duration of the audit processing in milliseconds."),
});
export type QaAuditOutput = z.infer<typeof QaAuditOutputSchema>;

export async function qaAuditCall(input: QaAuditInput): Promise<QaAuditOutput> {
  const startTime = Date.now(); // Track audit duration

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
1. **Transcription**: Provide accurate transcriptions in the original language AND ALWAYS in English. Use simple speaker labels WITHOUT gender:
   - For agent: "Agent: [AgentName]" (e.g., "Agent: Rahul")  
   - For customer: Use actual name if mentioned in call (e.g., "Priya:"), otherwise use "Customer:"
   - NEVER include gender like "(Male)" or "(Female)" in labels
2. **Privacy Protection**: MASK ALL customer private details in transcriptions:
   - Phone numbers → [PHONE MASKED]
   - Addresses → [ADDRESS MASKED]  
   - Account/Card numbers → [ACCOUNT MASKED]
   - Email addresses → [EMAIL MASKED]
   - Aadhaar/PAN/ID numbers → [ID MASKED]
3. **English Translation**: ALWAYS provide englishTranslation field - if the call is already in English, copy the original transcription. Never skip this field.
4. **Audit Scoring**: Evaluate each parameter based on the call content. Be precise and fair in your scoring.
5. **Root Cause Analysis**: If issues are found, provide thoughtful analysis of why they occurred.
6. **Summary**: Give constructive feedback highlighting strengths and areas for improvement.

**Output Requirements:**
- Ensure all transcriptions are accurate and properly formatted
- ALWAYS include englishTranslation (required field)
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
  "englishTranslation": "string (REQUIRED - always provide English translation, even if original is English)",
  "transcriptionInRequestedLanguage": "string (optional, if transcriptionLanguage was specified)",
  "callSummary": "string (required, concise summary of the call)",
  "rootCauseAnalysis": "string (optional, analysis of any significant issues)",
  "auditResults": [
    {
      "parameter": "string (MUST be in format: 'GroupName - SubParameterName', using the EXACT group name and sub-parameter name from the Audit Parameters provided above. For example, if the group is 'Greeting and Professionalism' and sub-parameter is 'Agent used standard greeting', then parameter should be 'Greeting and Professionalism - Agent used standard greeting'. NEVER use 'Unknown' or generic names.)",
      "score": number (0-100),
      "weightedScore": number (score * weight / 100),
      "comments": "string",
      "type": "Fatal" | "Non-Fatal" | "ZTP" (optional)
    }
  ],
  "overallScore": number (0-100, sum of weightedScore values),
  "summary": "string (required, brief summary highlighting strengths and areas for improvement)",
  "callLanguage": "string (optional)"
}

**CRITICAL**: 
1. For each parameter in auditResults, you MUST use the EXACT group name and sub-parameter name from the Audit Parameters list above. The format is "GroupName - SubParameterName". Do NOT use "Unknown" or any made-up names.
2. ALWAYS provide englishTranslation - this field is REQUIRED.`;

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

  // Apply rate limiting before calling Gemini API if enabled
  if (effectiveInput.applyRateLimit !== false) {
    await geminiRateLimiter.waitForSlot();
  }

  const result = await retryGeminiCall(async () => {
    return await model.generateContent({
      contents: [{ role: "user", parts }],
    });
  });
  const response = result.response;
  const text = response.text();

  // Extract token usage from the response
  const usageMetadata = response.usageMetadata;
  const tokenUsage = {
    inputTokens: usageMetadata?.promptTokenCount || 0,
    outputTokens: usageMetadata?.candidatesTokenCount || 0,
    totalTokens: usageMetadata?.totalTokenCount || 0,
  };

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

  // Ensure englishTranslation is always present
  if (!output.englishTranslation) {
    // If no English translation, use the original transcription as fallback
    output.englishTranslation =
      output.transcriptionInOriginalLanguage || "Translation not available";
  }

  // Fix any "Unknown" parameter names by mapping them to the correct input parameter names
  // Build a mapping of expected parameter names from input
  const expectedParameters: {
    groupName: string;
    subParamName: string;
    index: number;
  }[] = [];
  effectiveInput.auditParameters.forEach((group) => {
    group.subParameters.forEach((subParam) => {
      expectedParameters.push({
        groupName: group.name,
        subParamName: subParam.name,
        index: expectedParameters.length,
      });
    });
  });

  // Fix parameter names if they contain "Unknown" or don't match expected format
  if (output.auditResults && Array.isArray(output.auditResults)) {
    output.auditResults = output.auditResults.map((result, index) => {
      // Check if parameter name contains "Unknown" or is missing proper group name
      if (
        result.parameter.toLowerCase().includes("unknown") ||
        !result.parameter.includes(" - ")
      ) {
        // Try to match by index or by partial name match
        if (index < expectedParameters.length) {
          const expected = expectedParameters[index];
          result.parameter = `${expected.groupName} - ${expected.subParamName}`;
        } else {
          // Try to find a match by checking if the comment or parameter name contains any sub-parameter name
          const match = expectedParameters.find(
            (ep) =>
              result.parameter
                .toLowerCase()
                .includes(ep.subParamName.toLowerCase()) ||
              result.comments
                ?.toLowerCase()
                .includes(ep.subParamName.toLowerCase())
          );
          if (match) {
            result.parameter = `${match.groupName} - ${match.subParamName}`;
          }
        }
      }
      return result;
    });
  }

  // Calculate total audit duration at the very end (includes AI time + all system processing)
  const auditDurationMs = Date.now() - startTime;

  // Add token usage and duration to output
  output.tokenUsage = tokenUsage;
  output.auditDurationMs = auditDurationMs;

  return output;
}
