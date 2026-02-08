"use client"

import { useTheme } from '@/context/ThemeContext'

export function ScanlineOverlay() {
    const { settings } = useTheme()
    
    if (settings.themeMode !== 'fallout') return null
    
    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
            {/* Scanlines - static */}
            <div className="absolute inset-0 fo-scanlines opacity-30 mix-blend-overlay" />
            
            {/* Simple Vignette */}
            <div 
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
                }}
            />
            
            {/* Subtle Green Tint */}
            <div 
                className="absolute inset-0 mix-blend-overlay opacity-10"
                style={{ backgroundColor: 'var(--fo-primary)' }}
            />
        </div>
    )
}
