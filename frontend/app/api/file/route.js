import { NextRequest, NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // In development, forward to local FastAPI server
    // In production, the request will be handled by the same domain
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:8000' 
      : '';
    
    const fastapiResponse = await fetch(`${baseUrl}/api/file`);
    
    if (!fastapiResponse.ok) {
      throw new Error(`FastAPI responded with status: ${fastapiResponse.status}`);
    }
    
    const data = await fastapiResponse.json();
    return NextResponse.json(data, { status: fastapiResponse.status });
  } catch (error) {
    console.error('File fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file', details: error.message },
      { status: 500 }
    );
  }
} 