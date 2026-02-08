"use client"

import { useTheme } from '@/context/ThemeContext'
import { Panorama } from '@/components/minecraft/Panorama'
import { TerminalBackground } from '@/components/fallout/TerminalBackground'
import { ScanlineOverlay } from '@/components/fallout/ScanlineOverlay'

export function ThemeBackground() {
    const { settings } = useTheme()

    // The server now knows the correct theme via cookie, so we can render
    // the background immediately without waiting for mount.
    if (settings.themeMode === 'fallout') {
        return (
            <>
                <TerminalBackground />
                <ScanlineOverlay />
            </>
        )
    }
    
    return <Panorama />
}
