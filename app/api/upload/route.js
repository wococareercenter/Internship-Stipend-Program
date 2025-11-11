import { NextResponse } from 'next/server';
import path from "path";
import fs from "fs";

export async function POST(request) {
    try {
        // Get the file from the request
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

        // Forward the file to FastAPI backend
        // Use relative URL in production, absolute in development
        const fastApiUrl = process.env.NODE_ENV === 'production' 
            ? '' // Relative URL - will use same origin
            : (process.env.FASTAPI_URL || 'http://localhost:8000');
        
        // In production, FastAPI is accessible at /backend-api/api/* (FastAPI routes are at /api/*)
        const apiPath = process.env.NODE_ENV === 'production' 
            ? '/backend-api/api/upload'
            : `${fastApiUrl}/api/upload`;
        
        const fastApiFormData = new FormData();
        fastApiFormData.append('file', file);
        
        const response = await fetch(apiPath, {
            method: 'POST',
            body: fastApiFormData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ 
                error: "Backend upload failed",
                details: errorData 
            }, { status: response.status });
        }

        const data = await response.json();
        
        return NextResponse.json({ 
            message: "File uploaded successfully",
            file: data.file
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ 
            error: "Failed to upload file",
            details: error.message 
        }, { status: 500 });
    }
}