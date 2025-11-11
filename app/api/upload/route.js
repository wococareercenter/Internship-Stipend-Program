import { NextResponse } from 'next/server';
import path from "path";
import fs from 'fs';
import { writeFile, mkdir } from 'fs/promises';

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
        // Get the file from the request
        const formData = await request.formData();
        const file = formData.get('file');
        
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

        // Validate file type
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

        // Validate file size
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

        // Handle file storage directly - no need to proxy to FastAPI
        // Determine uploads directory
        const uploadsDir = process.env.VERCEL 
            ? '/tmp/uploads'
            : path.join(process.cwd(), 'public', 'uploads');
        
        // Create uploads directory if it doesn't exist
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (err) {
            // Directory might already exist, that's fine
        }
        
        // Delete any existing files in uploads directory
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
        
        // Read file buffer
        const fileBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);
        
        // Save file
        const filePath = path.join(uploadsDir, file.name);
        await writeFile(filePath, buffer);
        
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
        console.error('Upload error:', error);
        console.error('Error stack:', error.stack);
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