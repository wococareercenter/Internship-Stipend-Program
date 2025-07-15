import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // In development, forward to local FastAPI server
    // In production, the request will be handled by the same domain
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:8000' 
      : '';
    
    const fastapiResponse = await fetch(`${baseUrl}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!fastapiResponse.ok) {
      throw new Error(`FastAPI responded with status: ${fastapiResponse.status}`);
    }

    const data = await fastapiResponse.json();
    return NextResponse.json(data, { status: fastapiResponse.status });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json(
      { error: 'Extract request failed', details: error.message },
      { status: 500 }
    );
  }
} 