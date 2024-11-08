import { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage } from 'canvas';

async function rateImage(imageUrl: string) {
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(img.width, img.height);
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const resolutionScore = calculateResolutionScore(width, height);
  const colorScore = calculateColorScore(data);
  const contrastScore = calculateContrastScore(data);

  const totalScore = (
    resolutionScore * 0.4 +
    colorScore * 0.3 +
    contrastScore * 0.3
  ).toFixed(2);

  return { score: parseFloat(totalScore), grade: assignGrade(parseFloat(totalScore)) };
}

function calculateResolutionScore(width: number, height: number) {
  const resolution = width * height;
  return resolution > 1000000 ? 1 : resolution / 1000000;
}

function calculateColorScore(data: Uint8ClampedArray) {
  let colorfulness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    colorfulness += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
  }
  return Math.min(colorfulness / data.length, 1);
}

function calculateContrastScore(data: Uint8ClampedArray) {
  let contrast = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    contrast += 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const maxContrast = 255 * 3;
  return Math.min(contrast / maxContrast, 1);
}

function assignGrade(score: number) {
  if (score >= 0.85) return 'A';
  if (score >= 0.7) return 'B';
  if (score >= 0.5) return 'C';
  return 'D';
}

// Named export for POST method
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    const { score, grade } = await rateImage(imageUrl);
    res.status(200).json({ score, grade });
  } catch (error: any) {
    console.error('Error processing the image:', error);
    res.status(500).json({ error: "Failed to process image", details: error.message });
  }
}
