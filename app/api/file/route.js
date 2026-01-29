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

/**
 * Get current uploaded file information
 * Returns file metadata and content if available
 */
// export async function GET(request) {
//     try {
//         // Determine uploads directory based on environment
//         // Vercel uses /tmp (ephemeral), local uses public/uploads
//         const uploadsDir = process.env.VERCEL 
//             ? '/tmp/uploads'
//             : path.join(process.cwd(), 'public', 'uploads');
        
//         // Return null if uploads directory doesn't exist
//         if (!fs.existsSync(uploadsDir)) {
//             return NextResponse.json({ 
//                 file: null, 
//                 content: null 
//             }, {
//                 headers: {
//                     'Access-Control-Allow-Origin': '*',
//                     'Access-Control-Allow-Methods': 'GET, OPTIONS',
//                     'Access-Control-Allow-Headers': 'Content-Type',
//                 }
//             });
//         }
        
//         // Check if there's a file in uploads directory
//         const files = await fs.promises.readdir(uploadsDir);
//         for (const filename of files) {
//             const filePath = path.join(uploadsDir, filename);
//             const stat = await fs.promises.stat(filePath);
            
//             if (stat.isFile()) {
//                 // Get file content if it's a CSV (for preview purposes)
//                 let content = null;
//                 const fileExtension = path.extname(filename).toLowerCase();
//                 if (fileExtension === '.csv') {
//                     try {
//                         content = await fs.promises.readFile(filePath, 'utf-8');
//                     } catch (err) {
//                         console.error(`Error reading file content: ${err}`);
//                     }
//                 }
                
//                 // Return file metadata and content
//                 return NextResponse.json({
//                     file: {
//                         name: filename,
//                         size: stat.size,
//                         uploadDate: new Date(stat.mtime).toISOString()
//                     },
//                     content: content
//                 }, {
//                     headers: {
//                         'Access-Control-Allow-Origin': '*',
//                         'Access-Control-Allow-Methods': 'GET, OPTIONS',
//                         'Access-Control-Allow-Headers': 'Content-Type',
//                     }
//                 });
//             }
//         }
        
//         // No file found in uploads directory
//         return NextResponse.json({ 
//             file: null, 
//             content: null 
//         }, {
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//                 'Access-Control-Allow-Methods': 'GET, OPTIONS',
//                 'Access-Control-Allow-Headers': 'Content-Type',
//             }
//         });

//     } catch (error) {
//         // Log error for debugging
//         console.error('File fetch error:', error);
//         console.error('Error stack:', error.stack);
        
//         // Return error response
//         return NextResponse.json({ 
//             error: "Failed to fetch file",
//             details: error.message 
//         }, { 
//             status: 500,
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//                 'Access-Control-Allow-Methods': 'GET, OPTIONS',
//                 'Access-Control-Allow-Headers': 'Content-Type',
//             }
//         });
//     }
// }


export async function GET(request) {
    try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbwRrZl-p1kmHB5jXwoZHnjvN3xZEmLpCjd-JhrQ8Oiq8CJU-Zn4cgYHgktKxz_xg9aE/exec");
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
