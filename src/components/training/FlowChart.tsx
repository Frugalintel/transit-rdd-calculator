import { TRAINING_STEPS, TrainingStep } from '@/config/trainingSteps'
import { ThemeIcon } from '@/components/ThemeIcon'

interface FlowChartProps {
    currentStepId: string
    history: string[]
    steps?: Record<string, TrainingStep>
}

export function FlowChart({ currentStepId, history, steps }: FlowChartProps) {
    // Use provided steps or fall back to default
    const stepsMap = steps || TRAINING_STEPS
    
    // Determine the path to display
    // For now, we'll just show the linear path or a simple visualization of history + current
    const stepsToShow = [...history, currentStepId]

    return (
        <div className="flex items-center gap-2 overflow-x-auto p-4 bg-[var(--mc-input-bg)] border-2 border-[var(--mc-dark-border)]">
            {stepsToShow.map((stepId, index) => {
                const step = stepsMap[stepId]
                if (!step) return null
                
                const isCurrent = stepId === currentStepId
                
                return (
                    <div key={`${stepId}-${index}`} className="flex items-center gap-2 flex-shrink-0">
                        {index > 0 && (
                            <div className="w-8 h-1 bg-[var(--mc-dark-border)]"></div>
                        )}
                        <div 
                            className={`
                                w-12 h-12 flex items-center justify-center border-2 
                                ${isCurrent ? 'bg-[var(--mc-success-text)] border-[var(--mc-success-shadow)]' : 'bg-[var(--mc-button-bg)] border-[var(--mc-dark-border)]'}
                            `}
                            title={step.title}
                        >
                            <ThemeIcon type={step.icon} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

