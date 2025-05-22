"use client"

import React from "react"

export function HeroSection() {
  return (
    <div className="text-center mb-8 max-w-3xl mx-auto px-4">
      <h1 className="text-6xl md:text-5xl font-bold tracking-tight mb-4 font-inter ">
        Create any{" "}
        <span className="relative inline-block">
          <span className="relative z-10 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-transparent bg-clip-text">
            Ad
          </span>
          <span className="absolute inset-0 blur-sm bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-orange-500/40 rounded-lg z-0"></span>
        </span>{" "}
        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          in seconds.
        </span>
      </h1>
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Transform your ideas into stunning advertisements with our AI-powered platform. 
        No design skills needed — just describe what you want and watch the magic happen.
      </p>
    </div>
  )
}
