"use client"

import React from 'react'
import { Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NameTagInputProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    placeholder?: string
}

export function NameTagInput({ value, onChange, disabled, placeholder = "Name this calculation..." }: NameTagInputProps) {
    return (
        <div className={cn(
            "relative group",
            disabled && "opacity-50 pointer-events-none"
        )}>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-10 bg-[var(--mc-input-bg)] border-2 border-[var(--mc-dark-border)] text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono pr-10"
                maxLength={50}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Tag className="h-5 w-5 text-[#707070] transition-colors group-hover:text-white group-focus-within:text-white" />
            </div>
        </div>
    )
}
