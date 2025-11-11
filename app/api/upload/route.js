import { NextResponse } from 'next/server';
import path from "path";

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
        let apiPath;
        
        if (process.env.NODE_ENV === 'production') {
            // In production, construct full URL from request headers
            const headers = request.headers;
            const host = headers.get('host') || headers.get('x-forwarded-host');
            const protocol = headers.get('x-forwarded-proto') || 'https';
            const baseUrl = `${protocol}://${host}`;
            apiPath = `${baseUrl}/backend-api/api/upload`;
            console.log('Production API path:', apiPath);
        } else {
            // In development, use environment variable or default
            const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
            apiPath = `${fastApiUrl}/api/upload`;
            console.log('Development API path:', apiPath);
        }
        
        // Read file as array buffer for forwarding
        const fileBuffer = await file.arrayBuffer();
        
        // Create a new FormData with the file buffer
        const forwardFormData = new FormData();
        
        // Try to create a File object, fallback to Blob if File is not available
        let fileToForward;
        if (typeof File !== 'undefined') {
            fileToForward = new File([fileBuffer], file.name, { type: file.type });
        } else {
            // Fallback: use Blob (which should be available in Next.js)
            fileToForward = new Blob([fileBuffer], { type: file.type });
        }
        forwardFormData.append('file', fileToForward, file.name);
        
        const response = await fetch(apiPath, {
            method: 'POST',
            body: forwardFormData,
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('Backend upload failed:', errorData);
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
        console.error('Error stack:', error.stack);
        return NextResponse.json({ 
            error: "Failed to upload file",
            details: error.message 
        }, { status: 500 });
    }
}