import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

async function getTwitterProfileImageBase64(username: string): Promise<string> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`https://twitter.com/${username}`, { waitUntil: 'networkidle2' });

  const profileImageElement = await page.$('div[role="img"] img');
  
  if (!profileImageElement) {
    await browser.close();
    throw new Error("Profile image not found");
  }

  const profileImageUrl = await page.evaluate(
    (element) => element.src,
    profileImageElement
  );

  const imageResponse = await page.goto(profileImageUrl);
  if (!imageResponse) {
    await browser.close();
    throw new Error("Failed to download profile image");
  }

  const imageBuffer = await imageResponse.buffer();
  const base64Image = imageBuffer.toString('base64');

  await browser.close();
  return `data:image/jpeg;base64,${base64Image}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const base64Image = await getTwitterProfileImageBase64(username);
    return NextResponse.json({ image: base64Image });
  } catch (error: any) {
    console.error('Twitter API Error:', error);
    return NextResponse.json(
      { error: "Failed to fetch Twitter profile image" },
      { status: 500 }
    );
  }
}
