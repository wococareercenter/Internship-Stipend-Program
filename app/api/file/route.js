/**
 * File Information API Route
 * 
 * Retrieves information about the currently uploaded file:
 * - File name and size
 * - Upload date
 * - File content (for CSV files)
 * 
 * @route GET /api/file
 * @returns {object} File metadata and content (if CSV)
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}


export async function GET(request) {
    const year = Number(request.nextUrl.searchParams.get('year'));
    try {
        let res = null;
        if (year === 2025) {
            res = await fetch(
                `https://script.google.com/macros/s/AKfycbzU-8TEzYCMwU5TcXMmC-UJNbbGvZppFzoUoqQ9NjcWJhMhpnczeOjedCRYe4tvHvCVEA/exec?year=${year}`
            ); // 2025
        } else if (year === 2026) {
            res = await fetch(
                `https://script.google.com/macros/s/AKfycbzBTfuSqWU6wyrCxRImnR6y7ghyUU6Fy-0PsRZg9wrfqfT9N6iItTu82-U3apHhdKc2Xw/exec?year=${year}`
            ); // 2026
        }
        
        const data = await res.json();

        // Return file metadata and content
        return NextResponse.json({
            content: data
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (error) {
        return NextResponse.json({ 
            error: "Failed to fetch data", 
            details: error.message 
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            status: 500
        });
    }
}
