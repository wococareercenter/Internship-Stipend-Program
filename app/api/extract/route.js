import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        
        // Use relative URL in production, absolute in development
        const fastApiUrl = process.env.NODE_ENV === 'production' 
            ? '' // Relative URL - will use same origin
            : (process.env.FASTAPI_URL || 'http://localhost:8000');
        
        // In production, FastAPI is accessible at /backend-api/api/* (FastAPI routes are at /api/*)
        const apiPath = process.env.NODE_ENV === 'production' 
            ? '/backend-api/api/extract'
            : `${fastApiUrl}/api/extract`;
        
        const response = await fetch(apiPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
            } else {
                errorData = await response.text();
            }
            return NextResponse.json({ 
                error: "Failed to extract data",
                details: errorData 
            }, { status: response.status });
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data);
        } else {
            const textData = await response.text();
            return NextResponse.json({ 
                error: "Invalid response format from backend",
                details: textData 
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Extract error:', error);
        return NextResponse.json({ 
            error: "Failed to extract data",
            details: error.message 
        }, { status: 500 });
    }
}

