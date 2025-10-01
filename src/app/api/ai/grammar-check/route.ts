import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    const { grammarCheck } = await import('@/ai/flows/grammar-check-flow');
    const result = await grammarCheck({ text });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Grammar check API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process grammar check' },
      { status: 500 }
    );
  }
}