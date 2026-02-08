"use client"
import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { DEFAULT_TEMPLATES, CopyFormat } from '@/utils/textHelpers'
import { soundManager } from '@/utils/sounds'
import {
    ThemeColors,
    ThemePreset,
    FalloutColors,
    FalloutPreset,
    THEMES,
    FALLOUT_THEMES
} from '@/utils/themeConstants'

// Theme Mode - top level theme selection
export type ThemeMode = 'minecraft' | 'fallout'

export interface ThemeSettings {
    // Theme mode selection
    themeMode: ThemeMode
    // Minecraft settings (existing)
    activeTheme: ThemePreset
    customColors: ThemeColors
    // Fallout settings (new)
    falloutTheme: FalloutPreset
    falloutCustomColors: FalloutColors
    // Shared settings
    showFormat: boolean
    soundEnabled: boolean
    animationEnabled: boolean
    templates: Record<CopyFormat, string>
    visibleFormats: Record<CopyFormat, boolean>
}

interface ThemeContextType {
    settings: ThemeSettings
    mounted: boolean
    updateSettings: (updates: Partial<ThemeSettings>) => void
    resetTemplates: () => void
    // Minecraft theme functions
    setTheme: (theme: ThemePreset) => void
    updateCustomColor: (key: keyof ThemeColors, value: string) => void
    resetCustomColors: () => void
    currentColors: ThemeColors
    // Fallout theme functions
    setFalloutTheme: (theme: FalloutPreset) => void
    updateFalloutCustomColor: (key: keyof FalloutColors, value: string | number) => void
    resetFalloutCustomColors: () => void
    currentFalloutColors: FalloutColors
    // Theme mode
    setThemeMode: (mode: ThemeMode) => void
}

const DEFAULT_VISIBLE_FORMATS: Record<CopyFormat, boolean> = {
    simple: true,
    osnp: true,
    osp: true,
    isp: true,
    isnp: true,
    dpsr: true
}

const DEFAULT_SETTINGS: ThemeSettings = {
    // Theme mode - default to minecraft for backwards compatibility
    themeMode: 'minecraft',
    // Minecraft settings
    activeTheme: 'default',
    customColors: THEMES.default,
    // Fallout settings
    falloutTheme: 'green',
    falloutCustomColors: FALLOUT_THEMES.green,
    // Shared settings
    showFormat: true,
    soundEnabled: true,
    animationEnabled: true,
    templates: DEFAULT_TEMPLATES,
    visibleFormats: DEFAULT_VISIBLE_FORMATS
}

const ThemeContext = createContext<ThemeContextType | null>(null)

