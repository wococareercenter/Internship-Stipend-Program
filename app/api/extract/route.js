import { NextResponse } from 'next/server';
import { processData } from '../utils/processData';

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
        const { file_name, scale } = body;
        
        if (!file_name) {
            return NextResponse.json({ 
                error: "File name is required" 
            }, { 
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }
        
        // Process the data directly - no need to proxy to FastAPI
        const result = await processData(file_name, scale);
        
        return NextResponse.json(result, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error('Extract error:', error);
        console.error('Error stack:', error.stack);
        
        const statusCode = error.message.includes('not found') ? 404 
            : error.message.includes('missing required columns') ? 400 
            : 500;
        
        return NextResponse.json({ 
            error: "Failed to extract data",
            details: error.message 
        }, { 
            status: statusCode,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }
}

