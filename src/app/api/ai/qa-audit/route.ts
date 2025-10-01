import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { qaAuditCall } = await import('@/ai/flows/qa-audit-flow');
    const result = await qaAuditCall(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('QA Audit API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process QA audit' },
      { status: 500 }
    );
  }
}