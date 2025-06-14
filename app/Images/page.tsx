"use client";

import { SettingsProvider } from "@/lib/context/settings-context";
import { ChatInput } from "@/components/chatbar";
import Buttonlist from "@/components/buttonlist";

export default function ADcomponent() {
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
    </div>
  );
}
