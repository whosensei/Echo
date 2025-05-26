"use client";
import type * as React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  SendHorizonal,
  Paperclip,
  Video,
  Image,
  Sparkles,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import FileUploader from "./fileupload";

const Adtype = ["Static AD", "Video AD"];

export function ChatInput() {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedRatio, setSelectedRatio] = useState("Static AD");
  const [isCloneSelected, setIsCloneSelected] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleEnhance = () => {
    console.log("Enhancing message:", message);
  };

  const handleClone = () => {
    setIsCloneSelected(!isCloneSelected);
    console.log("Cloning message:", message, "Selected:", !isCloneSelected);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 240; // 10 rows approximately
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative glass-enhanced rounded-2xl p-1 hover:shadow-xl transition-all duration-300">
        <div className="absolute -bottom-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent rounded-full blur-sm"></div>
        <div className="absolute -bottom-1 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent rounded-full"></div>
        
        <div className="flex flex-col">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe the ad you want to create..."
            className="w-full min-h-[30px] max-h-[240px] resize-none border-0 bg-transparent px-5 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none text-base leading-relaxed overflow-y-auto custom-scrollbar"
            rows={2}
          />
          
          <div className="flex items-center justify-between p-4 pt-2 border-t border-transparent">
            <div className="flex items-center gap-3">
              <FileUploader />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-sm font-normal bg-background/50 border-border/50 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                  >
                    {selectedRatio === "Video AD" ? (
                      <Video className="w-3 h-3 mr-1.5" />
                    ) : (
                      <Image className="w-3 h-3 mr-1.5" />
                    )}
                    {selectedRatio}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36 glass-enhanced">
                  {Adtype.map((ratio) => (
                    <DropdownMenuCheckboxItem
                      key={ratio}
                      checked={selectedRatio === ratio}
                      onCheckedChange={() => setSelectedRatio(ratio)}
                      className="text-sm"
                    >
                      {ratio === "Video AD" ? (
                        <Video className="w-3 h-3 mr-2" />
                      ) : (
                        <Image className="w-3 h-3 mr-2" />
                      )}
                      {ratio}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleClone}
                variant="outline"
                size="sm"
                className={`text-sm font-normal relative overflow-hidden transition-all duration-300 ${
                  isCloneSelected
                    ? "btn-gradient text-white hover:text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                    : "bg-background/50 border-border/50 hover:bg-primary hover:text-white hover:border-primary"
                }`}
              >
                <Copy className="w-3 h-3 mr-1.5 relative z-10" />
                <span className="relative z-10">Clone</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">            
              <Button
                onClick={handleEnhance}
                variant="outline"
                size="icon"
                className="text-sm font-normal bg-background/50 border-border/50 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
              >
                <Sparkles className="w-3 h-3" />
              </Button>
              
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                size="sm"
                className={`relative overflow-hidden transition-all duration-300 ${
                  !message.trim()
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "btn-gradient text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                }`}
              >
                <SendHorizonal className="w-3 h-3 mr-1.5 relative z-10" />
                <span className="relative z-10">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
