// app/page.tsx
"use client";
import { useState } from "react";
import SocialProfileInput from "@/components/SocialProfileInput";

export default function Home() {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const handleProfileImage = (url: string) => {
    setProfileImageUrl(url);
  };

  return (
    <main className="flex h-auto flex-col items-center px-4">
      <SocialProfileInput onProfileImage={handleProfileImage} />
      {profileImageUrl && (
        <div className="mt-4">
          <img src={profileImageUrl} alt="Profile" className="w-32 h-32 rounded-full" />
        </div>
      )}
    </main>
  );
}
