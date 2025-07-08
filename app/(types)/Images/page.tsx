"use client";

import { SettingsProvider } from "@/lib/context/settings-context";
import { ChatInput } from "@/components/chatbar/chatbar";
import { SettingsGrid } from "@/components/settings-grid";
import { ImageGallerySidebar } from "@/components/image-gallery-sidebar";
import { ImageLibrary } from "@/components/image-library";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ADcomponent() {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  
  if (showImageLibrary) {
    return (
      <div className="min-h-screen">
        <div className="p-4">
          <Button 
            onClick={() => setShowImageLibrary(false)}
            variant="outline"
            className="mb-4"
          >
            ← Back to Creator
          </Button>
        </div>
        <ImageLibrary />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col justify-center items-center h-180">
      <div className="pb-4 font-medium text-4xl tracking-tighter text-balance">
        What do you wish to create !
      </div>
      
      <div className="mb-6">
        <Button 
          onClick={() => setShowImageLibrary(true)}
          variant="outline"
          className="text-sm"
        >
          🖼️ Browse Image Library
        </Button>
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
