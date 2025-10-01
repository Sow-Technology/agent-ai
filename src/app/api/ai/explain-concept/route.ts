import { NextRequest, NextResponse } from 'next/server';

export interface ExplainConceptInput {
  prompt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExplainConceptInput = await request.json();
    
    const { explainConcept } = await import('@/ai/flows/explain-ai-flow');
    const result = await explainConcept(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Explain concept API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process explain concept' },
      { status: 500 }
    );
  }
}