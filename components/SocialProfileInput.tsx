import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const SocialProfileInput = () => {
  const [platform, setPlatform] = useState<"instagram" | "twitter">("twitter");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [rating, setRating] = useState<{ score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlatformToggle = (newPlatform: "instagram" | "twitter") => {
    setPlatform(newPlatform);
    setUsername("");
    setProfileImage(null);
    setRating(null);
    setError(null);
  };

  const handleSearchProfileImage = async () => {
    if (!username) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // First get the profile image path
      const profileResponse = await axios.get(`/api/${platform}`, {
        params: { username },
      });
      const imagePath = profileResponse.data.imagePath;
      const imageUrl = `/api/images?imagePath=${imagePath}`;
      setProfileImage(imageUrl);


      // Then get the Gemini rating
      const ratingPrompt = "Rate this profile picture on professionalism, composition, and overall quality. Consider factors like lighting, background, pose, and image clarity.";
      const geminiResponse = await axios.post("/api/upload", {
        imagePath,
        prompt: ratingPrompt
      });

      setRating(geminiResponse.data);
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to fetch profile data");
      setProfileImage(null);
      setRating(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Input Section */}
      <div className="w-full max-w-md bg-white/80 shadow-lg rounded-lg p-6">
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
        
        <div className="relative">
          <motion.input
            type="text"
            placeholder={`Enter ${platform} username`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 rounded w-full p-2 mb-4 focus:outline-none focus:border-blue-500"
            whileFocus={{ scale: 1.02 }}
          />
          
          <motion.button
            onClick={handleSearchProfileImage}
            className="bg-blue-600 text-white rounded px-6 py-2 w-full font-semibold shadow-md disabled:opacity-50"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? "Analyzing..." : "Analyze Profile Picture"}
          </motion.button>
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {(profileImage || rating) && (
        <div className="w-full flex justify-center gap-8">
          {/* Image Display */}
          {profileImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-96 h-96 bg-gray-100 rounded-lg shadow-lg overflow-hidden"
            >
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            </motion.div>
          )}

          {/* Rating Display */}
          {rating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center bg-white/80 shadow-lg rounded-lg p-6 w-full max-w-md"
            >
              <div className="text-3xl font-bold mb-4">Rating: {rating.score}/10</div>
              <div className="text-lg text-gray-700">
                {/* Additional rating details can go here */}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialProfileInput;
