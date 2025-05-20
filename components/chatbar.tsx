"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  RectangleHorizontal,
  Sparkles,
  Pencil,
  Eclipse,
  SendHorizonal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const aspectRatios = [
  "1:3",
  "3:1",
  "1:2",
  "2:1",
  "9:16",
  "16:9",
  "10:16",
  "16:10",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "1:1",
];

const magicPrompts = ["Auto", "On", "Off"];
const styleTypes = ["Auto", "General", "Realistic", "Design"];

export function ChatInput() {
  const [message, setMessage] = useState("");
  const textInputref = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      // Here you would send the message to your chat service
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-2 mb-4">
      <div className="border-2 rounded-xl">
        <div className="w-full">
          <Input
            ref={textInputref}
            placeholder="Message Echo..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-20 py-3 px-4"
          />
        </div>

        <div className="flex items-center pr-3 justify-between">
          <div className="flex items-center pl-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="chat-button">
                  <span className="sr-only">Aspect Ratio</span>
                  <RectangleHorizontal className="w-5 h-5" /> Ratio
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="dropdown-menu dropdown-grid w-[220px]"
              >
                {aspectRatios.map((ratio) => (
                  <DropdownMenuItem key={ratio} className="dropdown-item">
                    {ratio}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="chat-button">
                  <span className="sr-only">Style Type</span>
                  <Eclipse className="w-5 h-5" />
                  Style
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dropdown-menu">
                {styleTypes.map((style) => (
                  <DropdownMenuItem key={style} className="dropdown-item">
                    {style}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="chat-button">
                  <span className="sr-only">Magic Prompt</span>
                  <Sparkles className="w-5 h-5" />
                  Enhance
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dropdown-menu">
                {magicPrompts.map((prompt) => (
                  <DropdownMenuItem key={prompt} className="dropdown-item">
                    {prompt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            onClick={handleSend}
            className="chat-button"
            disabled={!message.trim()}
            variant="ghost"
          >
            <SendHorizonal className="h-5 w-5" />
            Send
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
