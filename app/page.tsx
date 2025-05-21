import Image from "next/image";
import { ChatInput } from "../components/chatbar";
import { HeroSection } from "@/components/HeroSectiontext";

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="chat-container">
        <HeroSection />
        <ChatInput />
        
        <div className="examples-section">
          <h2 className="examples-title">Try these examples</h2>
          <div className="examples-grid">
            <div className="example-card">
              <p>Create a modern tech product advertisement</p>
            </div>
            <div className="example-card">
              <p>Design a minimalist fashion banner</p>
            </div>
            <div className="example-card">
              <p>Generate a food delivery app promotion</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}