import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AlertCircle } from "lucide-react";

interface Rating {
  overallRating: number;
  grade: string;
  platform: "x";
  username: string;
}

interface ProfileResponse {
  imageUrl: string;
}

interface SocialProfileInputProps {
  onProfileImage?: (url: string) => void;
}

const SocialProfileInput: React.FC<SocialProfileInputProps> = ({ onProfileImage }) => {
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const rateImage = useCallback(async (imageBase64: string) => {
    try {
      const response = await axios.post("/api/rate-image", { imageBase64 });
      const { success, overallRating, grade, error } = response.data;

      if (success) {
        setRating({
          overallRating,
          grade,
          platform: "x",
          username: username.trim(),
        });
      } else {
        setError(error || "Failed to rate the image.");
      }
    } catch (error) {
      setError("Error occurred while rating the image.");
    }
  }, [username]);

  const handleSearchProfileImage = useCallback(async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || /[^a-zA-Z0-9._]/.test(trimmedUsername)) {
      return setError("Please enter a valid username (alphanumeric, dots, underscores only).");
    }

    setLoading(true);
    setError(null);

    try {
      // Get image URL from Twitter API
      const { data } = await axios.get<ProfileResponse>("/api/twitter", {
        params: { username: trimmedUsername },
      });

      if (!data.imageUrl) {
        throw new Error("Profile image not found for the given username.");
      }

      // Fetch and convert image to base64
      const imageResponse = await fetch(data.imageUrl);
      const blob = await imageResponse.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        setProfileImage(base64data);
        if (onProfileImage) onProfileImage(base64data);
        await rateImage(base64data);
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || "Failed to fetch profile image.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [username, rateImage, onProfileImage]);

  // Rest of the component remains the same...
  const handleShare = useCallback((rating: Rating) => {
    const tweetText = `My X (@${rating.username}) profile image got ${rating.overallRating}/10 (${rating.grade})! Try this on xyz.com ⚡`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      "_blank"
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && username.trim()) {
        handleSearchProfileImage();
      }
    };

    const currentInput = inputRef.current;
    currentInput?.addEventListener("keydown", handleKeyDown);
    return () => currentInput?.removeEventListener("keydown", handleKeyDown);
  }, [username, handleSearchProfileImage]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4 relative">
          <div className="absolute left-4 text-gray-500 dark:text-gray-400">@</div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter X username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSearchProfileImage}
            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center space-x-2"
            disabled={loading}
          >
            <span>Search</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="text-center text-blue-500">Loading...</div>
        )}

        {profileImage && rating && (
          <div className="mt-6 flex flex-col items-center space-y-4">
            <img
              src={profileImage}
              alt="Profile"
              className="w-32 h-32 rounded-full shadow-md"
              loading="lazy"
            />
            <div className="text-center">
              <p className="text-lg font-semibold">Rating: {rating.overallRating}/10</p>
              <p className="text-lg font-semibold">Grade: {rating.grade}</p>
            </div>
            <button
              onClick={() => handleShare(rating)}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Share on X
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialProfileInput;
