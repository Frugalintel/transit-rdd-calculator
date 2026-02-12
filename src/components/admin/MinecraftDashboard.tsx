"use client"

import { useMemo, useState } from 'react'
import { StatsCard } from '@/components/admin/StatsCard'
import { ThemeIcon } from '@/components/ThemeIcon'
import { MinecraftBarChart } from '@/components/minecraft/MinecraftBarChart'
import { DashboardData } from '@/types/dashboard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { CalculationDrilldown } from '@/components/admin/CalculationDrilldown'
import { AdminActivityDrilldown } from '@/components/admin/AdminActivityDrilldown'
import { formatEasternDateTime, getEasternHour } from '@/utils/timezone'
import { useTheme } from '@/context/ThemeContext'

interface DrillSelection {
    bucketLabel: string
    view: string
    startIso: string
    endIso: string
    hourStart?: number
    hourEnd?: number
    calculationId?: string
}

export function MinecraftDashboard({ data }: { data: DashboardData }) {
    const [drillSelection, setDrillSelection] = useState<DrillSelection | null>(null)
    const [activitySelection, setActivitySelection] = useState<DashboardData['recentAdminLogs'][number] | null>(null)
    const { settings } = useTheme()
    const isChicago95 = settings.themeMode === 'chicago95'
    const {
        userCount,
        calcCount,
        logCount,
        calculationEventTimestamps,
        calculationEventRows,
        recentAdminLogs,
        weeklyTrend
    } = data

    const calculationEvents = calculationEventTimestamps || []
    const analyticsWindowStart = new Date()
    analyticsWindowStart.setDate(analyticsWindowStart.getDate() - 7)
    analyticsWindowStart.setHours(0, 0, 0, 0)
    const analyticsWindowEnd = new Date()

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const chartData = Array.from({ length: 7 }, (_, i) => {
        const baseDate = new Date()
        baseDate.setDate(baseDate.getDate() - (6 - i))
        const dayStart = new Date(baseDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(baseDate)
        dayEnd.setHours(23, 59, 59, 999)

        const value = calculationEvents.filter(ts => {
            const eventDate = new Date(ts)
            return eventDate >= dayStart && eventDate <= dayEnd
        }).length

        return {
            label: dayNames[dayStart.getDay()],
            value,
            startIso: dayStart.toISOString(),
            endIso: dayEnd.toISOString(),
        }
    })

    const timeOfDayCounts = new Array(24).fill(0)
    calculationEvents.forEach((ts) => {
        const hour = getEasternHour(ts)
        if (hour === null) return
        timeOfDayCounts[hour]++
    })

    const formatHour = (h: number) => {
        if (h === 0) return '12AM'
        if (h === 12) return '12PM'
        return h < 12 ? `${h}AM` : `${h - 12}PM`
    }

    const timeBuckets = Array.from({ length: 24 }, (_, hour) => ({
        label: formatHour(hour),
        value: timeOfDayCounts[hour],
        hourStart: hour,
        hourEnd: hour + 1,
        startIso: analyticsWindowStart.toISOString(),
        endIso: analyticsWindowEnd.toISOString(),
    }))

    const drillRows = useMemo(() => {
        if (!drillSelection) return []

        if (drillSelection.calculationId) {
            return (calculationEventRows || []).filter((row) => row.id === drillSelection.calculationId)
        }

        const startMs = new Date(drillSelection.startIso).getTime()
        const endMs = new Date(drillSelection.endIso).getTime()

        return (calculationEventRows || []).filter((row) => {
            const rowMs = new Date(row.created_at).getTime()
            return rowMs >= startMs && rowMs <= endMs
        })
    }, [drillSelection, calculationEventRows])

    const recentActivityCalcs = useMemo(() => {
        return [...(calculationEventRows || [])]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
    }, [calculationEventRows])

    return (
        <div className="space-y-6">
            <AdminPageHeader 
                title="Server Dashboard" 
                actions={
                    <div className={isChicago95 ? "flex items-center gap-2 px-3 py-1 chi95-panel" : "flex items-center gap-2 px-4 py-2 mc-slot"}>
                        <div className={`w-3 h-3 ${isChicago95 ? 'bg-[#008000]' : 'bg-[#55ff55] animate-pulse'}`} style={{ boxShadow: isChicago95 ? 'none' : '0 0 8px #55ff55' }}></div>
                        <span className={isChicago95 ? "chi95-text text-xs" : "mc-admin-text"}>Server Online</span>
                    </div>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard 
                    title="Total Users" 
                    value={userCount} 
                    icon="totem" 
                    description="Registered players"
                />
                <StatsCard 
                    title="Calculations" 
                    value={calcCount} 
                    icon="clock" 
                    description="Total Date Changes calculated"
                    trend={weeklyTrend}
                />
                <StatsCard 
                    title="System Logs" 
                    value={logCount} 
                    icon="paper" 
                    description="Recorded events"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <div className={isChicago95 ? "chi95-window p-4" : "mc-panel p-5"}>
                    <div className="flex items-center gap-2 mb-3">
                        <ThemeIcon type="wheat" />
                        <span className={isChicago95 ? "chi95-text text-lg font-bold" : "mc-admin-heading text-2xl"}>Daily Activity</span>
                    </div>
                    <MinecraftBarChart 
                        data={chartData}
                        subtitle="Calculations over the last 7 days"
                        height={220}
                        barColor="#55aa55"
                        showValues={true}
                        onBarClick={(item) => {
                            if (!item.startIso || !item.endIso) return
                            setActivitySelection(null)
                            setDrillSelection({
                                bucketLabel: item.label,
                                view: 'daily',
                                startIso: item.startIso,
                                endIso: item.endIso,
                            })
                        }}
                    />
                </div>

                {/* Time of Day Chart */}
                <div className={isChicago95 ? "chi95-window p-4" : "mc-panel p-5"}>
                    <div className="flex items-center gap-2 mb-3">
                        <ThemeIcon type="clock" />
                        <span className={isChicago95 ? "chi95-text text-lg font-bold" : "mc-admin-heading text-2xl"}>Peak Hours</span>
                    </div>
                    <MinecraftBarChart 
                        data={timeBuckets}
                        subtitle="Activity distribution by hour (ET)"
                        height={220}
                        barColor="#ffaa00"
                        showValues={true}
                        onBarClick={(item) => {
                            if (!item.startIso || !item.endIso) return
                            if (typeof item.hourStart !== 'number' || typeof item.hourEnd !== 'number') return
                            setActivitySelection(null)
                            setDrillSelection({
                                bucketLabel: item.label,
                                view: 'time-of-day',
                                startIso: item.startIso,
                                endIso: item.endIso,
                                hourStart: item.hourStart,
                                hourEnd: item.hourEnd,
                            })
                        }}
                    />
                </div>
            </div>

            {drillSelection && (
                <div className={isChicago95 ? "chi95-window p-4" : "mc-panel p-5"}>
                    <div className="flex items-center gap-2 mb-3">
                        <ThemeIcon type="book" />
                        <span className={isChicago95 ? "chi95-text text-lg font-bold" : "mc-admin-heading text-2xl"}>Calculation Drilldown</span>
                    </div>
                    <CalculationDrilldown
                        rows={drillRows}
                        bucketLabel={drillSelection.bucketLabel}
                        view={drillSelection.view}
                        hourStart={drillSelection.hourStart}
                        hourEnd={drillSelection.hourEnd}
                        embedded={true}
                        onClose={() => setDrillSelection(null)}
                    />
                </div>
            )}

            {activitySelection && (
                <div className={isChicago95 ? "chi95-window p-4" : "mc-panel p-5"}>
                    <div className="flex items-center gap-2 mb-3">
                        <ThemeIcon type="paper" />
                        <span className={isChicago95 ? "chi95-text text-lg font-bold" : "mc-admin-heading text-2xl"}>Admin Activity Drilldown</span>
                    </div>
                    <AdminActivityDrilldown
                        log={activitySelection}
                        onClose={() => setActivitySelection(null)}
                    />
                </div>
            )}

            {/* Detailed Stats Row */}
            <div className="grid grid-cols-1 gap-6">
                {/* Recent Activity Log */}
                <div className={isChicago95 ? "chi95-window p-4" : "mc-panel p-5"}>
                    <div className="flex items-center gap-2 mb-4">
                        <ThemeIcon type="book" />
                        <span className={isChicago95 ? "chi95-text text-lg font-bold" : "mc-admin-heading text-2xl"}>Recent Activity</span>
                    </div>
                    <div className="space-y-2">
                        {recentActivityCalcs.map((calc) => (
                            <button
                                key={calc.id}
                                type="button"
                                className={isChicago95 ? "w-full text-left flex justify-between items-center p-3 chi95-panel hover:bg-[#d4d0c8] transition" : "w-full text-left flex justify-between items-center p-3 mc-slot-dark hover:brightness-110 transition"}
                                onClick={() => {
                                    setActivitySelection(null)
                                    setDrillSelection({
                                        bucketLabel: calc.identifier || 'Calculation',
                                        view: 'calculation',
                                        startIso: calc.created_at,
                                        endIso: calc.created_at,
                                        calculationId: calc.id,
                                    })
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <ThemeIcon type="compass" />
                                    <div>
                                        <span className={isChicago95 ? "chi95-text text-sm font-bold" : "mc-admin-text text-lg font-bold"}>
                                            {calc.identifier || 'Calculation'}
                                        </span>
                                        <span className={isChicago95 ? "chi95-text text-black text-xs ml-2 font-medium" : "mc-text-muted ml-2"}>
                                            {calc.loadDate ? new Date(calc.loadDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <span className={isChicago95 ? "chi95-text text-black text-xs font-medium" : "mc-text-muted"}>
                                    {formatEasternDateTime(calc.created_at)}
                                </span>
                            </button>
                        ))}
                        {recentAdminLogs?.slice(0, 5).map((log) => (
                            <button
                                key={log.id}
                                type="button"
                                className={isChicago95 ? "w-full text-left flex justify-between items-center p-3 chi95-panel hover:bg-[#d4d0c8] transition" : "w-full text-left flex justify-between items-center p-3 mc-slot-dark hover:brightness-110 transition"}
                                onClick={() => {
                                    setDrillSelection(null)
                                    setActivitySelection(log)
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <ThemeIcon type="paper" />
                                    <div>
                                        <span className={isChicago95 ? "chi95-text text-sm font-bold capitalize" : "mc-admin-text text-lg font-bold capitalize"}>
                                            {log.action_type?.replace(/_/g, ' ') || 'System Event'}
                                        </span>
                                        <span className={isChicago95 ? "chi95-text text-black text-xs ml-2 font-medium" : "mc-text-muted ml-2"}>
                                            {log.userEmail || (log.user_id ? `User ${log.user_id.slice(0, 8)}` : 'Admin')}
                                        </span>
                                    </div>
                                </div>
                                <span className={isChicago95 ? "chi95-text text-black text-xs font-medium" : "mc-text-muted"}>
                                    {formatEasternDateTime(log.created_at)}
                                </span>
                            </button>
                        ))}
                        {recentActivityCalcs.length === 0 && (!recentAdminLogs || recentAdminLogs.length === 0) && (
                            <div className={isChicago95 ? "text-center chi95-text py-8 text-sm" : "text-center mc-text-muted py-8 text-lg"}>
                                No recent activity available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
