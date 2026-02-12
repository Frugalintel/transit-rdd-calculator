import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
    label: string
    color: string
    onChange: (color: string) => void
    onReset?: () => void
    isModified?: boolean
}

export function ColorPicker({ label, color, onChange, onReset, isModified }: ColorPickerProps) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'

    return (
        <div
            className={cn(
                "flex items-center justify-between p-2 gap-2 shadow-sm",
                isFallout
                    ? "border border-[var(--fo-primary-dim)] bg-black"
                    : isChicago95
                        ? "chi95-panel border border-[#808080]"
                        : "bg-[var(--mc-bg)] border-2 border-[var(--mc-dark-border)] rounded"
            )}
        >
            <div className="flex items-center gap-2">
                 <Label className={cn(isFallout ? "fo-label text-base" : isChicago95 ? "chi95-label text-sm" : "mc-heading text-lg")}>{label}</Label>
                 {isModified && <span className="text-[10px] text-red-500 font-bold">*</span>}
            </div>
           
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <div 
                        className={cn(
                            "w-8 h-8 cursor-pointer shadow-sm transition-transform active:scale-95",
                            isFallout
                                ? "border border-[var(--fo-primary-dim)]"
                                : isChicago95
                                    ? "border border-[#808080]"
                                    : "border-2 border-[var(--mc-dark-border)]"
                        )}
                        style={{ backgroundColor: color }}
                    >
                        <input 
                            type="color" 
                            value={color}
                            onChange={(e) => onChange(e.target.value)}
                            className="opacity-0 w-full h-full absolute inset-0 cursor-pointer"
                        />
                    </div>
                </div>
                <Input 
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        "w-20 h-8 font-mono text-sm p-1 text-center uppercase",
                        isFallout ? "fo-input" : isChicago95 ? "chi95-input" : "mc-input"
                    )}
                    maxLength={7}
                />
                {onReset && (
                    <Button 
                        onClick={onReset}
                        variant="destructive"
                        className={cn(
                            "h-8 w-8 p-0 font-bold",
                            !isFallout && !isChicago95 && "bg-[#aa0000] hover:bg-[#cc0000] border-[#550000] text-white"
                        )}
                        title="Reset to default"
                    >
                        ↺
                    </Button>
                )}
            </div>
        </div>
    )
}
