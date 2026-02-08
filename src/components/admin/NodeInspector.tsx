"use client"

import { useState, useEffect } from 'react'
import { TrainingStep, StepType, RichContent, SimulationConfig, CopyTemplateConfig } from '@/types'
import { ThemeIcon } from '@/components/ThemeIcon'
import { ItemType } from '@/components/minecraft/ItemIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme } from '@/context/ThemeContext'

const STEP_TYPES: StepType[] = ['info', 'input', 'quiz', 'decision', 'simulation', 'copy_template']
const ITEM_TYPES: ItemType[] = [
    'clock', 'compass', 'feather', 'paper', 'chest', 'book', 'sign',
    'firework', 'firework_star', 'redstone_dust', 'snowball', 'pumpkin_pie',
    'banner', 'pickaxe', 'iron_pickaxe', 'bell', 'totem', 'cookie',
    'poppy', 'chain', 'golden_helmet', 'cooked_chicken', 'cake',
    'torch', 'wheat', 'arrow_right', 'arrow_down'
]

interface NodeInspectorProps {
    step: TrainingStep | null
    allSteps: Record<string, TrainingStep>
    onSave: (step: TrainingStep) => void
    onDelete: (stepId: string) => void
    onNew: () => void
    isSaving: boolean
}

export function NodeInspector({ step, allSteps, onSave, onDelete, onNew, isSaving }: NodeInspectorProps) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const [formData, setFormData] = useState<Partial<TrainingStep>>({
        id: '',
        title: '',
        content: '',
        type: 'info',
        icon: 'book',
        nextStep: undefined,
        options: [],
        simulationConfig: undefined,
        copyTemplate: undefined,
    })
    
    useEffect(() => {
        if (step) {
            setFormData({
                id: step.id,
                title: step.title,
                content: step.content,
                type: step.type,
                icon: step.icon,
                nextStep: step.nextStep,
                options: step.options || [],
                simulationConfig: step.simulationConfig,
                copyTemplate: step.copyTemplate,
            })
        }
    }, [step])
    
    const handleSave = () => {
        if (!formData.id || !formData.title || !formData.content) {
            return
        }
        onSave(formData as TrainingStep)
    }
    
    const addOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...(prev.options || []), { label: '', nextStep: '', isCorrect: false }]
        }))
    }
    
    const updateOption = (index: number, field: string, value: any) => {
        setFormData(prev => {
            const newOptions = [...(prev.options || [])]
            newOptions[index] = { ...newOptions[index], [field]: value }
            return { ...prev, options: newOptions }
        })
    }
    
    const removeOption = (index: number) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options?.filter((_, i) => i !== index) || []
        }))
    }
    
    const resetForm = () => {
        setFormData({
            id: '',
            title: '',
            content: '',
            type: 'info',
            icon: 'book',
            nextStep: undefined,
            options: [],
            simulationConfig: undefined,
            copyTemplate: undefined,
        })
        onNew()
    }
    
    const panelClass = isFallout ? 'fo-panel' : 'mc-panel'
    const headingClass = isFallout ? 'fo-heading' : 'mc-heading'
    const labelClass = isFallout ? 'fo-label' : 'mc-label'
    const inputClass = isFallout ? 'fo-input' : 'mc-input'
    const borderClass = isFallout ? 'border-[var(--fo-primary-dim)]' : 'border-[var(--mc-dark-border)]'
    const slotClass = isFallout ? 'fo-slot' : 'mc-slot'

    return (
        <div className={`${panelClass} p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto`}>
            <div className={`flex items-center justify-between border-b-2 ${borderClass} pb-3`}>
                <h3 className={`${headingClass} text-lg flex items-center gap-2`}>
                    <ThemeIcon type="sign" />
                    {step ? 'Edit Step' : 'New Step'}
                </h3>
                <Button size="sm" onClick={resetForm} variant="default" className={isFallout ? "fo-button" : ""}>
                    <ThemeIcon type="paper" className="mr-1" />
                    New
                </Button>
            </div>
            
            <div className="space-y-4">
                {/* Basic Info */}
                <div>
                    <Label className={labelClass}>Step ID *</Label>
                    <Input
                        value={formData.id || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                        placeholder="e.g., check_spread"
                        disabled={!!step}
                        className={inputClass}
                    />
                    {step && (
                        <p className={`text-xs mt-1 ${isFallout ? 'text-[var(--fo-primary-dim)]' : 'text-gray-500'}`}>ID cannot be changed</p>
                    )}
                </div>
                
                <div>
                    <Label className={labelClass}>Title *</Label>
                    <Input
                        value={formData.title || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Step title"
                        className={inputClass}
                    />
                </div>
                
                <div>
                    <Label className={labelClass}>Content *</Label>
                    <Textarea
                        value={formData.content || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Step content/instructions"
                        rows={4}
                        className={inputClass}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className={labelClass}>Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as StepType }))}
                        >
                            <SelectTrigger className={inputClass}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={isFallout ? 'fo-panel' : ''}>
                                {STEP_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type === 'copy_template' ? 'Template' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div>
                        <Label className={labelClass}>Icon</Label>
                        <Select
                            value={formData.icon}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value as ItemType }))}
                        >
                            <SelectTrigger className={inputClass}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={isFallout ? 'fo-panel' : ''}>
                                {ITEM_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>
                                        <div className="flex items-center gap-2">
                                            <ThemeIcon type={type} />
                                            {type}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {/* Next Step (for linear flow) */}
                {formData.type !== 'quiz' && formData.type !== 'decision' && (
                    <div>
                        <Label className={labelClass}>Next Step</Label>
                        <Select
                            value={formData.nextStep || '__none__'}
                            onValueChange={(value) => setFormData(prev => ({ 
                                ...prev, 
                                nextStep: value === '__none__' ? undefined : value 
                            }))}
                        >
                            <SelectTrigger className={inputClass}>
                                <SelectValue placeholder="Select next step..." />
                            </SelectTrigger>
                            <SelectContent className={isFallout ? 'fo-panel' : ''}>
                                <SelectItem value="__none__">None (End)</SelectItem>
                                {Object.keys(allSteps)
                                    .filter(id => id !== formData.id)
                                    .map(stepId => (
                                        <SelectItem key={stepId} value={stepId}>
                                            {allSteps[stepId].title}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                {/* Options for quiz/decision types */}
                {(formData.type === 'quiz' || formData.type === 'decision') && (
                    <div className={`border-t-2 ${borderClass} pt-4`}>
                        <div className="flex items-center justify-between mb-3">
                            <Label className={labelClass}>Options / Branches</Label>
                            <Button size="sm" variant={isFallout ? 'default' : 'primary'} onClick={addOption} className={isFallout ? 'fo-button' : ''}>
                                + Add
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.options?.map((option, index) => (
                                <div key={index} className={`p-3 ${slotClass} space-y-2`}>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Option label"
                                            value={option.label}
                                            onChange={(e) => updateOption(index, 'label', e.target.value)}
                                            className={`flex-1 ${inputClass}`}
                                        />
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => removeOption(index)}
                                            className={isFallout ? 'fo-button-destructive' : ''}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                    <Select
                                        value={option.nextStep || '__none__'}
                                        onValueChange={(value) => updateOption(index, 'nextStep', value === '__none__' ? '' : value)}
                                    >
                                        <SelectTrigger className={inputClass}>
                                            <SelectValue placeholder="Goes to..." />
                                        </SelectTrigger>
                                        <SelectContent className={isFallout ? 'fo-panel' : ''}>
                                            <SelectItem value="__none__">None</SelectItem>
                                            {Object.keys(allSteps)
                                                .filter(id => id !== formData.id)
                                                .map(stepId => (
                                                    <SelectItem key={stepId} value={stepId}>
                                                        {allSteps[stepId].title}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {formData.type === 'quiz' && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={option.isCorrect || false}
                                                onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">Correct Answer</span>
                                        </label>
                                    )}
                                </div>
                            ))}
                            {(!formData.options || formData.options.length === 0) && (
                                <p className={`text-sm text-center py-2 ${isFallout ? 'text-[var(--fo-primary-dim)]' : 'text-gray-500'}`}>
                                    No options yet. Add at least one.
                                </p>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Simulation Config */}
                {formData.type === 'simulation' && (
                    <div className={`border-t-2 ${borderClass} pt-4`}>
                        <Label className={`${labelClass} mb-3 block`}>Simulation Settings</Label>
                        <div className={`space-y-3 ${slotClass} p-3`}>
                            <div>
                                <Label className={`text-xs ${isFallout ? 'text-[var(--fo-primary-dim)]' : 'text-gray-400'}`}>Pre-filled Weight</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 5000"
                                    value={formData.simulationConfig?.prefilledData?.weight || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        simulationConfig: {
                                            ...prev.simulationConfig,
                                            prefilledData: {
                                                ...prev.simulationConfig?.prefilledData,
                                                weight: e.target.value ? Number(e.target.value) : undefined
                                            }
                                        }
                                    }))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <Label className={`text-xs ${isFallout ? 'text-[var(--fo-primary-dim)]' : 'text-gray-400'}`}>Pre-filled Distance</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 1200"
                                    value={formData.simulationConfig?.prefilledData?.distance || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        simulationConfig: {
                                            ...prev.simulationConfig,
                                            prefilledData: {
                                                ...prev.simulationConfig?.prefilledData,
                                                distance: e.target.value ? Number(e.target.value) : undefined
                                            }
                                        }
                                    }))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <Label className={`text-xs ${isFallout ? 'text-[var(--fo-primary-dim)]' : 'text-gray-400'}`}>Hints (one per line)</Label>
                                <Textarea
                                    placeholder="Enter hints for the user..."
                                    value={formData.simulationConfig?.hints?.join('\n') || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        simulationConfig: {
                                            ...prev.simulationConfig,
                                            prefilledData: prev.simulationConfig?.prefilledData || {},
                                            hints: e.target.value.split('\n').filter(h => h.trim())
                                        }
                                    }))}
                                    rows={3}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Copy Template Config */}
                {formData.type === 'copy_template' && (
                    <div className={`border-t-2 ${borderClass} pt-4`}>
                        <Label className={`${labelClass} mb-3 block`}>Template Settings</Label>
                        <div className={`space-y-3 ${slotClass} p-3`}>
                            <div>
                                <Label className={`text-xs ${isFallout ? 'text-[var(--fo-primary-dim)]' : 'text-gray-400'}`}>Template Text</Label>
                                <Textarea
                                    placeholder="Use {{placeholder}} for dynamic values..."
                                    value={formData.copyTemplate?.template || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        copyTemplate: {
                                            ...prev.copyTemplate,
                                            template: e.target.value,
                                            placeholders: prev.copyTemplate?.placeholders || {}
                                        }
                                    }))}
                                    rows={5}
                                    className={`${inputClass} font-mono text-sm`}
                                />
                            </div>
                            <div>
                                <Label className={`text-xs ${isFallout ? 'text-[var(--fo-primary-dim)]' : 'text-gray-400'}`}>Description</Label>
                                <Input
                                    placeholder="Explain when to use this template"
                                    value={formData.copyTemplate?.description || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        copyTemplate: {
                                            ...prev.copyTemplate,
                                            template: prev.copyTemplate?.template || '',
                                            placeholders: prev.copyTemplate?.placeholders || {},
                                            description: e.target.value
                                        }
                                    }))}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Action Buttons */}
                <div className={`flex gap-2 pt-4 border-t-2 ${borderClass}`}>
                    <Button 
                        variant="primary"
                        onClick={handleSave} 
                        disabled={isSaving || !formData.id || !formData.title}
                        className={`flex-1 ${isFallout ? 'fo-button' : ''}`}
                    >
                        {isSaving ? 'Saving...' : 'Save Step'}
                    </Button>
                    {step && (
                        <Button 
                            variant="destructive"
                            onClick={() => onDelete(step.id)}
                            className={isFallout ? 'fo-button-destructive' : ''}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
