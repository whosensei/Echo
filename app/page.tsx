import { ChatInput } from "../components/chatbar";
import { HeroSection } from "@/components/HeroSectiontext";
import Buttonlist from "@/components/buttonlist";
import { ProfileDropdown } from "@/components/ProfileDropdown";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full">
      <ProfileDropdown />
      <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
        <HeroSection />
        <ChatInput />
        <Buttonlist />
      </main>
    </div>
  );
}