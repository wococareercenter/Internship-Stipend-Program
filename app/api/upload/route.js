/**
 * File Upload API Route
 * 
 * Handles CSV file uploads with validation:
 * - Validates file type (CSV, Excel)
 * - Validates file size (max 10MB)
 * - Stores files in uploads directory
 * - Cleans up old files before storing new one
 * 
 * @route POST /api/upload
 * @body FormData with 'file' field
 * @returns {object} Upload confirmation with file metadata
 */

import { NextResponse } from 'next/server';
import path from "path";
import fs from 'fs';
import { writeFile, mkdir } from 'fs/promises';

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
 * Main upload endpoint
 * Handles file upload, validation, and storage
 */
export async function POST(request) {
    try {
        // Parse multipart form data to get uploaded file
        const formData = await request.formData();
        const file = formData.get('file');
        
        // Validate file was provided
        if (!file) {
            return NextResponse.json({ 
                error: "No file provided" 
            }, { 
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        // Validate file type - only allow CSV and Excel files
        const allowedExtensions = ['.csv', '.xls', '.xlsx'];
        const fileName = file.name || '';
        const fileExtension = path.extname(fileName).toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            return NextResponse.json({ 
                error: "Invalid file type. Only CSV and Excel files are allowed." 
            }, { 
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        // Validate file size - maximum 10MB
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ 
                error: "File size must be less than 10MB" 
            }, { 
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        // Determine uploads directory based on environment
        // Vercel uses /tmp (ephemeral), local uses public/uploads
        const uploadsDir = process.env.VERCEL 
            ? '/tmp/uploads'
            : path.join(process.cwd(), 'public', 'uploads');
        
        // Create uploads directory if it doesn't exist
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (err) {
            // Directory might already exist, that's fine
        }
        
        // Clean up old files - only one file should exist at a time
        try {
            const files = await fs.promises.readdir(uploadsDir);
            for (const existingFile of files) {
                const filePath = path.join(uploadsDir, existingFile);
                const stat = await fs.promises.stat(filePath);
                if (stat.isFile()) {
                    await fs.promises.unlink(filePath);
                }
            }
        } catch (err) {
            // Ignore errors when cleaning up
        }
        
        // Read file buffer from uploaded file
        const fileBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);
        
        // Save file to uploads directory
        const filePath = path.join(uploadsDir, file.name);
        await writeFile(filePath, buffer);
        
        // Return success response with file metadata
        return NextResponse.json({ 
            message: "File uploaded successfully",
            file: {
                name: file.name,
                original_name: file.name,
                size: buffer.length,
            }
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        // Log error for debugging
        console.error('Upload error:', error);
        console.error('Error stack:', error.stack);
        
        // Return error response
        return NextResponse.json({ 
            error: "Failed to upload file",
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