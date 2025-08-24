from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
from datetime import datetime
import uvicorn

app = FastAPI(title="Test Credentials API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple credentials storage
CREDENTIALS_STORE: Dict[str, Dict[str, str]] = {}

# Pydantic models
class AddCredentialsRequest(BaseModel):
    domain: str
    credentials: Dict[str, str]

class CredentialsResponse(BaseModel):
    message: str
    status: str
    domain: str
    credentials_count: int
    timestamp: str

class ListCredentialsResponse(BaseModel):
    message: str
    status: str
    domains: list[str]
    total_domains: int
    timestamp: str

# Endpoints
@app.get("/")
async def root():
    return {"message": "Test Credentials API is running!"}

@app.post("/api/credentials/add", response_model=CredentialsResponse)
async def add_credentials(request: AddCredentialsRequest):
    """Add credentials for a specific domain"""
    try:
        CREDENTIALS_STORE[request.domain] = request.credentials
        
        return CredentialsResponse(
            message=f"Credentials added successfully for {request.domain}",
            status="success",
            domain=request.domain,
            credentials_count=len(request.credentials),
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add credentials: {str(e)}")

@app.get("/api/credentials/list", response_model=ListCredentialsResponse)
async def list_credentials():
    """List all domains with stored credentials"""
    try:
        domains = list(CREDENTIALS_STORE.keys())
        
        return ListCredentialsResponse(
            message="Credentials retrieved successfully",
            status="success",
            domains=domains,
            total_domains=len(domains),
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list credentials: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
