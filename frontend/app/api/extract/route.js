import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Forward the request to FastAPI
    const fastapiResponse = await fetch('http://127.0.0.1:8000/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await fastapiResponse.json();
    
    return NextResponse.json(data, { status: fastapiResponse.status });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json(
      { error: 'Extract request failed' },
      { status: 500 }
    );
  }
} 