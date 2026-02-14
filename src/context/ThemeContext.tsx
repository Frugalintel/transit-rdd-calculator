"use client"
import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react'
import { DEFAULT_TEMPLATES, CopyFormat } from '@/utils/textHelpers'
import { soundManager } from '@/utils/sounds'
import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client'
import {
    ThemeColors,
    ThemePreset,
    FalloutColors,
    FalloutPreset,
    Chicago95Colors,
    Chicago95Preset,
    THEMES,
    FALLOUT_THEMES,
    CHICAGO95_THEMES
} from '@/utils/themeConstants'

// Theme Mode - top level theme selection
export type ThemeMode = 'minecraft' | 'fallout' | 'chicago95'

export interface ThemeSettings {
    // Theme mode selection
    themeMode: ThemeMode
    // Minecraft settings (existing)
    activeTheme: ThemePreset
    customColors: ThemeColors
    // Fallout settings (new)
    falloutTheme: FalloutPreset
    falloutCustomColors: FalloutColors
    // Chicago95 settings
    chicago95Theme: Chicago95Preset
    chicago95CustomColors: Chicago95Colors
    // Shared settings
    showFormat: boolean
    soundEnabled: boolean
    animationEnabled: boolean
    templates: Record<CopyFormat, string>
    visibleFormats: Record<CopyFormat, boolean>
}

interface ThemeContextType {
    settings: ThemeSettings
    resolvedTemplates: Record<CopyFormat, string>
    overriddenFormats: CopyFormat[]
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
    // Chicago95 theme functions
    setChicago95Theme: (theme: Chicago95Preset) => void
    updateChicago95CustomColor: (key: keyof Chicago95Colors, value: string) => void
    resetChicago95CustomColors: () => void
    currentChicago95Colors: Chicago95Colors
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
    // Chicago95 settings
    chicago95Theme: 'default',
    chicago95CustomColors: CHICAGO95_THEMES.default,
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
    const secure = window.location.protocol === 'https:' || process.env.NODE_ENV === 'production' ? ';Secure' : ''
    document.cookie = `${name}=${value};path=/;max-age=31536000;SameSite=Lax${secure}`
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
        const savedChicago95Theme = localStorage.getItem('chicago95Theme')
        const savedChicago95CustomColors = localStorage.getItem('chicago95CustomColors')

        // Resolve themeMode: prefer localStorage for user-selected preference.
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
            chicago95Theme: (savedChicago95Theme as Chicago95Preset) || DEFAULT_SETTINGS.chicago95Theme,
            chicago95CustomColors: savedChicago95CustomColors ? JSON.parse(savedChicago95CustomColors) : DEFAULT_SETTINGS.chicago95CustomColors,
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
    const [serverTemplateOverrides, setServerTemplateOverrides] = useState<Partial<Record<CopyFormat, string>>>({})

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

