"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown, Copy } from "lucide-react";
import useSettings from "@/lib/hooks/use-settings";

export default function Buttonlist() {
  const {
    modeltype,
    ideogramaspectratio,
    ideogramstyletype,
    ideogrammagicprompt,
    ideogramodeltype,
    imagenModeltype,
    imagenaspectratio,
    imagenoutputformat,
    selectedModel,
    ideogramaspectRatio,
    ideogramstyleType,
    ideogrammagicPrompt,
    ideogrammodelType,
    imagenaspectRatio,
    imagenmodelType,
    imagenoutputFormat,
    setSelectedModel,
    setideogramaspectRatio,
    setideogramstyleType,
    setideogrammagicPrompt,
    setideogrammodelType,
    setimagenaspectRatio,
    setimagenmodelType,
    setimagenoutputFormat,
  } = useSettings();

  return (
    <div className="flex items-center justify-center w-full border rounded-2xl mt-2 p-2">
      {selectedModel === "Ideogram" ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="lg" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {ideogrammodelType}
                <ChevronDown className="h-4 w-4 ml-2 " />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Model Type
              </div>
              <div className="h-px bg-border my-1" />
              {ideogramodeltype.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setideogrammodelType(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="lg" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {ideogramaspectRatio}
                <ChevronDown className="h-4 w-4 ml-2 " />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-auto grid grid-cols-2"
            >
              <div className="col-span-2 px-2 py-1.5 text-sm font-semibold">
                Aspect Ratio
              </div>
              <div className="col-span-2 h-px bg-border my-1" />
              {ideogramaspectratio.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setideogramaspectRatio(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="lg" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {ideogramstyleType}
                <ChevronDown className="h-4 w-4 ml-2 " />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Style Type
              </div>
              <div className="h-px bg-border my-1" />
              {ideogramstyletype.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setideogramstyleType(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="lg" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {ideogrammagicPrompt}
                <ChevronDown className="h-4 w-4 ml-2 " />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Magic Prompt
              </div>
              <div className="h-px bg-border my-1" />
              {ideogrammagicprompt.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setideogrammagicPrompt(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="lg" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {imagenmodelType}
                <ChevronDown className="h-4 w-4 ml-2 " />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Model Type
              </div>
              <div className="h-px bg-border my-1" />
              {imagenModeltype.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setimagenmodelType(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="lg" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {imagenaspectRatio}
                <ChevronDown className="h-4 w-4 ml-2 " />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Aspect Ratio
              </div>
              <div className="h-px bg-border my-1" />
              {imagenaspectratio.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setimagenaspectRatio(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="lg" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {imagenoutputFormat}
                <ChevronDown className="h-4 w-4 ml-2 " />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Output Format
              </div>
              <div className="h-px bg-border my-1" />
              {imagenoutputformat.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setimagenoutputFormat(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
