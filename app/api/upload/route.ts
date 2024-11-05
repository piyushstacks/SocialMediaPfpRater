// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function getImageFromUrl(imageUrl: string): Promise<Buffer> {
  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer'
  });
  return Buffer.from(response.data, 'binary');
}

async function analyzeImageWithGemini(imageData: Buffer, prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

    // Convert buffer to base64
    const base64Image = imageData.toString('base64');
    
    // Prepare image for Gemini
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ];

    // Create analysis prompt
    const analysisPrompt = `
      Analyze this Twitter profile image based on the following criteria:
      ${prompt}
      Rate it on a scale of 1-10 and provide a detailed explanation.
      Format the response as JSON with the following structure:
      {
        "score": (number between 1-10),
        "rating": (brief one-line summary),
        "analysis": (detailed explanation)
      }
    `;

    // Generate content
    const result = await model.generateContent([analysisPrompt, ...imageParts]);
    const response = await result.response;
    
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt } = await req.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      );
    }

    // Get image data from URL
    const imageData = await getImageFromUrl(imageUrl);

    // Analyze with Gemini
    const analysis = await analyzeImageWithGemini(imageData, prompt);

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Upload Route Error:', error);
    return NextResponse.json(
      { 
        error: "Failed to analyze image",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method to handle direct image analysis requests
export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const username = searchParams.get('username');
  const prompt = searchParams.get('prompt');

  if (!username || !prompt) {
    return NextResponse.json(
      { error: "Username and prompt are required" },
      { status: 400 }
    );
  }

  try {
    // First get Twitter profile image using your existing route
    const twitterResponse = await fetch(`${req.nextUrl.origin}/api/twitter?username=${username}`);
    const twitterData = await twitterResponse.json();

    if (!twitterData.imageUrl) {
      return NextResponse.json(
        { error: "Failed to fetch Twitter profile image" },
        { status: 404 }
      );
    }

    // Get image data from URL
    const imageData = await getImageFromUrl(twitterData.imageUrl);

    // Analyze with Gemini
    const analysis = await analyzeImageWithGemini(imageData, prompt);

    return NextResponse.json({
      twitterImageUrl: twitterData.imageUrl,
      ...analysis
    });

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json(
      { 
        error: "Failed to analyze Twitter profile image",
        details: error.message 
      },
      { status: 500 }
    );
  }
}