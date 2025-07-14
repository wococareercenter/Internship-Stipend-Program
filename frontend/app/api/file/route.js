import { NextRequest, NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Forward the request to FastAPI
    const fastapiResponse = await fetch('http://127.0.0.1:8000/api/file');
    const data = await fastapiResponse.json();
    
    return NextResponse.json(data, { status: fastapiResponse.status });
  } catch (error) {
    console.error('File fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
} 