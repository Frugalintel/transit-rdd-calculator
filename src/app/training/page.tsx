"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TrainingModule, TrainingScenario } from '@/types'
import { ThemeIcon } from '@/components/ThemeIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { PipBoyIcon } from '@/components/fallout/PipBoyIcon'

export default function TrainingPage() {
    const { settings } = useTheme()
    const [modules, setModules] = useState<TrainingModule[]>([])
    const [scenarios, setScenarios] = useState<TrainingScenario[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedComplexity, setSelectedComplexity] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [comingSoonSettings, setComingSoonSettings] = useState<{
        enabled: boolean
        minecraft_message: string
        fallout_message: string
    } | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setIsLoading(true)
            
            // Check current user and admin status
            const { data: { session } } = await supabase.auth.getSession()
            let userIsAdmin = false
            
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()
                
                userIsAdmin = profile?.role === 'admin'
                setIsAdmin(userIsAdmin)
            }

            // Load system settings
            const { data: settingsData } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'training_coming_soon')
                .single()
            
            if (settingsData?.value) {
                setComingSoonSettings(settingsData.value)
            }

            // Load published modules
            const { data: modulesData, error: modulesError } = await supabase
                .from('training_modules')
                .select('*')
                .eq('is_published', true)
                .order('display_order', { ascending: true })

            if (modulesError) throw modulesError

            setModules(modulesData?.map((m: any) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                icon: m.icon,
                displayOrder: m.display_order,
                isPublished: m.is_published,
            })) || [])

            // Load published scenarios
            const { data: scenariosData, error: scenariosError } = await supabase
                .from('training_scenarios')
                .select('*')
                .eq('is_published', true)
                .order('display_order', { ascending: true })

            if (scenariosError) throw scenariosError

            setScenarios(scenariosData?.map((s: any) => ({
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
        } catch (error: any) {
            toast.error(`Failed to load training: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    // Filter scenarios
    const filteredScenarios = useMemo(() => {
        return scenarios.filter(s => {
            const matchesSearch = !searchTerm || 
                s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
            
            const matchesComplexity = !selectedComplexity || s.complexityLevel === selectedComplexity

            return matchesSearch && matchesComplexity
        })
    }, [scenarios, searchTerm, selectedComplexity])

    // Group scenarios by module
    const scenariosByModule = useMemo(() => {
        const grouped: Record<string, TrainingScenario[]> = {}
        modules.forEach(m => {
            grouped[m.id] = filteredScenarios.filter(s => s.moduleId === m.id)
        })
        // Ungrouped scenarios
        grouped['__ungrouped__'] = filteredScenarios.filter(s => !s.moduleId)
        return grouped
    }, [modules, filteredScenarios])

    // Check if coming soon is enabled and user is not admin
    // Default to showing coming soon if settings aren't loaded (null) or if explicitly enabled
    const showComingSoon = !isAdmin && (comingSoonSettings === null || comingSoonSettings?.enabled !== false)

    if (showComingSoon) {
        const isFallout = settings.themeMode === 'fallout'

        return (
            <div className={`min-h-screen p-4 md:p-8 ${isFallout ? 'fo-scanlines' : ''}`}>
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className={`${isFallout ? 'mb-8' : 'mc-panel mb-6'}`}>
                        <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isFallout ? 'border-b-2 border-[var(--fo-primary)] pb-4' : 'p-4'}`}>
                            <div className="flex items-center gap-3">
                                {isFallout ? (
                                    <PipBoyIcon type="book" size={32} />
                                ) : (
                                    <ThemeIcon type="book" scale={2} />
                                )}
                                <div>
                                    <h1 className={`${isFallout ? 'fo-title text-3xl' : 'mc-title text-3xl'}`}>
                                        {isFallout ? 'TRAINING CENTER' : 'Training Center'}
                                    </h1>
                                    <p className={`${isFallout ? 'fo-text text-sm' : 'mc-body text-sm text-gray-400'}`}>
                                        {isFallout ? 'STATUS: OFFLINE' : 'Master the date change process'}
                                    </p>
                                </div>
                            </div>
                            <Link href="/">
                                <Button variant={isFallout ? "ghost" : "default"} className={isFallout ? "fo-button" : ""}>
                                    {isFallout ? (
                                        <span className="fo-text">[ RETURN TO CALCULATOR ]</span>
                                    ) : (
                                        <>
                                            <ThemeIcon type="compass" className="mr-2" />
                                            Back to Calculator
                                        </>
                                    )}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Coming Soon Message */}
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        {isFallout ? (
                            <div className="w-full max-w-2xl fo-panel p-8 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--fo-primary)] opacity-50"></div>
                                <div className="mb-8">
                                    <div className="inline-block border-2 border-[var(--fo-primary)] p-4 mb-4 bg-[var(--fo-bg)] relative z-10">
                                        <PipBoyIcon type="radiation" size={48} />
                                    </div>
                                    <h2 className="fo-heading text-2xl mb-4 tracking-widest">[ TRAINING MODULE STATUS ]</h2>
                                    
                                    <div className="fo-text space-y-2 mb-8 text-left max-w-md mx-auto border-l-2 border-[var(--fo-primary-dim)] pl-4">
                                        <div className="flex justify-between">
                                            <span className="fo-text-dim">SYSTEM STATUS:</span>
                                            <span className="text-red-500 font-bold blinking">OFFLINE</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="fo-text-dim">CONTENT:</span>
                                            <span>UNDER DEVELOPMENT</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="fo-text-dim">ESTIMATED AVAILABILITY:</span>
                                            <span className="text-yellow-500">PENDING</span>
                                        </div>
                                    </div>
                                    
                                    <div className="fo-text text-sm border-t border-[var(--fo-primary-dim)] pt-4 mt-4">
                                        {comingSoonSettings?.fallout_message?.split('\n').map((line, i) => (
                                            <p key={i} className="mb-2 uppercase tracking-wide">
                                                <span className="mr-2">{'>'}</span>
                                                {line}
                                            </p>
                                        )) || (
                                            <>
                                                <p className="mb-2">{'>'} SYSTEM INITIALIZATION IN PROGRESS...</p>
                                                <p>{'>'} CHECK BACK LATER FOR UPDATES</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[var(--fo-primary)] opacity-50"></div>
                            </div>
                        ) : (
                            <div className="mc-panel p-12 text-center max-w-2xl">
                                <ThemeIcon type="chest" scale={3} className="mx-auto mb-6 opacity-50" />
                                <h2 className="mc-heading text-2xl mb-4">No Training Available</h2>
                                <p className="mc-body text-gray-400 text-lg">
                                    {comingSoonSettings?.minecraft_message || 'Training modules are being prepared. Check back soon!'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="mc-panel p-8 text-center">
                    <div className="animate-pulse mc-heading text-xl">Loading training modules...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mc-panel mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4">
                        <div className="flex items-center gap-3">
                            <ThemeIcon type="book" scale={2} />
                            <div>
                                <h1 className="mc-title text-3xl">Training Center</h1>
                                <p className="mc-body text-sm text-gray-400">
                                    Master the date change process
                                </p>
                            </div>
                        </div>
                        <Link href="/">
                            <Button>
                                <ThemeIcon type="compass" className="mr-2" />
                                Back to Calculator
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mc-panel p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search scenarios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="mc-input"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={selectedComplexity === null ? 'primary' : 'default'}
                                onClick={() => setSelectedComplexity(null)}
                                size="sm"
                            >
                                All
                            </Button>
                            <Button
                                variant={selectedComplexity === 'simple' ? 'primary' : 'default'}
                                onClick={() => setSelectedComplexity('simple')}
                                size="sm"
                                className="text-green-400"
                            >
                                Simple
                            </Button>
                            <Button
                                variant={selectedComplexity === 'intermediate' ? 'primary' : 'default'}
                                onClick={() => setSelectedComplexity('intermediate')}
                                size="sm"
                                className="text-yellow-400"
                            >
                                Intermediate
                            </Button>
                            <Button
                                variant={selectedComplexity === 'complex' ? 'primary' : 'default'}
                                onClick={() => setSelectedComplexity('complex')}
                                size="sm"
                                className="text-red-400"
                            >
                                Complex
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modules and Scenarios */}
                {modules.length === 0 && scenarios.length === 0 ? (
                    <div className="mc-panel p-8 text-center">
                        <ThemeIcon type="chest" scale={2} className="mx-auto mb-4 opacity-50" />
                        <h2 className="mc-heading text-xl mb-2">No Training Available</h2>
                        <p className="mc-body text-gray-400">
                            Training modules are being prepared. Check back soon!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {modules.map(module => {
                            const moduleScenarios = scenariosByModule[module.id] || []
                            if (moduleScenarios.length === 0 && searchTerm) return null

                            return (
                                <div key={module.id} className="mc-panel">
                                    {/* Module Header */}
                                    <div className="p-4 border-b-4 border-[var(--mc-dark-border)]">
                                        <div className="flex items-center gap-3">
                                            <ThemeIcon type={module.icon} scale={1.5} />
                                            <div>
                                                <h2 className="mc-heading text-xl">{module.title}</h2>
                                                {module.description && (
                                                    <p className="mc-body text-sm text-gray-400">
                                                        {module.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scenarios Grid */}
                                    <div className="p-4">
                                        {moduleScenarios.length === 0 ? (
                                            <p className="text-center text-gray-500 py-4">
                                                No scenarios in this module yet
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {moduleScenarios.map(scenario => (
                                                    <Link
                                                        key={scenario.id}
                                                        href={`/training/${module.id}/${scenario.id}`}
                                                    >
                                                        <div className="mc-slot p-4 h-full cursor-pointer transition-all hover:scale-[1.02] hover:border-green-500 border-2 border-transparent">
                                                            <div className="flex items-start gap-3">
                                                                <ThemeIcon type={scenario.icon} />
                                                                <div className="flex-1">
                                                                    <h3 className="font-bold mb-1">{scenario.title}</h3>
                                                                    {scenario.description && (
                                                                        <p className="text-xs text-gray-400 mb-2">
                                                                            {scenario.description}
                                                                        </p>
                                                                    )}
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`text-xs px-2 py-0.5 ${
                                                                            scenario.complexityLevel === 'simple' ? 'bg-green-900 text-green-300' :
                                                                            scenario.complexityLevel === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                                                                            'bg-red-900 text-red-300'
                                                                        }`}>
                                                                            {scenario.complexityLevel}
                                                                        </span>
                                                                        {scenario.tags.slice(0, 2).map(tag => (
                                                                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300">
                                                                                {tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Ungrouped Scenarios */}
                        {scenariosByModule['__ungrouped__']?.length > 0 && (
                            <div className="mc-panel">
                                <div className="p-4 border-b-4 border-[var(--mc-dark-border)]">
                                    <h2 className="mc-heading text-xl">Quick Scenarios</h2>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {scenariosByModule['__ungrouped__'].map(scenario => (
                                            <Link
                                                key={scenario.id}
                                                href={`/training/scenario/${scenario.id}`}
                                            >
                                                <div className="mc-slot p-4 h-full cursor-pointer transition-all hover:scale-[1.02]">
                                                    <div className="flex items-start gap-3">
                                                        <ThemeIcon type={scenario.icon} />
                                                        <div className="flex-1">
                                                            <h3 className="font-bold mb-1">{scenario.title}</h3>
                                                            <span className={`text-xs px-2 py-0.5 ${
                                                                scenario.complexityLevel === 'simple' ? 'bg-green-900 text-green-300' :
                                                                scenario.complexityLevel === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                                                                'bg-red-900 text-red-300'
                                                            }`}>
                                                                {scenario.complexityLevel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
