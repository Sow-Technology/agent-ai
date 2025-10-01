import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Call the AI QA audit API
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ai/qa-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && { 'Authorization': request.headers.get('authorization')! }),
      },
      body: JSON.stringify(body),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API returned ${aiResponse.status}: ${aiResponse.statusText}`);
    }

    const result = await aiResponse.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('QA Audit API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process QA audit' },
      { status: 500 }
    );
  }
}