/**
 * Scale Configuration API Route
 * 
 * Saves the scoring scale configuration from the frontend.
 * The scale is used later during data extraction to calculate scores.
 * 
 * @route POST /api/scale
 * @body {object} scale - Scoring scale configuration object
 * @returns {object} Confirmation with the saved scale
 */

import { NextResponse } from 'next/server';

// Export route config to ensure it's publicly accessible
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Handle CORS preflight requests
 * Allows cross-origin requests from the frontend
 */
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

/**
 * Save scale configuration
 * Receives scale from frontend and returns it (scale is passed to extract endpoint)
 */
export async function POST(request) {
    try {
        // Parse request body to get scale configuration
        const body = await request.json();
        const { scale } = body;
        
        // Return the scale (frontend will use this when calling extract endpoint)
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
        // Log error for debugging
        console.error('Scale save error:', error);
        console.error('Error stack:', error.stack);
        
        // Return error response
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

