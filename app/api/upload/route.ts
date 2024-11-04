import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    // Send the image to Gemini's rating API (replace with actual Gemini API endpoint)
    const geminiResponse = await axios.post("https://gemini-api-endpoint.com/rate", {
      imageUrl,
    });

    // Assume the response contains `grade` and `score`
    const { grade, score } = geminiResponse.data;

    // Return the grade and score to the frontend
    res.status(200).json({ grade, score });
  } catch (error) {
    console.error("Error rating image:", error);
    res.status(500).json({ error: "Failed to rate image" });
  }
}
