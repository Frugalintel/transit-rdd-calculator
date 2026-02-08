"use client"

import { useTheme } from '@/context/ThemeContext'
import { MinecraftDashboard } from './MinecraftDashboard'
import { FalloutDashboard } from './FalloutDashboard'
import { DashboardData } from '@/types/dashboard'

export function DashboardContent({ data }: { data: DashboardData }) {
    const { settings } = useTheme()
    
    // Check if fallout theme is active (any of the fallout presets)
    // The themeMode is what determines the overall style (minecraft vs fallout)
    if (settings.themeMode === 'fallout') {
        return <FalloutDashboard data={data} />
    }

    return <MinecraftDashboard data={data} />
}
