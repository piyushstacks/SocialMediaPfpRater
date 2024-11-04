"use client";
import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const SocialProfileInput = ({ onProfileImage }: { onProfileImage: (url: string) => void }) => {
  const [platform, setPlatform] = useState<"instagram" | "twitter">("instagram");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<{ grade: string; score: number } | null>(null);

  const handlePlatformToggle = (newPlatform: "instagram" | "twitter") => {
    setPlatform(newPlatform);
    setUsername("");
  };

  const handleSearchProfileImage = async () => {
    if (!username) return;
  
    setLoading(true);
    try {
      // Fetch the profile image from the appropriate platform endpoint
      const response = await axios.get(`/api/${platform}`, {
        params: { username },
      });
      const { imageUrl } = response.data;
      onProfileImage(imageUrl);
  
      // Send the image URL to the upload endpoint for rating
      const geminiResponse = await axios.post("/api/upload", { imageUrl });
      const { grade, score } = geminiResponse.data;
  
      // Update state to display the rating
      setRating({ grade, score });
    } catch (error) {
      console.error("Error fetching profile image or rating:", error);
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div className="flex flex-col items-center justify-center bg-white/80 shadow-lg rounded-lg p-6 w-full max-w-md transition-transform duration-300 hover:scale-105">
      <div className="flex w-full mb-4">
        <motion.button
          onClick={() => handlePlatformToggle("instagram")}
          className={`flex-1 p-2 text-center rounded-l-lg ${
            platform === "instagram" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          } transition-all duration-300`}
          whileHover={{ scale: 1.05 }}
        >
          Instagram
        </motion.button>
        <motion.button
          onClick={() => handlePlatformToggle("twitter")}
          className={`flex-1 p-2 text-center rounded-r-lg ${
            platform === "twitter" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          } transition-all duration-300`}
          whileHover={{ scale: 1.05 }}
        >
          Twitter
        </motion.button>
      </div>
      <motion.input
        type="text"
        placeholder={`Enter ${platform} username`}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border border-gray-300 rounded w-full p-2 mb-4 focus:outline-none focus:border-blue-500 transition-colors duration-300"
        whileFocus={{ scale: 1.02 }}
      />
      <motion.button
        onClick={handleSearchProfileImage}
        className="bg-blue-600 text-white rounded px-6 py-2 w-full font-semibold shadow-md transition-transform duration-300 hover:scale-105 hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {loading ? "Searching..." : `Fetch ${platform === "instagram" ? "Instagram" : "Twitter"} Profile Image`}
      </motion.button>
      
      {rating && (
  <div className="mt-6 text-center">
    <div className="text-6xl font-bold">{rating.grade}</div>
    <div className="text-xl">Score: {rating.score.toFixed(2)}</div>
  </div>
)}

    </div>
  );
};

export default SocialProfileInput;