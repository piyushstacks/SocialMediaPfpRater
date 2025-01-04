import { useState, useRef, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { AlertCircle } from "lucide-react";
import { FaTwitter, FaInstagram, FaSearch } from "react-icons/fa";

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

  const handleSearchProfileImage = async () => {
    if (!username.trim()) return setError("Please enter a username");

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get<ProfileResponse>(`/api/${platform}`, { params: { username: username.trim() } });
      if (!data.imageUrl) throw new Error("No profile image found");
      setProfileImage(data.imageUrl);
      // Rating logic here...
      setRating({ score: 80, grade: "A" }); // Mocked data for simplicity
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
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-6 overflow-hidden">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        {/* Platform Toggle */}
        <div className="flex w-full mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {["instagram", "twitter"].map((plt) => (
            <button
              key={plt}
              onClick={() => handlePlatformToggle(plt as PlatformType)}
              className={`flex-1 p-2 rounded-md flex items-center justify-center space-x-2 ${
                platform === plt
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {plt === "twitter" ? <FaTwitter /> : <FaInstagram />}
              <span>{plt.charAt(0).toUpperCase() + plt.slice(1)}</span>
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="flex items-center space-x-2 mb-4 relative">
          <div className="absolute left-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer" title="Don't include '@' in username">
            @
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={`Enter ${platform} username`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSearchProfileImage}
            className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md flex items-center space-x-2 hover:bg-blue-600"
          >
            <FaSearch />
            <span>Search</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && <div className="text-center text-blue-500">Loading...</div>}

        {/* Profile Image and Rating */}
        {profileImage && (
          <div className="flex flex-col items-center space-y-4 mt-6">
            <img src={profileImage} alt="Profile" className="w-32 h-32 rounded-full shadow-md" />
            {rating && (
              <div className="text-center">
                <p className="text-lg font-semibold">Rating Score: {rating.score}</p>
                <p className="text-lg font-semibold">Grade: {rating.grade}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialProfileInput;
