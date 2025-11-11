import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
        
        const response = await fetch(`${fastApiUrl}/api/file`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
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
                error: "Failed to fetch file",
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
        console.error('File fetch error:', error);
        return NextResponse.json({ 
            error: "Failed to fetch file",
            details: error.message 
        }, { status: 500 });
    }
}

