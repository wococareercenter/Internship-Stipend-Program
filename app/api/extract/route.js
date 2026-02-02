/**
 * Data Extraction API Route
 *
 * Processes in-memory data (e.g. from GET /api/file):
 * 1. Validates required columns (only those present in data)
 * 2. Cleaning location data using OpenAI
 * 3. Standardizing hours data
 * 4. Calculating scores based on the provided scale
 *
 * @route POST /api/extract
 * @body {object|Array} data - Array of row objects, or { data: array }
 * @body {object} scale - Scoring scale configuration (optional)
 * @returns {object} Processed data with scores, warnings, and metadata
 */

import { NextResponse } from 'next/server';
import { processDataFromRecords } from '../utils/processData';

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
        const body = await request.json();
        const { data: rawData, scale } = body;

        if (rawData === undefined || rawData === null) {
            return NextResponse.json({
                error: "Data is required"
            }, {
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        const records = Array.isArray(rawData) ? rawData : (rawData?.data && Array.isArray(rawData.data) ? rawData.data : null);
        if (!records || !Array.isArray(records)) {
            return NextResponse.json({
                error: "Data must be an array of row objects or an object with a 'data' array"
            }, {
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        const result = await processDataFromRecords(records, scale);
        
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