// Helper: set a cookie (client-side only)
function setCookie(name: string, value: string) {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=${value};path=/;max-age=31536000;SameSite=Lax`
}

// Read settings from localStorage synchronously to avoid theme flash
function getInitialSettings(serverThemeMode?: ThemeMode): ThemeSettings {
    if (typeof window === 'undefined') {
        // Server: use the cookie-derived value passed from the server layout
        return { ...DEFAULT_SETTINGS, themeMode: serverThemeMode || DEFAULT_SETTINGS.themeMode }
    }
    
    try {
        const savedThemeMode = localStorage.getItem('themeMode')
        const showFormat = localStorage.getItem('showFormatOption')
        const soundEnabled = localStorage.getItem('soundEnabled')
        const animationEnabled = localStorage.getItem('animationEnabled')
        const savedTemplates = localStorage.getItem('customTemplates')
        const savedVisible = localStorage.getItem('visibleFormats')
        const savedTheme = localStorage.getItem('activeTheme')
        const savedCustomColors = localStorage.getItem('customColors')
        const savedFalloutTheme = localStorage.getItem('falloutTheme')
        const savedFalloutCustomColors = localStorage.getItem('falloutCustomColors')

        // Resolve themeMode: prefer localStorage, fall back to server-provided value
        const resolvedThemeMode = (savedThemeMode as ThemeMode) || serverThemeMode || DEFAULT_SETTINGS.themeMode

        return {
            ...DEFAULT_SETTINGS,
            themeMode: resolvedThemeMode,
            showFormat: showFormat !== null ? showFormat === 'true' : DEFAULT_SETTINGS.showFormat,
            soundEnabled: soundEnabled !== null ? soundEnabled === 'true' : DEFAULT_SETTINGS.soundEnabled,
            animationEnabled: animationEnabled !== null ? animationEnabled === 'true' : DEFAULT_SETTINGS.animationEnabled,
            templates: savedTemplates ? JSON.parse(savedTemplates) : DEFAULT_SETTINGS.templates,
            visibleFormats: savedVisible ? JSON.parse(savedVisible) : DEFAULT_SETTINGS.visibleFormats,
            activeTheme: (savedTheme as ThemePreset) || DEFAULT_SETTINGS.activeTheme,
            customColors: savedCustomColors ? JSON.parse(savedCustomColors) : DEFAULT_SETTINGS.customColors,
            falloutTheme: (savedFalloutTheme as FalloutPreset) || DEFAULT_SETTINGS.falloutTheme,
            falloutCustomColors: savedFalloutCustomColors ? JSON.parse(savedFalloutCustomColors) : DEFAULT_SETTINGS.falloutCustomColors,
        }
    } catch {
        return { ...DEFAULT_SETTINGS, themeMode: serverThemeMode || DEFAULT_SETTINGS.themeMode }
    }
}

interface ThemeProviderProps {
    children: ReactNode
    serverThemeMode?: ThemeMode
}

export function ThemeProvider({ children, serverThemeMode }: ThemeProviderProps) {
    const [settings, setSettings] = useState<ThemeSettings>(() => getInitialSettings(serverThemeMode))
    const [mounted, setMounted] = useState(false)

    // Apply colors to CSS variables based on theme mode
    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement

        if (settings.themeMode === 'fallout') {
            // Clear stale Minecraft inline variables so CSS remapping works
            const mcVars = [
                '--mc-bg', '--mc-dark-border', '--mc-light-border', '--mc-shadow',
                '--mc-text-shadow', '--mc-input-bg', '--mc-input-text', '--mc-accent',
                '--mc-button-bg', '--mc-text-dark', '--mc-text-gray', '--mc-slot-bg'
            ]
            mcVars.forEach(v => root.style.removeProperty(v))

            // Apply Fallout theme colors
            const falloutColors = settings.falloutTheme === 'custom'
                ? settings.falloutCustomColors
                : FALLOUT_THEMES[settings.falloutTheme]

            root.style.setProperty('--fo-primary', falloutColors.primary)
            root.style.setProperty('--fo-primary-dim', falloutColors.primaryDim)
            root.style.setProperty('--fo-primary-glow', falloutColors.primaryGlow)
            root.style.setProperty('--fo-bg', falloutColors.bg)
            root.style.setProperty('--fo-panel-bg', falloutColors.panelBg)
            root.style.setProperty('--fo-text', falloutColors.textPrimary)
            root.style.setProperty('--fo-text-dim', falloutColors.textDim)
            root.style.setProperty('--fo-scanline-opacity', String(falloutColors.scanlineOpacity))

            root.classList.remove('theme-minecraft')
            root.classList.add('theme-fallout')
        } else {
            // Clear stale Fallout inline variables so CSS defaults apply
            const foVars = [
                '--fo-primary', '--fo-primary-dim', '--fo-primary-glow', '--fo-bg',
                '--fo-panel-bg', '--fo-text', '--fo-text-dim', '--fo-scanline-opacity'
            ]
            foVars.forEach(v => root.style.removeProperty(v))

            // Apply Minecraft theme colors
            const colors = settings.activeTheme === 'custom' 
                ? settings.customColors 
                : THEMES[settings.activeTheme]

            root.style.setProperty('--mc-bg', colors.panelBg)
            root.style.setProperty('--mc-dark-border', colors.borderDark)
            root.style.setProperty('--mc-light-border', colors.borderLight)
            root.style.setProperty('--mc-shadow', colors.shadow)
            root.style.setProperty('--mc-text-shadow', colors.textShadow)
            root.style.setProperty('--mc-input-bg', colors.inputBg)
            root.style.setProperty('--mc-input-text', colors.inputText)
            root.style.setProperty('--mc-accent', colors.accent)
            root.style.setProperty('--mc-button-bg', colors.buttonBg)
            root.style.setProperty('--mc-text-dark', colors.textDark)
            root.style.setProperty('--mc-text-gray', colors.textGray)
            root.style.setProperty('--mc-slot-bg', colors.slotBg)

            root.classList.remove('theme-fallout')
            root.classList.add('theme-minecraft')
        }
        
    }, [settings.themeMode, settings.activeTheme, settings.customColors, settings.falloutTheme, settings.falloutCustomColors, mounted])

    // Sync theme mode with sound manager
    useEffect(() => {
        soundManager.setThemeMode(settings.themeMode)
    }, [settings.themeMode])

    // Sync sound settings
    useEffect(() => {
        soundManager.setEnabled(settings.soundEnabled)
    }, [settings.soundEnabled])

    // Sync animation settings
    useEffect(() => {
        if (settings.animationEnabled) {
            document.body.classList.remove('disable-animations')
        } else {
            document.body.classList.add('disable-animations')
        }
    }, [settings.animationEnabled])

    useEffect(() => {
        setMounted(true)
        // Ensure the cookies are in sync with localStorage for existing users
        // who set their theme before the cookie-based SSR approach was added.
        setCookie('themeMode', settings.themeMode)
        setCookie('activeTheme', settings.activeTheme)
        setCookie('falloutTheme', settings.falloutTheme)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const updateSettings = (updates: Partial<ThemeSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...updates }
            
            // Shared settings
            if (updates.showFormat !== undefined) {
                localStorage.setItem('showFormatOption', String(next.showFormat))
            }
            if (updates.soundEnabled !== undefined) {
                localStorage.setItem('soundEnabled', String(next.soundEnabled))
            }
            if (updates.animationEnabled !== undefined) {
                localStorage.setItem('animationEnabled', String(next.animationEnabled))
            }
            if (updates.templates !== undefined) {
                localStorage.setItem('customTemplates', JSON.stringify(next.templates))
            }
            if (updates.visibleFormats !== undefined) {
                localStorage.setItem('visibleFormats', JSON.stringify(next.visibleFormats))
            }
            // Theme mode - save to both localStorage and cookie (cookie enables SSR)
            if (updates.themeMode !== undefined) {
                localStorage.setItem('themeMode', next.themeMode)
                setCookie('themeMode', next.themeMode)
            }
            // Minecraft settings
            if (updates.activeTheme !== undefined) {
                localStorage.setItem('activeTheme', next.activeTheme)
                setCookie('activeTheme', next.activeTheme)
            }
            if (updates.customColors !== undefined) {
                localStorage.setItem('customColors', JSON.stringify(next.customColors))
                // For custom colors, we might want to skip cookies if too large, but for now we won't persist complex object to cookie to keep it simple.
                // SSR mainly needs the preset name. Custom colors flash might still occur if using "custom", but presets will be fixed.
            }
            // Fallout settings
            if (updates.falloutTheme !== undefined) {
                localStorage.setItem('falloutTheme', next.falloutTheme)
                setCookie('falloutTheme', next.falloutTheme)
            }
            if (updates.falloutCustomColors !== undefined) {
                localStorage.setItem('falloutCustomColors', JSON.stringify(next.falloutCustomColors))
            }
            
            return next
        })
    }

    const resetTemplates = () => {
        updateSettings({ templates: DEFAULT_TEMPLATES })
    }

    const setTheme = (theme: ThemePreset) => {
        updateSettings({ activeTheme: theme })
    }

    const updateCustomColor = (key: keyof ThemeColors, value: string) => {
        const newColors = { ...settings.customColors, [key]: value }
        updateSettings({ 
            activeTheme: 'custom',
            customColors: newColors
        })
    }

    const resetCustomColors = () => {
        updateSettings({ customColors: THEMES.default })
    }

    const currentColors = settings.activeTheme === 'custom' 
        ? settings.customColors 
        : THEMES[settings.activeTheme]

    // Fallout theme functions
    const setFalloutTheme = (theme: FalloutPreset) => {
        updateSettings({ falloutTheme: theme })
    }

    const updateFalloutCustomColor = (key: keyof FalloutColors, value: string | number) => {
        const newColors = { ...settings.falloutCustomColors, [key]: value }
        updateSettings({
            falloutTheme: 'custom',
            falloutCustomColors: newColors
        })
    }

    const resetFalloutCustomColors = () => {
        updateSettings({ falloutCustomColors: FALLOUT_THEMES.green })
    }

    const currentFalloutColors = settings.falloutTheme === 'custom'
        ? settings.falloutCustomColors
        : FALLOUT_THEMES[settings.falloutTheme]

    // Theme mode function
    const setThemeMode = (mode: ThemeMode) => {
        updateSettings({ themeMode: mode })
    }

    return (
        <ThemeContext.Provider value={{ 
            settings, 
            mounted,
            updateSettings, 
            resetTemplates,
            // Minecraft theme
            setTheme,
            updateCustomColor,
            resetCustomColors,
            currentColors,
            // Fallout theme
            setFalloutTheme,
            updateFalloutCustomColor,
            resetFalloutCustomColors,
            currentFalloutColors,
            // Theme mode
            setThemeMode
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
    return ctx
}
