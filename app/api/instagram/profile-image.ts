// /pages/api/instagram/profile-image.ts
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Example API request to get the profile image URL (replace with real API endpoint)
    const response = await axios.get(`https://api.instagram.com/v1/users/${username}/?access_token=INSTAGRAM_ACCESS_TOKEN`);
    const profileImageUrl = response.data.data.profile_picture; // Modify based on API response

    // Send image URL to Gemini API for rating
    const ratingResponse = await axios.post('https://api.gemini.com/rate-image', { imageUrl: profileImageUrl });
    const { rating } = ratingResponse.data;

    res.status(200).json({ imageUrl: profileImageUrl, rating });
  } catch (error) {
    console.error("Error fetching Instagram profile image:", error);
    res.status(500).json({ error: "Failed to fetch Instagram profile image" });
  }
}
