"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, MonitorSmartphone } from "lucide-react"
import clsx from "clsx"
import { Button } from "@/components/ui/button"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = React.useState<string>()

  React.useEffect(() => {
    setSelectedTheme(theme)
  }, [theme])

  return (
    <div className="flex gap-0.5 rounded-full border border-border bg-card p-1 text-center">
      <SwitchButton selectedTheme={selectedTheme} setTheme={setTheme} theme="light">
        <Sun className="size-4" />
      </SwitchButton>
      <SwitchButton selectedTheme={selectedTheme} setTheme={setTheme} theme="system">
        <MonitorSmartphone className="size-4" />
      </SwitchButton>
      <SwitchButton selectedTheme={selectedTheme} setTheme={setTheme} theme="dark">
        <Moon className="size-4" />
      </SwitchButton>
    </div>
  )
}

function SwitchButton({
  selectedTheme,
  theme,
  setTheme,
  children,
}: {
  selectedTheme?: string
  theme: string
  setTheme: (theme: string) => void
  children?: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${theme} theme`}
      className={clsx(
        "!size-6 rounded-full !p-0 text-muted-foreground hover:bg-muted hover:text-foreground",
        selectedTheme === theme && "bg-muted text-foreground"
      )}
      onClick={() => setTheme(theme)}
    >
      {children}
    </Button>
  )
}
