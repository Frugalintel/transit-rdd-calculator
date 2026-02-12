"use client"

import * as React from "react"
import { useTheme } from "@/context/ThemeContext"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const { settings } = useTheme()
    const baseClass =
      settings.themeMode === 'fallout'
        ? 'fo-input'
        : settings.themeMode === 'chicago95'
          ? 'chi95-input'
          : 'mc-input'
    
    return (
      <input
        type={type}
        className={cn(baseClass, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
