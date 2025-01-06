import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { AlertCircle, Instagram } from "lucide-react";
import { FaSearch } from "react-icons/fa";

interface Rating {
  overallRating: number;
  grade: string;
  platform: DisplayPlatformType;
  username: string;
}

interface ProfileResponse {
  imageUrl: string;
}

type PlatformType = "instagram" | "twitter";
type DisplayPlatformType = "instagram" | "x";

const SocialProfileInput = () => {
  const [platform, setPlatform] = useState<PlatformType>("twitter");
  const [displayPlatform, setDisplayPlatform] = useState<DisplayPlatformType>("x");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchProfileImage = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || /[^a-zA-Z0-9._]/.test(trimmedUsername)) {
      return setError("Please enter a valid username (alphanumeric, dots, underscores only).");
    }

    setLoading(true);
    setError(null);

    try {
      const apiPlatform = platform === "twitter" ? "twitter" : "instagram";
      const { data } = await axios.get<ProfileResponse>(`/api/${apiPlatform}`, {
        params: { username: trimmedUsername },
      });

      if (!data.imageUrl) {
        throw new Error("Profile image not found for the given username.");
      }

      setProfileImage(data.imageUrl);
      await rateImage(data.imageUrl);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || "Failed to fetch profile image.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && username.trim()) {
        handleSearchProfileImage();
      }
    };

    const currentInput = inputRef.current;
    currentInput?.addEventListener("keydown", handleKeyDown);
    return () => {
      currentInput?.removeEventListener("keydown", handleKeyDown);
    };
  }, [username]);

  const handlePlatformToggle = (newDisplayPlatform: DisplayPlatformType) => {
    setDisplayPlatform(newDisplayPlatform);
    setPlatform(newDisplayPlatform === "x" ? "twitter" : "instagram");
    setUsername(""); // Only reset username, keep the results
    setError(null); // Clear any existing errors
  };

  const rateImage = async (imageUrl: string) => {
    try {
      const response = await axios.post("/api/rate-image", { imageBase64: imageUrl });
      const { success, overallRating, grade, error } = response.data;

      if (success) {
        setRating({
          overallRating,
          grade,
          platform: displayPlatform,
          username: username.trim()
        });
      } else {
        setError(error || "Failed to rate the image");
      }
    } catch (error) {
      setError("Error occurred while rating the image");
    }
  };

  const handleShare = (rating: Rating) => {
    try {
      const platformDisplay = rating.platform === "x" ? "X/Twitter" : "Instagram";
      const tweetText = `My ${platformDisplay} (@${rating.username}) profile image got ${rating.overallRating}/10 with a grade of ${rating.grade} Rating! What's yours? Try this on xyz.com now ⚡`;
      const encodedText = encodeURIComponent(tweetText);
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank");
    } catch (error) {
      console.error("Error sharing the result:", error);
      alert("Failed to share the result. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-6 overflow-hidden">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        {/* Platform Toggle with Results */}
        <div className="space-y-4">
          <div className="flex w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { id: "x", icon: (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 50 50"
                  className="w-5 h-5"
                  fill="currentColor"
                >
                  <path d="M 11 4 C 7.134 4 4 7.134 4 11 L 4 39 C 4 42.866 7.134 46 11 46 L 39 46 C 42.866 46 46 42.866 46 39 L 46 11 C 46 7.134 42.866 4 39 4 L 11 4 z M 13.085938 13 L 21.023438 13 L 26.660156 21.009766 L 33.5 13 L 36 13 L 27.789062 22.613281 L 37.914062 37 L 29.978516 37 L 23.4375 27.707031 L 15.5 37 L 13 37 L 22.308594 26.103516 L 13.085938 13 z M 16.914062 15 L 31.021484 35 L 34.085938 35 L 19.978516 15 L 16.914062 15 z" />
                </svg>
              )},
              { id: "instagram", icon: <Instagram className="w-5 h-5" /> }
            ].map(({ id, icon }) => (
              <button
                key={id}
                onClick={() => handlePlatformToggle(id as DisplayPlatformType)}
                className={`flex-1 p-2 rounded-md flex items-center justify-center space-x-2 ${
                  displayPlatform === id
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {icon}
                <span>{id === "x" ? "X/Twitter" : id.charAt(0).toUpperCase() + id.slice(1)}</span>
              </button>
            ))}
          </div>

          {/* Last Result Display */}
          {rating && rating.platform !== displayPlatform && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Last {rating.platform === "x" ? "X/Twitter" : "Instagram"} result: @{rating.username} - {rating.overallRating}/10 ({rating.grade})
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="flex items-center space-x-2 mb-4 relative mt-4">
          <div
            className="absolute left-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer"
            title="Don't include '@' in username"
          >
            @
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={`Enter ${displayPlatform === "x" ? "X/Twitter" : displayPlatform} username`}
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
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400" aria-live="assertive">
            <AlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center text-blue-500" aria-live="polite">
            Loading...
          </div>
        )}

        {/* Profile Image and Rating */}
        {profileImage && rating && rating.platform === displayPlatform && (
          <div className="result-section flex flex-col items-center space-y-4 mt-6">
            <img
              src={profileImage}
              alt="Profile"
              className="w-32 h-32 rounded-full shadow-md"
            />
            <div className="text-center">
              <p className="text-lg font-semibold">Rating: {rating.overallRating} / 10</p>
              <p className="text-lg font-semibold">Grade: {rating.grade}</p>
            </div>
            <button
              onClick={() => handleShare(rating)}
              className="group relative px-6 py-3 bg-black text-white rounded-lg shadow-lg 
              transition-all duration-300 ease-in-out
              hover:bg-gray-800 hover:shadow-xl
              active:scale-95 transform
              overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 
                  group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="flex items-center justify-center space-x-3">
                <span className="font-semibold">Post on</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 50 50"
                  className="w-5 h-5 transition-transform duration-300"
                  fill="currentColor"
                >
                  <path d="M 11 4 C 7.134 4 4 7.134 4 11 L 4 39 C 4 42.866 7.134 46 11 46 L 39 46 C 42.866 46 46 42.866 46 39 L 46 11 C 46 7.134 42.866 4 39 4 L 11 4 z M 13.085938 13 L 21.023438 13 L 26.660156 21.009766 L 33.5 13 L 36 13 L 27.789062 22.613281 L 37.914062 37 L 29.978516 37 L 23.4375 27.707031 L 15.5 37 L 13 37 L 22.308594 26.103516 L 13.085938 13 z M 16.914062 15 L 31.021484 35 L 34.085938 35 L 19.978516 15 L 16.914062 15 z" />
                </svg>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialProfileInput;