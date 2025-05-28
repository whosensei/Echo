"use client"

import React from "react"

export function HeroSection() {
  return (
    <div className="text-center space-y-8 hero-glow">
      <div className="space-y-4">
        <h1 className="text-[60px] md:text-[70px] lg:text-[80px] font-semibold tracking-[-0.02em] leading-tight">
          <span className="text-gradient-hero">Create</span>{" "}
          <span className="text-foreground">stunning</span>{" "}
          <span className="word-highlight">ads</span>
          <br />
          <span className="text-foreground">in</span>{" "}
          <span className="text-gradient-hero">seconds</span>{" "}
          <span className="text-foreground">with AI</span>
        </h1>
        
        <p className="text-[16px] md:text-[18px] lg:text-[20px] font-medium tracking-[0.00em] text-muted-foreground max-w-3xl mx-auto leading-[1.5]">
          Transform any concept into{" "}
          <span className="text-gradient font-medium">high-converting advertisements</span>{" "}
          that capture attention and drive results across all platforms.
        </p>
      </div>
      
      <div className="flex justify-center pt-4">
        <div className="relative">
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-slate-400 to-blue-600 rounded-full"></div>
          <div className="absolute inset-0 w-24 h-1 bg-gradient-to-r from-blue-500 via-slate-400 to-blue-600 rounded-full blur-sm opacity-50"></div>
        </div>
      </div>
    </div>
  )
}
