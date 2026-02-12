"use client"

import { StepType } from '@/types'
import { ThemeIcon } from '@/components/ThemeIcon'
import { useTheme } from '@/context/ThemeContext'
import { getTypeColor, getEditorTheme } from '@/utils/trainingTheme'

interface NodePaletteProps {
    onDragStart: (type: StepType) => void
}

const STEP_TYPES: Array<{ type: StepType; icon: string; description: string }> = [
    { type: 'info',          icon: 'book',          description: 'Display information to the user' },
    { type: 'input',         icon: 'sign',          description: 'Collect text input from user' },
    { type: 'quiz',          icon: 'redstone_dust',  description: 'Multiple choice with correct answers' },
    { type: 'decision',      icon: 'compass',       description: 'Branch based on user choice' },
    { type: 'simulation',    icon: 'iron_pickaxe',  description: 'Practice with calculator' },
    { type: 'copy_template', icon: 'paper',         description: 'Copy-paste output format' },
]

export function NodePalette({ onDragStart }: NodePaletteProps) {
    const { settings } = useTheme()
    const theme = getEditorTheme(settings.themeMode)

    return (
        <div className="mc-panel p-4">
            <h3 className="mc-heading text-lg mb-4 flex items-center gap-2">
                <ThemeIcon type="chest" />
                Step Types
            </h3>
            <div className="space-y-2">
                {STEP_TYPES.map((config) => {
                    const colors = getTypeColor(config.type, settings.themeMode)
                    return (
                        <div
                            key={config.type}
                            draggable
                            onDragStart={() => onDragStart(config.type)}
                            className="p-3 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02]"
                            style={{
                                backgroundColor: colors.bg,
                                border: `${theme.nodeBorderWidth} solid ${colors.border}`,
                                boxShadow: theme.bevelShadow,
                                fontFamily: theme.font,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <ThemeIcon type={config.icon} />
                                <div>
                                    <div 
                                        className="font-bold"
                                        style={{ color: theme.textColor, textShadow: theme.textShadow }}
                                    >
                                        {colors.label}
                                    </div>
                                    <div 
                                        className="text-xs"
                                        style={{ color: theme.textDim, textShadow: theme.textShadow !== 'none' ? '1px 1px 0 #000' : 'none' }}
                                    >
                                        {config.description}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 p-3 mc-slot">
                <p className="text-xs" style={{ color: theme.textDim }}>
                    Drag a step type onto the canvas to create a new step, or double-click the canvas.
                </p>
            </div>
        </div>
    )
}
