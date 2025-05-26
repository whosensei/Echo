"use client";
import { useState } from "react";
import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";

export default function Buttonlist() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const platforms = [
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      color: "from-pink-500 to-purple-600",
      glowColor: "rgba(236, 72, 153, 0.15)",
      shadowColor: "shadow-pink-500/10",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "from-blue-600 to-blue-700",
      glowColor: "rgba(37, 99, 235, 0.15)",
      shadowColor: "shadow-blue-500/10",
    },
    {
      id: "twitter",
      name: "X",
      icon: Twitter,
      color: "from-slate-700 to-slate-900",
      glowColor: "rgba(71, 85, 105, 0.15)",
      shadowColor: "shadow-slate-500/10",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "from-blue-500 to-blue-600",
      glowColor: "rgba(14, 165, 233, 0.15)",
      shadowColor: "shadow-blue-500/10",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatforms.includes(platform.id);
          
          return (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`group relative p-5 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                isSelected
                  ? `glass-enhanced shadow-xl ${platform.shadowColor}`
                  : `glass-enhanced hover:shadow-lg ${platform.shadowColor.replace('/10', '/5')}`
              }`}
            >
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-10 rounded-xl`}></div>
              )}
              
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                   style={{
                     background: `radial-gradient(circle at center, ${platform.glowColor}, transparent 70%)`
                   }}>
              </div>
              
              <div className="relative flex flex-col items-center space-y-3">
                <div className={`p-3 rounded-lg transition-all duration-300 ${
                  isSelected 
                    ? "bg-gradient-to-br " + platform.color + " text-white shadow-lg transform scale-110" 
                    : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground dark:group-hover:text-white group-hover:scale-110 group-hover:shadow-md"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium transition-all duration-300 ${
                  isSelected ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground group-hover:font-semibold"
                }`}>
                  {platform.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedPlatforms.length > 0 && (
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-enhanced">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-slate-400 rounded-full animate-pulse"></div>
            <p className="text-sm text-muted-foreground font-medium">
              {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
