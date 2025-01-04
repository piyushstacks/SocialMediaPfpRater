import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import withCors from '@/lib/cors';

// Helper function to add a delay
function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

// Function to convert image URL to base64
async function urlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

// Function to fetch the Instagram avatar
async function getInstagramAvatar(instagramUsername: string): Promise<string | null> {
  // First attempt using the unofficial JSON endpoint
  const jsonUrl = `https://www.instagram.com/${instagramUsername}/?__a=1`;
  try {
    const response = await fetch(jsonUrl);
    if (response.ok) {
      const data = await response.json();
      const profilePicUrl = data.graphql.user.profile_pic_url_hd || data.graphql.user.profile_pic_url;
      if (profilePicUrl) {
        const base64 = await urlToBase64(profilePicUrl);
        return `data:image/jpeg;base64,${base64}`;
      }
    }
  } catch (error) {
    console.warn(`JSON endpoint fetch failed for @${instagramUsername}`, error);
  }

  // If the JSON endpoint fails, proceed with Puppeteer
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${instagramUsername}/`, {
      waitUntil: 'domcontentloaded',
    });

    // Retry attempts to handle profile loading
    let profilePicUrl = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await page.waitForSelector('img[alt*="profile picture"]', {
          timeout: 8000,
        });

        // Extract the profile picture URL
        profilePicUrl = await page.evaluate(() => {
          const imgElement = document.querySelector('img[alt*="profile picture"]');
          return imgElement ? (imgElement as HTMLImageElement).src : null;
        });

        if (profilePicUrl) break; // Exit loop if URL is found
      } catch (error) {
        console.warn(`Retry attempt ${attempt + 1} for @${instagramUsername}`, error);
        await delay(2000); // Wait before retrying
      }
    }

    if (!profilePicUrl) throw new Error("Profile picture not found after multiple attempts");

    const base64 = await urlToBase64(profilePicUrl);
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching avatar for @${instagramUsername}:`, error);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

// Define the API handler
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const avatarUrl = await getInstagramAvatar(username);
    console.log(`Fetched avatar for @${username}:`, avatarUrl);
    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Failed to fetch Instagram profile image" },
        { status: 404 }
      );
    }
    return NextResponse.json({ imageUrl: avatarUrl });
  } catch (error) {
    console.error('Instagram API Error:', error);
    return NextResponse.json(
      { error: "An error occurred while fetching the Instagram profile image" },
      { status: 500 }
    );
  }
}

// Apply the CORS middleware
export default withCors(GET);
