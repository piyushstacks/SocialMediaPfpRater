import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// Define rating thresholds and standard aspect ratios
const BRIGHTNESS_THRESHOLD = 128;
const CONTRAST_THRESHOLD = 50;
const SHARPNESS_THRESHOLD = 100;
const SATURATION_THRESHOLD = 0.5;
const IMAGE_SIZE_THRESHOLD = 1024 * 1024; // 1 Megapixel
const STANDARD_ASPECT_RATIOS = [4 / 3, 16 / 9, 1]; // Common aspect ratios (4:3, 16:9, 1:1)

// Utility Functions
const calculateSharpness = async (imageBuffer: Buffer): Promise<number> => {
  const { data } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const laplacian = [];
  for (let i = 1; i < data.length - 1; i++) {
    const diff = data[i - 1] + data[i + 1] - 2 * data[i];
    laplacian.push(diff * diff);
  }
  return laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
};

const calculateBrightness = async (imageBuffer: Buffer): Promise<number> => {
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return data.reduce((sum, value) => sum + value, 0) / (info.width * info.height);
};

const calculateContrast = async (imageBuffer: Buffer): Promise<number> => {
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mean =
    data.reduce((sum, value) => sum + value, 0) / (info.width * info.height);

  const variance =
    data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    (info.width * info.height);

  return Math.sqrt(variance);
};

const calculateSaturation = async (imageBuffer: Buffer): Promise<number> => {
  const { data } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  let totalSaturation = 0;
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    totalSaturation += (max - min) / (max || 1); // Avoid division by zero
  }
  return totalSaturation / (data.length / 3);
};

const calculateImageSizeScore = async (
  imageBuffer: Buffer
): Promise<number> => {
  const metadata = await sharp(imageBuffer).metadata();
  const pixels = (metadata.width || 0) * (metadata.height || 0);
  return Math.min(pixels / IMAGE_SIZE_THRESHOLD, 10); // Scale score out of 10
};

const calculateAspectRatioScore = async (
  imageBuffer: Buffer
): Promise<number> => {
  const metadata = await sharp(imageBuffer).metadata();
  if (!metadata.width || !metadata.height) return 0;

  const aspectRatio = metadata.width / metadata.height;
  const closestMatch = STANDARD_ASPECT_RATIOS.reduce(
    (prev, curr) => (Math.abs(curr - aspectRatio) < Math.abs(prev - aspectRatio) ? curr : prev),
    Infinity
  );
  return 10 - Math.abs(aspectRatio - closestMatch) * 10; // Higher score for closer matches
};

// Function to calculate grade based on overall rating
const calculateGrade = (overallRating: number): string => {
  if (overallRating >= 8.5) return "A";
  if (overallRating >= 7.0) return "B";
  if (overallRating >= 5.0) return "C";
  if (overallRating >= 3.0) return "D";
  return "F";
};

// API Handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "Image data is required" },
        { status: 400 }
      );
    }

    // Decode Base64 image
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Calculate metrics
    const brightnessScore = (await calculateBrightness(imageBuffer)) / BRIGHTNESS_THRESHOLD * 10;
    const contrastScore = (await calculateContrast(imageBuffer)) / CONTRAST_THRESHOLD * 10;
    const sharpnessScore = (await calculateSharpness(imageBuffer)) / SHARPNESS_THRESHOLD * 10;
    const saturationScore = (await calculateSaturation(imageBuffer)) / SATURATION_THRESHOLD * 10;
    const imageSizeScore = await calculateImageSizeScore(imageBuffer);
    const aspectRatioScore = await calculateAspectRatioScore(imageBuffer);

    // Clamp all scores between 0 and 10
    const scores = [
      brightnessScore,
      contrastScore,
      sharpnessScore,
      saturationScore,
      imageSizeScore,
      aspectRatioScore,
    ].map((score) => Math.max(0, Math.min(10, score)));

    // Calculate overall rating
    const overallRating = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Calculate grade
    const grade = calculateGrade(overallRating);

    // Return response
    return NextResponse.json(
      { 
        success: true, 
        overallRating: parseFloat(overallRating.toFixed(1)), // Rounded rating
        grade, 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing image rating:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
