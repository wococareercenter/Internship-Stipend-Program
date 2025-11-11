/**
 * Data Extraction API Route
 * 
 * This endpoint processes uploaded CSV files by:
 * 1. Reading and parsing the CSV file
 * 2. Validating required columns
 * 3. Cleaning location data using OpenAI
 * 4. Standardizing hours data
 * 5. Calculating scores based on the provided scale
 * 
 * @route POST /api/extract
 * @body {string} file_name - Name of the uploaded CSV file
 * @body {object} scale - Scoring scale configuration (optional, uses default if not provided)
 * @returns {object} Processed data with scores, warnings, and metadata
 */

import { NextResponse } from 'next/server';
import { processData } from '../utils/processData';

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
 * Main extraction endpoint
 * Processes CSV file and returns scored data
 */
export async function POST(request) {
    try {
        // Parse request body
        const body = await request.json();
        const { file_name, scale } = body;
        
        // Validate required parameters
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
        
        // Process the CSV file: parse, validate, clean, and score
        // This function handles the entire data processing pipeline
        const result = await processData(file_name, scale);
        
        // Return processed data with scores and warnings
        return NextResponse.json(result, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        // Log error for debugging
        console.error('Extract error:', error);
        console.error('Error stack:', error.stack);
        
        // Determine appropriate HTTP status code based on error type
        const statusCode = error.message.includes('not found') ? 404 
            : error.message.includes('missing required columns') ? 400 
            : 500;
        
        // Return error response with details
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

