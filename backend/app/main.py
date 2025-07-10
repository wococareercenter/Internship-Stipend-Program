from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import time
from datetime import datetime


app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

### ROOT ENDPOINT ###
@app.get("/")
async def root():
    return {"message": "ISP Platform is running!"}

### SCALE ENDPOINT ###
# Data model for SCALE endpoint
class Scale(BaseModel):
    scale: dict

@app.post("/api/scale")
async def scale_post(data: Scale):
    print(f"POST received: {data.scale}")
    return {"result": data.scale}

### FILE LIST ENDPOINT ###
@app.get("/api/files")
async def list_files():
    """
    List all uploaded files
    """
    try:
        uploads_dir = "uploads"
        if not os.path.exists(uploads_dir):
            return {"files": []}
        
        files = []
        for filename in os.listdir(uploads_dir):
            file_path = os.path.join(uploads_dir, filename)
            if os.path.isfile(file_path):
                stat = os.stat(file_path)
                files.append({
                    "name": filename,
                    "size": stat.st_size,
                    "uploadDate": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        # Sort files by upload date (newest first)
        files.sort(key=lambda x: x["uploadDate"], reverse=True)
        
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

### FILE UPLOAD ENDPOINT ###
@app.post("/api/upload")
async def upload_file(file: UploadFile):
    """
    Upload a CSV file
    """
    try:
        # Validdate file type
        allowed_extensions = {".csv"}
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Only CSV files are allowed."
            )

        # Validate file size
        max_size = 10 * 1024 * 1024 # 10MB
        content = await file.read()
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File size too large."
            )
        # Generate unique filename
        timestamp = int(time.time())
        unique_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join("uploads", unique_filename)

        # save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)        
        
        return {
            "message": f"File uploaded successfully",
            "file": {
                "name": unique_filename,
                "original_name": file.filename,
                "size": len(content),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        # unexpected error
        raise HTTPException(
            status_code=500, 
            detail=f"Upload failed: {str(e)}"
        )

### FILE DELETE ENDPOINT ###
@app.delete("/api/files/{file_name}")
async def delete_file(file_name: str):
    """
    Delete a file
    """
    try:
        file_path = os.path.join("uploads", file_name)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        os.remove(file_path)
        return {"message": "File deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

### FILE GET ENDPOINT ###
@app.get("/api/files/{file_name}")
async def get_file(file_name: str):
    """
    Get file content
    """
    try:
        file_path = os.path.join("uploads", file_name)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check if it's a CSV file
        file_extension = os.path.splitext(file_name)[1].lower()
        if file_extension != '.csv':
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are supported for preview"
            )
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {"content": content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")





