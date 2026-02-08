"use client"

import { useState, useMemo } from 'react'
import { TrainingStep, CopyTemplateConfig } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeIcon } from '@/components/ThemeIcon'
import { Copy, CheckCircle2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'

interface CopyTemplateStepProps {
    step: TrainingStep
    onComplete: () => void
    onBack: () => void
    canGoBack: boolean
}

export function CopyTemplateStep({ step, onComplete, onBack, canGoBack }: CopyTemplateStepProps) {
    const config = step.copyTemplate
    const [hasCopied, setHasCopied] = useState(false)
    
    // Extract placeholders from template
    const placeholderKeys = useMemo(() => {
        if (!config?.template) return []
        const matches = config.template.match(/\{\{(\w+)\}\}/g) || []
        return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
    }, [config?.template])
    
    // State for placeholder values
    const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        placeholderKeys.forEach(key => {
            initial[key] = config?.placeholders?.[key] || ''
        })
        return initial
    })
    
    // Generate filled template
    const filledTemplate = useMemo(() => {
        if (!config?.template) return ''
        let result = config.template
        placeholderKeys.forEach(key => {
            const value = placeholderValues[key] || `[${key}]`
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        })
        return result
    }, [config?.template, placeholderKeys, placeholderValues])
    
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(filledTemplate)
            setHasCopied(true)
            toast.success("Template copied to clipboard!")
        } catch (err) {
            toast.error("Failed to copy")
        }
    }
    
    const updatePlaceholder = (key: string, value: string) => {
        setPlaceholderValues(prev => ({ ...prev, [key]: value }))
        setHasCopied(false) // Reset copied state when values change
    }
    
    // Check if all placeholders are filled
    const allFilled = placeholderKeys.every(key => placeholderValues[key]?.trim())
    
    return (
        <div className="w-full max-w-3xl">
            {/* Step Header */}
            <div className="mc-panel mb-4">
                <div className="flex items-center gap-3 border-b-2 border-[var(--mc-dark-border)] pb-4 mb-4">
                    <ThemeIcon type={step.icon as any} scale={1.5} />
                    <div>
                        <h2 className="mc-heading text-2xl">{step.title}</h2>
                        <p className="mc-body text-sm text-gray-400">Practice using copy templates</p>
                    </div>
                </div>
                
                <div className="mc-body mb-4">
                    {step.content}
                </div>
                
                {config?.description && (
                    <div className="mc-slot p-3 mb-4">
                        <p className="text-sm text-gray-300">{config.description}</p>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Placeholder Inputs */}
                {placeholderKeys.length > 0 && (
                    <div className="mc-panel p-4">
                        <h3 className="mc-subheading text-lg mb-4 flex items-center gap-2">
                            <Edit3 className="w-5 h-5" />
                            Fill in the Details
                        </h3>
                        
                        <div className="space-y-4">
                            {placeholderKeys.map(key => (
                                <div key={key} className="space-y-1">
                                    <Label className="mc-label capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </Label>
                                    <Input
                                        value={placeholderValues[key] || ''}
                                        onChange={(e) => updatePlaceholder(key, e.target.value)}
                                        placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
                                        className="mc-input"
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {!allFilled && (
                            <p className="text-xs text-yellow-500 mt-4">
                                Fill in all fields to complete this step
                            </p>
                        )}
                    </div>
                )}
                
                {/* Template Preview */}
                <div className="mc-panel p-4">
                    <h3 className="mc-subheading text-lg mb-4 flex items-center gap-2">
                        <ThemeIcon type="paper" />
                        Template Output
                    </h3>
                    
                    <div className="mc-slot p-4 mb-4">
                        <pre className="whitespace-pre-wrap text-sm font-mono text-white leading-relaxed">
                            {filledTemplate}
                        </pre>
                    </div>
                    
                    <Button 
                        onClick={handleCopy}
                        variant={hasCopied ? "primary" : "default"}
                        className="w-full"
                        disabled={!allFilled && placeholderKeys.length > 0}
                    >
                        {hasCopied ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy to Clipboard
                            </>
                        )}
                    </Button>
                </div>
            </div>
            
            {/* Raw Template Reference */}
            <div className="mc-panel p-4 mt-4">
                <details className="cursor-pointer">
                    <summary className="mc-subheading text-sm mb-2">
                        View Raw Template
                    </summary>
                    <div className="mc-slot p-3 mt-2">
                        <pre className="whitespace-pre-wrap text-xs font-mono text-gray-400">
                            {config?.template || 'No template defined'}
                        </pre>
                    </div>
                </details>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between mt-6">
                <Button 
                    onClick={onBack}
                    disabled={!canGoBack}
                >
                    Back
                </Button>
                <Button 
                    variant="primary"
                    onClick={onComplete}
                    disabled={!hasCopied && placeholderKeys.length > 0}
                >
                    {hasCopied ? 'Continue' : (allFilled ? 'Copy template first' : 'Fill all fields')}
                </Button>
            </div>
        </div>
    )
}
