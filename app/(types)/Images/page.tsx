"use client";

import { SettingsProvider } from "@/lib/context/settings-context";
import { ChatInput } from "@/components/chatbar";
import { SettingsGrid } from "@/components/settings-grid";
import { ImageGallerySidebar } from "@/components/image-gallery-sidebar";
import { useState } from "react";

export default function ADcomponent() {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  return (
    <div className="flex flex-col justify-center items-center h-180">
      <div className="pb-4 font-medium text-4xl tracking-tighter text-balance">
        What do you wish to create !
      </div>
      <SettingsProvider>
        <div className="w-full max-w-2xl mx-auto">
          <ChatInput />
          <SettingsGrid />
        </div>
      </SettingsProvider>
      <ImageGallerySidebar
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)} 
        onOpen={() => setIsGalleryOpen(true)} 
      />
    </div>
  );
}
