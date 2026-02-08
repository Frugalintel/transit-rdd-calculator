"use client"

import { useState, useEffect } from 'react'
import { TrainingStep, SimulationConfig } from '@/types'
import { useTransitData } from '@/hooks/useTransitData'
import { useCalculator, CalculationResult } from '@/hooks/useCalculator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { ThemeIcon } from '@/components/ThemeIcon'
import { FurnaceArrow } from '@/components/minecraft/FurnaceArrow'
import { Scale, MapPin, Lightbulb, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SimulationStepProps {
    step: TrainingStep
    onComplete: () => void
    onBack: () => void
    canGoBack: boolean
}

export function SimulationStep({ step, onComplete, onBack, canGoBack }: SimulationStepProps) {
    const { data, loading } = useTransitData()
    const { calculate } = useCalculator(data)
    const config = step.simulationConfig
    
    // Form state - prefill from config
    const [packDate, setPackDate] = useState<Date | undefined>(() => {
        if (config?.prefilledData?.packDate) {
            return new Date(config.prefilledData.packDate)
        }
        return undefined
    })
    const [loadDate, setLoadDate] = useState<Date | undefined>(() => {
        if (config?.prefilledData?.pickupDate) {
            return new Date(config.prefilledData.pickupDate)
        }
        return undefined
    })
    const [weight, setWeight] = useState(config?.prefilledData?.weight?.toString() || '')
    const [distance, setDistance] = useState(config?.prefilledData?.distance?.toString() || '')
    
    const [result, setResult] = useState<CalculationResult | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showHints, setShowHints] = useState(false)
    const [hasCalculated, setHasCalculated] = useState(false)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    
    // Determine which fields are required (not prefilled)
    const requiredFields = config?.requiredFields || []
    const isWeightPrefilled = config?.prefilledData?.weight !== undefined
    const isDistancePrefilled = config?.prefilledData?.distance !== undefined
    const isPackDatePrefilled = config?.prefilledData?.packDate !== undefined
    const isPickupDatePrefilled = config?.prefilledData?.pickupDate !== undefined
    
    const handleCalculate = () => {
        if (!packDate) {
            toast.error("Pack date required!")
            return
        }
        if (!loadDate) {
            toast.error("Pickup date required!")
            return
        }
        
        const weightNum = parseFloat(weight)
        const distNum = parseFloat(distance)
        if (isNaN(weightNum) || isNaN(distNum)) {
            toast.error("Invalid weight or distance!")
            return
        }
        
        setIsProcessing(true)
        
        setTimeout(() => {
            const res = calculate(weightNum, distNum, loadDate)
            setResult(res)
            setHasCalculated(true)
            
            // Check if result matches expected output
            if (config?.expectedOutput && res && !res.error) {
                const matches = res.rddDisplay === config.expectedOutput
                setIsCorrect(matches)
                if (matches) {
                    toast.success("Correct! Great job!")
                } else {
                    toast.error(`Expected RDD: ${config.expectedOutput}`)
                }
            } else {
                setIsCorrect(true) // No expected output, just accept
            }
            
            setTimeout(() => setIsProcessing(false), 50)
        }, 300)
    }
    
    const handleReset = () => {
        // Reset non-prefilled fields
        if (!isPackDatePrefilled) setPackDate(undefined)
        if (!isPickupDatePrefilled) setLoadDate(undefined)
        if (!isWeightPrefilled) setWeight('')
        if (!isDistancePrefilled) setDistance('')
        setResult(null)
        setHasCalculated(false)
        setIsCorrect(null)
    }
    
    return (
        <div className="w-full max-w-4xl">
            {/* Step Header */}
            <div className="mc-panel mb-4">
                <div className="flex items-center gap-3 border-b-2 border-[var(--mc-dark-border)] pb-4 mb-4">
                    <ThemeIcon type={step.icon as any} scale={1.5} />
                    <div>
                        <h2 className="mc-heading text-2xl">{step.title}</h2>
                        <p className="mc-body text-sm text-gray-400">Practice using the calculator</p>
                    </div>
                </div>
                
                <div className="mc-body mb-4">
                    {step.content}
                </div>
                
                {/* Hints Section */}
                {config?.hints && config.hints.length > 0 && (
                    <div className="mb-4">
                        <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => setShowHints(!showHints)}
                            className="mb-2"
                        >
                            <Lightbulb className="w-4 h-4 mr-2" />
                            {showHints ? 'Hide Hints' : 'Show Hints'}
                        </Button>
                        
                        {showHints && (
                            <div className="mc-slot p-3 space-y-2 animate-in fade-in duration-200">
                                {config.hints.map((hint, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="text-yellow-400">→</span>
                                        <span>{hint}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Simulator */}
            <div className="mc-panel p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                    {/* Input Section */}
                    <div className="flex-1">
                        <div className="mc-slot p-4 space-y-4 h-full">
                            <div className="mc-subheading border-b-2 border-[var(--mc-text-gray)] pb-2 mb-3">
                                Shipment Data
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="mc-label">Pack Date *</Label>
                                    <DatePicker 
                                        date={packDate}
                                        setDate={setPackDate}
                                        label="Select..."
                                        disabled={isPackDatePrefilled}
                                    />
                                    {isPackDatePrefilled && (
                                        <p className="text-xs text-green-500">Pre-filled</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="mc-label">Pickup Date *</Label>
                                    <DatePicker 
                                        date={loadDate}
                                        setDate={setLoadDate}
                                        label="Select..."
                                        disabled={isPickupDatePrefilled}
                                    />
                                    {isPickupDatePrefilled && (
                                        <p className="text-xs text-green-500">Pre-filled</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="mc-label">Weight (lbs)</Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            min="1" 
                                            placeholder="..."
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            disabled={isWeightPrefilled}
                                            className="pr-10"
                                        />
                                        <Scale className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    </div>
                                    {isWeightPrefilled && (
                                        <p className="text-xs text-green-500">Pre-filled</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="mc-label">Distance (miles)</Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            min="1" 
                                            placeholder="..."
                                            value={distance}
                                            onChange={(e) => setDistance(e.target.value)}
                                            disabled={isDistancePrefilled}
                                            className="pr-10"
                                        />
                                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    </div>
                                    {isDistancePrefilled && (
                                        <p className="text-xs text-green-500">Pre-filled</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                                <Button 
                                    onClick={handleCalculate}
                                    disabled={loading || !loadDate || !packDate}
                                    className="flex-1"
                                >
                                    {loading ? 'Loading...' : 'Calculate'}
                                </Button>
                                <Button onClick={handleReset} variant="destructive">
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex items-center justify-center py-2 lg:py-0 lg:px-4">
                        <div className="rotate-90 lg:rotate-0">
                            <FurnaceArrow isProcessing={isProcessing} />
                        </div>
                    </div>
                    
                    {/* Results */}
                    <div className="w-full lg:w-72">
                        <div className="mc-slot p-4 h-full flex flex-col">
                            <div className="mc-subheading border-b-2 border-[var(--mc-text-gray)] pb-2 mb-3 flex items-center gap-2">
                                Result
                                {isCorrect === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                {isCorrect === false && <XCircle className="w-5 h-5 text-red-500" />}
                            </div>
                            
                            {result ? (
                                <div className="space-y-3 animate-in fade-in duration-300">
                                    <div className="mc-achievement py-4 flex-col items-center text-center">
                                        <div className="text-xl mc-text-yellow mb-1">RDD</div>
                                        <div className="mc-text-white text-2xl">{result.rddDisplay}</div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-2 py-1 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)]">
                                            <span className="text-sm">Transit</span>
                                            <span className="text-sm">{result.transitDays} days</span>
                                        </div>
                                        <div className="flex justify-between items-center px-2 py-1 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)]">
                                            <span className="text-sm">Season</span>
                                            <span className={`text-sm ${result.seasonStatus === 'Peak Season' ? 'text-red-400' : 'text-green-400'}`}>
                                                {result.seasonStatus === 'Peak Season' ? 'Peak' : 'Off-Peak'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {config?.expectedOutput && (
                                        <div className={`p-2 text-center text-sm ${isCorrect ? 'bg-green-900/50 border-green-500' : 'bg-red-900/50 border-red-500'} border-2`}>
                                            Expected: {config.expectedOutput}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                                    <div className="w-12 h-12 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] mb-3"></div>
                                    <div className="text-sm">Enter data and calculate</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
                    disabled={!hasCalculated}
                >
                    {hasCalculated ? 'Continue' : 'Complete calculation first'}
                </Button>
            </div>
        </div>
    )
}
