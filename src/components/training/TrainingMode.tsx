"use client"
import { useRouter } from 'next/navigation'
import { useTraining } from './TrainingContext'
import { StepRenderer } from './StepRenderer'
import { FlowChart } from './FlowChart'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'
import { useTheme } from '@/context/ThemeContext'
import { PipBoyIcon } from '@/components/fallout/PipBoyIcon'

export function TrainingMode() {
    const router = useRouter()
    const { settings } = useTheme()
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

    const isFallout = settings.themeMode === 'fallout'
    
    // If we have modules/scenarios, redirect to training page
    const hasModularContent = modules.length > 0 || scenarios.length > 0

    const handleGoToTrainingCenter = () => {
        closeTraining()
        router.push('/training')
    }

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300 ${isFallout ? 'fo-scanlines' : ''}`}>
            <div className="absolute top-4 right-4 z-50">
                <Button variant="destructive" onClick={closeTraining} className={isFallout ? "fo-button fo-button-destructive" : ""}>
                    {isFallout ? (
                        <><PipBoyIcon type="x" size={16} className="mr-2" /> EXIT TRAINING</>
                    ) : (
                        <><ThemeIcon type="chain" className="mr-2" /> Exit Training</>
                    )}
                </Button>
            </div>

            <div className="w-full max-w-4xl p-4 sm:p-6 md:p-8 flex flex-col items-center gap-6">
                {isLoading ? (
                    <div className={isFallout ? "fo-panel p-8 text-center w-full max-w-lg" : "mc-panel p-8 text-center"}>
                        <div className={`animate-pulse ${isFallout ? 'fo-heading text-xl' : 'mc-heading text-xl'}`}>
                            {isFallout ? 'LOADING TRAINING...' : 'Loading training...'}
                        </div>
                    </div>
                ) : hasModularContent ? (
                    // Show option to go to training center
                    isFallout ? (
                        // Fallout themed modal
                        <div className="fo-panel p-6 sm:p-8 md:p-10 text-center w-full max-w-2xl relative overflow-hidden">
                            {/* Top accent bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--fo-primary)] opacity-70"></div>
                            
                            {/* Corner decorations */}
                            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[var(--fo-primary)] opacity-50"></div>
                            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[var(--fo-primary)] opacity-50"></div>
                            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[var(--fo-primary)] opacity-50"></div>
                            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[var(--fo-primary)] opacity-50"></div>
                            
                            {/* Content */}
                            <div className="relative z-10">
                                <div className="inline-block border-2 border-[var(--fo-primary)] p-3 mb-6 bg-[var(--fo-bg)]">
                                    <PipBoyIcon type="book" size={48} />
                                </div>
                                
                                <h2 className="fo-heading text-2xl sm:text-3xl mb-6 tracking-widest">
                                    [ TRAINING CENTER AVAILABLE ]
                                </h2>
                                
                                <div className="fo-text text-base sm:text-lg mb-8 leading-relaxed px-2 sm:px-4">
                                    <p className="mb-4">
                                        {'>'} WE HAVE STRUCTURED TRAINING MODULES AND SCENARIOS AVAILABLE.
                                    </p>
                                    <p className="fo-text-dim">
                                        {'>'} WOULD YOU LIKE TO EXPLORE THEM?
                                    </p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8">
                                    <Button 
                                        variant="ghost" 
                                        onClick={handleGoToTrainingCenter}
                                        className="fo-button fo-button-primary text-base sm:text-lg px-6 py-3 h-auto min-h-0"
                                    >
                                        <PipBoyIcon type="arrow-right" size={16} className="mr-2" />
                                        [ GO TO TRAINING CENTER ]
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        onClick={closeTraining}
                                        className="fo-button fo-button-ghost text-base sm:text-lg px-6 py-3 h-auto min-h-0"
                                    >
                                        [ MAYBE LATER ]
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Minecraft themed modal
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
                    )
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
                            <div className={isFallout ? "fo-panel p-8 text-center w-full max-w-lg" : "mc-panel p-8 text-center"}>
                                {isFallout ? (
                                    <PipBoyIcon type="radiation" size={48} className="mx-auto mb-4 opacity-50" />
                                ) : (
                                    <ThemeIcon type="chest" scale={2} className="mx-auto mb-4 opacity-50" />
                                )}
                                <h2 className={`${isFallout ? 'fo-heading text-xl' : 'mc-heading text-xl'} mb-2`}>
                                    {isFallout ? '[ NO TRAINING STEPS ]' : 'No Training Steps'}
                                </h2>
                                <p className={`${isFallout ? 'fo-text-dim' : 'mc-body text-gray-400'} mb-4`}>
                                    {isFallout ? '> TRAINING CONTENT IS BEING PREPARED.' : 'Training content is being prepared.'}
                                </p>
                                <Button onClick={closeTraining} variant={isFallout ? "ghost" : "default"} className={isFallout ? "fo-button" : ""}>
                                    {isFallout ? '[ CLOSE ]' : 'Close'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

