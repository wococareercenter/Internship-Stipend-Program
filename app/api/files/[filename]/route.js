import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
    try {
        const { filename } = params;
        
        if (!filename) {
            return NextResponse.json({ 
                error: "Filename is required" 
            }, { status: 400 });
        }

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        const filePath = path.join(uploadsDir, filename);

        // Security check: ensure the file is within the uploads directory
        const resolvedPath = path.resolve(filePath);
        const resolvedUploadsDir = path.resolve(uploadsDir);
        
        if (!resolvedPath.startsWith(resolvedUploadsDir)) {
            return NextResponse.json({ 
                error: "Access denied" 
            }, { status: 403 });
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ 
                error: "File not found" 
            }, { status: 404 });
        }

        // Check if it's a CSV file
        const fileExtension = path.extname(filename).toLowerCase();
        if (fileExtension !== '.csv') {
            return NextResponse.json({ 
                error: "Only CSV files are supported for preview" 
            }, { status: 400 });
        }

        // Read file content
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Return the CSV content as text
        return new NextResponse(fileContent, {
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': `inline; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error('Error reading file:', error);
        return NextResponse.json({ 
            error: "Failed to read file",
            details: error.message 
        }, { status: 500 });
    }
} 