"use client";
import type * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Sparkles, X, ChevronDown, ArrowUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import FileUploader from "./fileupload";
import { CircularSettingsButton } from "./circular-settings-button";
import { UploadedFile } from "@/lib/hooks/useFileUploader";
import useEnhanceUserPrompt from "@/lib/hooks/enhanceuserPrompt";
import useSettings from "@/lib/hooks/use-settings";
import { useTheme } from "next-themes";
import { useChatFlow } from "@/lib/hooks/useChatFlow";
import { Island_Moments } from "next/font/google";

// Helper function to get model logos
const getModelLogo = (modelName: string, theme: string | undefined) => {
  const isDark = theme === "dark";

  switch (modelName) {
    case "OpenAI-image-1":
      return isDark ? "/OpenAI Logo(dark).png" : "/OpenAI Logo (light).png";
    case "Flux-kontext":
      return isDark ? "/Flux Logo (dark).png" : "/Flux Logo (light).png";
    case "Ideogram":
      return isDark
        ? "/Ideogram Logo (dark).png"
        : "/Ideogram Logo (light).png";
    case "Imagen-4":
      return "/Google Logo.png";
    default:
      return null;
  }
};

export function ChatInput() {
  const {
    modeltype,
    setSelectedModel,
    selectedModel,
    ideogramaspectRatio,
    ideogramstyleType,
    ideogrammagicPrompt,
    ideogrammodelType,
    imagenaspectRatio,
    imagenmodelType,
    imagenoutputFormat,
  } = useSettings();

  const {
    createChat,
    generateImages,
    addVersion,
    currentChat,
    currentVersion,
    isLoading,
    error,
  } = useChatFlow();

  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  // const { enhancePrompt, isEnhancing, error } = useEnhanceUserPrompt();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleSend = async () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      console.log("Uploaded files:", uploadedFiles);

      const settings =
        selectedModel === "Ideogram"
          ? {
              model_type: ideogrammodelType,
              aspect_ratio: ideogramaspectRatio,
              style_type: ideogramstyleType,
              magic_prompt: ideogrammagicPrompt,
            }
          : {
              model_type: imagenmodelType,
              aspect_ratio: imagenaspectRatio,
              output_format: imagenoutputFormat,
            };

      if (!currentChat) {
        const result = await createChat(message, settings);
        if (result) {
          const imagegeneration = await generateImages(selectedModel);
          // get the image url from the imagegeneration
        }
      } else {
        const result = await addVersion(message, settings);
        if (result) {
          const imagegeneration = await generateImages(selectedModel);
          // {isLoading && <div> Generating Images ... </div>}
          // get the image url from the imagegeneration
        }
      }

      const datasend = JSON.stringify({
        prompt: message,
        settings: settings,
        model: selectedModel,
      });

      console.log(datasend);

      // const response = await fetch("api/generate",{
      //   method: "POST",
      //   headers:{
      //     "Content-Type":"application/json",
      //   },
      //   body:datasend
      // })

      // if(!response.ok){
      //   throw new Error("Failed to send the message")
      // }

      setMessage("");
      // Clear uploaded files after sending
      uploadedFiles.forEach((file) => {
        if (file.preview_url) {
          URL.revokeObjectURL(file.preview_url);
        }
      });
      setUploadedFiles([]);
    }
  };

  // const handleEnhance = async () => {
  //   if (!message.trim() || isEnhancing) return;

  //   const originalMessage = message;
  //   setMessage("");

  //   try {
  //     await enhancePrompt(originalMessage, (chunk) => {
  //       setMessage((prev) => prev + chunk);
  //     });
  //   } catch (error) {
  //     setMessage(originalMessage);
  //   }
  // };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resizetextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 240;
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizetextarea();
  }, [message, resizetextarea]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleFilesUploaded = (newFiles: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileKey: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.file_key === fileKey);
      if (fileToRemove?.preview_url) {
        URL.revokeObjectURL(fileToRemove.preview_url);
      }
      return prev.filter((f) => f.file_key !== fileKey);
    });
  };

  return (
    <div className="w-full items-center justify-center space-y-4">
      <div className="glass-enhanced rounded-2xl p-1 shadow-sm transition-all duration-300">
        {/* <div className="absolute -bottom-2 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent rounded-full blur-sm"></div> */}
        {/* <div className="absolute -bottom-1 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent rounded-full"></div> */}

        <div className="flex flex-col">
          {uploadedFiles.length > 0 && (
            <div className="px-5 pt-3 pb-2">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.file_key}
                    className="relative group glass-enhanced rounded-lg p-1 border border-border/30"
                  >
                    {file.preview_url ? (
                      <div className="relative">
                        <img
                          src={file.preview_url}
                          alt={file.file_name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <button
                          onClick={() => removeFile(file.file_key)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                          aria-label={`Remove ${file.file_name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center relative">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <button
                          onClick={() => removeFile(file.file_key)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                          aria-label={`Remove ${file.file_name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="absolute bottom-26 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <div className="bg-black/80 text-white text-xs px-2 py-1 rounded mt-1 whitespace-nowrap max-w-32 truncate">
                        {file.file_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe the ad you want to create..."
            className="w-full min-h-[10px] max-h-[240px] resize-none border-0 bg-transparent px-5 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none text-base leading-relaxed overflow-y-auto custom-scrollbar"
            rows={2}
          />

          <div className="flex items-center justify-between p-4 pt-2 border-t border-transparent">
            <div className="flex items-center gap-3">
              <FileUploader onFilesUploaded={handleFilesUploaded} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border border-gray-200 dark:border-accent rounded-3xl h-9 flex items-center gap-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    {getModelLogo(selectedModel, theme) && (
                      <img
                        src={getModelLogo(selectedModel, theme)!}
                        alt={`${selectedModel} logo`}
                        className="w-5 h-5 object-contain"
                      />
                    )}
                    {selectedModel}
                    <ChevronDown className="h-4 w-4 text-accent-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-48 glass-enhanced"
                >
                  {modeltype.map((model) => (
                    <DropdownMenuItem
                      key={model}
                      onClick={() => setSelectedModel(model)}
                      className={`text-sm flex items-center gap-2 pb-2${
                        selectedModel === model
                          ? "bg-muted text-accent-foreground"
                          : ""
                      }`}
                    >
                      {getModelLogo(model, theme) && (
                        <img
                          src={getModelLogo(model, theme)!}
                          alt={`${model} logo`}
                          className="w-5 h-5 object-contain flex-shrink-0"
                        />
                      )}
                      <span className="flex-grow">{model}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <CircularSettingsButton />
            </div>

            <div className="flex items-center gap-2">
              {/* <Button
                onClick={handleEnhance}
                disabled={!message.trim() || isEnhancing}
                variant="outline"
                size="icon"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Sparkles
                  className={`w-3 h-3 ${isEnhancing ? "animate-spin" : ""}`}
                />
              </Button> */}

              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                size="sm"
                className="w-9 h-9 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <ArrowUp className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
