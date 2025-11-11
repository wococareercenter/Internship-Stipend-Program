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
    try {
        const body = await request.json();
        const { scale } = body;
        
        // Simply return the scale - no need to proxy to FastAPI
        return NextResponse.json({ 
            result: scale 
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

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

