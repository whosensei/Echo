"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const Router = useRouter();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-6xl font-semibold text-foreground tracking-tighter">
            Welcome to Echo !
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
          A platform that lets you create ads and social media posts for your campaigns within seconds, making it easy to promote your app effectively.
          </p>
        </div>

        {/* CTA Section */}
        <div className="pt-2">
          <Button
            size="lg"
            onClick={() => Router.push("/Images")}
            className="group relative px-8 py-4 font-semibold"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <span>Click to see progress</span>
              <svg 
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" 
                />
              </svg>
            </span>
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
