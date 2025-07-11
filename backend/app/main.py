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

### FILE ENDPOINT ###
@app.get("/api/file")
async def get_file():
    """
    Get the current uploaded file info and content
    """
    try:
        uploads_dir = "uploads"
        if not os.path.exists(uploads_dir):
            return {"file": None, "content": None}
        
        # Check if there's a file in uploads directory
        for filename in os.listdir(uploads_dir):
            file_path = os.path.join(uploads_dir, filename)
            if os.path.isfile(file_path):
                stat = os.stat(file_path)
                
                # Get file content if it's a CSV
                content = None
                file_extension = os.path.splitext(filename)[1].lower()
                if file_extension == '.csv':
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                    except Exception as e:
                        print(f"Error reading file content: {e}")
                
                return {
                    "file": {
                        "name": filename,
                        "size": stat.st_size,
                        "uploadDate": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    },
                    "content": content
                }
        
        # No file found
        return {"file": None, "content": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file: {str(e)}")

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
        # Use original filename (will replace if exists)
        file_path = os.path.join("uploads", file.filename)

        # Delete any existing files in uploads directory
        uploads_dir = "uploads"
        if os.path.exists(uploads_dir):
            for existing_file in os.listdir(uploads_dir):
                existing_file_path = os.path.join(uploads_dir, existing_file)
                if os.path.isfile(existing_file_path):
                    os.remove(existing_file_path)

        # save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)        
        
        return {
            "message": f"File uploaded successfully",
            "file": {
                "name": file.filename,
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




### Extract Data ENDPOINT ###
def load_csv_config():
    """
    Load the CSV config
    """
    try:
        with open("csv_config.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="CSV config file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load CSV config: {str(e)}")

# Process Data
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

        # Load the CSV file first to see what columns exist
        df = pd.read_csv(f"uploads/{file_name}")
        
        # Clean column names and renamed columns (strip whitespace and convert to lowercase)
        df.columns = df.columns.str.strip().str.lower()
        expected_columns = [col.strip().lower() for col in columns.values()]
        
       

        ### DEBUG ###
        print(f"Available columns in CSV: {list(df.columns)}")
        print("--------------------------------")
        print(f"Expected columns from config: {expected_columns}")

        # Check which columns are missing
        missing_columns = [col for col in expected_columns if col not in df.columns]
        if missing_columns:
            print(f"Missing columns: {missing_columns}")
            raise HTTPException(status_code=400, detail=f"CSV file is missing required columns: {missing_columns}")
        
        # Create a mapping from lowercase column names to renamed columns
        column_mapping = {}
        for original_col, renamed_col in renamed_columns.items():
            column_mapping[original_col.strip().lower()] = renamed_col
        
        # Select only the columns we want and rename them
        df = df.loc[:, expected_columns].rename(columns=column_mapping)

        # Validate the data
        warnings = []
        validation_config = csv_format["validations"]

        for field, validation in validation_config.items():
            if field in df.columns:
                valid_values = validation["valid_values"]
                # Skip validation if valid_values is "any"
                if valid_values == "any":
                    continue
                # Ensure valid_values is a list and convert to lowercase
                if isinstance(valid_values, str):
                    valid_values = [valid_values.strip().lower()]
                else:
                    valid_values = [val.strip().lower() for val in valid_values]
                
                # Clean the data values (strip whitespace and handle NaN)
                cleaned_values = df[field].astype(str).str.strip().str.lower()
                non_null_mask = ~df[field].isna()
                cleaned_values = cleaned_values[non_null_mask]
                
                # Find invalid values by comparing cleaned values
                invalid_values = []
                for value in cleaned_values.unique():
                    if value not in valid_values:
                        invalid_values.append(value)
                
                if len(invalid_values) > 0:
                    warnings.append(f'Invalid {field} values: {invalid_values}')

        # Convert DataFrame to records, handling NaN values
        records = df.to_dict("records")
        
        # Replace NaN values with None for JSON serialization
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        
        return {
            "data": records,
            "warnings": warnings,
            "total_records": len(df),
            "columns": list(df.columns)
        }
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        print(f"Error in process_data: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

class ExtractData(BaseModel):
    file_name: str

# Final Extract and Send Data to Frontend
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


