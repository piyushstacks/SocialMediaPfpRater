import { v2 as cloudinary } from "cloudinary";
import type { NextApiRequest, NextApiResponse } from "next";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { image } = req.body; // Base64 encoded image

      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: "temp-images", // Folder for temporary images
        resource_type: "image",
      });

      // Return the image URL
      res.status(200).json({ url: result.secure_url });
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
