"use client";
import type * as React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { buttonBaseStyles, buttonHoverStyles, buttonSelectedStyles, buttonTextStyles } from "./ui/buttonstyles";
import {
  RectangleHorizontal,
  Sparkles,
  Eclipse,
  SendHorizonal,
  Paperclip,
  Video,
  Image,
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
  const [selectedRatio, setSelectedRatio] = useState("AdType");
  const [cloneselect, setcloneselect] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      // send the message to your chat service
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        100
      )}px`;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-2 mb-4">
      <div className="border rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm gap-2">
        <div className="w-full pt-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message Echo..."
            className="w-full min-h-[80px] max-h-[150px] py-2 px-4 resize-none border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 mb-0 bg-transparent text-foreground placeholder:text-muted-foreground overflow-hidden"
            rows={1}
            style={{ minHeight: "70px", maxHeight: "100px" }}
          />
        </div>

        <div className="flex items-center justify-between bg-background px-3 py-2">
          <div className="flex items-center space-x-2">

          <FileUploader />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full h-9 px-4 space-x-1">
                {selectedRatio === "Video AD" ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
                <span>{selectedRatio}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="dropdown-menu dropdown-grid w-auto"
            >
              {Adtype.map((ratio) => (
                <DropdownMenuCheckboxItem
                  key={ratio}
                  checked={selectedRatio === ratio}
                  onCheckedChange={() => setSelectedRatio(ratio)}
                >
                  {ratio}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => setcloneselect(!cloneselect)}
            className={`rounded-full h-9 px-4 ${cloneselect
              ? buttonSelectedStyles
              : `${buttonHoverStyles} ${buttonTextStyles}`
              }`}
          >
            clone
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="rounded-full h-9 w-9 p-0">
            <Sparkles className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            size="icon"
            className={`rounded-full h-9 w-9 p-0 transition-all duration-300 ${!message.trim()
              ? "bg-gray-200/60 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500"
              : "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
              }`}
          >
            <SendHorizonal className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
    </div >
  );
}
