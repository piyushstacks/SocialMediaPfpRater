import { useState, useRef, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { AlertCircle } from "lucide-react";

interface Rating {
  score: number;
  grade: string;
}

interface ProfileResponse {
  imageUrl: string;
}

type PlatformType = "instagram" | "twitter";

const SocialProfileInput = () => {
  const [platform, setPlatform] = useState<PlatformType>("twitter");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        handleSearchProfileImage();
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (input) {
        input.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [username]);

  const resetState = () => {
    setUsername("");
    setProfileImage(null);
    setError(null);
    setRating(null);
  };

  const handlePlatformToggle = (newPlatform: PlatformType) => {
    setPlatform(newPlatform);
    resetState();
  };

  const getBase64ImageData = async (imageUrl: string): Promise<string> => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      ctx?.drawImage(image, 0, 0);
      return canvas.toDataURL("image/jpeg").split(",")[1]; // Get base64 part
    }
    throw new Error("Failed to process image for rating");
  };

  // Updated rateImage function to use the Gemini model and base64 data
  const rateImage = async (imageBase64: string): Promise<Rating> => {
    try {
      // Use NEXT_PUBLIC_ prefix for client-side environment variables
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("Gemini API key is not configured");
      }

      const response = await axios.post('/api/gemini_model', {
        image: imageBase64, // Base64 data URI
        apiKey: apiKey, // Correctly pass the API key
      }, {
        // Optional: add timeout and error handling config
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Destructure score and grade, with type safety and default values
      const { score, grade } = response.data;

      // Validate the response
      if (typeof score !== 'number' || typeof grade !== 'string') {
        throw new Error("Invalid response format from Gemini model");
      }

      return {
        score: Math.min(Math.max(score, 0), 100), // Ensure score is between 0-100
        grade: grade.toUpperCase() // Normalize grade to uppercase
      };
    } catch (error) {
      // More detailed error handling
      if (axios.isAxiosError(error)) {
        // Axios-specific error handling
        const errorMessage = error.response?.data?.detail || error.message;
        console.error("Gemini API Error:", errorMessage);
        throw new Error(`Failed to rate image: ${errorMessage}`);
      } else if (error instanceof Error) {
        console.error("Image Rating Error:", error.message);
        throw error;
      } else {
        console.error("Unknown error occurred", error);
        throw new Error("An unexpected error occurred while rating the image");
      }
    }
  };

  const handleSearchProfileImage = async () => {
    if (!username.trim()) return setError("Please enter a username");

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get<ProfileResponse>(`/api/${platform}`, { params: { username: username.trim() } });
      if (!data.imageUrl) throw new Error("No profile image found");

      setProfileImage(data.imageUrl);

      try {
        const base64ImageData = await getBase64ImageData(data.imageUrl);
        const ratingResult = await rateImage(base64ImageData);
        setRating(ratingResult);
      } catch (error) {
        setError("Failed to rate the profile image");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
      setProfileImage(null);
      setRating(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6 space-y-6">
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <div className="flex w-full mb-4 bg-gray-100 rounded-lg p-1">
          {["instagram", "twitter"].map((plt) => (
            <button
              key={plt}
              onClick={() => handlePlatformToggle(plt as PlatformType)}
              className={`flex-1 p-2 rounded-md ${platform === plt ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}
            >
              {plt.charAt(0).toUpperCase() + plt.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            placeholder={`Enter ${platform} username`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSearchProfileImage}
            disabled={loading}
            className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Fetch Profile Image"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="mr-2" />
            {error}
          </div>
        )}
      </div>

      {profileImage && (
        <div className="w-full flex flex-col items-center space-y-4">
          <img src={profileImage} alt="Profile" className="w-32 h-32 rounded-full shadow-md" />
          {rating && (
            <div className="text-center">
              <div className="text-lg font-semibold">Rating Score: {rating.score.toFixed(2)}</div>
              <div className="text-xl font-bold">Grade: {rating.grade}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialProfileInput;
