"use client";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState } from "react";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";

export function TwolayoutDesign() {
  const options1 = ["10", "20", "30"];
  const [selected1, setSelected1] = useState(options1[0]);

  return (
    <div className="flex h-screen p-2 rounded-xl border border-gray-300 overflow-hidden">
      <div className=" flex-1 border rounded-xl border-gray-300 p-2 m-3">
        <div className="m-2 border rounded-xl h-30">Image upload section</div>
        <div className="grid grid-cols-2 gap-1 mb-6 justify-center pt-5">
          <div className="flex flex-col space-y-2 mb-3">
            <DropdownMenu>
              <DropdownMenuLabel className="pl-4 text-gray-500">Button1</DropdownMenuLabel>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-3/6 justify-between p-5 shadow"
                  size="lg"
                >
                  {selected1}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {options1.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setSelected1(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col space-y-2 mb-3 ">
            <DropdownMenu>
              <DropdownMenuLabel className="pl-4">Button1</DropdownMenuLabel>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-3/6 justify-between p-5 shadow"
                  size="lg"
                >
                  {selected1}
                  <ChevronDown className="h-4 w-4 ml-2 " />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {options1.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setSelected1(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col space-y-2 mb-3">
            <DropdownMenu>
              <DropdownMenuLabel className="pl-4">Button1</DropdownMenuLabel>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-3/6 justify-between p-5 shadow"
                  size="lg"
                >
                  {selected1}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {options1.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setSelected1(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col space-y-2 mb-3">
            <DropdownMenu>
              <DropdownMenuLabel className="pl-4">Button1</DropdownMenuLabel>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-3/6 justify-between p-5 shadow"
                  size="lg"
                >
                  {selected1}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {options1.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setSelected1(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>

        <div className="flex flex-col border rounded-xl bg-blue-100/50 backdrop-blur-lg h-20 mb-5 px-5 py-3">
          <div className="flex">
          <Sparkles className="w-4 h-4 mt-1 text-blue-700" / >
          <span className="text-blue-700 pl-2">Credit cost</span>
          </div>
          <span className="text-blue-500">1 cost</span>
        </div>
        <div className="flex justify-center">
          <Button className="w-3/4 p-5 text-md shadow" onClick={() => alert("hit")} variant="default">
            <Sparkles className="w-6 h-6"/>
            Generate
          </Button>
        </div>
      </div>
      <div className="flex-1 border rounded-xl border-gray-300 p-2 m-3">
        <div className="flex justify-center items-center h-screen">
          <img src="null" alt="generated images"></img>
        </div>
      </div>
    </div>
  );
}
