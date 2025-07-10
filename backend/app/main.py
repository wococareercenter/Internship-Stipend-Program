from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import time
from datetime import datetime
import pandas as pd
import json

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

### Extract Data ENDPOINT ###
def load_csv_config():
    """
    Load the CSV config
    """
    try:
        with open("backend/csv_config.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="CSV config file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load CSV config: {str(e)}")

def process_data(file_name: str):
    """
    Process the data from the CSV file
    """
    try:
        # Load the CSV config
        config = load_csv_config()
        csv_format = config["csv_format_2025"]
        columns = csv_format["columns"]
        renamed_columns = csv_format["renamed_columns"]

        # Load the CSV file and rename the columns
        df = pd.read_csv(f"uploads/{file_name}").loc[:, columns.values()].rename(columns=renamed_columns)

        # Validate the data
        warnings = []
        validation_config = csv_format["validations"]

        for field, validation in validation_config.items():
            if field in df.columns:
                valid_values = validation["valid_values"]
                invalid_values = df[~df[field].isin(valid_values)][field].unique()
                
                if len(invalid_values) > 0:
                    warnings.append(f'Invalid {field} values: {list(invalid_values)}')

        return {
            "data": df.to_dict("records"),
            "warnings": warnings,
            "total_records": len(df),
            "columns": list(df.columns)
        }
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")



class ExtractData(BaseModel):
    file_name: str

@app.post("/api/extract")
async def extract_data_endpoint(data: ExtractData):
    """
    Extract data from a CSV file
    """
    try:
        result = process_data(data.file_name)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract data: {str(e)}")



