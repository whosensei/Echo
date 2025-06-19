"use client";
import { Settings2 } from "lucide-react";
import useSettings from "@/lib/hooks/use-settings";

export function SettingsGrid() {
  const {
    selectedModel,
    ideogrammodelType,
    ideogramaspectRatio,
    ideogramstyleType,
    ideogrammagicPrompt,
    imagenmodelType,
    imagenaspectRatio,
    imagenoutputFormat,
  } = useSettings();

  return (
    <div className="w-full mt-3">
      <div className="flex items-center justify-between px-4 py-3 rounded-xl glass-enhanced border border-border/30">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Settings</span>
        </div>
        
        <div className="flex items-center gap-2">
          <SettingBadge 
            label="Model"
            value={selectedModel} 
            color="blue"
          />
          
          {selectedModel === "Ideogram" ? (
            <>
              <SettingBadge 
                label="Type"
                value={ideogrammodelType} 
                color="purple"
              />
              <SettingBadge 
                label="Ratio"
                value={ideogramaspectRatio} 
                color="green"
              />
              <SettingBadge 
                label="Style"
                value={ideogramstyleType} 
                color="orange"
              />
              <SettingBadge 
                label="Magic"
                value={ideogrammagicPrompt} 
                color="pink"
              />
            </>
          ) : (
            <>
              <SettingBadge 
                label="Type"
                value={imagenmodelType} 
                color="purple"
              />
              <SettingBadge 
                label="Ratio"
                value={imagenaspectRatio} 
                color="green"
              />
              <SettingBadge 
                label="Format"
                value={imagenoutputFormat} 
                color="orange"
              />
              <div className="w-16"></div> 
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground opacity-75">
            {selectedModel === "Ideogram"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SettingBadge({ 
  label,
  value, 
  color 
}: {
  label: string;
  value: string;
  color: "blue" | "purple" | "green" | "orange" | "pink";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    purple: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    green: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    orange: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    pink: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700"
  };
  
  return (
    <div className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-medium border ${colorClasses[color]}`}>
      <span className="text-[10px] opacity-75 mr-1.5">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
