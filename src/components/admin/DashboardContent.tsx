"use client"

import { useTheme } from '@/context/ThemeContext'
import { MinecraftDashboard } from './MinecraftDashboard'
import { FalloutDashboard } from './FalloutDashboard'
import { DashboardData } from '@/types/dashboard'

export function DashboardContent({ data }: { data: DashboardData }) {
    const { settings } = useTheme()
    
    // Theme mode controls the dashboard shell style.
    if (settings.themeMode === 'fallout') {
        return <FalloutDashboard data={data} />
    }

    // Chicago95 currently uses the shared dashboard with Chicago-aware styling branches.
    return <MinecraftDashboard data={data} />
}
