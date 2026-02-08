"use client"
import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react'
import { TRAINING_STEPS, TrainingStep } from '@/config/trainingSteps'
import { TrainingStep as TrainingStepType, TrainingModule, TrainingScenario } from '@/types'
import { createClient } from '@/utils/supabase/client'

interface TrainingContextType {
    isOpen: boolean
    currentStepId: string
    currentStep: TrainingStep
    history: string[]
    steps: Record<string, TrainingStep>
    modules: TrainingModule[]
    scenarios: TrainingScenario[]
    selectedModuleId: string | null
    selectedScenarioId: string | null
    isLoading: boolean
    openTraining: () => void
    closeTraining: () => void
    nextStep: (stepId: string) => void
    prevStep: () => void
    selectModule: (moduleId: string | null) => void
    selectScenario: (scenarioId: string | null) => void
    startScenario: (scenarioId: string) => void
    loadFromDatabase: () => Promise<void>
}

const TrainingContext = createContext<TrainingContextType | null>(null)

export function TrainingProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentStepId, setCurrentStepId] = useState('start')
    const [history, setHistory] = useState<string[]>([])
    const [steps, setSteps] = useState<Record<string, TrainingStep>>(TRAINING_STEPS)
    const [modules, setModules] = useState<TrainingModule[]>([])
    const [scenarios, setScenarios] = useState<TrainingScenario[]>([])
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
    const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const currentStep = steps[currentStepId] || TRAINING_STEPS['start']

    const loadFromDatabase = useCallback(async () => {
        try {
            setIsLoading(true)
            
            // Run all 3 queries in parallel with a 3s timeout
            const timeout = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Training load timeout')), 3000)
            )
            
            const [modulesResult, scenariosResult, stepsResult] = await Promise.race([
                Promise.all([
                    supabase.from('training_modules').select('*').eq('is_published', true).order('display_order', { ascending: true }),
                    supabase.from('training_scenarios').select('*').eq('is_published', true).order('display_order', { ascending: true }),
                    supabase.from('training_steps').select('*').order('display_order', { ascending: true }),
                ]),
                timeout.then(() => { throw new Error('timeout') }) as never,
            ])
            
            if (modulesResult.data) {
                setModules(modulesResult.data.map(m => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    icon: m.icon,
                    displayOrder: m.display_order,
                    isPublished: m.is_published,
                })))
            }
            
            if (scenariosResult.data) {
                setScenarios(scenariosResult.data.map(s => ({
                    id: s.id,
                    moduleId: s.module_id,
                    title: s.title,
                    description: s.description,
                    icon: s.icon,
                    complexityLevel: s.complexity_level,
                    tags: s.tags || [],
                    displayOrder: s.display_order,
                    isPublished: s.is_published,
                })))
            }
            
            if (stepsResult.data) {
                const stepsMap: Record<string, TrainingStep> = { ...TRAINING_STEPS }
                stepsResult.data.forEach(row => {
                    stepsMap[row.id] = {
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
                    }
                })
                setSteps(stepsMap)
            }
        } catch (error) {
            // Silently fall back to hardcoded steps — don't block the app
            console.warn('Training data load failed, using fallback:', error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    // Load data on mount — non-blocking, deferred so it doesn't block initial render
    useEffect(() => {
        const timer = setTimeout(() => loadFromDatabase(), 100)
        return () => clearTimeout(timer)
    }, [loadFromDatabase])

    const openTraining = () => {
        setIsOpen(true)
        setCurrentStepId('start')
        setHistory([])
        setSelectedModuleId(null)
        setSelectedScenarioId(null)
    }

    const closeTraining = () => {
        setIsOpen(false)
        setSelectedModuleId(null)
        setSelectedScenarioId(null)
    }

    const nextStep = (stepId: string) => {
        if (steps[stepId]) {
            setHistory(prev => [...prev, currentStepId])
            setCurrentStepId(stepId)
        }
    }

    const prevStep = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1]
            setHistory(h => h.slice(0, -1))
            setCurrentStepId(prev)
        }
    }

    const selectModule = (moduleId: string | null) => {
        setSelectedModuleId(moduleId)
        setSelectedScenarioId(null)
    }

    const selectScenario = (scenarioId: string | null) => {
        setSelectedScenarioId(scenarioId)
    }

    const startScenario = (scenarioId: string) => {
        setSelectedScenarioId(scenarioId)
        // Find first step in scenario
        const scenarioSteps = Object.values(steps).filter(s => s.scenarioId === scenarioId)
        if (scenarioSteps.length > 0) {
            // Find root step (not referenced by others)
            const referencedIds = new Set<string>()
            scenarioSteps.forEach(step => {
                if (step.nextStep) referencedIds.add(step.nextStep)
                step.options?.forEach(opt => {
                    if (opt.nextStep) referencedIds.add(opt.nextStep)
                })
            })
            const rootStep = scenarioSteps.find(s => !referencedIds.has(s.id)) || scenarioSteps[0]
            setCurrentStepId(rootStep.id)
            setHistory([])
        }
    }

    return (
        <TrainingContext.Provider value={{ 
            isOpen, 
            currentStepId, 
            currentStep, 
            history,
            steps,
            modules,
            scenarios,
            selectedModuleId,
            selectedScenarioId,
            isLoading,
            openTraining, 
            closeTraining, 
            nextStep, 
            prevStep,
            selectModule,
            selectScenario,
            startScenario,
            loadFromDatabase,
        }}>
            {children}
        </TrainingContext.Provider>
    )
}

export const useTraining = () => {
    const ctx = useContext(TrainingContext)
    if (!ctx) throw new Error("useTraining must be used within TrainingProvider")
    return ctx
}

