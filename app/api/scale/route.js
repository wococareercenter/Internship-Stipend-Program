import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        
        const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
        
        const response = await fetch(`${fastApiUrl}/api/scale`, {
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
                error: "Failed to save scale",
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
        console.error('Scale save error:', error);
        return NextResponse.json({ 
            error: "Failed to save scale",
            details: error.message 
        }, { status: 500 });
    }
}

