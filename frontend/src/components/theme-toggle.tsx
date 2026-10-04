import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => {
      document.documentElement.classList.toggle("dark", !dark); setDark(!dark);
    }}>{dark ? <Sun /> : <Moon />}</Button>
  );
}
