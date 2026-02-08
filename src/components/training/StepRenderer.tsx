import { TrainingStep } from '@/config/trainingSteps'
import { TrainingStep as TrainingStepType } from '@/types'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'
import { useTraining } from './TrainingContext'
import { SimulationStep } from './SimulationStep'
import { CopyTemplateStep } from './CopyTemplateStep'

interface StepRendererProps {
    step: TrainingStep | TrainingStepType
    onComplete?: () => void
    onBack?: () => void
    canGoBack?: boolean
}

export function StepRenderer({ step, onComplete, onBack, canGoBack }: StepRendererProps) {
    const training = useTraining()
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
        <div className="mc-panel w-full max-w-2xl">
            <div className="flex justify-between items-center border-b-2 border-[var(--mc-dark-border)] pb-4 mb-4">
                <h2 className="mc-heading text-2xl flex items-center gap-2">
                    <ThemeIcon type={step.icon} scale={1.5} />
                    {step.title}
                </h2>
                <div className="mc-small">Step ID: {step.id}</div>
            </div>

            <div className="mc-body mb-8 min-h-[100px]">
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

