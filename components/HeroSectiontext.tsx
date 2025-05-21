"use client"

import React from "react"

export function HeroSection() {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
        Create any AD with{" "}
        <span className="relative inline-block">
          <span className="relative z-10 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text">
            AI
          </span>
          <span className="absolute inset-0 blur-lg bg-gradient-to-r from-pink-400/40 via-purple-400/40 to-indigo-400/40 rounded-lg z-0"></span>
        </span>{" "}
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
          in seconds.
        </span>
      </h1>
      <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
        Transform your ideas into stunning advertisements with our AI-powered platform. 
        No design skills needed — just describe what you want and watch the magic happen.
      </p>
    </div>
  )
}