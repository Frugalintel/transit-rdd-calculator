"use client"

import { useTheme } from '@/context/ThemeContext'

export function TerminalBackground() {
    const { settings } = useTheme()
    
    if (settings.themeMode !== 'fallout') return null
    
    return (
        <div className="fixed inset-0 z-[-1]" style={{ backgroundColor: 'var(--fo-bg)' }}>
            {/* Grid pattern overlay - Static */}
            <div 
                className="absolute inset-0 opacity-[0.1]"
                style={{
                    backgroundImage: `
                        linear-gradient(var(--fo-primary-dim) 1px, transparent 1px),
                        linear-gradient(90deg, var(--fo-primary-dim) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                }}
            />
        </div>
    )
}
