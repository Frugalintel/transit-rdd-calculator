"use client"
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { 
    ThemePreset, 
    ThemeColors, 
    THEMES, 
    FalloutPreset, 
    FalloutColors, 
    FALLOUT_THEMES,
    Chicago95Preset,
    CHICAGO95_THEMES
} from '@/utils/themeConstants'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CopyFormat, FORMAT_LABELS, DEFAULT_TEMPLATES } from '@/utils/textHelpers'
import { ItemIcon, ItemType } from './minecraft/ItemIcon'
import { PipBoyIcon, PipBoyIconType } from './fallout/PipBoyIcon'
import { ThemeIcon } from './ThemeIcon'
import { ColorPicker } from './settings/ColorPicker'
import { ThemePreview } from './settings/ThemePreview'
import { FalloutThemePreview } from './settings/FalloutThemePreview'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createClient } from '@/utils/supabase/client'

type SettingsTab = 'general' | 'colors' | 'templates' | 'admin'

interface AdminStats {
    userCount: number
    savedCalcCount: number
    attemptCount: number
    successfulAttemptCount: number
}

const VARIABLES = [
    { label: 'Pack Date', value: '{{pack_date}}' },
    { label: 'Pickup Date', value: '{{load_date}}' },
    { label: 'RDD', value: '{{rdd_date}}' },
    { label: 'Earliest Pickup', value: '{{earliest_load_date}}' },
    { label: 'Latest Pickup', value: '{{latest_load_date}}' },
]

interface SettingsMenuProps {
    isOpen: boolean
    onClose: () => void
    user?: any
    isAdmin?: boolean
}

