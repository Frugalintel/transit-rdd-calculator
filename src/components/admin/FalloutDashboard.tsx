"use client"

import { useMemo, useState } from 'react'
import { DashboardData } from '@/types/dashboard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { CalculationDrilldown } from '@/components/admin/CalculationDrilldown'
import { formatEasternDateTime, getEasternHour } from '@/utils/timezone'

interface DrillSelection {
    bucketLabel: string
    view: string
    startIso: string
    endIso: string
    hourStart?: number
    hourEnd?: number
}

export function FalloutDashboard({ data }: { data: DashboardData }) {
    const [drillSelection, setDrillSelection] = useState<DrillSelection | null>(null)
    const {
        userCount,
        calcCount,
        logCount,
        calculationEventTimestamps,
        calculationEventRows,
        recentCalcs,
        dbLatency,
        weeklyTrend,
        uniqueRouteCount
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
    const maxBucketVal = Math.max(...timeBuckets.map((bucket) => bucket.value), 1)

    const drillRows = useMemo(() => {
        if (!drillSelection) return []
        const startMs = new Date(drillSelection.startIso).getTime()
        const endMs = new Date(drillSelection.endIso).getTime()

        return (calculationEventRows || []).filter((row) => {
            const rowMs = new Date(row.created_at).getTime()
            return rowMs >= startMs && rowMs <= endMs
        })
    }, [drillSelection, calculationEventRows])

    return (
        <div className="relative text-[var(--fo-primary)] font-mono w-full">
            <AdminPageHeader 
                title="SUDCO INDUSTRIES (TM)" 
                subtitle="Unified Operating System v2.4"
                actions={
                    <div className="text-right">
                        <div className="text-sm opacity-80">Latency: {dbLatency}ms</div>
                    </div>
                }
            />

            {/* Main Grid - Pip-Boy Style */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Stats (STAT) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="border border-[var(--fo-primary-dim)] p-4 relative hover:border-[var(--fo-primary)] transition-colors duration-300">
                        <h3 className="fo-heading text-lg mb-4 border-none p-0 m-0">System Stats</h3>
                        
                        <div className="space-y-6">
                            <StatRow label="Active Users" value={userCount} />
                            <StatRow label="Total Calcs" value={calcCount} sub={weeklyTrend} />
                            <StatRow label="Unique Date Changes" value={uniqueRouteCount} />
                            <StatRow label="System Logs" value={logCount} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Data Stream (DATA) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Daily Activity Chart */}
                    <div className="border border-[var(--fo-primary-dim)] p-6 relative hover:border-[var(--fo-primary)] transition-colors duration-300">
                        <h3 className="fo-heading text-lg mb-6 border-none p-0 m-0">Daily Activity</h3>
                        
                        <div className="flex items-end justify-between h-40 gap-4">
                            {chartData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                                    <div className="text-xs mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--fo-primary)] text-black px-1 font-bold">
                                        {d.value}
                                    </div>
                                    <div 
                                        className="w-full bg-[var(--fo-primary-dim)] group-hover:bg-[var(--fo-primary)] transition-all relative cursor-pointer"
                                        onClick={() => {
                                            if (!d.startIso || !d.endIso) return
                                            setDrillSelection({
                                                bucketLabel: d.label,
                                                view: 'daily',
                                                startIso: d.startIso,
                                                endIso: d.endIso,
                                            })
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key !== 'Enter' && event.key !== ' ') return
                                            event.preventDefault()
                                            if (!d.startIso || !d.endIso) return
                                            setDrillSelection({
                                                bucketLabel: d.label,
                                                view: 'daily',
                                                startIso: d.startIso,
                                                endIso: d.endIso,
                                            })
                                        }}
                                        style={{ height: `${Math.max((d.value / Math.max(...chartData.map(c => c.value), 1)) * 100, 2)}%` }}
                                    >
                                        {/* Scanline effect on bars */}
                                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
                                    </div>
                                    <div className="text-xs mt-2 opacity-70 uppercase">{d.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Time Analysis Chart */}
                    <div className="border border-[var(--fo-primary-dim)] p-6 relative hover:border-[var(--fo-primary)] transition-colors duration-300">
                        <h3 className="fo-heading text-lg mb-6 border-none p-0 m-0">Temporal Analysis</h3>
                        
                        <div className="flex items-end justify-between h-32 gap-2">
                            {timeBuckets.map((bucket, i) => (
                                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group cursor-crosshair">
                                    <div className="text-xs mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-6 bg-[var(--fo-primary)] text-black px-1">
                                        {bucket.value}
                                    </div>
                                    <div 
                                        className="w-full bg-[var(--fo-primary)] opacity-80 hover:opacity-100 transition-all cursor-pointer"
                                        onClick={() => {
                                            setDrillSelection({
                                                bucketLabel: bucket.label,
                                                view: 'time-of-day',
                                                startIso: bucket.startIso,
                                                endIso: bucket.endIso,
                                                hourStart: bucket.hourStart,
                                                hourEnd: bucket.hourEnd,
                                            })
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key !== 'Enter' && event.key !== ' ') return
                                            event.preventDefault()
                                            setDrillSelection({
                                                bucketLabel: bucket.label,
                                                view: 'time-of-day',
                                                startIso: bucket.startIso,
                                                endIso: bucket.endIso,
                                                hourStart: bucket.hourStart,
                                                hourEnd: bucket.hourEnd,
                                            })
                                        }}
                                        style={{ height: `${Math.max((bucket.value / maxBucketVal) * 100, 5)}%` }}
                                    ></div>
                                    <div className="text-[10px] mt-1 opacity-70">{bucket.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="text-center text-xs opacity-50 mt-4 uppercase tracking-widest">--- Calculation Frequency / 24H ET Cycle ---</div>
                    </div>

                    {drillSelection && (
                        <div className="border border-[var(--fo-primary-dim)] p-6 relative hover:border-[var(--fo-primary)] transition-colors duration-300">
                            <h3 className="fo-heading text-lg mb-4 border-none p-0 m-0">Calculation Drilldown</h3>
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

                    {/* Recent Activity Stream */}
                    <div className="border border-[var(--fo-primary-dim)] p-6 relative hover:border-[var(--fo-primary)] transition-colors duration-300">
                        <h3 className="fo-heading text-lg mb-4 border-none p-0 m-0">Recent Activity</h3>

                        <div className="space-y-3 font-mono text-sm">
                            {recentCalcs?.map((calc) => (
                                <div key={calc.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--fo-primary-dim)] border-dotted pb-2 hover:bg-[rgba(26,255,128,0.05)] p-2 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[var(--fo-primary)]">CALC_EXEC: {calc.name}</span>
                                        <span className="text-xs opacity-70">{formatEasternDateTime(calc.created_at)}</span>
                                    </div>
                                    <span className="text-xs border border-[var(--fo-primary)] px-2 py-0.5 mt-2 sm:mt-0 self-start sm:self-auto">STATUS: OK</span>
                                </div>
                            ))}
                            {recentCalcs.length === 0 && <div className="text-sm opacity-50 italic py-4">No recent activity detected...</div>}
                        </div>

                        {/* Blinking Cursor at bottom */}
                        <div className="mt-4 animate-pulse">_</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatRow({ label, value, sub }: { label: string, value: number, sub?: string }) {
    return (
        <div className="flex justify-between items-end border-b border-[var(--fo-primary-dim)] border-dotted pb-1">
            <span className="uppercase tracking-wide text-sm">{label}</span>
            <div className="text-right">
                <span className="text-2xl font-bold block leading-none">{value}</span>
                {sub && <span className="text-xs opacity-70">{sub}</span>}
            </div>
        </div>
    )
}
