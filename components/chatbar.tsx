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
      // Here you would send the message to your chat service
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
    <div className="w-full max-w-3xl mx-auto p-2 mb-4">
      <div className="border rounded-xl overflow-hidden">
        <div className="w-full pt-2">
          <Textarea
            ref={textareaRef}
            placeholder="Message Echo..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[80px] max-h-[100px] py-2 px-4 resize-none overflow-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 mb-0"
            rows={1}
          />
        </div>

        <div className="flex items-center pr-2 justify-between bg-background mt-[-4px] pb-2">
          <div className="pl-1">
                <Button variant="ghost" className="chat-button">
                  <span className="sr-only">Attach File</span>
                  <Paperclip className="w-5 h-5" /> Attach
                </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="chat-button">
                  <span className="sr-only">Aspect Ratio</span>
                  <RectangleHorizontal className="w-5 h-5" /> {selectedRatio}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="dropdown-menu dropdown-grid w-auto columns-3">
                {aspectRatios.map((ratio) => (
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="chat-button">
                  <span className="sr-only">Style Type</span>
                  <Eclipse className="w-5 h-5" /> {selectedStyle}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="dropdown-menu">
                {styleTypes.map((style) => (
                  <DropdownMenuCheckboxItem
                    key={style}
                    checked={selectedStyle === style}
                    onCheckedChange={() => setSelectedStyle(style)}
                  >
                    {style}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="chat-button">
                  <span className="sr-only">Magic Prompt</span>
                  <Sparkles className="w-5 h-5" /> {selectedEnhance}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="dropdown-menu">
                {magicPrompts.map((prompt) => (
                  <DropdownMenuCheckboxItem
                    key={prompt}
                    checked={selectedEnhance === prompt}
                    onCheckedChange={() => setSelectedEnhance(prompt)}
                  >
                    
                      {prompt}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button onClick={handleSend} className="chat-button" disabled={!message.trim()} variant="ghost">
            <SendHorizonal className="h-5 w-5" />
            Send
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
