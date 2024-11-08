import { useState, useRef } from "react";
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

  const assignGrade = (score: number): string => {
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 50) return "C";
    return "D";
  };

  const calculateScore = (data: Uint8ClampedArray, width: number, height: number): number => {
    const resolutionScore = Math.min((width * height / 500000) * 25, 25);
    const colorScore = Math.min(data.reduce((acc, val, idx) => idx % 4 === 0 ? acc + Math.abs(data[idx] - data[idx + 1]) : acc, 0) / data.length * 10, 20);
    const brightnessScore = Math.min(data.reduce((acc, val, idx) => idx % 4 === 0 ? acc + (data[idx] + data[idx + 1] + data[idx + 2]) / 3 : acc, 0) / (data.length / 4) / 15, 20);
    const sharpnessScore = Math.min(data.reduce((acc, _, idx) => (idx + 4 < data.length) ? acc + Math.abs(data[idx] - data[idx + 4]) : acc, 0) / (width * height) * 10, 20);
    const contrastScore = Math.min(data.reduce((acc, val) => acc + val, 0) / (255 * 3) * 25, 25);

    return Math.min(resolutionScore + colorScore + brightnessScore + sharpnessScore + contrastScore, 100);
  };

  const rateImage = async (imageElement: HTMLImageElement): Promise<Rating> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas not available");

    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D context not available");

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    context.drawImage(imageElement, 0, 0);

    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);

    // Check if the image likely contains anime or non-human content
    const isAnime = data.some((val, idx) => idx % 4 === 0 && val > 200 && data[idx + 1] < 50 && data[idx + 2] > 200);
    const isHuman = data.some((val, idx) => idx % 4 === 0 && val > 100 && data[idx + 1] > 40 && data[idx + 2] < 200);

    // Calculate score with penalties
    let score = calculateScore(data, width, height);
    if (isAnime) score *= 0.7; // Penalize anime images
    if (!isHuman) score *= 0.8; // Penalize non-human images

    return { score, grade: assignGrade(score) };
  };

  const handleSearchProfileImage = async () => {
    if (!username.trim()) return setError("Please enter a username");

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get<ProfileResponse>(`/api/${platform}`, { params: { username: username.trim() } });
      if (!data.imageUrl) throw new Error("No profile image found");

      setProfileImage(data.imageUrl);

      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          try {
            setRating(await rateImage(img));
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = data.imageUrl;
      });
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
