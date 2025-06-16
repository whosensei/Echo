"use client";

import { SettingsProvider } from "@/lib/context/settings-context";
import { ChatInput } from "@/components/chatbar";
import Buttonlist from "@/components/buttonlist";
import { ImageGallerySidebar } from "@/components/image-gallery-sidebar";
import { useState } from "react";

export default function ADcomponent() {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="pb-3 font-semibold text-4xl tracking-tighter text-balance">
        What do you wish to create !
      </div>
      <SettingsProvider>
        <div className="w-full max-w-2xl mx-auto">
          <ChatInput />
          <Buttonlist />
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
