import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export const getGoogleAI = () => {
  if (!genAI) {
    const apiKey =
      process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_GENAI_API_KEY or GOOGLE_AI_API_KEY environment variable is required"
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

export const getModel = (modelName: string = "gemini-2.0-flash-exp") => {
  const ai = getGoogleAI();
  return ai.getGenerativeModel({ model: modelName });
};
