"use client"

import { useTheme as useAppTheme } from "@/context/ThemeContext"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const MC_TOAST = "group toast group-[.toaster]:bg-[var(--mc-bg)] group-[.toaster]:text-[var(--mc-text-dark)] group-[.toaster]:border-2 group-[.toaster]:border-black group-[.toaster]:shadow-[inset_2px_2px_0_0_var(--mc-light-border),inset_-2px_-2px_0_0_var(--mc-dark-border),inset_-4px_-4px_0_0_var(--mc-shadow),0_4px_8px_rgba(0,0,0,0.5)] group-[.toaster]:mc-body group-[.toaster]:tracking-normal group-[.toaster]:p-3"
const FO_TOAST = "group toast group-[.toaster]:bg-black group-[.toaster]:text-[var(--fo-primary)] group-[.toaster]:border group-[.toaster]:border-[var(--fo-primary)] group-[.toaster]:shadow-none group-[.toaster]:fo-text group-[.toaster]:tracking-wider group-[.toaster]:uppercase group-[.toaster]:p-3"

const Toaster = ({ ...props }: ToasterProps) => {
  const { settings } = useAppTheme()
  const isFallout = settings.themeMode === 'fallout'

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: isFallout ? FO_TOAST : MC_TOAST,
          description: isFallout ? "group-[.toast]:text-[var(--fo-primary-dim)]" : "group-[.toast]:mc-text-gray",
          actionButton: isFallout
            ? "group-[.toast]:fo-button group-[.toast]:text-sm"
            : "group-[.toast]:bg-[var(--mc-button-bg)] group-[.toast]:text-[var(--mc-text-dark)] group-[.toast]:border-2 group-[.toast]:border-[var(--mc-dark-border)] group-[.toast]:shadow-[inset_2px_2px_0_0_var(--mc-light-border),inset_-2px_-2px_0_0_var(--mc-dark-border)]",
          cancelButton: isFallout
            ? "group-[.toast]:fo-button group-[.toast]:text-sm"
            : "group-[.toast]:bg-[var(--mc-button-bg)] group-[.toast]:text-[var(--mc-text-gray)] group-[.toast]:border-2 group-[.toast]:border-[var(--mc-dark-border)] group-[.toast]:shadow-[inset_2px_2px_0_0_var(--mc-light-border),inset_-2px_-2px_0_0_var(--mc-dark-border)]",
          success: isFallout
            ? "group-[.toaster]:!bg-black group-[.toaster]:!border-[var(--fo-primary)]"
            : "group-[.toaster]:!bg-[var(--mc-bg)] group-[.toaster]:!border-black",
          error: isFallout
            ? "group-[.toaster]:!bg-black group-[.toaster]:!border-[#FF4444] group-[.toaster]:!text-[#FF4444]"
            : "group-[.toaster]:!bg-[var(--mc-bg)] group-[.toaster]:!border-black group-[.toaster]:text-[var(--mc-destructive-text)]",
          warning: isFallout
            ? "group-[.toaster]:!bg-black group-[.toaster]:!border-[#FFB000] group-[.toaster]:!text-[#FFB000]"
            : "group-[.toaster]:!bg-[var(--mc-bg)] group-[.toaster]:!border-black group-[.toaster]:text-[var(--mc-warning-text)]",
          info: isFallout
            ? "group-[.toaster]:!bg-black group-[.toaster]:!border-[var(--fo-primary)]"
            : "group-[.toaster]:!bg-[var(--mc-bg)] group-[.toaster]:!border-black",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
