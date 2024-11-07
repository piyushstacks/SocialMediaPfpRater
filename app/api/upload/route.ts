import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function getImageFromPath(imagePath: string): Promise<Buffer> {
  return fs.readFile(imagePath);
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const { imagePath, prompt } = req.body;

    if (!imagePath || !prompt) {
      res.status(400).json({ error: "Image path and prompt are required" });
      return;
    }

    // Get image data from path
    const imageData = await getImageFromPath(path.resolve(imagePath));

    // Analyze with Gemini
    const analysis = await analyzeImageWithGemini(imageData, prompt);

    res.status(200).json(analysis);

  } catch (error: any) {
    console.error('Upload Route Error:', error);
    res.status(500).json({ 
      error: "Failed to analyze image",
      details: error.message 
    });
  }
}
