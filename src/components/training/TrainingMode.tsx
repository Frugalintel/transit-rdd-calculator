"use client"
import { useRouter } from 'next/navigation'
import { useTraining } from './TrainingContext'
import { StepRenderer } from './StepRenderer'
import { FlowChart } from './FlowChart'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'

export function TrainingMode() {
    const router = useRouter()
    const { 
        isOpen, 
        closeTraining, 
        currentStep, 
        currentStepId, 
        history, 
        steps,
        modules,
        scenarios,
        isLoading 
    } = useTraining()

    if (!isOpen) return null

    // If we have modules/scenarios, redirect to training page
    const hasModularContent = modules.length > 0 || scenarios.length > 0

    const handleGoToTrainingCenter = () => {
        closeTraining()
        router.push('/training')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute top-4 right-4 z-50">
                <Button variant="destructive" onClick={closeTraining}>
                    <ThemeIcon type="chain" className="mr-2" />
                    Exit Training
                </Button>
            </div>

            <div className="w-full max-w-4xl p-4 flex flex-col items-center gap-6">
                {isLoading ? (
                    <div className="mc-panel p-8 text-center">
                        <div className="animate-pulse mc-heading text-xl">Loading training...</div>
                    </div>
                ) : hasModularContent ? (
                    // Show option to go to training center
                    <div className="mc-panel p-8 text-center max-w-lg">
                        <ThemeIcon type="book" scale={2} className="mx-auto mb-4" />
                        <h2 className="mc-heading text-2xl mb-4">Training Center Available</h2>
                        <p className="mc-body mb-6 text-gray-300">
                            We have structured training modules and scenarios available. 
                            Would you like to explore them?
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button variant="primary" onClick={handleGoToTrainingCenter}>
                                <ThemeIcon type="compass" className="mr-2" />
                                Go to Training Center
                            </Button>
                            <Button onClick={closeTraining}>
                                Maybe Later
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Fallback to legacy training mode
                    <>
                        {currentStep ? (
                            <>
                <StepRenderer step={currentStep} />
                                <FlowChart 
                                    currentStepId={currentStepId} 
                                    history={history}
                                    steps={steps}
                                />
                            </>
                        ) : (
                            <div className="mc-panel p-8 text-center">
                                <ThemeIcon type="chest" scale={2} className="mx-auto mb-4 opacity-50" />
                                <h2 className="mc-heading text-xl mb-2">No Training Steps</h2>
                                <p className="mc-body text-gray-400 mb-4">
                                    Training content is being prepared.
                                </p>
                                <Button onClick={closeTraining}>Close</Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

