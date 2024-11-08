import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// Helper function to add a delay
function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

// Define the function to fetch the Twitter avatar
async function getTwitterAvatar(twitterUsername: string): Promise<string | null> {
  let browser;
  try {
    // Launch Puppeteer with necessary options
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(`https://twitter.com/${twitterUsername}`, {
      waitUntil: 'domcontentloaded', // Switch to 'domcontentloaded' for faster initial load
    });

    // Use retry attempts to account for load issues with smaller accounts
    let url = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Wait for a more specific selector or a longer time
        await page.waitForSelector('a[href$="/photo"] img[src], img[alt*="Profile photo"]', {
          timeout: 8000,
        });

        // Attempt to extract the image URL
        url = await page.evaluate(() => {
          const imgElement = document.querySelector('a[href$="/photo"] img, img[alt*="Profile photo"]');
          return imgElement ? (imgElement as HTMLImageElement).src : null;
        });

        if (url) break; // Exit loop if URL is found
      } catch {
        console.warn(`Retry attempt ${attempt + 1} for @${twitterUsername}`);
        await delay(3000); // Wait before retrying
      }
    }

    if (!url) throw new Error("Profile image not found after multiple attempts");
    return url;
  } catch (error) {
    console.error(`Error fetching avatar for @${twitterUsername}:`, error);
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
    const avatarUrl = await getTwitterAvatar(username);
    console.log(`Fetched avatar for @${username}:`, avatarUrl);
    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Failed to fetch Twitter profile image" },
        { status: 404 }
      );
    }
    return NextResponse.json({ imageUrl: avatarUrl });
  } catch (error) {
    console.error('Twitter API Error:', error);
    return NextResponse.json(
      { error: "An error occurred while fetching the Twitter profile image" },
      { status: 500 }
    );
  }
}
