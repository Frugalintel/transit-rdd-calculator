"use client"

import { useTheme } from '@/context/ThemeContext'

export function Chicago95Background() {
    const { settings } = useTheme()
    if (settings.themeMode !== 'chicago95') return null

    return (
        <div
            className="fixed inset-0 -z-20 pointer-events-none"
            style={{
                backgroundImage:
                    'var(--chi95-desktop-overlay, none), var(--chi95-desktop-image, none), linear-gradient(0deg, rgba(255,255,255,var(--chi95-grid-alpha,0.06)) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,var(--chi95-grid-alpha,0.06)) 1px, transparent 1px)',
                backgroundSize: 'cover, cover, 24px 24px, 24px 24px',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat, no-repeat, repeat, repeat',
                backgroundColor: 'var(--chi95-desktop-bg)',
            }}
        />
    )
}
