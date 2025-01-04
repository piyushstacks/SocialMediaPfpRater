import sys
from pathlib import Path
from settings import BASE_DIR

# Add project root to Python path
sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.gemini_model.route import router as gemini_model_router

app = FastAPI()

# Add CORS middleware (uncomment if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Changed to "*" to allow all methods, including GET, POST, etc.
    allow_headers=["*"],
)

# Include your router
app.include_router(gemini_model_router, prefix="/api/gemini_model", tags=["Gemini Model"])

# Define a root endpoint for basic testing
@app.get("/")
async def root():
    return {"message": "Welcome to the Image Rating API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
