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
import { useMediaGeneration } from "@/lib/hooks/use-mediageneration";

export function TwolayoutDesign() {
  
  const background = ["white","black","neutral","gray","office"];
  const aspect_ratio = ["1:1","16:9","9:16","4:3","3:4","3:2","2:3","4:5","5:4","21:9","9:21","2:1","1:2"]
  const gender = ["male","female","none"]
  const output_format = ["jpg","png"]
  const [uploadedimguri, setUploadeduri] = useState("")
  const [bg, setBg] = useState(background[0]);
  const [gen, setGen] = useState(gender[0]);
  const [aspect, setAspect] = useState(aspect_ratio[0])
  const [outputformat, setOutputformat] = useState(output_format[0])

  const {loading, setLoading, generateheadshots} = useMediaGeneration();

  const handleGenerate = ()=>{
    const data = JSON.stringify({
      uploadedimguri,
      gen,
      bg,
      aspect,
      outputformat
    })
    console.log(data)
    // generateheadshots(data);
  }

  return (
    <div className="flex h-screen p-2 rounded-xl border border-gray-300 overflow-hidden">
      <div className=" flex-1 border rounded-xl border-gray-300 p-2 m-3">
        <div className="m-2 border rounded-xl h-30">Image upload section</div>
        <div className="grid grid-cols-2 gap-1 mb-6 justify-center pt-5">
          <div className="flex flex-col space-y-2 mb-3">
            <DropdownMenu>
              <DropdownMenuLabel className="pl-4 text-gray-500">Gender</DropdownMenuLabel>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-2/3 justify-between p-5 shadow focus-visible:ring-0 focus-visible:ring-offset-0"
                  size="lg"
                >
                  {gen}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {gender.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setGen(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col space-y-2 mb-3 ">
            <DropdownMenu>
              <DropdownMenuLabel className="pl-4  text-gray-500">Background</DropdownMenuLabel>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-2/3 justify-between p-5 shadow focus-visible:ring-0 focus-visible:ring-offset-0"
                  size="lg"
                >
                  {bg}
                  <ChevronDown className="h-4 w-4 ml-2 " />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {background.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setBg(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col space-y-2 mb-3">
            <DropdownMenu>
              <DropdownMenuLabel className="pl-4  text-gray-500">Aspect Ratio</DropdownMenuLabel>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-2/3 justify-between p-5 shadow focus-visible:ring-0 focus-visible:ring-offset-0"
                  size="lg"
                >
                  {aspect}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {aspect_ratio.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setAspect(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col space-y-2 mb-3">
            <DropdownMenu>
              <DropdownMenuLabel className="pl-4  text-gray-500">Output Format</DropdownMenuLabel>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-2/3 justify-between p-5 shadow focus-visible:ring-0 focus-visible:ring-offset-0"
                  size="lg"
                >
                  {outputformat}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                {output_format.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setOutputformat(option)}
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
          <span className="text-blue-500">Each image will cost 1 credit</span>
        </div>
        <div className="flex justify-center">
          <Button className="w-3/4 p-5 text-md shadow focus-visible:ring-0 focus-visible:ring-offset-0" onClick={handleGenerate} variant="default">
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
