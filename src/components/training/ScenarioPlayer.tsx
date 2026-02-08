"use client"

import { useState, useEffect, useMemo } from 'react'
import { TrainingStep, TrainingScenario, TrainingModule } from '@/types'
import { StepRenderer } from './StepRenderer'
import { SimulationStep } from './SimulationStep'
import { CopyTemplateStep } from './CopyTemplateStep'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface ScenarioPlayerProps {
    scenarioId: string
    moduleId?: string
    onComplete: () => void
    onExit: () => void
}

export function ScenarioPlayer({ scenarioId, moduleId, onComplete, onExit }: ScenarioPlayerProps) {
    const [scenario, setScenario] = useState<TrainingScenario | null>(null)
    const [module, setModule] = useState<TrainingModule | null>(null)
    const [steps, setSteps] = useState<TrainingStep[]>([])
    const [currentStepId, setCurrentStepId] = useState<string | null>(null)
    const [history, setHistory] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()
    
    const currentStep = useMemo(() => {
        return steps.find(s => s.id === currentStepId) || null
    }, [steps, currentStepId])
    
    const progress = useMemo(() => {
        if (steps.length === 0) return 0
        const currentIndex = steps.findIndex(s => s.id === currentStepId)
        return Math.round(((currentIndex + 1) / steps.length) * 100)
    }, [steps, currentStepId])
    
    useEffect(() => {
        loadScenario()
    }, [scenarioId])
    
    const loadScenario = async () => {
        try {
            setIsLoading(true)
            
            // Load scenario
            const { data: scenarioData, error: scenarioError } = await supabase
                .from('training_scenarios')
                .select('*')
                .eq('id', scenarioId)
                .single()
            
            if (scenarioError) throw scenarioError
            
            setScenario({
                id: scenarioData.id,
                moduleId: scenarioData.module_id,
                title: scenarioData.title,
                description: scenarioData.description,
                icon: scenarioData.icon,
                complexityLevel: scenarioData.complexity_level,
                tags: scenarioData.tags || [],
                displayOrder: scenarioData.display_order,
                isPublished: scenarioData.is_published,
            })
            
            // Load module if available
            if (scenarioData.module_id) {
                const { data: moduleData } = await supabase
                    .from('training_modules')
                    .select('*')
                    .eq('id', scenarioData.module_id)
                    .single()
                
                if (moduleData) {
                    setModule({
                        id: moduleData.id,
                        title: moduleData.title,
                        description: moduleData.description,
                        icon: moduleData.icon,
                        displayOrder: moduleData.display_order,
                        isPublished: moduleData.is_published,
                    })
                }
            }
            
            // Load steps for this scenario
            const { data: stepsData, error: stepsError } = await supabase
                .from('training_steps')
                .select('*')
                .eq('scenario_id', scenarioId)
                .order('display_order', { ascending: true })
            
            if (stepsError) throw stepsError
            
            const loadedSteps: TrainingStep[] = (stepsData || []).map((row: any) => ({
                id: row.id,
                title: row.title,
                content: row.content,
                type: row.type,
                icon: row.icon,
                nextStep: row.next_step || undefined,
                options: row.options || [],
                scenarioId: row.scenario_id || undefined,
                richContent: row.rich_content || undefined,
                simulationConfig: row.simulation_config || undefined,
                copyTemplate: row.copy_template || undefined,
                displayOrder: row.display_order,
            }))
            
            setSteps(loadedSteps)
            
            // Find the starting step (first step or one with no incoming connections)
            if (loadedSteps.length > 0) {
                // Find steps that are referenced by others
                const referencedIds = new Set<string>()
                loadedSteps.forEach(step => {
                    if (step.nextStep) referencedIds.add(step.nextStep)
                    step.options?.forEach(opt => {
                        if (opt.nextStep) referencedIds.add(opt.nextStep)
                    })
                })
                
                // Find root step (not referenced by anyone)
                const rootStep = loadedSteps.find(s => !referencedIds.has(s.id)) || loadedSteps[0]
                setCurrentStepId(rootStep.id)
            }
        } catch (error: any) {
            toast.error(`Failed to load scenario: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }
    
    const goToStep = (stepId: string) => {
        if (currentStepId) {
            setHistory(prev => [...prev, currentStepId])
        }
        setCurrentStepId(stepId)
    }
    
    const goBack = () => {
        if (history.length > 0) {
            const prevStep = history[history.length - 1]
            setHistory(prev => prev.slice(0, -1))
            setCurrentStepId(prevStep)
        }
    }
    
    const handleStepComplete = () => {
        if (!currentStep) return
        
        // If step has nextStep, go there
        if (currentStep.nextStep) {
            goToStep(currentStep.nextStep)
        } else if (!currentStep.options || currentStep.options.length === 0) {
            // No next step and no options - scenario complete
            toast.success("Scenario complete!")
            onComplete()
        }
    }
    
    const handleOptionSelect = (nextStepId: string) => {
        goToStep(nextStepId)
    }
    
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
                <div className="mc-panel p-8 text-center">
                    <div className="animate-pulse mc-heading text-xl">Loading scenario...</div>
                </div>
            </div>
        )
    }
    
    if (!scenario || steps.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
                <div className="mc-panel p-8 text-center">
                    <div className="mc-heading text-xl mb-4">No steps found</div>
                    <p className="mc-body mb-4">This scenario has no training steps yet.</p>
                    <Button onClick={onExit}>Exit</Button>
                </div>
            </div>
        )
    }
    
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm overflow-auto">
            {/* Header */}
            <div className="bg-[var(--mc-bg)] border-b-4 border-[var(--mc-dark-border)] p-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {module && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <ThemeIcon type={module.icon} />
                                <span>{module.title}</span>
                                <span>/</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <ThemeIcon type={scenario.icon} scale={1.2} />
                            <span className="mc-heading text-lg">{scenario.title}</span>
                        </div>
                        <div className={`px-2 py-0.5 text-xs rounded ${
                            scenario.complexityLevel === 'simple' ? 'bg-green-900 text-green-300' :
                            scenario.complexityLevel === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-red-900 text-red-300'
                        }`}>
                            {scenario.complexityLevel}
                        </div>
                    </div>
                    
                    <Button variant="destructive" onClick={onExit}>
                        <ThemeIcon type="chain" className="mr-2" />
                        Exit
                    </Button>
                </div>
                
                {/* Progress Bar */}
                <div className="max-w-5xl mx-auto mt-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-4 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)]">
                            <div 
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-sm mc-body">{progress}%</span>
                    </div>
                </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-5xl mx-auto flex flex-col items-center py-8">
                    {currentStep && (
                        <>
                            {/* Simulation Step */}
                            {currentStep.type === 'simulation' && (
                                <SimulationStep
                                    step={currentStep}
                                    onComplete={handleStepComplete}
                                    onBack={goBack}
                                    canGoBack={history.length > 0}
                                />
                            )}
                            
                            {/* Copy Template Step */}
                            {currentStep.type === 'copy_template' && (
                                <CopyTemplateStep
                                    step={currentStep}
                                    onComplete={handleStepComplete}
                                    onBack={goBack}
                                    canGoBack={history.length > 0}
                                />
                            )}
                            
                            {/* Other Step Types */}
                            {currentStep.type !== 'simulation' && currentStep.type !== 'copy_template' && (
                                <div className="w-full max-w-2xl">
                                    <div className="mc-panel">
                                        <div className="flex items-center gap-3 border-b-2 border-[var(--mc-dark-border)] pb-4 mb-4">
                                            <ThemeIcon type={currentStep.icon} scale={1.5} />
                                            <h2 className="mc-heading text-2xl">{currentStep.title}</h2>
                                        </div>
                                        
                                        <div className="mc-body mb-8 min-h-[100px]">
                                            {currentStep.content}
                                        </div>
                                        
                                        {/* Options for quiz/decision */}
                                        {currentStep.options && currentStep.options.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {currentStep.options.map((option, i) => (
                                                    <Button
                                                        key={i}
                                                        onClick={() => option.nextStep && handleOptionSelect(option.nextStep)}
                                                        className="w-full h-16 text-lg"
                                                        disabled={!option.nextStep}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex justify-between">
                                                <Button 
                                                    onClick={goBack}
                                                    disabled={history.length === 0}
                                                >
                                                    Back
                                                </Button>
                                                <Button 
                                                    variant="primary"
                                                    onClick={handleStepComplete}
                                                >
                                                    {currentStep.nextStep ? 'Next' : 'Finish'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {/* Step Indicator */}
            <div className="bg-[var(--mc-bg)] border-t-4 border-[var(--mc-dark-border)] p-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 overflow-x-auto py-2">
                        {steps.map((step, index) => {
                            const isCompleted = history.includes(step.id)
                            const isCurrent = step.id === currentStepId
                            
                            return (
                                <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                                    {index > 0 && (
                                        <div className={`w-8 h-1 ${isCompleted ? 'bg-green-500' : 'bg-[var(--mc-dark-border)]'}`} />
                                    )}
                                    <div 
                                        className={`
                                            w-10 h-10 flex items-center justify-center border-2 transition-all
                                            ${isCurrent ? 'bg-green-600 border-green-400 scale-110' : 
                                              isCompleted ? 'bg-green-900 border-green-700' : 
                                              'bg-[var(--mc-slot-bg)] border-[var(--mc-dark-border)]'}
                                        `}
                                        title={step.title}
                                    >
                                        <ThemeIcon type={step.icon} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
