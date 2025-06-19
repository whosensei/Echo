"use client"
import OpenAI from "openai";
import { createContext, useContext, useState, ReactNode } from "react";

const modeltype = ["Ideogram","Imagen-4","OpenAI-image-1", "Flux-kontext", ];

//Ideogram
const ideogramaspectratio = ["1:3","3:1","1:2","2:1","9:16","16:9","10:16","16:10","2:3", "3:2","3:4","4:3","4:5", "5:4","1:1"];
const ideogramstyletype = ["Auto", "General", "Realistic", "Design"];
const ideogrammagicprompt = ["Auto", "On", "Off"];
const ideogramodeltype = ["default", "v3-turbo", "v3-quality"];

//Imagen-4
const imagenModeltype = ["default", "fast" , "quality"]
const imagenaspectratio =  ["1:1","9:16","16:9","3:4"]
const imagenoutputformat = ["jpg","png"]

type SettingsContextType = {
  modeltype: string[];
  ideogramaspectratio: string[];
  ideogramstyletype: string[];
  ideogrammagicprompt: string[];
  ideogramodeltype: string[];
  imagenModeltype: string[];
  imagenaspectratio: string[];
  imagenoutputformat: string[];
  selectedModel: string;
  ideogramaspectRatio: string;
  ideogramstyleType: string;
  ideogrammagicPrompt: string;
  ideogrammodelType: string;
  imagenaspectRatio: string;
  imagenmodelType: string;
  imagenoutputFormat: string;
  setSelectedModel: (model: string) => void;
  setideogramaspectRatio: (ratio: string) => void;
  setideogramstyleType: (style: string) => void;
  setideogrammagicPrompt: (prompt: string) => void;
  setideogrammodelType: (type: string) => void;
  setimagenaspectRatio: (ratio: string) => void;
  setimagenmodelType: (type: string) => void;
  setimagenoutputFormat: (format: string) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState(modeltype[0]);
  const [ideogramaspectRatio, setideogramaspectRatio] = useState(ideogramaspectratio[0]);
  const [ideogramstyleType, setideogramstyleType] = useState(ideogramstyletype[0]);
  const [ideogrammagicPrompt, setideogrammagicPrompt] = useState(ideogrammagicprompt[0]);
  const [ideogrammodelType, setideogrammodelType] = useState(ideogramodeltype[0]);
  const [imagenaspectRatio, setimagenaspectRatio] = useState(imagenaspectratio[0]);
  const [imagenmodelType, setimagenmodelType] = useState(imagenModeltype[0]);
  const [imagenoutputFormat, setimagenoutputFormat] = useState(imagenoutputformat[0]);

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
} 