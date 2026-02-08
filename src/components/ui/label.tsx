"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { useTheme } from "@/context/ThemeContext"

import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(isFallout ? "fo-label" : "mc-label", className)}
      {...props}
    />
  )
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
