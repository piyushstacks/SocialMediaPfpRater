import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    // Fetch profile image URL from Instagram API
    const igResponse = await axios.get(`https://graph.instagram.com/v1/users/${username}?access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`);
    const profileImageUrl = igResponse.data.data.profile_picture;

    // Send the profile image URL to Gemini for rating
    const geminiApiUrl = process.env.GEMINI_API_URL;
    if (!geminiApiUrl) {
      throw new Error("GEMINI_API_URL is not defined");
    }
    const geminiResponse = await axios.post(geminiApiUrl, { imageUrl: profileImageUrl });
    const { rating } = geminiResponse.data;

    return NextResponse.json({ imageUrl: profileImageUrl, rating });
  } catch (error) {
    console.error("Error fetching Instagram profile image or rating:", error);
    return NextResponse.json({ error: "Failed to rate Instagram profile image" }, { status: 500 });
  }
}
