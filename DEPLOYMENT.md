# Vercel Deployment Guide

## Overview
This project consists of a Next.js frontend and a FastAPI backend, both deployed on Vercel.

## Deployment Steps

### 1. Environment Variables
Make sure to set these environment variables in your Vercel project:

- `OPENAI_API_KEY`: Your OpenAI API key for location cleaning
- `VERCEL`: This will be automatically set by Vercel

### 2. File Structure
The deployment uses the following structure:
- Frontend: `frontend/` (Next.js app)
- Backend: `backend/api/index.py` (FastAPI serverless function)
- Root: `vercel.json` (deployment configuration)

### 3. Key Changes Made for Vercel

#### Backend Changes:
- Added proper error handling to return JSON responses
- Updated file uploads to use `/tmp` directory (writable on Vercel)
- Added CORS middleware for cross-origin requests
- Added global exception handler

#### Frontend Changes:
- Updated API routes to work in both development and production
- Added proper error handling in API routes
- Updated Next.js config for serverless deployment

### 4. Testing Deployment

After deployment, test these endpoints:

1. **Health Check**: `https://your-domain.vercel.app/health`
2. **Root**: `https://your-domain.vercel.app/`
3. **API Cache**: `https://your-domain.vercel.app/api/cache`

### 5. Common Issues and Solutions

#### Issue: "Unexpected token 'A', "A server e"... is not valid JSON"
**Solution**: This was caused by FastAPI returning HTML error pages instead of JSON. Fixed by:
- Adding proper exception handlers
- Ensuring all responses are JSON
- Updating CORS configuration

#### Issue: File uploads not working
**Solution**: Vercel has a read-only filesystem. Fixed by:
- Using `/tmp` directory for file uploads
- Creating uploads directory if it doesn't exist

#### Issue: Frontend can't connect to backend
**Solution**: Updated API routes to work in production by:
- Using relative URLs in production
- Keeping localhost URLs for development
- Adding proper error handling

### 6. Development vs Production

- **Development**: Frontend runs on `localhost:3000`, backend on `localhost:8000`
- **Production**: Both frontend and backend run on the same Vercel domain

### 7. Monitoring

Use the test script to verify deployment:
```bash
python test_deployment.py
```

Update the `base_url` in the test script to match your Vercel domain.

## Troubleshooting

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables are set
3. Test endpoints individually
4. Check browser console for frontend errors
5. Use the test script to verify backend functionality 