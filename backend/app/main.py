from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel



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

@app.get("/")
async def root():
    return {"message": "ISP Platform is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Data model for test endpoint
class FAFSAScale(BaseModel):
    vhn: int
    hn: int

@app.post("/api/FAFSA")
async def fafsa_post(data: FAFSAScale):
    print(f"POST received: vhn={data.vhn}, hn={data.hn}")
    return {"result": {"vhn": data.vhn, "hn": data.hn}}   

