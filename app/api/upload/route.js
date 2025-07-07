import { NextRequest, NextResponse } from 'next/server';
import formidable from "formidable";
import fs from "fs";
import path from "path";

export async function POST(request) {
    try {
        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const form = formidable({
            uploadDir: uploadsDir,
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            filter: function ({ name, originalFilename, mimetype }) {
                // Only allow CSV and Excel files
                const allowedTypes = [
                    'text/csv',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ];
                
                const allowedExtensions = ['.csv', '.xls', '.xlsx'];
                const fileExtension = path.extname(originalFilename || '').toLowerCase();
                
                return allowedTypes.includes(mimetype) || allowedExtensions.includes(fileExtension);
            }
        });

        // Convert NextRequest to Node.js request for formidable
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            return NextResponse.json({ 
                error: "No file provided" 
            }, { status: 400 });
        }

        // Validate file type
        const allowedExtensions = ['.csv', '.xls', '.xlsx'];
        const fileName = file.name || '';
        const fileExtension = path.extname(fileName).toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            return NextResponse.json({ 
                error: "Invalid file type. Only CSV and Excel files are allowed." 
            }, { status: 400 });
        }

        // Validate file size
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ 
                error: "File size must be less than 10MB" 
            }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}_${fileName}`;
        const filePath = path.join(uploadsDir, uniqueFileName);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fs.writeFileSync(filePath, buffer);

        // Generate URL for the uploaded file
        const fileUrl = `/uploads/${uniqueFileName}`;

        return NextResponse.json({ 
            message: "File uploaded successfully",
            file: {
                name: fileName,
                size: file.size,
                type: file.type,
                url: fileUrl
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ 
            error: "Failed to upload file",
            details: error.message 
        }, { status: 500 });
    }
} 