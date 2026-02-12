"use client"

import { useTheme } from '@/context/ThemeContext'

export function Chicago95Background() {
    const { settings } = useTheme()
    if (settings.themeMode !== 'chicago95') return null

    return (
        <div
            className="fixed inset-0 -z-20 pointer-events-none"
            style={{
                background:
                    'linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), var(--chi95-desktop-bg)',
                backgroundSize: '24px 24px, 24px 24px, auto',
            }}
        />
    )
}
