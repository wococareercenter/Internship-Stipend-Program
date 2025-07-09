from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import time


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


### FAFSA ENDPOINT ###
# Data model for FAFSA endpoint
class FAFSAScale(BaseModel):
    vhn: int
    hn: int

@app.post("/api/FAFSA")
async def fafsa_post(data: FAFSAScale):
    print(f"POST received: vhn={data.vhn}, hn={data.hn}")
    return {"result": {"vhn": data.vhn, "hn": data.hn}}   


### PAID / UNPAID ENDPOINT ###

### IN PERSON / HYBRID / VIRTUAL ENDPOINT ###

### COST OF LIVING ENDPOINT ###


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






