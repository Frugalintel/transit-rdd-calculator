"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { TrainingModule, TrainingScenario } from '@/types'
import { ThemeIcon } from '@/components/ThemeIcon'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { TrainingAccessCheck } from '@/components/training/TrainingAccessCheck'

interface ModulePageProps {
    params: Promise<{ moduleId: string }>
}

export default function ModulePage({ params }: ModulePageProps) {
    const { moduleId } = use(params)
    const [module, setModule] = useState<TrainingModule | null>(null)
    const [scenarios, setScenarios] = useState<TrainingScenario[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        loadModule()
    }, [moduleId])

    const loadModule = async () => {
        try {
            setIsLoading(true)

            // Load module
            const { data: moduleData, error: moduleError } = await supabase
                .from('training_modules')
                .select('*')
                .eq('id', moduleId)
                .single()

            if (moduleError) throw moduleError

            setModule({
                id: moduleData.id,
                title: moduleData.title,
                description: moduleData.description,
                icon: moduleData.icon,
                displayOrder: moduleData.display_order,
                isPublished: moduleData.is_published,
            })

            // Load scenarios for this module
            const { data: scenariosData, error: scenariosError } = await supabase
                .from('training_scenarios')
                .select('*')
                .eq('module_id', moduleId)
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
            toast.error(`Failed to load module: ${error.message}`)
            router.push('/training')
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="mc-panel p-8 text-center">
                    <div className="animate-pulse mc-heading text-xl">Loading module...</div>
                </div>
            </div>
        )
    }

    if (!module) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="mc-panel p-8 text-center">
                    <h2 className="mc-heading text-xl mb-4">Module Not Found</h2>
                    <Link href="/training">
                        <Button>Back to Training</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <TrainingAccessCheck>
            <div className="min-h-screen p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                        <Link href="/training" className="hover:text-white">Training</Link>
                        <span>/</span>
                        <span className="text-white">{module.title}</span>
                    </div>

                    {/* Module Header */}
                    <div className="mc-panel mb-6">
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <ThemeIcon type={module.icon} scale={2} />
                            <div>
                                <h1 className="mc-title text-3xl">{module.title}</h1>
                                {module.description && (
                                    <p className="mc-body text-gray-400 mt-2">
                                        {module.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                {/* Scenarios List */}
                <div className="mc-panel">
                    <div className="p-4 border-b-4 border-[var(--mc-dark-border)]">
                        <h2 className="mc-heading text-xl">Select a Scenario</h2>
                    </div>

                    {scenarios.length === 0 ? (
                        <div className="p-8 text-center">
                            <ThemeIcon type="chest" scale={2} className="mx-auto mb-4 opacity-50" />
                            <p className="text-gray-400">No scenarios available in this module yet.</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {scenarios.map((scenario, index) => (
                                <Link
                                    key={scenario.id}
                                    href={`/training/${moduleId}/${scenario.id}`}
                                >
                                    <div className="mc-slot p-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-green-500 border-2 border-transparent flex items-center gap-4">
                                        <div className="w-8 h-8 flex items-center justify-center bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)]">
                                            <span className="mc-body text-lg">{index + 1}</span>
                                        </div>
                                        <ThemeIcon type={scenario.icon} scale={1.2} />
                                        <div className="flex-1">
                                            <h3 className="font-bold">{scenario.title}</h3>
                                            {scenario.description && (
                                                <p className="text-sm text-gray-400">{scenario.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 ${
                                                scenario.complexityLevel === 'simple' ? 'bg-green-900 text-green-300' :
                                                scenario.complexityLevel === 'intermediate' ? 'bg-yellow-900 text-yellow-300' :
                                                'bg-red-900 text-red-300'
                                            }`}>
                                                {scenario.complexityLevel}
                                            </span>
                                            <ThemeIcon type="arrow_right" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Back Button */}
                <div className="mt-6">
                    <Link href="/training">
                        <Button>
                            <ThemeIcon type="arrow_down" className="mr-2 rotate-90" />
                            Back to Training Center
                        </Button>
                    </Link>
                </div>
            </div>
        </TrainingAccessCheck>
    )
}
