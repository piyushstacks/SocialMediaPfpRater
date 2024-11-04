// /pages/api/twitter/profile-image.ts
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Example API request to get the profile image URL (replace with real API endpoint)
    const response = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        Authorization: `Bearer TWITTER_BEARER_TOKEN`,
      },
    });
    const profileImageUrl = response.data.data.profile_image_url; // Modify based on API response

    // Send image URL to Gemini API for rating
    const ratingResponse = await axios.post('https://api.gemini.com/rate-image', { imageUrl: profileImageUrl });
    const { rating } = ratingResponse.data;

    res.status(200).json({ imageUrl: profileImageUrl, rating });
  } catch (error) {
    console.error("Error fetching Twitter profile image:", error);
    res.status(500).json({ error: "Failed to fetch Twitter profile image" });
  }
}
