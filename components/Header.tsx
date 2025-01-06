"use client";

import React from "react";
import { FaTwitter, FaGithub, FaSun, FaMoon } from "react-icons/fa";
import Link from "next/link";
import { useTheme } from "@/context/theme-context";

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-opacity-90 bg-gray-800 text-white backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* App Name */}
        <Link href="/" className="text-lg font-semibold hover:text-gray-300">
          XIG PFP Rater
        </Link>
        
        {/* Buttons on Right */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <FaSun size={18} /> : <FaMoon size={18} />}
          </button>
          
          {/* Social Buttons */}
          {[
            {
              href: "https://github.com/piyushstacks",
              icon: <FaGithub size={18} />,
              label: "Star on GitHub",
            },
            {
              href: "https://twitter.com/piyushstacks",
              icon: <FaTwitter size={18} />,
              label: "Follow on Twitter",
            },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label={label}
            >
              {icon}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
