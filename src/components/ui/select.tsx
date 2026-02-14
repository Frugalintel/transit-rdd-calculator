"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  const isChicago95 = settings.themeMode === 'chicago95'
  
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        isFallout ? "fo-input" : isChicago95 ? "chi95-input" : "mc-input",
        "flex h-10 w-full items-center justify-between [&>span:first-child]:line-clamp-1",
        isChicago95 && "chi95-select-trigger flex! items-center! justify-between! gap-0 bg-white text-black [&>span:first-child]:flex-1 [&>span:first-child]:text-left [&>span:first-child]:text-black",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        {isChicago95 ? (
          <span className="chi95-select-icon !flex-none" aria-hidden="true">
            <span className="chi95-select-caret" />
          </span>
        ) : (
          <ChevronDown className={cn("h-5 w-5 opacity-70", isChicago95 && "text-black opacity-100")} />
        )}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  const isChicago95 = settings.themeMode === 'chicago95'
  
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-[101] max-h-96 min-w-[8rem] overflow-hidden p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          isFallout ? "fo-panel" : isChicago95 ? "border border-[#808080] bg-white text-black shadow-none" : "mc-panel",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            isChicago95 ? "p-0" : "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  const isChicago95 = settings.themeMode === 'chicago95'
  
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(isFallout ? "fo-label" : isChicago95 ? "chi95-label" : "mc-label", "py-1.5 px-2", className)}
      {...props}
    />
  )
})
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  const isChicago95 = settings.themeMode === 'chicago95'
  
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center py-2 px-8 text-xl outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 border-2 border-transparent",
        isFallout
          ? "text-[var(--fo-text)] hover:bg-[var(--fo-primary-dim)] hover:text-[var(--fo-text)] focus:bg-[var(--fo-primary-dim)] focus:text-[var(--fo-text)] hover:border-[var(--fo-primary)] fo-text"
          : isChicago95
            ? "!py-0 !px-4 min-h-[18px] !text-[11px] !font-normal !leading-[18px] text-black bg-white border-0 hover:bg-[#000080] hover:text-white focus:bg-[#000080] focus:text-white data-[highlighted]:bg-[#000080] data-[highlighted]:!text-white data-[state=checked]:bg-[#000080] data-[state=checked]:!text-white"
          : "text-[var(--mc-text-dark)] hover:bg-[var(--mc-slot-bg)] hover:text-white hover:border-white focus:bg-[var(--mc-slot-bg)] focus:text-white mc-text-dark",
        className
      )}
      {...props}
    >
      {!isChicago95 && (
        <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className="h-4 w-4" />
          </SelectPrimitive.ItemIndicator>
        </span>
      )}

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  const isChicago95 = settings.themeMode === 'chicago95'
  
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px", isFallout ? "bg-[var(--fo-primary-dim)]" : isChicago95 ? "bg-[#808080]" : "bg-[var(--mc-border)]", className)}
      {...props}
    />
  )
})
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
