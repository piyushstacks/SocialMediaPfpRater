import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

async function getTwitterProfileImage(username: string): Promise<string> {
  try {
    return await fetchTwitterProfileImage(username);
  } catch (error) {
    console.error(`Error fetching Twitter profile image for username: ${username}`, error);
    return '/api/placeholder'; // Return a placeholder image URL
  }
}

async function fetchTwitterProfileImage(username: string): Promise<string> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`https://twitter.com/${username}`);

  // Find the profile image element
  const profileImageElement = await page.$('img[alt="Profile image"]');

  if (!profileImageElement) {
    console.error(`Profile image not found for username: ${username}`);
    throw new Error("Profile image not found");
  }

  // Get the profile image URL
  const profileImageUrl = await page.evaluate(
    (element) => element.src,
    profileImageElement
  );

  // Download the image to a temporary location
  const imageResponse = await page.goto(profileImageUrl);
  if (!imageResponse) {
    throw new Error("Failed to download profile image");
  }
  const imageBuffer = await imageResponse.buffer();

  const tempFileName = `${uuidv4()}.jpg`;
  const tempFilePath = path.join('/tmp', tempFileName);
  fs.writeFileSync(tempFilePath, imageBuffer);

  await browser.close();
  return tempFilePath;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const imagePath = await getTwitterProfileImage(username);
    return NextResponse.json({ imagePath });
  } catch (error: any) {
    console.error('Twitter API Error:', error);
    return NextResponse.json(
      { error: "Failed to fetch Twitter profile image" },
      { status: 500 }
    );
  }
}
