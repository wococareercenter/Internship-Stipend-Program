import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        
        // Check if uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            return NextResponse.json({ files: [] });
        }

        // Read all files in the uploads directory
        const files = fs.readdirSync(uploadsDir);
        
        const fileList = files.map(fileName => {
            const filePath = path.join(uploadsDir, fileName);
            const stats = fs.statSync(filePath);
            
            return {
                name: fileName,
                size: stats.size,
                uploadDate: stats.mtime.toISOString(),
                type: path.extname(fileName).toLowerCase(),
                url: `/uploads/${fileName}`
            };
        });

        // Sort by upload date (newest first)
        fileList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        return NextResponse.json({ 
            files: fileList 
        });

    } catch (error) {
        console.error('Error fetching files:', error);
        return NextResponse.json({ 
            error: "Failed to fetch files",
            details: error.message 
        }, { status: 500 });
    }
} 