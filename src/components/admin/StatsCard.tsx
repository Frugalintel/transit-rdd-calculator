"use client"

import { ThemeIcon } from '@/components/ThemeIcon'
import { useTheme } from '@/context/ThemeContext'

interface StatsCardProps {
    title: string
    value: string | number
    icon: string
    description?: string
    trend?: string
}

export function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
    const isPositiveTrend = trend?.startsWith('+')
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'
    
    return (
        <div className={isFallout ? "fo-panel p-5" : isChicago95 ? "chi95-window p-4" : "mc-panel p-5"}>
            <div className="flex justify-between items-start mb-4">
                <div className={isFallout ? "border border-[var(--fo-primary-dim)] p-3" : isChicago95 ? "chi95-panel p-2" : "mc-slot-dark p-3"}>
                    <ThemeIcon type={icon} scale={1.5} />
                </div>
                {trend && (
                    <span className={`
                        h-8 px-3 text-base font-bold leading-none
                        ${isPositiveTrend 
                            ? (isFallout ? 'fo-button fo-button-primary' : isChicago95 ? 'chi95-button chi95-button-primary' : 'mc-button mc-button-primary')
                            : (isFallout ? 'fo-button fo-button-destructive' : isChicago95 ? 'chi95-button chi95-button-destructive' : 'mc-button mc-button-destructive')
                        }
                    `}>
                        {trend}
                    </span>
                )}
            </div>
            <h3 className={isFallout ? "fo-heading text-2xl mb-2 border-none" : isChicago95 ? "chi95-text text-lg font-bold mb-1" : "mc-admin-heading text-2xl mb-2"}>{title}</h3>
            <div className={isFallout ? "fo-title text-5xl" : isChicago95 ? "chi95-text text-4xl font-bold" : "mc-admin-value text-5xl"}>{value}</div>
            {description && (
                <p className={isFallout ? "fo-text-dim mt-2 text-sm" : isChicago95 ? "chi95-text mt-2 text-xs opacity-80" : "mc-text-muted mt-3 text-lg"}>{description}</p>
            )}
        </div>
    )
}
