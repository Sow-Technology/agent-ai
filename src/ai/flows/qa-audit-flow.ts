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
    // Safe parsing without Regex for large files to avoid Maximum call stack size exceeded
    const commaIdx = effectiveInput.audioDataUri.indexOf(",");
    const semicolonIdx = effectiveInput.audioDataUri.indexOf(";");
    
    if (commaIdx > -1 && semicolonIdx > -1 && semicolonIdx < commaIdx) {
      mimeType = effectiveInput.audioDataUri.substring(5, semicolonIdx);
      // We don't substring the base64 yet if we don't have to, to save memory? 
      // Actually we need it for size check.
      audioBase64 = effectiveInput.audioDataUri.substring(commaIdx + 1);
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

  // Check if this is a large audio file (>15MB base64 = ~11MB actual)
  const isLargeAudio = audioBase64.length > 15 * 1024 * 1024;
  
  // Build transcription instructions based on audio size
  const transcriptionInstructions = isLargeAudio
    ? `1. **Transcription**: For this LONG call, DO NOT provide full transcription. Instead:
   - Set transcriptionInOriginalLanguage to "Long call - full transcription not available"
   - Set englishTranslation to "Long call - full transcription not available"
   - Focus on providing COMPLETE and DETAILED audit results for ALL parameters`
    : `1. **Transcription**: Provide accurate transcriptions in the original language AND ALWAYS in English. Use simple speaker labels WITHOUT gender:
   - For agent: "Agent: [AgentName]" (e.g., "Agent: Rahul")  
   - For customer: Use actual name if mentioned in call (e.g., "Priya:"), otherwise use "Customer:"
   - NEVER include gender like "(Male)" or "(Female)" in labels`;

  const textPrompt = `You are an expert QA auditor for call centers. You are tasked with auditing the attached audio call recording.

**Context:**
- Agent User ID: ${effectiveInput.agentUserId}
- Campaign: ${effectiveInput.campaignName || "N/A"}
- Expected Call Language: ${effectiveInput.callLanguage}
${
  effectiveInput.transcriptionLanguage
    ? `- Requested Transcription Language: ${effectiveInput.transcriptionLanguage}`
    : ""
}

**Audit Parameters (Parameter Name - Weight%):**
${parametersDesc}

**Audit Instructions:**
${transcriptionInstructions}
2. **Privacy Protection**: MASK ALL customer private details in any text:
   - Phone numbers → [PHONE MASKED]
   - Addresses → [ADDRESS MASKED]  
   - Account/Card numbers → [ACCOUNT MASKED]
   - Email addresses → [EMAIL MASKED]
   - Aadhaar/PAN/ID numbers → [ID MASKED]
3. **Audit Scoring Guidelines**:
   
   **Score Scale (0-100):**
   - **100**: Perfect compliance - agent fully met the requirement
   - **80-99**: Good - minor issues but acceptable performance
   - **50-79**: Needs improvement - noticeable issues but not critical
   - **1-49**: Poor - significant failure, requires immediate attention
   - **0**: Complete failure - requirement was not met at all
   
   **Parameter Types & Their Impact:**
   - **Fatal Parameters**: Critical compliance items. Score > 50% (not perfect) on ANY Fatal parameter triggers Zero Tolerance Policy (ZTP) - overall audit score becomes 0.
   - **Non-Fatal Parameters**: Standard quality metrics. Low scores reduce overall score but don't trigger ZTP.
   - **ZTP Parameters**: Absolute zero tolerance. ANY failure (score < 80%) on ZTP parameters should result in score of 0 for that parameter.
   
   **IMPORTANT**: Be precise and fair in your scoring. The score should reflect actual performance observed in the call.
   
4. **Root Cause Analysis**: If issues are found, provide thoughtful analysis of why they occurred.
5. **Summary**: Give constructive feedback highlighting strengths and areas for improvement.
6. **CRITICAL - COMPLETE ALL AUDIT RESULTS**: You MUST provide a score and comments for EVERY sub-parameter listed above. Do not truncate or skip any parameters.

**Output Requirements:**
- Calculate weighted scores correctly (score × weight ÷ 100)
- Overall score should be the sum of all weighted scores
- **CRITICAL ZTP RULE**: If ANY Fatal-type parameter scores GREATER than 50% (meaning not perfect compliance), the overall audit score MUST be set to 0 (Zero Tolerance Policy)
- Provide detailed, actionable feedback
- Use the identified agent name in the summary
- PRIORITIZE completing all auditResults over transcription length


**IMPORTANT**: Respond ONLY with valid JSON matching this exact structure:
{
  "agentUserId": "string (optional)",
  "campaignName": "string (optional)",
  "identifiedAgentName": "string (optional, e.g., 'John Doe' or 'Unknown Agent')",
  "transcriptionInOriginalLanguage": "string (${isLargeAudio ? 'use placeholder for long calls' : 'formatted with speaker labels'})",
  "englishTranslation": "string (REQUIRED - ${isLargeAudio ? 'use placeholder for long calls' : 'always provide English translation'})",
  "transcriptionInRequestedLanguage": "string (optional, if transcriptionLanguage was specified)",
  "callSummary": "string (required, concise summary of the call - max 500 characters)",
  "rootCauseAnalysis": "string (optional, analysis of any significant issues)",
  "auditResults": [
    {
      "parameter": "string (MUST be in format: 'GroupName - SubParameterName', using the EXACT group name and sub-parameter name from the Audit Parameters provided above. For example, if the group is 'Greeting and Professionalism' and sub-parameter is 'Agent used standard greeting', then parameter should be 'Greeting and Professionalism - Agent used standard greeting'. NEVER use 'Unknown' or generic names.)",
      "score": number (0-100),
      "weightedScore": number (score * weight / 100),
      "comments": "string (brief, max 100 characters)",
      "type": "Fatal" | "Non-Fatal" | "ZTP" (optional)
    }
  ],
  "overallScore": number (0-100, sum of weightedScore values),
  "summary": "string (required, brief summary - max 300 characters)",
  "callLanguage": "string (optional)"
}

**CRITICAL**: 
1. For each parameter in auditResults, you MUST use the EXACT group name and sub-parameter name from the Audit Parameters list above. The format is "GroupName - SubParameterName". Do NOT use "Unknown" or any made-up names.
2. You MUST provide auditResults for ALL ${effectiveInput.auditParameters.reduce((sum, g) => sum + g.subParameters.length, 0)} sub-parameters listed above.
3. Keep comments brief to fit within output limits.`;

  // Prepare the content parts with audio
  const parts: any[] = [
    {
      text: textPrompt,
    },
  ];

  // Apply rate limiting before calling Gemini API if enabled
  if (effectiveInput.applyRateLimit !== false) {
    await geminiRateLimiter.waitForSlot();
  }

  // --- HANDLE AUDIO: INLINE OR FILE UPLOAD ---
  // Gemini inline data limit is ~20MB. 30 min audio > 20MB.
  // We check size or just prefer File API for robustness.
  
  let fileUriForGemini: string | null = null;
  let tempFilePath: string | null = null;

  try {
      if (audioBase64 && effectiveInput.audioDataUri !== MOCK_AUDIO_DATA_URI) {
        
        // Calculate size roughly (base64 length * 0.75)
        const sizeInBytes = audioBase64.length * 0.75;
        const SIZE_LIMIT_BYTES = 10 * 1024 * 1024; // 10MB threshold to be safe

        if (sizeInBytes > SIZE_LIMIT_BYTES) {
           // USE FILE API
           const { GoogleAIFileManager } = await import("@google/generative-ai/server");
           const fs = await import("fs");
           const os = await import("os");
           const path = await import("path");

           const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY;
           if (!apiKey) throw new Error("API Key missing");
           
           const fileManager = new GoogleAIFileManager(apiKey);
           
           // Write to temp file
           const ext = mimeType.split("/")[1] || "wav";
           tempFilePath = path.join(os.tmpdir(), `audit-${Date.now()}.${ext}`);
           await fs.promises.writeFile(tempFilePath, Buffer.from(audioBase64, "base64"));
           
           // Upload
           const uploadResult = await fileManager.uploadFile(tempFilePath, {
               mimeType,
               displayName: `Audit Call ${effectiveInput.agentUserId}`,
           });
           
           fileUriForGemini = uploadResult.file.uri;

           // Wait for processing to be ACTIVE? (Usually rapid for audio, but good practice)
           // For simple audio, active is usually immediate.
           
           parts.push({
               fileData: {
                   mimeType: uploadResult.file.mimeType,
                   fileUri: fileUriForGemini,
               }
           });

        } else {
           // USE INLINE (Small file)
           parts.push({
            inlineData: {
              mimeType: mimeType,
              data: audioBase64,
            },
           });
        }
      } else {
         parts[0].text += "\n\n**NOTE**: No real audio provided. Please generate a realistic sample audit based on the parameters provided.";
      }

      const result = await retryGeminiCall(async () => {
        return await model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig: {
            maxOutputTokens: 64000, // Gemini 2.0 Flash actual limit
            temperature: 0.2,
            responseMimeType: "application/json", // Force valid JSON output
          },
        });
      });
      const response = result.response;
      let text = response.text();

      // Sanitize control characters that break JSON parsing
      text = text.replace(/[\x00-\x1F\x7F]/g, (char) => {
        if (char === '\n' || char === '\r' || char === '\t') return char;
        return ' '; // Replace other control chars with space
      });

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
      
      // Handle truncated JSON by attempting to close it
      if (!jsonText.endsWith("}")) {
        console.warn("Detected truncated JSON output, attempting recovery...");
        // Find last complete field
        const lastCompleteComma = jsonText.lastIndexOf('",');
        if (lastCompleteComma > -1) {
          jsonText = jsonText.substring(0, lastCompleteComma + 1);
          // Close any unclosed arrays and object
          const openBrackets = (jsonText.match(/\[/g) || []).length - (jsonText.match(/\]/g) || []).length;
          const openBraces = (jsonText.match(/\{/g) || []).length - (jsonText.match(/\}/g) || []).length;
          jsonText += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces));
        }
      }

  const output = JSON.parse(jsonText) as QaAuditOutput;

  // Validate and set defaults for all critical fields
  if (!output.identifiedAgentName) {
    output.identifiedAgentName = "Unknown Agent";
  }
  if (!output.callLanguage) {
    output.callLanguage = effectiveInput.callLanguage;
  }
  
  // Ensure overallScore is always a number
  if (output.overallScore === undefined || output.overallScore === null || isNaN(output.overallScore)) {
    // Calculate from auditResults if available
    if (output.auditResults && Array.isArray(output.auditResults) && output.auditResults.length > 0) {
      output.overallScore = output.auditResults.reduce((sum, r) => sum + (r.weightedScore || 0), 0);
    } else {
      output.overallScore = 0;
    }
  }
  
  // ZTP (Zero Tolerance Policy): If any Fatal parameter scores > 50, set overall score to 0
  if (output.auditResults && Array.isArray(output.auditResults)) {
    const hasFatalFailure = output.auditResults.some(
      (r) => r.type === "Fatal" && r.score > 50
    );
    if (hasFatalFailure) {
      console.log("ZTP Applied: Fatal parameter scored above 50%, setting overall score to 0");
      output.overallScore = 0;
    }
  }
  
  // Ensure auditResults is always an array
  if (!output.auditResults || !Array.isArray(output.auditResults)) {
    output.auditResults = [];
  }
  
  // Ensure summary is always present
  if (!output.summary) {
    output.summary = "Audit completed. Some data may be incomplete due to processing constraints.";
  }
  
  // Ensure callSummary is always present
  if (!output.callSummary) {
    output.callSummary = "Call summary not available.";
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

  } finally {
      // CLEANUP: Delete temp file if created
      if (tempFilePath) {
          try {
             const fs = await import("fs");
             await fs.promises.unlink(tempFilePath);
          } catch (e) {
              console.error("Failed to delete temp file:", e);
          }
      }
  }
}
