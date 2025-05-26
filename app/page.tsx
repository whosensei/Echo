import { ChatInput } from "../components/chatbar";
import { HeroSection } from "@/components/HeroSectiontext";
import Buttonlist from "@/components/buttonlist";
import { ProfileDropdown } from "@/components/ProfileDropdown";
// import { FeaturesSection } from "@/components/FeaturesSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background bg-glow relative overflow-hidden">
      <div className="absolute inset-0 pattern-dots opacity-30"></div>
      <div className="absolute inset-0 pattern-grid opacity-20"></div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-16 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-slate-300/15 rounded-full blur-2xl float-slow pulse-glow"></div>
        <div className="absolute top-32 right-24 w-32 h-32 bg-gradient-to-br from-slate-400/15 to-blue-500/20 rounded-full blur-xl float-slow" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-300/25 to-slate-400/10 rounded-full blur-lg float-slow" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-60 right-1/3 w-28 h-28 bg-gradient-to-br from-slate-300/20 to-blue-400/15 rounded-full blur-xl float-slow pulse-glow" style={{animationDelay: '1s'}}></div>
        
        <div className="absolute top-1/4 left-1/2 w-16 h-16 border border-blue-300/30 rounded-lg rotate-45 float-slow" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 border border-slate-400/20 rounded-full float-slow" style={{animationDelay: '5s'}}></div>
      </div>
      
      <ProfileDropdown />
      
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl mx-auto space-y-12 animate-fade-in">
          <HeroSection />
          
          <div className="w-full max-w-2xl mx-auto">
            <ChatInput />
          </div>
          
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">
              Choose a platform and we'll generate a platform-specific post in seconds.
              </p>
            </div>
            <Buttonlist />
          </div>
        </div>
        
        {/* <div className="w-full max-w-6xl mx-auto mt-24">
          <FeaturesSection />
        </div> */}
      </main>
    </div>
  );
}