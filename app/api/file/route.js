import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Export route config to ensure it's publicly accessible
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle CORS preflight requests
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
    try {
        // Determine uploads directory
        const uploadsDir = process.env.VERCEL 
            ? '/tmp/uploads'
            : path.join(process.cwd(), 'public', 'uploads');
        
        if (!fs.existsSync(uploadsDir)) {
            return NextResponse.json({ 
                file: null, 
                content: null 
            }, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }
        
        // Check if there's a file in uploads directory
        const files = await fs.promises.readdir(uploadsDir);
        for (const filename of files) {
            const filePath = path.join(uploadsDir, filename);
            const stat = await fs.promises.stat(filePath);
            
            if (stat.isFile()) {
                // Get file content if it's a CSV
                let content = null;
                const fileExtension = path.extname(filename).toLowerCase();
                if (fileExtension === '.csv') {
                    try {
                        content = await fs.promises.readFile(filePath, 'utf-8');
                    } catch (err) {
                        console.error(`Error reading file content: ${err}`);
                    }
                }
                
                return NextResponse.json({
                    file: {
                        name: filename,
                        size: stat.size,
                        uploadDate: new Date(stat.mtime).toISOString()
                    },
                    content: content
                }, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                });
            }
        }
        
        // No file found
        return NextResponse.json({ 
            file: null, 
            content: null 
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error('File fetch error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({ 
            error: "Failed to fetch file",
            details: error.message 
        }, { 
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }
}