            root.classList.remove('theme-minecraft', 'theme-chicago95')
            root.classList.add('theme-fallout')
        } else if (settings.themeMode === 'chicago95') {
            // Clear stale variables so CSS remapping works
            const mcVars = [
                '--mc-bg', '--mc-dark-border', '--mc-light-border', '--mc-shadow',
                '--mc-text-shadow', '--mc-input-bg', '--mc-input-text', '--mc-accent',
                '--mc-button-bg', '--mc-text-dark', '--mc-text-gray', '--mc-slot-bg'
            ]
            const foVars = [
                '--fo-primary', '--fo-primary-dim', '--fo-primary-glow', '--fo-bg',
                '--fo-panel-bg', '--fo-text', '--fo-text-dim', '--fo-scanline-opacity'
            ]
            mcVars.forEach(v => root.style.removeProperty(v))
            foVars.forEach(v => root.style.removeProperty(v))

            const chicagoColors = settings.chicago95Theme === 'custom'
                ? settings.chicago95CustomColors
                : CHICAGO95_THEMES[settings.chicago95Theme]

            root.style.setProperty('--chi95-desktop-bg', chicagoColors.desktopBg)
            root.style.setProperty('--chi95-window-bg', chicagoColors.windowBg)
            root.style.setProperty('--chi95-titlebar-bg', chicagoColors.titleBarBg)
            root.style.setProperty('--chi95-titlebar-text', chicagoColors.titleBarText)
            root.style.setProperty('--chi95-border-light', chicagoColors.borderLight)
            root.style.setProperty('--chi95-border-dark', chicagoColors.borderDark)
            root.style.setProperty('--chi95-text', chicagoColors.text)
            root.style.setProperty('--chi95-text-dim', chicagoColors.textDim)
            root.style.setProperty('--chi95-button-face', chicagoColors.buttonFace)
            root.style.setProperty('--chi95-button-text', chicagoColors.buttonText)
            root.style.setProperty('--chi95-input-bg', chicagoColors.inputBg)
            root.style.setProperty('--chi95-input-text', chicagoColors.inputText)
            root.style.setProperty('--chi95-accent', chicagoColors.accent)
            root.style.setProperty('--chi95-grid-alpha', settings.chicago95Theme === 'sgs' ? '0' : '0.06')
            if (settings.chicago95Theme === 'sgs') {
                root.style.setProperty('--chi95-desktop-image', 'url("/backgrounds/IMG_0864.webp")')
                root.style.setProperty('--chi95-desktop-overlay', 'linear-gradient(rgba(9, 16, 35, 0.24), rgba(9, 16, 35, 0.24))')
            } else {
                root.style.removeProperty('--chi95-desktop-image')
                root.style.removeProperty('--chi95-desktop-overlay')
            }

            root.classList.remove('theme-minecraft', 'theme-fallout')
            root.classList.add('theme-chicago95')
        } else {
            // Clear stale Fallout inline variables so CSS defaults apply
            const foVars = [
                '--fo-primary', '--fo-primary-dim', '--fo-primary-glow', '--fo-bg',
                '--fo-panel-bg', '--fo-text', '--fo-text-dim', '--fo-scanline-opacity'
            ]
            const chiVars = [
                '--chi95-desktop-bg', '--chi95-window-bg', '--chi95-titlebar-bg', '--chi95-titlebar-text',
                '--chi95-border-light', '--chi95-border-dark', '--chi95-text', '--chi95-text-dim',
                '--chi95-button-face', '--chi95-button-text', '--chi95-input-bg', '--chi95-input-text', '--chi95-accent',
                '--chi95-desktop-image', '--chi95-grid-alpha', '--chi95-desktop-overlay'
            ]
            foVars.forEach(v => root.style.removeProperty(v))
            chiVars.forEach(v => root.style.removeProperty(v))

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

            root.classList.remove('theme-fallout', 'theme-chicago95')
            root.classList.add('theme-minecraft')
        }

    }, [settings.themeMode, settings.activeTheme, settings.customColors, settings.falloutTheme, settings.falloutCustomColors, settings.chicago95Theme, settings.chicago95CustomColors, mounted])

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
        setCookie('chicago95Theme', settings.chicago95Theme)

    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!mounted) return
        let cancelled = false

        const loadServerTemplateOverrides = async () => {
            try {
                const supabase = createSupabaseBrowserClient()
                const { data: sessionData } = await supabase.auth.getSession()
                const sessionUser = sessionData.session?.user
                if (!sessionUser) {
                    if (!cancelled) {
                        setServerTemplateOverrides({})
                    }
                    return
                }

                const { data, error } = await supabase
                    .from('user_template_overrides')
                    .select('format_key, template_text')
                    .eq('target_user_id', sessionUser.id)

                if (error || !data) {
                    if (!cancelled) {
                        setServerTemplateOverrides({})
                    }
                    return
                }

                const nextOverrides: Partial<Record<CopyFormat, string>> = {}
                for (const row of data as Array<{ format_key: string; template_text: string }>) {
                    const format = row.format_key as CopyFormat
                    if (format in DEFAULT_TEMPLATES) {
                        nextOverrides[format] = row.template_text
                    }
                }
                if (!cancelled) {
                    setServerTemplateOverrides(nextOverrides)
                }
            } catch {
                if (!cancelled) {
                    setServerTemplateOverrides({})
                }
            }
        }

        void loadServerTemplateOverrides()

        const onFocus = () => {
            void loadServerTemplateOverrides()
        }
        window.addEventListener('focus', onFocus)

        return () => {
            cancelled = true
            window.removeEventListener('focus', onFocus)
        }
    }, [mounted])

    const resolvedTemplates = useMemo(
        () => ({ ...settings.templates, ...serverTemplateOverrides }),
        [settings.templates, serverTemplateOverrides]
    )

    const overriddenFormats = useMemo(
        () => Object.keys(serverTemplateOverrides) as CopyFormat[],
        [serverTemplateOverrides]
    )

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
            // Chicago95 settings
            if (updates.chicago95Theme !== undefined) {
                localStorage.setItem('chicago95Theme', next.chicago95Theme)
                setCookie('chicago95Theme', next.chicago95Theme)
            }
            if (updates.chicago95CustomColors !== undefined) {
                localStorage.setItem('chicago95CustomColors', JSON.stringify(next.chicago95CustomColors))
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

    // Chicago95 theme functions
    const setChicago95Theme = (theme: Chicago95Preset) => {
        updateSettings({ chicago95Theme: theme })
    }

    const updateChicago95CustomColor = (key: keyof Chicago95Colors, value: string) => {
        const newColors = { ...settings.chicago95CustomColors, [key]: value }
        updateSettings({
            chicago95Theme: 'custom',
            chicago95CustomColors: newColors
        })
    }

    const resetChicago95CustomColors = () => {
        updateSettings({ chicago95CustomColors: CHICAGO95_THEMES.default })
    }

    const currentChicago95Colors = settings.chicago95Theme === 'custom'
        ? settings.chicago95CustomColors
        : CHICAGO95_THEMES[settings.chicago95Theme]

    // Theme mode function
    const setThemeMode = (mode: ThemeMode) => {
        updateSettings({ themeMode: mode })
    }

    return (
        <ThemeContext.Provider value={{ 
            settings, 
            resolvedTemplates,
            overriddenFormats,
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
            // Chicago95 theme
            setChicago95Theme,
            updateChicago95CustomColor,
            resetChicago95CustomColors,
            currentChicago95Colors,
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
