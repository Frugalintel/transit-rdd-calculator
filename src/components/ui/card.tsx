"use client"

import * as React from "react"
import { useTheme } from "@/context/ThemeContext"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { settings } = useTheme()
  const baseClass =
    settings.themeMode === "fallout"
      ? "fo-panel"
      : settings.themeMode === "chicago95"
        ? "chi95-panel"
        : "mc-panel"
  return (
    <div
      ref={ref}
      className={cn(baseClass, className)}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { settings } = useTheme()
  return (
    <h3
      ref={ref}
      className={cn(
        settings.themeMode === "fallout"
          ? "fo-heading text-2xl"
          : settings.themeMode === "chicago95"
            ? "chi95-text text-xl font-bold"
            : "mc-text-dark text-2xl",
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { settings } = useTheme()
  return (
    <p
      ref={ref}
      className={cn(
        settings.themeMode === "fallout"
          ? "fo-text-dim text-lg"
          : settings.themeMode === "chicago95"
            ? "chi95-text text-sm opacity-80"
            : "text-lg text-gray-600",
        className
      )}
      {...props}
    />
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
