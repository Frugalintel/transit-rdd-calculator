"use client"

import * as React from "react"
import { useTheme } from "@/context/ThemeContext"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const { settings } = useTheme()
    const baseClass =
      settings.themeMode === "fallout"
        ? "fo-input"
        : settings.themeMode === "chicago95"
          ? "chi95-input"
          : "mc-input"
    return (
      <textarea
        className={cn(
          baseClass,
          "flex min-h-[80px] w-full px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

