"use client";

import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const UploadImage = ({ onUpload }: { onUpload: (url: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { rating, imageUrl } = response.data;
      setRating(rating);
      onUpload(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <input type="file" onChange={handleImageUpload} />
      {loading && <p>Loading...</p>}
      {rating !== null && <p>Rating: {rating}</p>}
    </div>
  );
};

export default UploadImage;
