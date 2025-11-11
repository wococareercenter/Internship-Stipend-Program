import { NextResponse } from 'next/server';

// Export route config to ensure it's publicly accessible
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle CORS preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function POST(request) {
    console.log('POST /api/scale called');
    try {
        const body = await request.json();
        
        // Use relative URL in production, absolute in development
        let apiPath;
        
        if (process.env.NODE_ENV === 'production') {
            // In production, construct full URL from request headers
            const headers = request.headers;
            const host = headers.get('host') || headers.get('x-forwarded-host');
            const protocol = headers.get('x-forwarded-proto') || 'https';
            const baseUrl = `${protocol}://${host}`;
            apiPath = `${baseUrl}/backend-api/api/scale`;
        } else {
            // In development, use environment variable or default
            const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
            apiPath = `${fastApiUrl}/api/scale`;
        }
        
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
                error: "Failed to save scale",
                details: errorData 
            }, { 
                status: response.status,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        } else {
            const textData = await response.text();
            return NextResponse.json({ 
                error: "Invalid response format from backend",
                details: textData 
            }, { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

    } catch (error) {
        console.error('Scale save error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({ 
            error: "Failed to save scale",
            details: error.message 
        }, { 
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }
}

