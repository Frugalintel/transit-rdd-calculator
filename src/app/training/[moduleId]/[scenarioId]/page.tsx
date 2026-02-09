"use client"

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ScenarioPlayer } from '@/components/training/ScenarioPlayer'
import { TrainingAccessCheck } from '@/components/training/TrainingAccessCheck'

interface ScenarioPageProps {
    params: Promise<{ moduleId: string; scenarioId: string }>
}

export default function ScenarioPage({ params }: ScenarioPageProps) {
    const { moduleId, scenarioId } = use(params)
    const router = useRouter()

    const handleComplete = () => {
        // Go back to module page
        router.push(`/training/${moduleId}`)
    }

    const handleExit = () => {
        router.push(`/training/${moduleId}`)
    }

    return (
        <TrainingAccessCheck>
            <ScenarioPlayer
                scenarioId={scenarioId}
                moduleId={moduleId}
                onComplete={handleComplete}
                onExit={handleExit}
            />
        </TrainingAccessCheck>
    )
}
