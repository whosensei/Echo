"use client"
import type * as React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RectangleHorizontal, Sparkles, Eclipse, SendHorizonal, Paperclip } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

const aspectRatios = [
  "1:3", "3:1", "1:2", "2:1", "9:16", "16:9", "10:16", "16:10",
  "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "1:1",
]

const magicPrompts = ["Auto", "On", "Off"]
const styleTypes = ["Auto", "General", "Realistic", "Design"]

export function ChatInput() {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedRatio, setSelectedRatio] = useState("1:1")
  const [selectedStyle, setSelectedStyle] = useState("Auto")
  const [selectedEnhance, setSelectedEnhance] = useState("Auto")

  const handleSend = () => {
    if (message.trim()) {
      console.log("Sending message:", message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full mx-auto">
      <div className="bg-white/5 rounded-xl backdrop-blur-sm overflow-hidden border border-white/10">
        <div className="w-full pt-2">
          <Textarea
            ref={textareaRef}
            placeholder="Describe your advertisement idea..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="chat-input"
            rows={3}
          />
        </div>

        <div className="flex items-center px-4 py-3 justify-between bg-white/5">
          <div className="flex gap-2">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <Paperclip className="w-5 h-5" />
              <span className="ml-2">Attach</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <RectangleHorizontal className="w-5 h-5" />
                  <span className="ml-2">{selectedRatio}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/10 backdrop-blur-lg border-white/20">
                {aspectRatios.map((ratio) => (
                  <DropdownMenuCheckboxItem
                    key={ratio}
                    checked={selectedRatio === ratio}
                    onCheckedChange={() => setSelectedRatio(ratio)}
                    className="text-white hover:bg-white/20"
                  >
                    {ratio}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Eclipse className="w-5 h-5" />
                  <span className="ml-2">{selectedStyle}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/10 backdrop-blur-lg border-white/20">
                {styleTypes.map((style) => (
                  <DropdownMenuCheckboxItem
                    key={style}
                    checked={selectedStyle === style}
                    onCheckedChange={() => setSelectedStyle(style)}
                    className="text-white hover:bg-white/20"
                  >
                    {style}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Sparkles className="w-5 h-5" />
                  <span className="ml-2">{selectedEnhance}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/10 backdrop-blur-lg border-white/20">
                {magicPrompts.map((prompt) => (
                  <DropdownMenuCheckboxItem
                    key={prompt}
                    checked={selectedEnhance === prompt}
                    onCheckedChange={() => setSelectedEnhance(prompt)}
                    className="text-white hover:bg-white/20"
                  >
                    {prompt}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button 
            onClick={handleSend} 
            disabled={!message.trim()} 
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <SendHorizonal className="w-5 h-5 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}