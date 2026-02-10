"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useTheme } from "@/context/ThemeContext"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[99] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// Minecraft close button
const MinecraftCloseButton = () => (
  <DialogPrimitive.Close
    className="absolute right-3 top-3 sm:right-4 sm:top-4 focus:outline-none disabled:pointer-events-none shrink-0"
    aria-label="Close"
    title="Close"
  >
    <div className="mc-button mc-button-destructive w-14 h-12 flex items-center justify-center p-0">
      <span className="text-2xl font-bold leading-none">×</span>
    </div>
  </DialogPrimitive.Close>
)

// Fallout close button
const FalloutCloseButton = () => (
  <DialogPrimitive.Close className="absolute right-0 top-0 focus:outline-none disabled:pointer-events-none flex-shrink-0 z-50">
    <div 
      className="fo-button flex items-center justify-center p-0 cursor-pointer group w-7 h-7 sm:w-9 sm:h-9 hover:bg-[var(--fo-primary)] hover:text-black transition-colors border-l-2 border-b-2 border-[var(--fo-primary)]"
      style={{ borderTop: 'none', borderRight: 'none', borderLeftWidth: '2px', borderBottomWidth: '2px' }}
    >
       <span className="text-lg sm:text-xl leading-none font-bold">×</span>
    </div>
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
)

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "relative z-[100] grid w-full max-w-lg gap-4 p-6 duration-200 pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            isFallout ? "fo-panel" : "mc-panel",
            className
          )}
          style={{ margin: 0 }}
          {...props}
        >
          {children}
          {isFallout ? <FalloutCloseButton /> : <MinecraftCloseButton />}
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-2xl",
        isFallout ? "fo-heading" : "mc-text-dark",
        className
      )}
      {...props}
    />
  )
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        "text-lg",
        isFallout ? "fo-text-dim" : "text-gray-600",
        className
      )}
      {...props}
    />
  )
})
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
