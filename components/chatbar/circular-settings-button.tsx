"use client";
import { Button } from "@/components/ui/button";
import { Settings2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import useSettings from "@/lib/hooks/use-settings";

export function CircularSettingsButton() {
  const {
    selectedModel,
    ideogramaspectRatio,
    ideogramstyleType,
    ideogrammagicPrompt,
    ideogrammodelType,
    imagenaspectRatio,
    imagenmodelType,
    imagenoutputFormat,
    ideogramaspectratio,
    ideogramstyletype,
    ideogrammagicprompt,
    ideogramodeltype,
    imagenModeltype,
    imagenaspectratio,
    imagenoutputformat,
    setideogramaspectRatio,
    setideogramstyleType,
    setideogrammagicPrompt,
    setideogrammodelType,
    setimagenaspectRatio,
    setimagenmodelType,
    setimagenoutputFormat,
  } = useSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="border border-gray-200 dark:border-accent rounded-full h-9 w-9 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 glass-enhanced">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
          <Settings2 className="w-3 h-3" />
          Model Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {selectedModel === "Ideogram" ? (
          <>
            <div className="p-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-between h-8 text-xs min-w-[100px] focus-visible:ring-0 focus-visible:ring-offset-0">
                      {ideogrammodelType}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {ideogramodeltype.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => setideogrammodelType(option)}
                        className={`text-xs ${option === ideogrammodelType ? 'bg-muted font-medium' : ''}`}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Ratio</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-between h-8 text-xs min-w-[100px] focus-visible:ring-0 focus-visible:ring-offset-0">
                      {ideogramaspectRatio}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {ideogramaspectratio.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => setideogramaspectRatio(option)}
                        className={`text-xs ${option === ideogramaspectRatio ? 'bg-muted font-medium' : ''}`}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Style</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-between h-8 text-xs min-w-[100px] focus-visible:ring-0 focus-visible:ring-offset-0">
                      {ideogramstyleType}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {ideogramstyletype.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => setideogramstyleType(option)}
                        className={`text-xs ${option === ideogramstyleType ? 'bg-muted font-medium' : ''}`}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Magic Prompt</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-between h-8 text-xs min-w-[100px] focus-visible:ring-0 focus-visible:ring-offset-0">
                      {ideogrammagicPrompt}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {ideogrammagicprompt.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => setideogrammagicPrompt(option)}
                        className={`text-xs ${option === ideogrammagicPrompt ? 'bg-muted font-medium' : ''}`}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-between h-8 text-xs min-w-[100px] focus-visible:ring-0 focus-visible:ring-offset-0">
                      {imagenmodelType}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {imagenModeltype.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => setimagenmodelType(option)}
                        className={`text-xs ${option === imagenmodelType ? 'bg-muted font-medium' : ''}`}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Ratio</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-between h-8 text-xs min-w-[100px] focus-visible:ring-0 focus-visible:ring-offset-0">
                      {imagenaspectRatio}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {imagenaspectratio.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => setimagenaspectRatio(option)}
                        className={`text-xs ${option === imagenaspectRatio ? 'bg-muted font-medium' : ''}`}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Format</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-between h-8 text-xs min-w-[100px] focus-visible:ring-0 focus-visible:ring-offset-0">
                      {imagenoutputFormat}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {imagenoutputformat.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => setimagenoutputFormat(option)}
                        className={`text-xs ${option === imagenoutputFormat ? 'bg-muted font-medium' : ''}`}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 