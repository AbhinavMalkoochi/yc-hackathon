from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="YC Agent API", version="1.0.0")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessageResponse(BaseModel):
    message: str
    status: str
    timestamp: str

@app.get("/")
async def root():
    return {"message": "FastAPI server is running!"}

@app.get("/api/message", response_model=MessageResponse)
async def get_message():
    from datetime import datetime
    return MessageResponse(
        message="Hello from FastAPI backend!",
        status="success",
        timestamp=datetime.now().isoformat()
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fastapi-backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

