"use client"

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ScenarioPlayer } from '@/components/training/ScenarioPlayer'
import { TrainingAccessCheck } from '@/components/training/TrainingAccessCheck'

interface ScenarioPageProps {
    params: Promise<{ scenarioId: string }>
}

export default function StandaloneScenarioPage({ params }: ScenarioPageProps) {
    const { scenarioId } = use(params)
    const router = useRouter()

    const handleComplete = () => {
        router.push('/training')
    }

    const handleExit = () => {
        router.push('/training')
    }

    return (
        <TrainingAccessCheck>
            <ScenarioPlayer
                scenarioId={scenarioId}
                onComplete={handleComplete}
                onExit={handleExit}
            />
        </TrainingAccessCheck>
    )
}
