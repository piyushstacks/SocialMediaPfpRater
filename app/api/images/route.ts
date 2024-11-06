import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { imagePath } = req.query;

  if (!imagePath || Array.isArray(imagePath)) {
    res.status(400).json({ error: 'Invalid image path' });
    return;
  }

  const fullPath = path.resolve('path/to/images/directory', imagePath as string);

  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  res.setHeader('Content-Type', 'image/jpeg');
  fs.createReadStream(fullPath).pipe(res);
}
