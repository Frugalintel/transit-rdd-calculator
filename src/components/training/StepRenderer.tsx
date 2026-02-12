import { TrainingStep } from '@/config/trainingSteps'
import { TrainingStep as TrainingStepType } from '@/types'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'
import { useTraining } from './TrainingContext'
import { SimulationStep } from './SimulationStep'
import { CopyTemplateStep } from './CopyTemplateStep'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface StepRendererProps {
    step: TrainingStep | TrainingStepType
    onComplete?: () => void
    onBack?: () => void
    canGoBack?: boolean
}

export function StepRenderer({ step, onComplete, onBack, canGoBack }: StepRendererProps) {
    const training = useTraining()
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'
    const { nextStep, prevStep, history } = training

    // Handle simulation step
    if (step.type === 'simulation') {
        return (
            <SimulationStep
                step={step as TrainingStepType}
                onComplete={onComplete || (() => step.nextStep && nextStep(step.nextStep))}
                onBack={onBack || prevStep}
                canGoBack={canGoBack ?? history.length > 0}
            />
        )
    }

    // Handle copy template step
    if (step.type === 'copy_template') {
        return (
            <CopyTemplateStep
                step={step as TrainingStepType}
                onComplete={onComplete || (() => step.nextStep && nextStep(step.nextStep))}
                onBack={onBack || prevStep}
                canGoBack={canGoBack ?? history.length > 0}
            />
        )
    }

    // Default rendering for info, input, quiz, decision
    return (
        <div className={cn("w-full max-w-2xl", isFallout ? "fo-panel" : isChicago95 ? "chi95-window p-4" : "mc-panel")}>
            <div className={cn("flex justify-between items-center pb-4 mb-4", isFallout ? "border-b border-[var(--fo-primary-dim)]" : isChicago95 ? "border-b border-[#808080]" : "border-b-2 border-[var(--mc-dark-border)]")}>
                <h2 className={cn("text-2xl flex items-center gap-2", isFallout ? "fo-heading border-none mb-0" : isChicago95 ? "chi95-text text-xl font-bold" : "mc-heading")}>
                    <ThemeIcon type={step.icon} scale={1.5} />
                    {step.title}
                </h2>
                <div className={isFallout ? "fo-small" : isChicago95 ? "chi95-text text-xs" : "mc-small"}>Step ID: {step.id}</div>
            </div>

            <div className={cn("mb-8 min-h-[100px]", isFallout ? "fo-text" : isChicago95 ? "chi95-text" : "mc-body")}>
                {step.content}
            </div>

            <div className="space-y-4">
                {step.options && step.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {step.options.map((option, i) => (
                            <Button
                                key={i}
                                onClick={() => nextStep(option.nextStep)}
                                className="w-full h-16 text-lg"
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-between mt-8">
                        <Button 
                            onClick={onBack || prevStep} 
                            disabled={canGoBack === false || (canGoBack === undefined && history.length === 0)}
                        >
                            Back
                        </Button>
                        {step.nextStep ? (
                             <Button 
                                variant="primary"
                                onClick={onComplete || (() => nextStep(step.nextStep!))} 
                            >
                                Next
                            </Button>
                        ) : (
                            <Button 
                                variant="primary"
                                onClick={onComplete || (() => window.location.reload())}
                            >
                                Finish
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

