"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
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

type ActivityRangeId = '7d' | '14d' | '30d' | '4w' | '8w' | '12w'

const ACTIVITY_RANGES: Array<{
    id: ActivityRangeId
    label: string
    bucket: 'day' | 'week'
    bucketCount: number
    spanDays: number
}> = [
    { id: '7d', label: '7D', bucket: 'day', bucketCount: 7, spanDays: 7 },
    { id: '14d', label: '14D', bucket: 'day', bucketCount: 14, spanDays: 14 },
    { id: '30d', label: '30D', bucket: 'day', bucketCount: 30, spanDays: 30 },
    { id: '4w', label: '4W', bucket: 'week', bucketCount: 4, spanDays: 28 },
    { id: '8w', label: '8W', bucket: 'week', bucketCount: 8, spanDays: 56 },
    { id: '12w', label: '12W', bucket: 'week', bucketCount: 12, spanDays: 84 },
]

export function FalloutDashboard({ data }: { data: DashboardData }) {
    const [drillSelection, setDrillSelection] = useState<DrillSelection | null>(null)
    const [rangeId, setRangeId] = useState<ActivityRangeId>('7d')
    const [windowOffset, setWindowOffset] = useState(0)
    const temporalScrollRef = useRef<HTMLDivElement | null>(null)
    const temporalSlotWidth = 24
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

    const calculationEvents = useMemo(
        () => calculationEventTimestamps ?? [],
        [calculationEventTimestamps]
    )
    const selectedRange = ACTIVITY_RANGES.find((range) => range.id === rangeId) ?? ACTIVITY_RANGES[0]
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const rangeEnd = useMemo(() => {
        const end = new Date()
        end.setDate(end.getDate() - (windowOffset * selectedRange.spanDays))
        end.setHours(23, 59, 59, 999)
        return end
    }, [windowOffset, selectedRange.spanDays])

    const rangeStart = useMemo(() => {
        const start = new Date(rangeEnd)
        start.setDate(start.getDate() - (selectedRange.spanDays - 1))
        start.setHours(0, 0, 0, 0)
        return start
    }, [rangeEnd, selectedRange.spanDays])

    const rangeLabel = useMemo(() => {
        const fmt = (value: Date) => value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${fmt(rangeStart)} - ${fmt(rangeEnd)}`
    }, [rangeStart, rangeEnd])

    const windowEvents = useMemo(() => {
        const startMs = rangeStart.getTime()
        const endMs = rangeEnd.getTime()
        return calculationEvents.filter((timestamp) => {
            const eventMs = new Date(timestamp).getTime()
            return Number.isFinite(eventMs) && eventMs >= startMs && eventMs <= endMs
        })
    }, [calculationEvents, rangeStart, rangeEnd])

    const chartData = (() => {
        if (selectedRange.bucket === 'day') {
            return Array.from({ length: selectedRange.bucketCount }, (_, i) => {
                const dayStart = new Date(rangeStart)
                dayStart.setDate(dayStart.getDate() + i)
                dayStart.setHours(0, 0, 0, 0)

                const dayEnd = new Date(dayStart)
                dayEnd.setHours(23, 59, 59, 999)

                const dayStartMs = dayStart.getTime()
                const dayEndMs = dayEnd.getTime()
                const value = windowEvents.filter((timestamp) => {
                    const eventMs = new Date(timestamp).getTime()
                    return Number.isFinite(eventMs) && eventMs >= dayStartMs && eventMs <= dayEndMs
                }).length

                const label = selectedRange.bucketCount <= 7
                    ? dayNames[dayStart.getDay()]
                    : `${dayStart.getMonth() + 1}/${dayStart.getDate()}`

                return {
                    label,
                    value,
                    startIso: dayStart.toISOString(),
                    endIso: dayEnd.toISOString(),
                }
            })
        }

        return Array.from({ length: selectedRange.bucketCount }, (_, i) => {
            const weekStart = new Date(rangeStart)
            weekStart.setDate(weekStart.getDate() + (i * 7))
            weekStart.setHours(0, 0, 0, 0)

            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)
            if (weekEnd > rangeEnd) {
                weekEnd.setTime(rangeEnd.getTime())
            }

            const weekStartMs = weekStart.getTime()
            const weekEndMs = weekEnd.getTime()
            const value = windowEvents.filter((timestamp) => {
                const eventMs = new Date(timestamp).getTime()
                return Number.isFinite(eventMs) && eventMs >= weekStartMs && eventMs <= weekEndMs
            }).length

            return {
                label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
                value,
                startIso: weekStart.toISOString(),
                endIso: weekEnd.toISOString(),
            }
        })
    })()

    const maxChartValue = Math.max(...chartData.map((bucket) => bucket.value), 1)
    const activityChartMinWidth = Math.max(
        selectedRange.bucket === 'day'
            ? selectedRange.bucketCount * 36
            : selectedRange.bucketCount * 64,
        420
    )

    const timeOfDayCounts = new Array(24).fill(0)
    windowEvents.forEach((ts) => {
        const hour = getEasternHour(ts)
        if (hour === null) return
        timeOfDayCounts[hour]++
    })

    const formatHourCompact = (h: number) => {
        if (h === 0) return '12A'
        if (h === 12) return '12P'
        return h < 12 ? `${h}A` : `${h - 12}P`
    }

    const timeBuckets = Array.from({ length: 24 }, (_, hourStart) => {
        const hourEnd = hourStart + 1
        const value = timeOfDayCounts[hourStart]
        return {
            label: formatHourCompact(hourStart),
            value,
            hourStart,
            hourEnd,
            startIso: rangeStart.toISOString(),
            endIso: rangeEnd.toISOString(),
        }
    })
    const maxBucketVal = Math.max(...timeBuckets.map((bucket) => bucket.value), 1)

    useEffect(() => {
        const el = temporalScrollRef.current
        if (!el) return

        // Center the business-hour window (7A-6P) by default.
        const businessStartHour = 7
        const businessEndHour = 18
        const businessCenterPx = ((businessStartHour + businessEndHour + 1) / 2) * temporalSlotWidth
        const targetScroll = businessCenterPx - (el.clientWidth / 2)
        const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
        el.scrollLeft = Math.min(Math.max(0, targetScroll), maxScroll)
    }, [rangeId, windowOffset, temporalSlotWidth])

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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-w-0">
                
                {/* Left Column: Stats (STAT) */}
                <div className="lg:col-span-4 space-y-8 min-w-0">
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
                <div className="lg:col-span-8 space-y-8 min-w-0">
                    
                    {/* Daily Activity Chart */}
                    <div className="border border-[var(--fo-primary-dim)] p-4 sm:p-6 relative hover:border-[var(--fo-primary)] transition-colors duration-300 overflow-hidden min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h3 className="fo-heading text-lg border-none p-0 m-0">
                                {selectedRange.bucket === 'day' ? 'Daily Activity' : 'Weekly Activity'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="fo-button fo-button-ghost text-xs px-2 py-1 h-auto min-h-0"
                                    onClick={() => setWindowOffset((prev) => prev + 1)}
                                >
                                    [ PREV ]
                                </button>
                                <button
                                    type="button"
                                    className="fo-button fo-button-ghost text-xs px-2 py-1 h-auto min-h-0"
                                    onClick={() => setWindowOffset(0)}
                                    disabled={windowOffset === 0}
                                >
                                    [ NOW ]
                                </button>
                                <button
                                    type="button"
                                    className="fo-button fo-button-ghost text-xs px-2 py-1 h-auto min-h-0"
                                    onClick={() => setWindowOffset((prev) => Math.max(prev - 1, 0))}
                                    disabled={windowOffset === 0}
                                >
                                    [ NEXT ]
                                </button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Range Presets</div>
                            <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
                                <div className="flex items-center gap-3 min-w-max">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase opacity-60">Daily</span>
                                        {ACTIVITY_RANGES.filter((range) => range.bucket === 'day').map((range) => (
                                            <button
                                                key={range.id}
                                                type="button"
                                                className="fo-button fo-button-ghost text-xs px-2 py-1 h-auto min-h-0"
                                                style={rangeId === range.id ? { background: 'var(--fo-primary)', color: '#000', borderColor: 'var(--fo-primary)' } : undefined}
                                                onClick={() => {
                                                    setRangeId(range.id)
                                                    setWindowOffset(0)
                                                }}
                                            >
                                                [{range.label}]
                                            </button>
                                        ))}
                                    </div>
                                    <div className="w-px h-5 bg-[var(--fo-primary-dim)] opacity-60" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase opacity-60">Weekly</span>
                                        {ACTIVITY_RANGES.filter((range) => range.bucket === 'week').map((range) => (
                                            <button
                                                key={range.id}
                                                type="button"
                                                className="fo-button fo-button-ghost text-xs px-2 py-1 h-auto min-h-0"
                                                style={rangeId === range.id ? { background: 'var(--fo-primary)', color: '#000', borderColor: 'var(--fo-primary)' } : undefined}
                                                onClick={() => {
                                                    setRangeId(range.id)
                                                    setWindowOffset(0)
                                                }}
                                            >
                                                [{range.label}]
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-[11px] uppercase tracking-wide opacity-70 mb-5 flex flex-wrap items-center gap-2">
                            <span>Window: {rangeLabel}</span>
                            <span className="opacity-50">|</span>
                            <span>
                                {windowOffset === 0 ? 'Current Window' : `${windowOffset} Window${windowOffset > 1 ? 's' : ''} Back`}
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
                            <div className="flex items-end justify-between h-40 gap-2 sm:gap-4 min-w-[420px]" style={{ minWidth: `${activityChartMinWidth}px` }}>
                                {chartData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group min-w-0">
                                        <div className="text-xs mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--fo-primary)] text-black px-1 font-bold">
                                            {d.value}
                                        </div>
                                        <div 
                                            className="w-full bg-[var(--fo-primary)] opacity-80 hover:opacity-100 transition-all cursor-pointer"
                                            onClick={() => {
                                                if (!d.startIso || !d.endIso) return
                                                setDrillSelection({
                                                    bucketLabel: d.label,
                                                    view: selectedRange.bucket === 'day' ? 'daily' : 'weekly',
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
                                                    view: selectedRange.bucket === 'day' ? 'daily' : 'weekly',
                                                    startIso: d.startIso,
                                                    endIso: d.endIso,
                                                })
                                            }}
                                            style={{ height: d.value > 0 ? `${Math.max((d.value / maxChartValue) * 100, 6)}%` : '0%' }}
                                        />
                                        <div className="text-[10px] sm:text-xs mt-2 opacity-70 uppercase whitespace-nowrap">{d.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Time Analysis Chart */}
                    <div className="border border-[var(--fo-primary-dim)] p-4 sm:p-6 relative hover:border-[var(--fo-primary)] transition-colors duration-300 overflow-hidden min-w-0">
                        <h3 className="fo-heading text-lg mb-6 border-none p-0 m-0">Temporal Analysis (1h Bins)</h3>
                        
                        <div ref={temporalScrollRef} className="overflow-x-auto no-scrollbar -mx-1 px-1">
                            <div className="flex items-end h-28 gap-1 min-w-max pr-2">
                                {timeBuckets.map((bucket, i) => (
                                    <div key={i} className="flex flex-col items-center w-5 shrink-0 h-full group cursor-crosshair">
                                        <div className="relative h-[86px] w-full flex items-end">
                                            <div className="text-[10px] mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 left-1/2 -translate-x-1/2 bg-[var(--fo-primary)] text-black px-1">
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
                                                style={{ height: bucket.value > 0 ? `${Math.max((bucket.value / maxBucketVal) * 100, 5)}%` : '0%' }}
                                            ></div>
                                        </div>
                                        <div className="text-[8px] mt-1 opacity-70 whitespace-nowrap leading-none h-3">
                                            {bucket.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-center text-xs opacity-50 mt-4 uppercase tracking-widest">--- Calculation Frequency / 24H ET Cycle (Selected Window) ---</div>
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
