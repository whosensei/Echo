"use client"

import React from "react"

export function HeroSection() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12 md:py-16 text-center">
      <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight font-sans">
        <div className="block">
          Create any{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-blue-400 via-blue-300 to-slate-200 text-transparent bg-clip-text">
              Ad
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-400/40 via-blue-300/40 to-slate-200/40 rounded-lg z-0 blur-md"></span>
          </span>
        </div>
        <div className="bg-gradient-to-r from-blue-400 via-blue-300 to-slate-200 text-transparent bg-clip-text">
          in seconds.
        </div>
      </h1>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-sans {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
    </div>
  )
}
