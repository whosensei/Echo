import Image from "next/image";
import { ChatInput } from "../components/chatbar";
import { HeroSection } from "@/components/HeroSectiontext";
import Buttonlist from "@/components/buttonlist";

export default function Home() {
  return(
  <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
  <HeroSection />
  <ChatInput />
  <Buttonlist />
</main>)
}