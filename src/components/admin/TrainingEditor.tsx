"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { TrainingStep, StepType, TrainingModule, TrainingScenario } from '@/types'
import { ThemeIcon } from '@/components/ThemeIcon'
import { FlowEditor } from './FlowEditor'
import { NodePalette } from './NodePalette'
import { NodeInspector } from './NodeInspector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useTheme } from '@/context/ThemeContext'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

type ViewMode = 'flow' | 'list'

// Debounce helper
function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args)
        }, delay)
    }, [delay]) as T
}

export function TrainingEditor() {
    const [steps, setSteps] = useState<Record<string, TrainingStep>>({})
    const [modules, setModules] = useState<TrainingModule[]>([])
    const [scenarios, setScenarios] = useState<TrainingScenario[]>([])
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
    const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [viewMode, setViewMode] = useState<ViewMode>('flow')
    const [searchTerm, setSearchTerm] = useState('')
    const [draggedType, setDraggedType] = useState<StepType | null>(null)
    const supabase = createClient()
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    
    const selectedStep = selectedStepId ? steps[selectedStepId] : null
    
    // Filter steps by selected scenario
    const filteredSteps = useMemo(() => {
        let filtered = Object.values(steps)
        
        if (selectedScenarioId) {
            filtered = filtered.filter(s => s.scenarioId === selectedScenarioId)
        }
        
        if (searchTerm) {
            filtered = filtered.filter(step => 
                step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                step.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                step.content.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        
        return filtered
    }, [steps, selectedScenarioId, searchTerm])
    
    const stepsRecord = useMemo(() => {
        const record: Record<string, TrainingStep> = {}
        filteredSteps.forEach(step => {
            record[step.id] = step
        })
        return record
    }, [filteredSteps])
    
    // Filter scenarios by selected module
    const filteredScenarios = useMemo(() => {
        if (!selectedModuleId) return scenarios
        return scenarios.filter(s => s.moduleId === selectedModuleId)
    }, [scenarios, selectedModuleId])
    
    useEffect(() => {
        loadData()
    }, [])
    
    const loadData = async () => {
        try {
            setIsLoading(true)
            
            // Run all 3 queries in parallel
            const [modulesResult, scenariosResult, stepsResult] = await Promise.all([
                supabase.from('training_modules').select('*').order('display_order', { ascending: true }),
                supabase.from('training_scenarios').select('*').order('display_order', { ascending: true }),
                supabase.from('training_steps').select('*').order('display_order', { ascending: true }),
            ])
            
            if (modulesResult.error) throw modulesResult.error
            if (scenariosResult.error) throw scenariosResult.error
            if (stepsResult.error) throw stepsResult.error
            
            setModules(modulesResult.data?.map(m => ({
                id: m.id,
                title: m.title,
                description: m.description,
                icon: m.icon,
                displayOrder: m.display_order,
                isPublished: m.is_published,
            })) || [])
            
            setScenarios(scenariosResult.data?.map(s => ({
                id: s.id,
                moduleId: s.module_id,
                title: s.title,
                description: s.description,
                icon: s.icon,
                complexityLevel: s.complexity_level,
                tags: s.tags || [],
                displayOrder: s.display_order,
                isPublished: s.is_published,
            })) || [])
            
            const stepsMap: Record<string, TrainingStep> = {}
            stepsResult.data?.forEach(row => {
                stepsMap[row.id] = {
                    id: row.id,
                    title: row.title,
                    content: row.content,
                    type: row.type as StepType,
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
        } catch (error: any) {
            toast.error(`Failed to load data: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }
    
    const saveStep = async (step: TrainingStep) => {
        try {
            setIsSaving(true)
            const { error } = await supabase
                .from('training_steps')
                .upsert({
                    id: step.id,
                    title: step.title,
                    content: step.content,
                    type: step.type,
                    icon: step.icon,
                    next_step: step.nextStep || null,
                    options: step.options || [],
                    scenario_id: step.scenarioId || selectedScenarioId || null,
                    rich_content: step.richContent || null,
                    simulation_config: step.simulationConfig || null,
                    copy_template: step.copyTemplate || null,
                    display_order: step.displayOrder ?? Object.keys(steps).length,
                }, {
                    onConflict: 'id'
                })
            
            if (error) throw error
            
            toast.success('Step saved!')
            await loadData()
            setSelectedStepId(step.id)
        } catch (error: any) {
            toast.error(`Failed to save: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }
    
    const deleteStep = async (stepId: string) => {
        if (!confirm(`Delete step "${steps[stepId]?.title}"?`)) return
        
        try {
            const { error } = await supabase
                .from('training_steps')
                .delete()
                .eq('id', stepId)
            
            if (error) throw error
            
            toast.success('Step deleted!')
            await loadData()
            if (selectedStepId === stepId) {
                setSelectedStepId(null)
            }
        } catch (error: any) {
            toast.error(`Failed to delete: ${error.message}`)
        }
    }
    
    // Stable callback for step selection (prevents FlowEditor re-renders)
    const handleStepSelect = useCallback((stepId: string) => {
        setSelectedStepId(stepId)
    }, [])
    
    // Debounced save for connection changes
    const debouncedSaveStep = useDebouncedCallback(async (step: TrainingStep) => {
        await saveStep(step)
    }, 500)
    
    const handleStepsChange = useCallback(async (newSteps: Record<string, TrainingStep>) => {
        // Find changed steps and save them (debounced)
        for (const [id, step] of Object.entries(newSteps)) {
            if (JSON.stringify(steps[id]) !== JSON.stringify(step)) {
                debouncedSaveStep(step)
            }
        }
    }, [steps, debouncedSaveStep])
    
    const handleAddStep = useCallback((position: { x: number, y: number }) => {
        const newId = `step_${Date.now()}`
        const newStep: TrainingStep = {
            id: newId,
            title: 'New Step',
            content: 'Enter step content here...',
            type: draggedType || 'info',
            icon: 'book',
            scenarioId: selectedScenarioId || undefined,
        }
        setSteps(prev => ({ ...prev, [newId]: newStep }))
        setSelectedStepId(newId)
        setDraggedType(null)
    }, [draggedType, selectedScenarioId])
    
    const createModule = async () => {
        const title = prompt('Enter module title:')
        if (!title) return
        
        try {
            const { error } = await supabase
                .from('training_modules')
                .insert({
                    title,
                    description: '',
                    icon: 'book',
                    display_order: modules.length,
                    is_published: false,
                })
            
            if (error) throw error
            toast.success('Module created!')
            await loadData()
        } catch (error: any) {
            toast.error(`Failed to create module: ${error.message}`)
        }
    }
    
    const createScenario = async () => {
        if (!selectedModuleId) {
            toast.error('Select a module first')
            return
        }
        
        const title = prompt('Enter scenario title:')
        if (!title) return
        
        try {
            const { error } = await supabase
                .from('training_scenarios')
                .insert({
                    module_id: selectedModuleId,
                    title,
                    description: '',
                    icon: 'compass',
                    complexity_level: 'simple',
                    tags: [],
                    display_order: filteredScenarios.length,
                    is_published: false,
                })
            
            if (error) throw error
            toast.success('Scenario created!')
            await loadData()
        } catch (error: any) {
            toast.error(`Failed to create scenario: ${error.message}`)
        }
    }
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl mc-admin-text animate-pulse">Loading training data...</div>
            </div>
        )
    }
    
    return (
        <div className="space-y-4">
            <AdminPageHeader 
                title="Training Builder" 
                icon="book"
                actions={
                    <div className="flex gap-2">
                        <Button 
                            variant={viewMode === 'flow' ? (isFallout ? 'primary' : 'primary') : 'default'}
                            onClick={() => setViewMode('flow')}
                            className={isFallout && viewMode === 'flow' ? 'fo-button fo-button-primary' : (isFallout ? 'fo-button' : '')}
                        >
                            <ThemeIcon type="wheat" className="mr-2" />
                            Flow View
                        </Button>
                        <Button 
                            variant={viewMode === 'list' ? (isFallout ? 'primary' : 'primary') : 'default'}
                            onClick={() => setViewMode('list')}
                            className={isFallout && viewMode === 'list' ? 'fo-button fo-button-primary' : (isFallout ? 'fo-button' : '')}
                        >
                            <ThemeIcon type="chest" className="mr-2" />
                            List View
                        </Button>
                        <Button onClick={loadData} variant="default" className={isFallout ? 'fo-button' : ''}>
                            <ThemeIcon type="compass" className="mr-2" />
                            Refresh
                        </Button>
                    </div>
                }
            />
            
            {/* Module & Scenario Selectors */}
            <div className={`
                p-4
                ${isFallout ? 'fo-panel' : 'mc-panel'}
            `}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className={`mb-2 block ${isFallout ? 'fo-label' : 'mc-label'}`}>Module</Label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedModuleId || '__all__'}
                                onValueChange={(v) => {
                                    setSelectedModuleId(v === '__all__' ? null : v)
                                    setSelectedScenarioId(null)
                                }}
                            >
                                <SelectTrigger className={isFallout ? 'fo-input' : 'mc-input flex-1'}>
                                    <SelectValue placeholder="All Modules" />
                                </SelectTrigger>
                                <SelectContent className={isFallout ? 'fo-panel' : ''}>
                                    <SelectItem value="__all__">All Modules</SelectItem>
                                    {modules.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            <div className="flex items-center gap-2">
                                                <ThemeIcon type={m.icon} />
                                                {m.title}
                                                {!m.isPublished && <span className="text-xs text-gray-500">(draft)</span>}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={createModule} variant="default" className={isFallout ? 'fo-button' : ''}>+</Button>
                        </div>
                    </div>
                    
                    <div>
                        <Label className={`mb-2 block ${isFallout ? 'fo-label' : 'mc-label'}`}>Scenario</Label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedScenarioId || '__all__'}
                                onValueChange={(v) => setSelectedScenarioId(v === '__all__' ? null : v)}
                            >
                                <SelectTrigger className={isFallout ? 'fo-input' : 'mc-input flex-1'}>
                                    <SelectValue placeholder="All Scenarios" />
                                </SelectTrigger>
                                <SelectContent className={isFallout ? 'fo-panel' : ''}>
                                    <SelectItem value="__all__">All Scenarios</SelectItem>
                                    {filteredScenarios.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            <div className="flex items-center gap-2">
                                                <ThemeIcon type={s.icon} />
                                                {s.title}
                                                <span className={`text-xs px-1 ${
                                                    s.complexityLevel === 'simple' ? 'text-green-500' :
                                                    s.complexityLevel === 'intermediate' ? 'text-yellow-500' :
                                                    'text-red-500'
                                                }`}>
                                                    ({s.complexityLevel})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={createScenario} disabled={!selectedModuleId} variant="default" className={isFallout ? 'fo-button' : ''}>+</Button>
                        </div>
                    </div>
                    
                    <div>
                        <Label className={`mb-2 block ${isFallout ? 'fo-label' : 'mc-label'}`}>Search Steps</Label>
                        <Input 
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={isFallout ? 'fo-input' : 'mc-input'}
                        />
                    </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-500">
                    Showing {filteredSteps.length} step{filteredSteps.length !== 1 ? 's' : ''}
                    {selectedScenarioId && ` in "${scenarios.find(s => s.id === selectedScenarioId)?.title}"`}
                    {selectedModuleId && !selectedScenarioId && ` in "${modules.find(m => m.id === selectedModuleId)?.title}"`}
                </div>
            </div>
            
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left Sidebar - Node Palette */}
                <div className="lg:col-span-1">
                    <NodePalette onDragStart={setDraggedType} />
                </div>
                
                {/* Center - Flow/List View */}
                <div className="lg:col-span-2">
                    {viewMode === 'flow' ? (
                        <div className={isFallout ? 'fo-panel' : 'mc-panel'} style={{ height: '700px' }}>
                            <FlowEditor
                                steps={stepsRecord}
                                selectedStepId={selectedStepId}
                                onStepSelect={handleStepSelect}
                                onStepsChange={handleStepsChange}
                                onAddStep={handleAddStep}
                            />
                        </div>
                    ) : (
                        <div className={`p-4 ${isFallout ? 'fo-panel' : 'mc-panel'}`}>
                            <h3 className={`text-lg mb-4 ${isFallout ? 'fo-heading' : 'mc-heading'}`}>All Steps</h3>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {filteredSteps.map(step => (
                                    <div
                                        key={step.id}
                                        onClick={() => setSelectedStepId(step.id)}
                                        className={`
                                            p-3 cursor-pointer border-2 transition-colors
                                            ${selectedStepId === step.id 
                                                ? (isFallout 
                                                    ? 'bg-[var(--fo-primary-dim)] border-[var(--fo-primary)] text-black' 
                                                    : 'bg-[var(--mc-slot-bg)] border-[var(--mc-accent)]') 
                                                : (isFallout 
                                                    ? 'bg-transparent border-[var(--fo-primary-dim)] hover:border-[var(--fo-primary)]' 
                                                    : 'bg-[var(--mc-bg)] border-[var(--mc-dark-border)] hover:bg-[var(--mc-light-border)]')}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ThemeIcon type={step.icon} />
                                            <div className="flex-1">
                                                <div className="font-bold">{step.title}</div>
                                                <div className={isFallout ? 'text-xs opacity-70' : 'text-xs text-gray-500'}>
                                                    {step.id} • {step.type}
                                                    {step.nextStep && ` → ${step.nextStep}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredSteps.length === 0 && (
                                    <div className="text-center text-gray-500 py-8">
                                        No steps found. Create one to get started!
                                    </div>
                                )}
                            </div>
                    </div>
                    )}
                </div>
                
                {/* Right Sidebar - Inspector */}
                <div className="lg:col-span-1">
                    <NodeInspector
                        step={selectedStep}
                        allSteps={steps}
                        onSave={saveStep}
                        onDelete={deleteStep}
                        onNew={() => setSelectedStepId(null)}
                        isSaving={isSaving}
                    />
                </div>
            </div>
        </div>
    )
}
