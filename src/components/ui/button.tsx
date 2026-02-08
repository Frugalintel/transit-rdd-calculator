"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { useTheme } from "@/context/ThemeContext"

import { cn } from "@/lib/utils"

// Size variants (shared between themes)
const sizeVariants = cva(
  "",
  {
    variants: {
      size: {
        default: "h-10 px-6 text-xl",
        sm: "h-8 px-4 text-lg",
        lg: "h-12 px-10 text-2xl",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

// Minecraft theme variant classes
const MINECRAFT_VARIANTS: Record<string, string> = {
  default: "mc-button",
  primary: "mc-button mc-button-primary",
  destructive: "mc-button mc-button-destructive",
  warning: "mc-button mc-button-warning",
  secondary: "mc-button mc-button-secondary",
  outline: "mc-button",
  ghost: "mc-button mc-button-ghost",
  link: "mc-button mc-button-link",
}

// Fallout theme variant classes
const FALLOUT_VARIANTS: Record<string, string> = {
  default: "fo-button",
  primary: "fo-button fo-button-primary",
  destructive: "fo-button fo-button-destructive",
  warning: "fo-button fo-button-warning",
  secondary: "fo-button",
  outline: "fo-button",
  ghost: "fo-button fo-button-ghost",
  link: "fo-button fo-button-link",
}

export type ButtonVariant = "default" | "primary" | "destructive" | "warning" | "secondary" | "outline" | "ghost" | "link"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sizeVariants> {
  asChild?: boolean
  variant?: ButtonVariant | null
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size, asChild = false, ...props }, ref) => {
    const { settings } = useTheme()
    const themeVariants = settings.themeMode === 'fallout' ? FALLOUT_VARIANTS : MINECRAFT_VARIANTS
    const variantClass = themeVariants[variant || 'default']
    
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(variantClass, sizeVariants({ size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, sizeVariants as buttonVariants }
