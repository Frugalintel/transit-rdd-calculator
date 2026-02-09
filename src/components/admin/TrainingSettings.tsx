"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ThemeIcon } from '@/components/ThemeIcon'
import { PipBoyIcon } from '@/components/fallout/PipBoyIcon'

interface TrainingSettingsProps {
    onUpdate?: () => void
}

export function TrainingSettings({ onUpdate }: TrainingSettingsProps) {
    const [enabled, setEnabled] = useState(true)
    const [minecraftMessage, setMinecraftMessage] = useState('')
    const [falloutMessage, setFalloutMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'training_coming_soon')
                .single()

            if (error && error.code !== 'PGRST116') throw error

            if (data?.value) {
                setEnabled(data.value.enabled)
                setMinecraftMessage(data.value.minecraft_message || '')
                setFalloutMessage(data.value.fallout_message || '')
            } else {
                // Defaults
                setMinecraftMessage('Training modules are being prepared. Check back soon!')
                setFalloutMessage('TRAINING MODULE STATUS: OFFLINE\nCONTENT UNDER DEVELOPMENT\nCHECK BACK LATER FOR UPDATES')
            }
        } catch (error: any) {
            toast.error(`Failed to load settings: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            
            const value = {
                enabled,
                minecraft_message: minecraftMessage,
                fallout_message: falloutMessage
            }

            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'training_coming_soon',
                    value,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            toast.success('Settings saved successfully')
            onUpdate?.()
        } catch (error: any) {
            toast.error(`Failed to save settings: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-4">Loading settings...</div>
    }

    return (
        <div className="space-y-6">
            <div className="mc-panel p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="mc-heading text-lg">Coming Soon Mode</h3>
                        <p className="mc-body text-sm text-gray-400">
                            When enabled, regular users will see the "Coming Soon" message instead of training content.
                            Admins always bypass this screen.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="coming-soon-mode" className="mc-label cursor-pointer">
                            {enabled ? 'ENABLED' : 'DISABLED'}
                        </Label>
                        <Switch
                            id="coming-soon-mode"
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Minecraft Message Editor */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ThemeIcon type="chest" scale={1} />
                            <Label className="mc-label">Minecraft Message</Label>
                        </div>
                        <Textarea
                            value={minecraftMessage}
                            onChange={(e) => setMinecraftMessage(e.target.value)}
                            className="mc-input min-h-[120px] font-sans"
                            placeholder="Enter message for Minecraft theme..."
                        />
                        <div className="mc-panel p-4 bg-[var(--mc-slot-bg)] text-center">
                            <h4 className="mc-heading text-sm mb-2 opacity-70">Preview</h4>
                            <div className="mc-body text-gray-200 text-sm">
                                {minecraftMessage || 'No message set'}
                            </div>
                        </div>
                    </div>

                    {/* Fallout Message Editor */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <PipBoyIcon type="terminal" size={20} />
                            <Label className="mc-label">Fallout Message</Label>
                        </div>
                        <Textarea
                            value={falloutMessage}
                            onChange={(e) => setFalloutMessage(e.target.value)}
                            className="mc-input min-h-[120px] font-mono text-xs"
                            placeholder="Enter message for Fallout theme..."
                        />
                        <div className="fo-panel p-4 bg-black text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--fo-primary)] opacity-50"></div>
                            <h4 className="fo-heading text-xs mb-2 opacity-70 text-[var(--fo-primary)]">PREVIEW</h4>
                            <div className="fo-text text-[var(--fo-primary)] text-xs text-left font-mono">
                                {falloutMessage.split('\n').map((line, i) => (
                                    <div key={i}>{'>'} {line}</div>
                                )) || '> NO MESSAGE SET'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="mc-button"
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