export function SettingsMenu({ isOpen, onClose, user, isAdmin = false }: SettingsMenuProps) {
    const router = useRouter()
    const { 
        settings, 
        updateSettings, 
        resetTemplates, 
        setTheme, 
        updateCustomColor, 
        currentColors,
        setFalloutTheme,
        updateFalloutCustomColor,
        resetFalloutCustomColors,
        currentFalloutColors,
        setChicago95Theme,
        updateChicago95CustomColor,
        resetChicago95CustomColors,
        currentChicago95Colors,
        setThemeMode
    } = useTheme()
    const [activeTab, setActiveTab] = useState<SettingsTab>('general')
    const [expandedTemplate, setExpandedTemplate] = useState<CopyFormat | null>(null)
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
    const [loadingStats, setLoadingStats] = useState(false)
    
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'
    const isMinecraft = settings.themeMode === 'minecraft'

    // Fetch admin stats when admin tab is active
    useEffect(() => {
        if (activeTab === 'admin' && isAdmin && !adminStats) {
            const fetchStats = async () => {
                setLoadingStats(true)
                const supabase = createClient()
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                const sinceIso = sevenDaysAgo.toISOString()
                
                const [userResult, savedCalcResult, attemptResult, successfulAttemptResult] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('calculations').select('*', { count: 'exact', head: true }).gte('created_at', sinceIso),
                    supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('action_type', 'calculation').gte('created_at', sinceIso),
                    supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('action_type', 'calculation').eq('details->>successful', 'true').gte('created_at', sinceIso),
                ])
                
                setAdminStats({
                    userCount: userResult.count || 0,
                    savedCalcCount: savedCalcResult.count || 0,
                    attemptCount: attemptResult.count || 0,
                    successfulAttemptCount: successfulAttemptResult.count || 0,
                })
                setLoadingStats(false)
            }
            fetchStats()
        }
    }, [activeTab, isAdmin, adminStats])

    // Reset stats when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setAdminStats(null)
        }
    }, [isOpen])

    // Reset expanded template when tab changes
    useEffect(() => {
        if (activeTab !== 'templates') {
            setExpandedTemplate(null)
        }
    }, [activeTab])

    const handleTemplateChange = (format: CopyFormat, value: string) => {
        updateSettings({
            templates: {
                ...settings.templates,
                [format]: value
            }
        })
    }

    const insertVariable = (format: CopyFormat, variable: string) => {
        const textarea = document.getElementById(`template-input-${format}`) as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = settings.templates[format] || ''
        
        const newText = text.substring(0, start) + variable + text.substring(end)
        
        handleTemplateChange(format, newText)
        
        // Defer focus restoration to allow React to update state
        setTimeout(() => {
            textarea.focus()
            const newPos = start + variable.length
            textarea.setSelectionRange(newPos, newPos)
        }, 0)
    }

    const handleVisibilityChange = (format: CopyFormat, visible: boolean) => {
        updateSettings({
            visibleFormats: {
                ...settings.visibleFormats,
                [format]: visible
            }
        })
    }
    
    const handleResetFormat = (format: CopyFormat) => {
         updateSettings({
            templates: {
                ...settings.templates,
                [format]: DEFAULT_TEMPLATES[format]
            }
        })
    }

    const successRate = adminStats && adminStats.attemptCount > 0
        ? Math.round((adminStats.successfulAttemptCount / adminStats.attemptCount) * 100)
        : null

    const TabButton = ({ id, label, icon }: { id: SettingsTab, label: string, icon: ItemType }) => {
        const isActive = activeTab === id
        
        if (isFallout) {
            return (
                <button
                    onClick={() => setActiveTab(id)}
                    className={cn(
                        "fo-button min-w-[120px] border-b-0 px-6 py-2 transition-all duration-200",
                        isActive && "fo-button-primary"
                    )}
                    style={!isActive ? { borderColor: 'var(--fo-primary-dim)' } : undefined}
                >
                    <span className="text-lg tracking-wider">{label}</span>
                </button>
            )
        }

        if (isChicago95) {
            return (
                <button
                    onClick={() => setActiveTab(id)}
                    className={cn(
                        "chi95-button min-w-[110px] px-3 py-1 text-sm",
                        isActive && "chi95-button-primary"
                    )}
                >
                    {label}
                </button>
            )
        }

        return (
            <button
                onClick={() => setActiveTab(id)}
                className={cn(
                    "relative flex items-center gap-2 px-4 sm:px-6 mc-body text-lg sm:text-xl transition-all duration-75 select-none",
                    // Base Borders
                    "border-t-2 border-l-2 border-r-2 border-[var(--mc-dark-border)]",
                    // Active vs Inactive
                    isActive 
                        ? "bg-[var(--mc-bg)] text-[var(--mc-text-dark)] z-20 py-3 -mb-1 pb-4" 
                        : "bg-[#707070] text-[#f0f0f0] hover:bg-[#808080] hover:text-white z-10 py-3 mt-2 mb-0 shadow-[inset_2px_2px_0_0_#909090,inset_-2px_-2px_0_0_#404040]"
                )}
                style={{
                    // Active bevels needs transparent bottom to merge
                    boxShadow: isActive 
                        ? "inset 2px 2px 0 0 #ffffff, inset -2px 0 0 0 #555555" 
                        : undefined
                }}
            >
                <ItemIcon type={icon} scale={1} className={isActive ? "" : "opacity-80"} />
                <span className={isActive ? "" : "drop-shadow-sm"}>{label}</span>
            </button>
        )
    }

    const MinecraftToggle = ({ label, checked, onChange, description }: { label: string, checked: boolean, onChange: (c: boolean) => void, description?: string }) => {
        if (isFallout) {
            return (
                <div className="w-full bg-transparent border-b border-[var(--fo-primary-dim)] py-4 group hover:bg-[rgba(26,255,128,0.05)] transition-colors">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => onChange(!checked)}>
                        <div className={cn(
                            "fo-text text-xl font-mono w-10 text-center transition-all",
                            checked ? "text-[var(--fo-primary)]" : "text-[var(--fo-primary-dim)]"
                        )}>[{checked ? 'X' : ' '}]</div>
                        <div className="flex flex-col gap-1 flex-1">
                            <Label className="fo-heading text-lg sm:text-xl cursor-pointer border-none mb-0 group-hover:text-[var(--fo-primary-glow)] transition-colors">
                                {label}
                            </Label>
                            {description && (
                                <p className="fo-small text-sm opacity-70">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        if (isChicago95) {
            return (
                <div className="w-full chi95-fieldset">
                    <div className="flex items-center gap-3">
                        <Switch
                            id={`toggle-${label}`}
                            checked={checked}
                            onCheckedChange={onChange}
                        />
                        <div className="flex flex-col gap-1 flex-1">
                            <Label className="chi95-label text-sm" htmlFor={`toggle-${label}`}>
                                {label}
                            </Label>
                            {description && (
                                <p className="chi95-text text-xs opacity-80">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="w-full bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)] hover:bg-[#959595] transition-colors">
                <div className="flex items-center gap-4 p-3 sm:p-4">
                    <Switch 
                        id={`toggle-${label}`}
                        checked={checked} 
                        onCheckedChange={onChange}
                    />
                    <div className="flex flex-col gap-1 flex-1">
                        <Label className="mc-heading text-lg sm:text-xl cursor-pointer mc-text-white" htmlFor={`toggle-${label}`}>
                            {label}
                        </Label>
                        {description && (
                            <p className="mc-small text-sm sm:text-base leading-tight drop-shadow-md">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                className={cn(
                    "!max-w-4xl w-[95vw] sm:w-[85vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 shadow-xl",
                    isFallout 
                        ? "fo-panel border-2 bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)]" 
                        : isChicago95
                            ? "chi95-window"
                        : "bg-[var(--mc-bg)] border-2 sm:border-4 border-[var(--mc-dark-border)]"
                )}
                style={{ margin: 0 }}
            >
                <DialogHeader className={cn(
                    "p-4 sm:p-6 shrink-0",
                    isFallout 
                        ? "border-b-2 border-[var(--fo-primary)] bg-black text-left"
                        : isChicago95
                            ? "border-b border-[#808080] bg-[#c0c0c0] text-left"
                        : "border-b-4 border-[var(--mc-dark-border)] bg-[var(--mc-bg)] text-center"
                )}>
                    <div className={isFallout || isChicago95 ? "text-left" : "text-center"}>
                        <DialogTitle className={cn(
                            "text-3xl sm:text-4xl mb-1",
                            isFallout ? "fo-title border-none tracking-widest text-shadow-none" : isChicago95 ? "chi95-text font-bold text-xl sm:text-2xl" : "mc-heading drop-shadow-sm"
                        )}>
                            {isFallout ? 'SYSTEM CONFIGURATION' : isChicago95 ? 'System Settings' : 'Options'}
                        </DialogTitle>
                        <DialogDescription className={cn(
                            "text-base sm:text-lg",
                            isFallout ? "fo-subheading opacity-100" : isChicago95 ? "chi95-text opacity-80 text-xs sm:text-sm" : "mc-body"
                        )}>
                            {isFallout ? 'SUDCO INDUSTRIES UNIFIED OPERATING SYSTEM' : isChicago95 ? 'Configure application settings' : 'Configure game settings'}
                        </DialogDescription>
                    </div>
                </DialogHeader>
                
                <div className={cn(
                    "px-4 sm:px-6 pt-4 pb-0 shrink-0 relative",
                    isFallout ? "bg-black border-b border-[var(--fo-primary-dim)]" : isChicago95 ? "bg-[#c0c0c0] border-b border-[#808080]" : "bg-[var(--mc-bg)]"
                )}>
                    {!isFallout && !isChicago95 && <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[var(--mc-dark-border)] z-10" />}
                    <div className="flex gap-2 items-end settings-tabs-container overflow-x-auto overflow-y-hidden relative z-20 justify-start sm:justify-start w-full">
                        <TabButton id="general" label={isFallout ? "GENERAL" : "General"} icon="compass" />
                        <TabButton id="colors" label={isFallout ? "DISPLAY" : "Colors"} icon="firework_star" />
                        <TabButton id="templates" label={isFallout ? "OUTPUT" : "Templates"} icon="book" />
                        {isAdmin && <TabButton id="admin" label={isFallout ? "ADMIN" : "Admin"} icon="golden_helmet" />}
                    </div>
                </div>

                <div className={cn(
                    "p-4 sm:p-6 overflow-y-auto flex-1 min-h-0",
                    isFallout ? "bg-black scrollbar-thin scrollbar-thumb-[var(--fo-primary)] scrollbar-track-transparent" : isChicago95 ? "bg-[#c0c0c0]" : "bg-[var(--mc-bg)]"
                )}>
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             <div className={cn(
                                 "p-5 sm:p-6 space-y-5",
                                 isFallout ? "" : ""
                             )}>
                                <div className={cn(
                                    "flex items-center gap-3 border-b-2 pb-3 mb-5",
                                    isFallout ? "border-[var(--fo-primary-dim)]" : isChicago95 ? "border-[#808080]" : "border-[var(--mc-text-gray)]"
                                )}>
                                    <h3 className={isFallout ? "fo-heading text-xl sm:text-2xl border-none mb-0" : isChicago95 ? "chi95-text text-lg sm:text-xl font-bold" : "mc-heading text-xl sm:text-2xl"}>
                                        {isFallout ? 'INTERFACE SETTINGS' : isChicago95 ? 'Interface Settings' : 'Interface Settings'}
                                    </h3>
                                </div>
                                
                                <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                                    <MinecraftToggle 
                                        label="Sound Effects" 
                                        checked={settings.soundEnabled} 
                                        onChange={(c) => updateSettings({ soundEnabled: c })} 
                                        description="Play sounds when interacting with buttons"
                                    />
                                    
                                    <MinecraftToggle 
                                        label="Animations" 
                                        checked={settings.animationEnabled} 
                                        onChange={(c) => updateSettings({ animationEnabled: c })} 
                                        description="Enable smooth transitions and visual effects throughout the app"
                                    />
                                    
                                    <MinecraftToggle 
                                        label="Show Format Selector" 
                                        checked={settings.showFormat} 
                                        onChange={(c) => updateSettings({ showFormat: c })} 
                                        description="Display the template format dropdown in calculation results"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Color Settings */}
                    {activeTab === 'colors' && (
                         <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="p-5 sm:p-6 space-y-6">
                                
                                {/* Theme Mode Selector */}
                                <div className={`p-4 ${isFallout ? 'border-b-4 border-[var(--fo-primary-dim)]' : isChicago95 ? 'border-b border-[#808080]' : 'border-b-4 border-[var(--mc-dark-border)]'}`}>
                                    <Label className={`block text-center mb-3 ${isFallout ? 'fo-label' : isChicago95 ? 'chi95-label' : 'mc-label'}`}>Theme Style</Label>
                                    <div className="flex gap-4 justify-center">
                                        <Button 
                                            variant={settings.themeMode === 'minecraft' ? 'primary' : 'ghost'}
                                            onClick={() => setThemeMode('minecraft')}
                                            className="flex-1 max-w-[180px]"
                                        >
                                            Minecraft
                                        </Button>
                                        <Button 
                                            variant={settings.themeMode === 'fallout' ? 'primary' : 'ghost'}
                                            onClick={() => setThemeMode('fallout')}
                                            className="flex-1 max-w-[180px]"
                                        >
                                            Fallout
                                        </Button>
                                        <Button
                                            variant={settings.themeMode === 'chicago95' ? 'primary' : 'ghost'}
                                            onClick={() => setThemeMode('chicago95')}
                                            className="flex-1 max-w-[180px]"
                                        >
                                            Chicago95
                                        </Button>
                                    </div>
                                </div>

                                {/* Minecraft Theme Selection */}
                                {isMinecraft && (
                                    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                                        <div className="space-y-2">
                                            <Label className="mc-label block text-center mb-1">Select Theme</Label>
                                            <Select 
                                                value={settings.activeTheme}
                                                onValueChange={(val) => setTheme(val as ThemePreset)}
                                            >
                                                <SelectTrigger className="mc-button w-full h-12 justify-between px-4 text-lg sm:text-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="mc-panel border-2 border-black">
                                                    <SelectItem value="default" className="mc-body text-lg focus:bg-[var(--mc-slot-bg)] focus:text-[var(--mc-warning-text)] cursor-pointer">Default</SelectItem>
                                                    <SelectItem value="nether" className="mc-body text-lg focus:bg-[var(--mc-slot-bg)] focus:text-[var(--mc-warning-text)] cursor-pointer">Nether</SelectItem>
                                                    <SelectItem value="ocean" className="mc-body text-lg focus:bg-[var(--mc-slot-bg)] focus:text-[var(--mc-warning-text)] cursor-pointer">Ocean</SelectItem>
                                                    <SelectItem value="forest" className="mc-body text-lg focus:bg-[var(--mc-slot-bg)] focus:text-[var(--mc-warning-text)] cursor-pointer">Forest</SelectItem>
                                                    <SelectItem value="redstone" className="mc-body text-lg focus:bg-[var(--mc-slot-bg)] focus:text-[var(--mc-warning-text)] cursor-pointer">Redstone</SelectItem>
                                                    <SelectItem value="custom" className="mc-body text-lg focus:bg-[var(--mc-slot-bg)] focus:text-[var(--mc-warning-text)] cursor-pointer">Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="mt-2">
                                            <Label className="mc-label block text-center mb-2">Preview</Label>
                                            <div className="border-4 border-[var(--mc-dark-border)] p-1 bg-[var(--mc-slot-bg)]">
                                                <ThemePreview colors={settings.activeTheme === 'custom' ? currentColors : THEMES[settings.activeTheme]} />
                                            </div>
                                        </div>
                                        
                                        {settings.activeTheme !== 'custom' && (
                                            <Button 
                                                onClick={() => {
                                                    updateSettings({
                                                        customColors: THEMES[settings.activeTheme],
                                                        activeTheme: 'custom'
                                                    })
                                                }}
                                                className="w-full mt-2"
                                            >
                                                Use as Base for Custom
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Fallout Theme Selection */}
                                {isFallout && (
                                    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                                        <div className="space-y-2">
                                            <Label className="fo-label block text-center mb-1">Select Color Scheme</Label>
                                            <Select 
                                                value={settings.falloutTheme}
                                                onValueChange={(val) => setFalloutTheme(val as FalloutPreset)}
                                            >
                                                <SelectTrigger className="fo-button w-full h-12 justify-between px-4 text-lg sm:text-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="fo-panel">
                                                    <SelectItem value="green" className="fo-text text-lg cursor-pointer">Pip-Boy Green</SelectItem>
                                                    <SelectItem value="amber" className="fo-text text-lg cursor-pointer">Amber</SelectItem>
                                                    <SelectItem value="blue" className="fo-text text-lg cursor-pointer">Blue</SelectItem>
                                                    <SelectItem value="white" className="fo-text text-lg cursor-pointer">White</SelectItem>
                                                    <SelectItem value="red" className="fo-text text-lg cursor-pointer">Red</SelectItem>
                                                    <SelectItem value="pink" className="fo-text text-lg cursor-pointer">Pink</SelectItem>
                                                    <SelectItem value="yellow" className="fo-text text-lg cursor-pointer">Yellow</SelectItem>
                                                    <SelectItem value="purple" className="fo-text text-lg cursor-pointer">Purple</SelectItem>
                                                    <SelectItem value="cyan" className="fo-text text-lg cursor-pointer">Cyan</SelectItem>
                                                    <SelectItem value="custom" className="fo-text text-lg cursor-pointer">Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="mt-2">
                                            <Label className="fo-label block text-center mb-2">Preview</Label>
                                            <div className="border-2 border-[var(--fo-primary)]">
                                                <FalloutThemePreview colors={settings.falloutTheme === 'custom' ? currentFalloutColors : FALLOUT_THEMES[settings.falloutTheme]} />
                                            </div>
                                        </div>
                                        
                                        {settings.falloutTheme !== 'custom' && (
                                            <Button 
                                                onClick={() => {
                                                    updateSettings({
                                                        falloutCustomColors: FALLOUT_THEMES[settings.falloutTheme],
                                                        falloutTheme: 'custom'
                                                    })
                                                }}
                                                className="w-full mt-2"
                                            >
                                                Customize Colors
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Chicago95 Theme Selection */}
                                {isChicago95 && (
                                    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                                        <div className="space-y-2">
                                            <Label className="chi95-label block text-center mb-1">Select Style</Label>
                                            <Select
                                                value={settings.chicago95Theme}
                                                onValueChange={(val) => setChicago95Theme(val as Chicago95Preset)}
                                            >
                                                <SelectTrigger className="w-full h-10 px-2 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="chi95-panel border border-[#808080]">
                                                    <SelectItem value="default" className="chi95-text text-sm cursor-pointer">Windows 95 Default</SelectItem>
                                                    <SelectItem value="classic-blue" className="chi95-text text-sm cursor-pointer">Classic Blue</SelectItem>
                                                    <SelectItem value="olive" className="chi95-text text-sm cursor-pointer">Olive</SelectItem>
                                                    <SelectItem value="custom" className="chi95-text text-sm cursor-pointer">Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="mt-2">
                                            <Label className="chi95-label block text-center mb-2">Preview</Label>
                                            <div className="chi95-panel p-2">
                                                <div className="border border-[#808080] bg-[var(--chi95-window-bg)]">
                                                    <div className="px-2 py-1 bg-[var(--chi95-titlebar-bg)] text-[var(--chi95-titlebar-text)] text-sm font-bold">
                                                        Date Change Tool V3
                                                    </div>
                                                    <div className="p-3 text-[var(--chi95-text)] text-sm">
                                                        Chicago95 theme preview
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {settings.chicago95Theme !== 'custom' && (
                                            <Button
                                                onClick={() => {
                                                    updateSettings({
                                                        chicago95CustomColors: CHICAGO95_THEMES[settings.chicago95Theme],
                                                        chicago95Theme: 'custom'
                                                    })
                                                }}
                                                className="w-full mt-2"
                                            >
                                                Customize Colors
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Minecraft Custom Colors Editor */}
                                {isMinecraft && settings.activeTheme === 'custom' && (
                                    <div className="space-y-5 mt-4 border-t-4 border-[var(--mc-dark-border)] pt-6">
                                        <div className="flex items-center justify-center gap-3 mb-2">
                                            <ItemIcon type="cookie" scale={1.5} />
                                            <h4 className="mc-heading text-xl sm:text-2xl">Custom Colors</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-[var(--mc-slot-bg)] p-4 border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)]">
                                                <h5 className="mc-subheading text-lg sm:text-xl text-center border-b-2 border-[var(--mc-dark-border)] pb-2 mb-4">Panel & Borders</h5>
                                                <div className="space-y-3">
                                                    <ColorPicker 
                                                        label="Background" 
                                                        color={currentColors.panelBg} 
                                                        onChange={(c) => updateCustomColor('panelBg', c)}
                                                        onReset={() => updateCustomColor('panelBg', THEMES.default.panelBg)}
                                                        isModified={currentColors.panelBg !== THEMES.default.panelBg}
                                                    />
                                                    <ColorPicker 
                                                        label="Dark Border" 
                                                        color={currentColors.borderDark} 
                                                        onChange={(c) => updateCustomColor('borderDark', c)}
                                                        onReset={() => updateCustomColor('borderDark', THEMES.default.borderDark)}
                                                        isModified={currentColors.borderDark !== THEMES.default.borderDark}
                                                    />
                                                    <ColorPicker 
                                                        label="Light Border" 
                                                        color={currentColors.borderLight} 
                                                        onChange={(c) => updateCustomColor('borderLight', c)}
                                                        onReset={() => updateCustomColor('borderLight', THEMES.default.borderLight)}
                                                        isModified={currentColors.borderLight !== THEMES.default.borderLight}
                                                    />
                                                    <ColorPicker 
                                                        label="Shadow" 
                                                        color={currentColors.shadow} 
                                                        onChange={(c) => updateCustomColor('shadow', c)}
                                                        onReset={() => updateCustomColor('shadow', THEMES.default.shadow)}
                                                        isModified={currentColors.shadow !== THEMES.default.shadow}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="bg-[var(--mc-slot-bg)] p-4 border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)]">
                                                <h5 className="mc-subheading text-lg sm:text-xl text-center border-b-2 border-[var(--mc-dark-border)] pb-2 mb-4">UI Elements</h5>
                                                <div className="space-y-3">
                                                    <ColorPicker 
                                                        label="Slot Bg" 
                                                        color={currentColors.slotBg} 
                                                        onChange={(c) => updateCustomColor('slotBg', c)}
                                                        onReset={() => updateCustomColor('slotBg', THEMES.default.slotBg)}
                                                        isModified={currentColors.slotBg !== THEMES.default.slotBg}
                                                    />
                                                    <ColorPicker 
                                                        label="Button Bg" 
                                                        color={currentColors.buttonBg} 
                                                        onChange={(c) => updateCustomColor('buttonBg', c)}
                                                        onReset={() => updateCustomColor('buttonBg', THEMES.default.buttonBg)}
                                                        isModified={currentColors.buttonBg !== THEMES.default.buttonBg}
                                                    />
                                                    <ColorPicker 
                                                        label="Input Bg" 
                                                        color={currentColors.inputBg} 
                                                        onChange={(c) => updateCustomColor('inputBg', c)}
                                                        onReset={() => updateCustomColor('inputBg', THEMES.default.inputBg)}
                                                        isModified={currentColors.inputBg !== THEMES.default.inputBg}
                                                    />
                                                    <ColorPicker 
                                                        label="Accent" 
                                                        color={currentColors.accent} 
                                                        onChange={(c) => updateCustomColor('accent', c)}
                                                        onReset={() => updateCustomColor('accent', THEMES.default.accent)}
                                                        isModified={currentColors.accent !== THEMES.default.accent}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-[var(--mc-slot-bg)] p-4 border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)] md:col-span-2">
                                                <h5 className="mc-subheading text-lg sm:text-xl text-center border-b-2 border-[var(--mc-dark-border)] pb-2 mb-4">Text Colors</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <ColorPicker 
                                                        label="Text Dark" 
                                                        color={currentColors.textDark} 
                                                        onChange={(c) => updateCustomColor('textDark', c)}
                                                        onReset={() => updateCustomColor('textDark', THEMES.default.textDark)}
                                                        isModified={currentColors.textDark !== THEMES.default.textDark}
                                                    />
                                                    <ColorPicker 
                                                        label="Text Gray" 
                                                        color={currentColors.textGray} 
                                                        onChange={(c) => updateCustomColor('textGray', c)}
                                                        onReset={() => updateCustomColor('textGray', THEMES.default.textGray)}
                                                        isModified={currentColors.textGray !== THEMES.default.textGray}
                                                    />
                                                    <ColorPicker 
                                                        label="Input Text" 
                                                        color={currentColors.inputText} 
                                                        onChange={(c) => updateCustomColor('inputText', c)}
                                                        onReset={() => updateCustomColor('inputText', THEMES.default.inputText)}
                                                        isModified={currentColors.inputText !== THEMES.default.inputText}
                                                    />
                                                    <ColorPicker 
                                                        label="Text Shadow" 
                                                        color={currentColors.textShadow} 
                                                        onChange={(c) => updateCustomColor('textShadow', c)}
                                                        onReset={() => updateCustomColor('textShadow', THEMES.default.textShadow)}
                                                        isModified={currentColors.textShadow !== THEMES.default.textShadow}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Minecraft hint text */}
                                {isMinecraft && settings.activeTheme !== 'custom' && (
                                    <div className="p-4 text-center mc-small mt-4 italic">
                                        Select &quot;Custom&quot; from the dropdown above to edit individual colors
                                    </div>
                                )}

                                {/* Fallout Custom Colors Editor */}
                                {isFallout && settings.falloutTheme === 'custom' && (
                                    <div className="space-y-5 mt-4 border-t-2 border-[var(--fo-primary-dim)] pt-6">
                                        <div className="flex items-center justify-center gap-3 mb-2">
                                            <PipBoyIcon type="cog" size={24} />
                                            <h4 className="fo-heading text-xl sm:text-2xl">Custom Colors</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="fo-slot p-4">
                                                <h5 className="fo-subheading text-lg sm:text-xl text-center border-b border-[var(--fo-primary-dim)] pb-2 mb-4">Terminal Colors</h5>
                                                <div className="space-y-3">
                                                    <ColorPicker 
                                                        label="Primary" 
                                                        color={currentFalloutColors.primary} 
                                                        onChange={(c) => updateFalloutCustomColor('primary', c)}
                                                        onReset={() => updateFalloutCustomColor('primary', FALLOUT_THEMES.green.primary)}
                                                        isModified={currentFalloutColors.primary !== FALLOUT_THEMES.green.primary}
                                                    />
                                                    <ColorPicker 
                                                        label="Primary Dim" 
                                                        color={currentFalloutColors.primaryDim} 
                                                        onChange={(c) => updateFalloutCustomColor('primaryDim', c)}
                                                        onReset={() => updateFalloutCustomColor('primaryDim', FALLOUT_THEMES.green.primaryDim)}
                                                        isModified={currentFalloutColors.primaryDim !== FALLOUT_THEMES.green.primaryDim}
                                                    />
                                                    <ColorPicker 
                                                        label="Primary Glow" 
                                                        color={currentFalloutColors.primaryGlow} 
                                                        onChange={(c) => updateFalloutCustomColor('primaryGlow', c)}
                                                        onReset={() => updateFalloutCustomColor('primaryGlow', FALLOUT_THEMES.green.primaryGlow)}
                                                        isModified={currentFalloutColors.primaryGlow !== FALLOUT_THEMES.green.primaryGlow}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="fo-slot p-4">
                                                <h5 className="fo-subheading text-lg sm:text-xl text-center border-b border-[var(--fo-primary-dim)] pb-2 mb-4">Backgrounds</h5>
                                                <div className="space-y-3">
                                                    <ColorPicker 
                                                        label="Background" 
                                                        color={currentFalloutColors.bg} 
                                                        onChange={(c) => updateFalloutCustomColor('bg', c)}
                                                        onReset={() => updateFalloutCustomColor('bg', FALLOUT_THEMES.green.bg)}
                                                        isModified={currentFalloutColors.bg !== FALLOUT_THEMES.green.bg}
                                                    />
                                                    <ColorPicker 
                                                        label="Panel Bg" 
                                                        color={currentFalloutColors.panelBg} 
                                                        onChange={(c) => updateFalloutCustomColor('panelBg', c)}
                                                        onReset={() => updateFalloutCustomColor('panelBg', FALLOUT_THEMES.green.panelBg)}
                                                        isModified={currentFalloutColors.panelBg !== FALLOUT_THEMES.green.panelBg}
                                                    />
                                                </div>
                                            </div>

                                            <div className="fo-slot p-4 md:col-span-2">
                                                <h5 className="fo-subheading text-lg sm:text-xl text-center border-b border-[var(--fo-primary-dim)] pb-2 mb-4">Text & Effects</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <ColorPicker 
                                                        label="Text Primary" 
                                                        color={currentFalloutColors.textPrimary} 
                                                        onChange={(c) => updateFalloutCustomColor('textPrimary', c)}
                                                        onReset={() => updateFalloutCustomColor('textPrimary', FALLOUT_THEMES.green.textPrimary)}
                                                        isModified={currentFalloutColors.textPrimary !== FALLOUT_THEMES.green.textPrimary}
                                                    />
                                                    <ColorPicker 
                                                        label="Text Dim" 
                                                        color={currentFalloutColors.textDim} 
                                                        onChange={(c) => updateFalloutCustomColor('textDim', c)}
                                                        onReset={() => updateFalloutCustomColor('textDim', FALLOUT_THEMES.green.textDim)}
                                                        isModified={currentFalloutColors.textDim !== FALLOUT_THEMES.green.textDim}
                                                    />
                                                </div>
                                                <div className="mt-4">
                                                    <Label className="fo-label text-sm mb-2 block">Scanline Intensity: {Math.round(currentFalloutColors.scanlineOpacity * 100)}%</Label>
                                                    <input 
                                                        type="range"
                                                        min="0"
                                                        max="30"
                                                        value={currentFalloutColors.scanlineOpacity * 100}
                                                        onChange={(e) => updateFalloutCustomColor('scanlineOpacity', parseInt(e.target.value) / 100)}
                                                        className="w-full accent-[var(--fo-primary)]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            variant="destructive"
                                            onClick={resetFalloutCustomColors}
                                            className="w-full mt-4"
                                        >
                                            Reset to Default Green
                                        </Button>
                                    </div>
                                )}
                                
                                {/* Fallout hint text */}
                                {isFallout && settings.falloutTheme !== 'custom' && (
                                    <div className="p-4 text-center fo-text-dim mt-4 italic">
                                        Select &quot;Custom&quot; from the dropdown above to edit individual colors
                                    </div>
                                )}

                                {isChicago95 && settings.chicago95Theme === 'custom' && (
                                    <div className="space-y-4 mt-4 border-t border-[#808080] pt-4">
                                        <div className="flex items-center justify-center gap-3 mb-2">
                                            <ThemeIcon type="book" scale={1.25} />
                                            <h4 className="chi95-text text-lg sm:text-xl font-bold">Custom Colors</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <ColorPicker label="Desktop Bg" color={currentChicago95Colors.desktopBg} onChange={(c) => updateChicago95CustomColor('desktopBg', c)} onReset={() => updateChicago95CustomColor('desktopBg', CHICAGO95_THEMES.default.desktopBg)} isModified={currentChicago95Colors.desktopBg !== CHICAGO95_THEMES.default.desktopBg} />
                                            <ColorPicker label="Window Bg" color={currentChicago95Colors.windowBg} onChange={(c) => updateChicago95CustomColor('windowBg', c)} onReset={() => updateChicago95CustomColor('windowBg', CHICAGO95_THEMES.default.windowBg)} isModified={currentChicago95Colors.windowBg !== CHICAGO95_THEMES.default.windowBg} />
                                            <ColorPicker label="Title Bar" color={currentChicago95Colors.titleBarBg} onChange={(c) => updateChicago95CustomColor('titleBarBg', c)} onReset={() => updateChicago95CustomColor('titleBarBg', CHICAGO95_THEMES.default.titleBarBg)} isModified={currentChicago95Colors.titleBarBg !== CHICAGO95_THEMES.default.titleBarBg} />
                                            <ColorPicker label="Title Text" color={currentChicago95Colors.titleBarText} onChange={(c) => updateChicago95CustomColor('titleBarText', c)} onReset={() => updateChicago95CustomColor('titleBarText', CHICAGO95_THEMES.default.titleBarText)} isModified={currentChicago95Colors.titleBarText !== CHICAGO95_THEMES.default.titleBarText} />
                                            <ColorPicker label="Border Light" color={currentChicago95Colors.borderLight} onChange={(c) => updateChicago95CustomColor('borderLight', c)} onReset={() => updateChicago95CustomColor('borderLight', CHICAGO95_THEMES.default.borderLight)} isModified={currentChicago95Colors.borderLight !== CHICAGO95_THEMES.default.borderLight} />
                                            <ColorPicker label="Border Dark" color={currentChicago95Colors.borderDark} onChange={(c) => updateChicago95CustomColor('borderDark', c)} onReset={() => updateChicago95CustomColor('borderDark', CHICAGO95_THEMES.default.borderDark)} isModified={currentChicago95Colors.borderDark !== CHICAGO95_THEMES.default.borderDark} />
                                            <ColorPicker label="Text" color={currentChicago95Colors.text} onChange={(c) => updateChicago95CustomColor('text', c)} onReset={() => updateChicago95CustomColor('text', CHICAGO95_THEMES.default.text)} isModified={currentChicago95Colors.text !== CHICAGO95_THEMES.default.text} />
                                            <ColorPicker label="Input Bg" color={currentChicago95Colors.inputBg} onChange={(c) => updateChicago95CustomColor('inputBg', c)} onReset={() => updateChicago95CustomColor('inputBg', CHICAGO95_THEMES.default.inputBg)} isModified={currentChicago95Colors.inputBg !== CHICAGO95_THEMES.default.inputBg} />
                                        </div>
                                        <Button variant="warning" onClick={resetChicago95CustomColors} className="w-full mt-4">
                                            Reset to Default
                                        </Button>
                                    </div>
                                )}

                                {isChicago95 && settings.chicago95Theme !== 'custom' && (
                                    <div className="p-4 text-center chi95-text text-xs mt-4 italic">
                                        Select &quot;Custom&quot; from the dropdown above to edit individual colors
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Copy Templates */}
                    {activeTab === 'templates' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             <div className="p-5 sm:p-6 space-y-6">
                                 <div className={cn(
                                     "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 pb-4 mb-5",
                                     isFallout ? "border-[var(--fo-primary-dim)]" : isChicago95 ? "border-[#808080]" : "border-[var(--mc-text-gray)]"
                                 )}>
                                     <div className="flex items-center gap-3">
                                        <ThemeIcon type="book" scale={1.5} />
                                        <h3 className={isFallout ? "fo-heading text-xl sm:text-2xl" : isChicago95 ? "chi95-text text-lg sm:text-xl font-bold" : "mc-heading text-xl sm:text-2xl"}>
                                            {isFallout ? 'OUTPUT TEMPLATES' : isChicago95 ? 'Template Editor' : 'Template Editor'}
                                        </h3>
                                     </div>
                                     <Button variant={isFallout ? "destructive" : "warning"} onClick={resetTemplates} className="h-10 sm:h-12 text-base sm:text-lg">
                                        Reset All
                                     </Button>
                                 </div>
                                 
                                 <div className="space-y-4">
                                    {(Object.entries(FORMAT_LABELS) as [CopyFormat, string][]).map(([format, label]) => {
                                        const isExpanded = expandedTemplate === format
                                        const isVisible = settings.visibleFormats[format]
                                        
                                        return (
                                            <div key={format} className={cn(
                                                "transition-[background-color,border-color,box-shadow] duration-300 overflow-hidden",
                                                isFallout 
                                                    ? cn("border border-[var(--fo-primary-dim)]", isExpanded && "border-[var(--fo-primary)]")
                                                    : isChicago95
                                                        ? cn("chi95-panel border border-[#808080]", isExpanded && "bg-[#d4d0c8]")
                                                    : cn("border-2", isExpanded 
                                                        ? "bg-[var(--mc-bg)] border-[var(--mc-dark-border)] shadow-none" 
                                                        : "bg-[var(--mc-slot-bg)] border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)]")
                                            )}>
                                                {/* Header Row */}
                                                <div className="flex items-center justify-between p-3 sm:p-4 gap-4">
                                                    {/* Toggle Visibility Switch */}
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        {isFallout ? (
                                                            <span 
                                                                className="fo-text text-xl cursor-pointer select-none" 
                                                                onClick={() => handleVisibilityChange(format, !isVisible)}
                                                                title={isVisible ? "Format Enabled" : "Format Disabled"}
                                                            >
                                                                [{isVisible ? 'X' : ' '}]
                                                            </span>
                                                        ) : (
                                                            <Switch
                                                                checked={isVisible}
                                                                onCheckedChange={(checked) => handleVisibilityChange(format, checked)}
                                                                title={isVisible ? "Format Enabled" : "Format Disabled"}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Title */}
                                                    <div 
                                                        className="flex-1 flex items-center gap-3 cursor-pointer"
                                                        onClick={() => setExpandedTemplate(isExpanded ? null : format)}
                                                    >
                                                        <Label className={cn(
                                                            "text-lg sm:text-xl cursor-pointer pointer-events-none select-none",
                                                            isFallout 
                                                                ? "fo-heading" 
                                                                : cn("mc-heading", isExpanded ? "mc-text-dark" : "mc-text-white")
                                                        )}>
                                                            {label}
                                                        </Label>
                                                    </div>

                                                    {/* Edit/Expand Button */}
                                                    <Button
                                                        size="icon"
                                                        onClick={() => setExpandedTemplate(isExpanded ? null : format)}
                                                        className="h-10 w-10"
                                                        title="Edit template"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="shrink-0">
                                                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                                                        </svg>
                                                    </Button>
                                                </div>
                                                
                                                {isExpanded && isVisible && (
                                                    <div className={cn(
                                                        "p-4 sm:p-5 border-t-2 animate-in slide-in-from-top-2 duration-200",
                                                        isFallout 
                                                            ? "border-[var(--fo-primary-dim)] bg-transparent" 
                                                            : isChicago95
                                                                ? "border-[#808080] bg-[#c0c0c0]"
                                                            : "border-[var(--mc-text-gray)] bg-[var(--mc-bg)]"
                                                    )}>
                                                        <div className={cn(
                                                            "mb-4 p-4",
                                                            isFallout 
                                                                ? "border border-[var(--fo-primary-dim)]" 
                                                                : isChicago95
                                                                    ? "chi95-fieldset"
                                                                : "mc-slot border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)]"
                                                        )}>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className={cn("text-sm sm:text-base", isFallout ? "fo-heading" : isChicago95 ? "chi95-label" : "mc-heading")}>Insert Variable:</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {VARIABLES.map(v => (
                                                                    <button
                                                                        key={v.value}
                                                                        onClick={() => insertVariable(format, v.value)}
                                                                        className={isFallout 
                                                                            ? "fo-button text-sm sm:text-base px-3 py-1 h-8" 
                                                                            : isChicago95
                                                                                ? "chi95-button text-sm sm:text-base px-3 py-1 h-8"
                                                                            : "mc-button mc-button-secondary text-sm sm:text-base px-3 py-1 h-8"
                                                                        }
                                                                        title={`Insert ${v.value}`}
                                                                    >
                                                                        {v.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="mb-4">
                                                            <Label className={cn("mb-2 block", isFallout ? "fo-label" : isChicago95 ? "chi95-label" : "mc-label")}>Template Content</Label>
                                                            <textarea 
                                                                id={`template-input-${format}`}
                                                                value={settings.templates[format]}
                                                                onChange={(e) => handleTemplateChange(format, e.target.value)}
                                                                className={cn(
                                                                    "w-full min-h-[140px] text-base sm:text-lg font-mono p-4 resize-y",
                                                                    isFallout ? "fo-input !border !border-[var(--fo-primary-dim)]" : isChicago95 ? "chi95-input" : "mc-input"
                                                                )}
                                                                placeholder={`Template for ${label}...`}
                                                            />
                                                        </div>

                                                        <div className={cn(
                                                            "mb-4 p-3",
                                                            isFallout 
                                                                ? "border border-[var(--fo-primary-dim)]" 
                                                                : isChicago95
                                                                    ? "chi95-panel border border-[#808080]"
                                                                : "bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)]"
                                                        )}>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className={cn(
                                                                    "text-sm sm:text-base",
                                                                    isFallout ? "fo-heading" : isChicago95 ? "chi95-label" : "mc-heading text-[var(--mc-warning-text)] drop-shadow-md"
                                                                )}>How to use variables</span>
                                                                <p className={cn(
                                                                    "text-xs sm:text-sm leading-relaxed",
                                                                    isFallout ? "fo-small" : isChicago95 ? "chi95-text opacity-90" : "mc-small drop-shadow-md"
                                                                )}>
                                                                    Click the buttons above to insert at cursor, or type manually like <code className={cn(
                                                                        "px-1.5 py-0.5 mx-0.5 font-mono text-xs inline-block align-middle",
                                                                        isFallout ? "bg-black text-[var(--fo-primary)] border border-[var(--fo-primary-dim)]" : isChicago95 ? "bg-[#ffffff] text-black border border-[#808080]" : "bg-[#2a2a2a] text-[var(--mc-success-text)] border border-[var(--mc-dark-border)]"
                                                                    )}>{'{{'}variable_name{'}}'}</code>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex justify-end">
                                                            <Button 
                                                                variant="destructive"
                                                                onClick={() => handleResetFormat(format)}
                                                                className="h-10 px-4 text-base"
                                                            >
                                                                Reset to Default
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {isExpanded && !isVisible && (
                                                    <div className={cn(
                                                        "p-4 text-center italic border-t-2",
                                                        isFallout 
                                                            ? "fo-small border-[var(--fo-primary-dim)]" 
                                                            : isChicago95
                                                                ? "chi95-text border-[#808080]"
                                                            : "mc-small bg-[#555555] border-[#373737]"
                                                    )}>
                                                        Enable this format to edit its template
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                 </div>
                             </div>
                        </div>
                    )}

                    {/* Admin Panel (Minecraft) */}
                    {activeTab === 'admin' && isAdmin && isMinecraft && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="p-5 sm:p-6 space-y-6">
                                <div className="flex items-center gap-3 border-b-4 border-[var(--mc-dark-border)] pb-3 mb-5">
                                    <ThemeIcon type="golden_helmet" scale={1.5} />
                                    <h3 className="mc-heading text-xl sm:text-2xl">Server Administration</h3>
                                    <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)]">
                                        <div className="w-2 h-2 bg-[#55ff55] shadow-[0_0_5px_#55ff55]"></div>
                                        <span className="mc-body text-white text-sm">Online</span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <div className="bg-[var(--mc-bg)] border-2 border-[var(--mc-dark-border)] relative p-4 group hover:bg-[var(--mc-slot-bg)] transition-colors">
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-[var(--mc-dark-border)] clip-corner"></div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] flex items-center justify-center shadow-inner">
                                                <ThemeIcon type="totem" />
                                            </div>
                                            <span className="mc-heading text-lg">Players</span>
                                        </div>
                                        <div className="mc-text-yellow text-3xl font-bold ml-1">
                                            {loadingStats ? '...' : adminStats?.userCount ?? '—'}
                                        </div>
                                        <div className="mc-text-muted text-sm ml-1">Active Accounts</div>
                                    </div>

                                    <div className="bg-[var(--mc-bg)] border-2 border-[var(--mc-dark-border)] relative p-4 group hover:bg-[var(--mc-slot-bg)] transition-colors">
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-[var(--mc-dark-border)] clip-corner"></div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] flex items-center justify-center shadow-inner">
                                                <ThemeIcon type="clock" />
                                            </div>
                                            <span className="mc-heading text-lg">Attempts (7d)</span>
                                        </div>
                                        <div className="mc-text-yellow text-3xl font-bold ml-1">
                                            {loadingStats ? '...' : adminStats?.attemptCount ?? '—'}
                                        </div>
                                        <div className="mc-text-muted text-sm ml-1">Calculation clicks</div>
                                    </div>

                                    <div className="bg-[var(--mc-bg)] border-2 border-[var(--mc-dark-border)] relative p-4 group hover:bg-[var(--mc-slot-bg)] transition-colors">
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-[var(--mc-dark-border)] clip-corner"></div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] flex items-center justify-center shadow-inner">
                                                <ThemeIcon type="paper" />
                                            </div>
                                            <span className="mc-heading text-lg">Saved (7d)</span>
                                        </div>
                                        <div className="mc-text-yellow text-3xl font-bold ml-1">
                                            {loadingStats ? '...' : adminStats?.savedCalcCount ?? '—'}
                                        </div>
                                        <div className="mc-text-muted text-sm ml-1">Saved calculations</div>
                                    </div>

                                    <div className="bg-[var(--mc-bg)] border-2 border-[var(--mc-dark-border)] relative p-4 group hover:bg-[var(--mc-slot-bg)] transition-colors">
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-[var(--mc-dark-border)] clip-corner"></div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] flex items-center justify-center shadow-inner">
                                                <ThemeIcon type="cookie" />
                                            </div>
                                            <span className="mc-heading text-lg">Success (7d)</span>
                                        </div>
                                        <div className="mc-text-yellow text-3xl font-bold ml-1">
                                            {loadingStats ? '...' : successRate === null ? '—' : `${successRate}%`}
                                        </div>
                                        <div className="mc-text-muted text-sm ml-1">
                                            {loadingStats ? '...' : `${adminStats?.successfulAttemptCount ?? 0} of ${adminStats?.attemptCount ?? 0}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Info */}
                                <div className="bg-[var(--mc-slot-bg)] border-4 border-[var(--mc-dark-border)] p-4 relative">
                                    <div className="absolute -top-3 left-4 bg-[var(--mc-bg)] px-2 border-2 border-[var(--mc-dark-border)]">
                                        <span className="mc-heading text-sm">Server Info</span>
                                    </div>
                                    <div className="space-y-3 mt-2">
                                        <div className="flex justify-between items-center border-b border-[var(--mc-text-gray)] pb-1 border-dashed">
                                            <span className="mc-text-dark">Operator</span>
                                            <span className="mc-text-white font-bold">{user?.email || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[var(--mc-text-gray)] pb-1 border-dashed">
                                            <span className="mc-text-dark">Permission Level</span>
                                            <span className="mc-text-green font-bold">OP (Level 4)</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="mc-text-dark">World Status</span>
                                            <span className="mc-text-green font-bold">Running</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Open Full Admin Button */}
                                <Button 
                                    onClick={() => {
                                        onClose()
                                        router.push('/admin')
                                    }}
                                    variant="primary"
                                    className="w-full h-16 text-xl border-4 border-black shadow-[inset_4px_4px_0_0_rgba(255,255,255,0.2)] hover:brightness-110 active:brightness-90 active:translate-y-1"
                                >
                                    <ThemeIcon type="gear" className="mr-3" />
                                    Access Control Panel
                                </Button>

                                <p className="mc-small text-center text-xs opacity-70">
                                    Confidential • Authorized Operators Only
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Admin Panel (Chicago95) */}
                    {activeTab === 'admin' && isAdmin && isChicago95 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="p-5 sm:p-6 space-y-4">
                                <div className="chi95-titlebar">
                                    <span>Server Administration</span>
                                    <span>ONLINE</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="chi95-panel p-3">
                                        <div className="chi95-label text-xs">Users</div>
                                        <div className="chi95-text text-2xl font-bold">{loadingStats ? '...' : adminStats?.userCount ?? '—'}</div>
                                    </div>
                                    <div className="chi95-panel p-3">
                                        <div className="chi95-label text-xs">Attempts (7d)</div>
                                        <div className="chi95-text text-2xl font-bold">{loadingStats ? '...' : adminStats?.attemptCount ?? '—'}</div>
                                    </div>
                                    <div className="chi95-panel p-3">
                                        <div className="chi95-label text-xs">Saved (7d)</div>
                                        <div className="chi95-text text-2xl font-bold">{loadingStats ? '...' : adminStats?.savedCalcCount ?? '—'}</div>
                                    </div>
                                    <div className="chi95-panel p-3">
                                        <div className="chi95-label text-xs">Success (7d)</div>
                                        <div className="chi95-text text-2xl font-bold">{loadingStats ? '...' : successRate === null ? '—' : `${successRate}%`}</div>
                                    </div>
                                </div>

                                <div className="chi95-panel p-3">
                                    <div className="chi95-label text-xs mb-1">Operator</div>
                                    <div className="chi95-text">{user?.email || 'Unknown'}</div>
                                </div>

                                <Button
                                    onClick={() => {
                                        onClose()
                                        router.push('/admin')
                                    }}
                                    variant="primary"
                                    className="w-full h-11"
                                >
                                    Access Control Panel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Admin Panel (Fallout) */}
                    {activeTab === 'admin' && isAdmin && isFallout && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="p-5 sm:p-6 space-y-6">
                                <div className="flex items-center gap-3 border-b border-[var(--fo-primary-dim)] pb-3 mb-5">
                                    <PipBoyIcon type="cog" size={24} />
                                    <h3 className="fo-heading text-xl sm:text-2xl border-none mb-0 tracking-widest">
                                        SYSTEM DIAGNOSTICS
                                    </h3>
                                    <div className="ml-auto flex items-center gap-2 px-3 py-1 border border-[var(--fo-primary)] bg-[var(--fo-bg)] shadow-[0_0_5px_var(--fo-primary-dim)]">
                                        <div className="w-2 h-2 rounded-full bg-[var(--fo-primary)] animate-pulse shadow-[0_0_8px_var(--fo-primary)]"></div>
                                        <span className="fo-text text-sm tracking-widest font-bold">LIVE</span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <div className="p-4 border border-[var(--fo-primary-dim)] hover:border-[var(--fo-primary)] transition-colors duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <PipBoyIcon type="user" />
                                            <span className="fo-subheading text-lg tracking-widest">PERSONNEL</span>
                                        </div>
                                        <div className="fo-title text-4xl mb-1 text-right">
                                            {loadingStats ? '...' : adminStats?.userCount ?? '—'}
                                        </div>
                                        <div className="fo-small text-xs uppercase tracking-wider opacity-60 text-right">Active Units</div>
                                    </div>

                                    <div className="p-4 border border-[var(--fo-primary-dim)] hover:border-[var(--fo-primary)] transition-colors duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <PipBoyIcon type="clock" />
                                            <span className="fo-subheading text-lg tracking-widest">ATTEMPTS (7D)</span>
                                        </div>
                                        <div className="fo-title text-4xl mb-1 text-right">
                                            {loadingStats ? '...' : adminStats?.attemptCount ?? '—'}
                                        </div>
                                        <div className="fo-small text-xs uppercase tracking-wider opacity-60 text-right">Calculation clicks</div>
                                    </div>

                                    <div className="p-4 border border-[var(--fo-primary-dim)] hover:border-[var(--fo-primary)] transition-colors duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <PipBoyIcon type="terminal" />
                                            <span className="fo-subheading text-lg tracking-widest">SAVED (7D)</span>
                                        </div>
                                        <div className="fo-title text-4xl mb-1 text-right">
                                            {loadingStats ? '...' : adminStats?.savedCalcCount ?? '—'}
                                        </div>
                                        <div className="fo-small text-xs uppercase tracking-wider opacity-60 text-right">Saved calculations</div>
                                    </div>

                                    <div className="p-4 border border-[var(--fo-primary-dim)] hover:border-[var(--fo-primary)] transition-colors duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <PipBoyIcon type="check" />
                                            <span className="fo-subheading text-lg tracking-widest">SUCCESS (7D)</span>
                                        </div>
                                        <div className="fo-title text-4xl mb-1 text-right">
                                            {loadingStats ? '...' : successRate === null ? '—' : `${successRate}%`}
                                        </div>
                                        <div className="fo-small text-xs uppercase tracking-wider opacity-60 text-right">
                                            {loadingStats ? '...' : `${adminStats?.successfulAttemptCount ?? 0} OF ${adminStats?.attemptCount ?? 0}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Info */}
                                <div className="p-4 border border-[var(--fo-primary-dim)]">
                                    <h4 className="fo-heading text-lg mb-4 border-none p-0 m-0 inline-block">
                                        USER AUTHENTICATION
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                        <div className="flex justify-between items-center border-b border-[var(--fo-primary-dim)] border-dotted pb-1">
                                            <span className="fo-text-dim text-sm uppercase">Identity</span>
                                            <span className="fo-text tracking-widest">{user?.email?.split('@')[0].toUpperCase() || 'UNKNOWN'}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[var(--fo-primary-dim)] border-dotted pb-1">
                                            <span className="fo-text-dim text-sm uppercase">Clearance</span>
                                            <span className="fo-text tracking-widest">LEVEL 5 (ADMIN)</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[var(--fo-primary-dim)] border-dotted pb-1">
                                            <span className="fo-text-dim text-sm uppercase">Terminal ID</span>
                                            <span className="fo-text tracking-widest">VLT-001-A</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[var(--fo-primary-dim)] border-dotted pb-1">
                                            <span className="fo-text-dim text-sm uppercase">Connection</span>
                                            <span className="fo-text tracking-widest text-[var(--fo-primary-glow)]">SECURE</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Open Full Admin Button */}
                                <Button 
                                    onClick={() => {
                                        onClose()
                                        router.push('/admin')
                                    }}
                                    variant="ghost"
                                    className="w-full h-16 text-xl fo-button border-2 border-[var(--fo-primary)] hover:bg-[var(--fo-primary)] hover:text-black transition-all"
                                >
                                    ACCESS CONTROL PANEL
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={cn(
                    "p-4 sm:p-6 pt-4 shrink-0",
                    isFallout 
                        ? "bg-transparent border-t border-[var(--fo-primary-dim)]" 
                        : isChicago95
                            ? "bg-[#c0c0c0] border-t border-[#808080]"
                            : "bg-[var(--mc-bg)] border-t-4 border-[var(--mc-dark-border)]"
                )}>
                    <Button 
                        onClick={onClose} 
                        className={cn(
                            "w-full transition-transform font-bold",
                            isChicago95 ? "text-base h-10 sm:h-10" : "text-xl sm:text-2xl h-12 sm:h-14",
                            isFallout ? "fo-button hover:scale-[1.01]" : isChicago95 ? "chi95-button text-base h-10 sm:h-10" : "mc-button hover:scale-[1.01] active:scale-[0.99]"
                        )}
                        variant={isFallout ? "default" : "default"}
                    >
                        {isFallout ? 'EXIT CONFIG' : 'Done'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
