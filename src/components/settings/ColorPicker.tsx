import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ColorPickerProps {
    label: string
    color: string
    onChange: (color: string) => void
    onReset?: () => void
    isModified?: boolean
}

export function ColorPicker({ label, color, onChange, onReset, isModified }: ColorPickerProps) {
    return (
        <div className="flex items-center justify-between p-2 bg-[var(--mc-bg)] border-2 border-[var(--mc-dark-border)] rounded gap-2 shadow-sm">
            <div className="flex items-center gap-2">
                 <Label className="mc-heading text-lg">{label}</Label>
                 {isModified && <span className="text-[10px] text-red-500 font-bold">*</span>}
            </div>
           
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <div 
                        className="w-8 h-8 border-2 border-[var(--mc-dark-border)] cursor-pointer shadow-sm transition-transform active:scale-95"
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
                    className="w-20 h-8 font-mono text-sm mc-input p-1 text-center uppercase"
                    maxLength={7}
                />
                {onReset && (
                    <Button 
                        onClick={onReset}
                        className="h-8 w-8 p-0 bg-[#aa0000] hover:bg-[#cc0000] border-[#550000] text-white font-bold"
                        title="Reset to default"
                    >
                        ↺
                    </Button>
                )}
            </div>
        </div>
    )
}
