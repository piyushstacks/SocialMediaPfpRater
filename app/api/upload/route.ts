import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function getImageFromPath(imagePath: string): Promise<Buffer> {
  return fs.readFileSync(imagePath);
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
      Analyze this image based on the following criteria:
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
    const { imagePath, prompt } = await req.json();

    if (!imagePath || !prompt) {
      return NextResponse.json(
        { error: "Image path and prompt are required" },
        { status: 400 }
      );
    }

    // Get image data from path
    const imageData = await getImageFromPath(imagePath);

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
