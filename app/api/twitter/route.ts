import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    const profileImageUrl = response.data?.data?.profile_image_url;

    if (!profileImageUrl) {
      return NextResponse.json({ error: "Profile image not found" }, { status: 404 });
    }

    const highResImageUrl = profileImageUrl.replace("_normal", "_400x400");

    return NextResponse.json({ imageUrl: highResImageUrl });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching Twitter profile image:", error.response?.data || error.message);
    } else {
      console.error("Error fetching Twitter profile image:", error);
    }
    return NextResponse.json({ error: "Failed to fetch profile image" }, { status: 500 });
  }
}
