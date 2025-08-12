import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface ThemeToggleProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, ...props }) => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = mounted ? theme === "dark" : true

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full bg-card border border-border text-foreground shadow-md px-3 py-2",
        className
      )}
      {...props}
    >
      <Sun className="h-4 w-4" aria-hidden="true" />
      <Switch
        id="theme-toggle"
        aria-label="Toggle dark mode"
        checked={isDark}
        onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
      />
      <Moon className="h-4 w-4" aria-hidden="true" />
    </div>
  )
}
