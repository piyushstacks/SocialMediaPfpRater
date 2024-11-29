from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import aiohttp
import base64
import re
import logging
from typing import Optional

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define request and response models
class RatingRequest(BaseModel):
    image: str
    instructions: Optional[str] = None
    apiKey: str

class RatingResponse(BaseModel):
    score: int
    grade: str

# Helper function to convert data URI to bytes
def data_uri_to_bytes(data_uri: str) -> bytes:
    header, encoded = data_uri.split(",", 1)
    data = base64.b64decode(encoded)
    return data

# Helper function to detect MIME type
def detect_mime_type(data_uri: str) -> str:
    if data_uri.startswith('data:image/jpeg'):
        return 'image/jpeg'
    elif data_uri.startswith('data:image/png'):
        return 'image/png'
    elif data_uri.startswith('data:image/gif'):
        return 'image/gif'
    elif data_uri.startswith('data:image/webp'):
        return 'image/webp'
    else:
        return 'application/octet-stream'

# Helper function to prepare the image part for the request
def prepare_image_part(image_bytes: bytes, mime_type: str) -> dict:
    return {
        "inlineData": {
            "data": base64.b64encode(image_bytes).decode(),
            "mimeType": mime_type,
        }
    }

@router.post("/", response_model=RatingResponse)
async def get_image_rating(request: RatingRequest):
    # Validate input
    if not request.image:
        raise HTTPException(status_code=400, detail="Image data is required")
    if not request.apiKey:
        raise HTTPException(status_code=400, detail="API key is required")

    try:
        # Convert data URI to bytes
        image_bytes = data_uri_to_bytes(request.image)
        mime_type = detect_mime_type(request.image)

        # Prepare image part
        image_part = prepare_image_part(image_bytes, mime_type)

        # Default or custom instructions
        default_instructions = """
        Carefully analyze this profile picture and provide:
        1. A professional quality score from 1-100 based on:
           - Image clarity
           - Composition
           - Lighting
           - Professionalism
           - Overall visual appeal
        2. A corresponding letter grade (A+, A, A-, B+, B, B-, etc.)

        Respond ONLY with a JSON object:
        {
          "score": number (1-100),
          "grade": string
        }

        Be objective and precise in your rating.
        """
        prompt = request.instructions or default_instructions

        # Updated Gemini API endpoint
        url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {request.apiKey}"
        }

        # Payload structure for Gemini API
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    image_part
                ]
            }],
            "generationConfig": {
                "temperature": 0.4,
                "topP": 1,
                "topK": 32,
                "maxOutputTokens": 4096,
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_VIOLENCE", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            ]
        }

        # Make API request
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                # Log full response for debugging
                response_text = await resp.text()
                logger.info(f"Gemini API Response Status: {resp.status}")
                logger.info(f"Gemini API Response: {response_text}")

                # Check response status
                if resp.status != 200:
                    raise HTTPException(status_code=resp.status, detail=f"Gemini API error: {response_text}")

                # Parse JSON response
                result = await resp.json()

                # Extract generated text
                generated_text = result['candidates'][0]['content']['parts'][0]['text']
                logger.info(f"Generated Text: {generated_text}")

                # Extract score and grade using regex
                score_match = re.search(r'"score"\s*:\s*(\d+)', generated_text)
                grade_match = re.search(r'"grade"\s*:\s*"([A-F][+-]?)"', generated_text)

                if not score_match or not grade_match:
                    # Fallback parsing if JSON extraction fails
                    score_match = re.search(r'Score:\s*(\d+)', generated_text)
                    grade_match = re.search(r'Grade:\s*([A-F][+-]?)', generated_text)

                # Validate and return results
                if not score_match or not grade_match:
                    logger.error(f"Could not parse score and grade from: {generated_text}")
                    raise HTTPException(status_code=500, detail="Unable to parse Gemini response")

                score = int(score_match.group(1))
                grade = grade_match.group(1)

                return RatingResponse(score=score, grade=grade)

    except aiohttp.ClientError as e:
        logger.error(f"Network error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")