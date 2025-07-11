from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import time
from datetime import datetime
import pandas as pd
import json
from dotenv import load_dotenv
from openai import OpenAI

app = FastAPI()

# Global cache for cleaned locations to avoid re-cleaning
location_cache = {}

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

### CACHE ENDPOINT ###
@app.get("/api/cache")
async def get_cache():
    """Get the current location cache"""
    global location_cache
    return {
        "cache_size": len(location_cache),
        "cached_locations": location_cache
    }

@app.delete("/api/cache")
async def clear_cache():
    """Clear the location cache"""
    global location_cache
    cache_size = len(location_cache)
    location_cache.clear()
    return {"message": f"Cache cleared. Removed {cache_size} cached locations."}

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

class ExtractData(BaseModel):
    file_name: str
    scale: dict

# Clean Location Column
def clean_location_column(df):
    """
    Clean the location column using LLM
    """
    load_dotenv('.env')
    api_key = os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        print("Warning: OPENROUTER_API_KEY not found, skipping location cleaning")
        return df
    
    client = OpenAI(api_key=api_key)
    
    def get_location(location):
        """Get cleaned location from LLM"""
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{
                    "role": "user",
                    "content": f"""
                        Extract the state from this location: '{location}'
                        Return only the state name with no spaces (e.g., 'NewYork', 'California', 'Texas')
                        If no state is found, return 'Unknown'
                        Examples:
                        - 'New York, NY' -> 'NewYork'
                        - 'Los Angeles, CA' -> 'California'
                        - 'South Carolina' -> 'SouthCarolina'
                    """
                }]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error cleaning location '{location}': {e}")
            return "Unknown"
    
    # Clean locations using ThreadPoolExecutor for efficiency
    from concurrent.futures import ThreadPoolExecutor
    
    clean_df = df.copy()
    locations = list(clean_df['location'].dropna().unique())  # Get unique locations
    
    # Check cache first and only clean new locations
    location_mapping = {}
    locations_to_clean = []
    
    for loc in locations:
        if loc in location_cache:
            location_mapping[loc] = location_cache[loc]
            print(f"'{loc}' -> '{location_cache[loc]}' (from cache)")
        else:
            locations_to_clean.append(loc)
    
    if locations_to_clean:
        print(f"Cleaning {len(locations_to_clean)} new unique locations...")
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(get_location, loc): loc for loc in locations_to_clean}
            
            for future in futures:
                original_loc = futures[future]
                try:
                    cleaned_loc = future.result()
                    location_mapping[original_loc] = cleaned_loc
                    location_cache[original_loc] = cleaned_loc  # Store in cache
                    print(f"'{original_loc}' -> '{cleaned_loc}' (new)")
                except Exception as e:
                    print(f"Error processing '{original_loc}': {e}")
                    location_mapping[original_loc] = "Unknown"
                    location_cache[original_loc] = "Unknown"  # Store in cache
    else:
        print("All locations found in cache, no LLM calls needed!")
    
    # Apply the mapping to the dataframe
    clean_df['location'] = clean_df['location'].map(location_mapping).fillna("Unknown")
    
    return clean_df

# Process Data
def process_data(file_name: str, scale: dict = None):
    """
    Process the data from the CSV file
    """
    try:
        # Load the CSV config
        config = load_csv_config()
        csv_format = config["csv_format_2025"]
        default_scale = config["default_scale"] # default scale for the data
        if scale is None:
            scale = default_scale

        columns = csv_format["columns"]
        renamed_columns = csv_format["renamed_columns"]

        # Load the CSV file first to see what columns exist
        df = pd.read_csv(f"uploads/{file_name}")
        
        # Clean column names and renamed columns (strip whitespace and convert to lowercase)
        df.columns = df.columns.str.strip().str.lower()
        expected_columns = [col.strip().lower() for col in columns.values()]
        
       

        ### DEBUG ###
        # print(f"Available columns in CSV: {list(df.columns)}")
        # print("--------------------------------")
        # print(f"Expected columns from config: {expected_columns}")

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

        # clean the location column
        df = clean_location_column(df)
        
        # Convert DataFrame to records, handling NaN values
        records = df.to_dict("records")
        
        # Calculate scores for each record
        for record in records:
            # Replace NaN values with None for JSON serialization
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None

            # Calculate scores for this student
            score = 0
            score_breakdown = {}

            # Need Level scoring with mapping
            if record.get('need_level'):
                need_level = record['need_level'].lower().replace(' ', '')
                # Map the CSV values to scale keys
                need_mapping = {
                    'veryhighneed': 'veryHighNeed',
                    'highneed': 'highNeed', 
                    'moderateneed': 'moderateNeed',
                    'lowneed': 'lowNeed',
                    'noneed': 'noNeed'
                }
                scale_key = need_mapping.get(need_level, need_level)
                need_scores = scale['fafsaScale']
                need_score = need_scores.get(scale_key, 0)
                

                
                score_breakdown['need_level'] = need_score
                score += need_score
            
            # Paid/Unpaid scoring
            if record.get('paid_internship'):
                paid_status = record['paid_internship'].lower()
                paid_scores = scale['paid']
                paid_score = paid_scores.get(paid_status, 0)
                score_breakdown['paid_internship'] = paid_score
                score += paid_score
            
            # Internship Type scoring with mapping
            if record.get('internship_type'):
                internship_type = record['internship_type'].lower().replace('-', '')
                # Map the CSV values to scale keys
                type_mapping = {
                    'inperson': 'inPerson',
                    'hybrid': 'hybrid',
                    'virtual': 'virtual'
                }
                scale_key = type_mapping.get(internship_type, internship_type)
                type_scores = scale['internshipType']
                type_score = type_scores.get(scale_key, 0)
                score_breakdown['internship_type'] = type_score
                score += type_score

            # Location scoring (look up in cost of living tiers)
            if record.get('location'):
                location_score = 0
                location = record['location']
                
                # Look up in cost of living tiers
                cost_of_living = scale['costOfLiving']
                for tier_name, tier_states in cost_of_living.items():
                    if location in tier_states:
                        location_score = tier_states[location]
                        break
                
                score_breakdown['location'] = location_score
                score += location_score

            record['score'] = score
            record['score_breakdown'] = score_breakdown

        return {
            "data": records,
            "warnings": warnings,
            "total_records": len(df),
            "columns": list(df.columns),
        }
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        print(f"Error in process_data: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")



class CalculateScores(BaseModel):
    scale: dict
    data: dict



# Final Extract and Send Data to Frontend
@app.post("/api/extract")
async def extract_data_endpoint(data: ExtractData):
    """
    Extract data from a CSV file
    """
    try:
        result = process_data(data.file_name, data.scale)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract data: {str(e)}")


