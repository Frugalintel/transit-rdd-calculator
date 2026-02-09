"use client"

import { useState } from 'react'
import { TrainingEditor } from '@/components/admin/TrainingEditor'
import { TrainingSettings } from '@/components/admin/TrainingSettings'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'
import { PipBoyIcon } from '@/components/fallout/PipBoyIcon'
import { useTheme } from '@/context/ThemeContext'

export default function TrainingPage() {
    const [view, setView] = useState<'editor' | 'settings'>('editor')
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className={isFallout ? "fo-title text-2xl" : "mc-title text-2xl"}>
                    Training Management
                </h1>
                <div className="flex gap-2">
                    <Button 
                        variant={view === 'editor' ? 'primary' : 'default'}
                        onClick={() => setView('editor')}
                        className={isFallout ? "fo-button" : ""}
                    >
                        {isFallout ? (
                            <PipBoyIcon type="book" size={16} className="mr-2" />
                        ) : (
                            <ThemeIcon type="book" className="mr-2" />
                        )}
                        Editor
                    </Button>
                    <Button 
                        variant={view === 'settings' ? 'primary' : 'default'}
                        onClick={() => setView('settings')}
                        className={isFallout ? "fo-button" : ""}
                    >
                        {isFallout ? (
                            <PipBoyIcon type="cog" size={16} className="mr-2" />
                        ) : (
                            <ThemeIcon type="gear" className="mr-2" />
                        )}
                        Settings
                    </Button>
                </div>
            </div>

            {view === 'editor' ? (
                <TrainingEditor />
            ) : (
                <TrainingSettings />
            )}
        </div>
    )
}

