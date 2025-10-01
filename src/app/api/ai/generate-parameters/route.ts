import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();

    const { generateParametersFromSop } = await import(
      "@/ai/flows/generate-parameters-from-sop-flow"
    );
    const result = await generateParametersFromSop({ title, content });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate parameters API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate parameters from SOP" },
      { status: 500 }
    );
  }
}
