"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/ThemeContext"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  id?: string
  title?: string
  disabled?: boolean
}

// Minecraft-styled switch
const MinecraftSwitch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, className, id, title, disabled }, ref) => (
    <button
      ref={ref}
      id={id}
      title={title}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "group relative inline-flex shrink-0 cursor-pointer items-center border-2 border-black focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden h-8 w-16 bg-black select-none align-middle",
        className
      )}
    >
      {/* Background Track - Left (Green/ON) */}
      <div className="absolute inset-y-0 left-0 w-[55%] bg-[var(--mc-success)] shadow-inner">
        <div className="absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-[10px] bg-[var(--mc-light-border)] shadow-[1px_1px_0_0_rgba(0,0,0,0.3)]" />
      </div>

      {/* Background Track - Right (Grey/OFF) */}
      <div className="absolute inset-y-0 right-0 w-[55%] bg-[var(--mc-button-bg)] shadow-inner">
        <div className="absolute right-[40%] top-1/2 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 border-2 border-[var(--mc-dark-border)] opacity-60" />
      </div>

      {/* Sliding Thumb */}
      <div
        className="absolute inset-y-0 w-[58%] bg-[var(--mc-bg)] shadow-[inset_2px_2px_0_0_var(--mc-light-border),inset_-2px_-2px_0_0_var(--mc-dark-border)] switch-thumb"
        style={{ left: checked ? '42%' : '0' }}
      />
    </button>
  )
)

// Fallout-styled switch
const FalloutSwitch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, className, id, title, disabled }, ref) => (
    <button
      ref={ref}
      id={id}
      title={title}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "group relative inline-flex shrink-0 cursor-pointer items-center focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden h-8 w-16 select-none align-middle transition-all",
        checked ? "bg-[var(--fo-primary-dim)]" : "bg-[var(--fo-bg)]",
        "border border-[var(--fo-primary)]",
        checked && "shadow-[0_0_10px_var(--fo-primary-dim)]",
        className
      )}
    >
      {/* ON label */}
      <div className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold transition-opacity",
        checked ? "opacity-100" : "opacity-30"
      )} style={{ color: 'var(--fo-primary)' }}>
        ON
      </div>

      {/* OFF label */}
      <div className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold transition-opacity",
        !checked ? "opacity-100" : "opacity-30"
      )} style={{ color: 'var(--fo-primary)' }}>
        OFF
      </div>

      {/* Sliding Thumb */}
      <div
        className="absolute top-1 bottom-1 w-6 switch-thumb transition-all"
        style={{ 
          left: checked ? 'calc(100% - 28px)' : '4px',
          backgroundColor: 'var(--fo-primary)',
          boxShadow: '0 0 8px var(--fo-primary-glow)'
        }}
      />
    </button>
  )
)

// Theme-aware switch that renders the appropriate style
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (props, ref) => {
    const { settings } = useTheme()
    
    if (settings.themeMode === 'fallout') {
      return <FalloutSwitch ref={ref} {...props} />
    }
    return <MinecraftSwitch ref={ref} {...props} />
  }
)
Switch.displayName = "Switch"

export { Switch }