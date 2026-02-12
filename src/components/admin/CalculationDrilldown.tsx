"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { CalculationEventRow } from '@/types/dashboard'
import { formatEasternDateTime, getEasternHour } from '@/utils/timezone'
import { useTheme } from '@/context/ThemeContext'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface CalculationDrilldownProps {
    rows: CalculationEventRow[]
    bucketLabel: string
    view: string
    hourStart?: number
    hourEnd?: number
    embedded?: boolean
    onClose?: () => void
}

interface DrillRow {
    id: string
    createdAt: string
    identifier: string
    enteredBy: string
    authenticated: string
    weight: string
    distance: string
    pickupDate: string
    packDate: string
    transitDays: string
    rdd: string
}

type SortField =
    | 'created_at'
    | 'identifier'
    | 'entered_by'
    | 'authenticated'
    | 'weight'
    | 'distance'
    | 'load_date'
    | 'pack_date'
    | 'transit_days'
    | 'rdd'

type SortDirection = 'asc' | 'desc'

const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
    { value: 'created_at', label: 'Time' },
    { value: 'identifier', label: 'Identifier' },
    { value: 'entered_by', label: 'Entered By' },
    { value: 'authenticated', label: 'Authenticated' },
    { value: 'weight', label: 'Weight' },
    { value: 'distance', label: 'Distance' },
    { value: 'load_date', label: 'Pickup Date' },
    { value: 'pack_date', label: 'Pack Date' },
    { value: 'transit_days', label: 'Transit Days' },
    { value: 'rdd', label: 'RDD' },
]

function formatDateTime(value: string | null | undefined) {
    return formatEasternDateTime(value)
}

export function CalculationDrilldown({
    rows,
    bucketLabel,
    view,
    hourStart,
    hourEnd,
    embedded = false,
    onClose
}: CalculationDrilldownProps) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const [sortField, setSortField] = useState<SortField>('created_at')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    const filteredRows = useMemo<CalculationEventRow[]>(() => {
        return rows
            .filter((row) => {
                if (typeof hourStart !== 'number' || typeof hourEnd !== 'number') return true
                const hour = getEasternHour(row.created_at)
                if (hour === null) return false
                return hour >= hourStart && hour < hourEnd
            })
    }, [rows, hourStart, hourEnd])

    const sortedRows = useMemo<CalculationEventRow[]>(() => {
        const toMs = (value: string | null | undefined) => {
            if (!value) return -1
            const ms = new Date(value).getTime()
            return Number.isFinite(ms) ? ms : -1
        }

        const comparableValue = (row: CalculationEventRow): string | number => {
            switch (sortField) {
                case 'created_at':
                    return toMs(row.created_at)
                case 'identifier':
                    return (row.identifier || '').toLowerCase()
                case 'entered_by': {
                    const enteredBy = row.userEmail
                        ? row.userEmail
                        : row.user_id
                            ? `user ${row.user_id.slice(0, 8)}`
                            : 'anonymous'
                    return enteredBy.toLowerCase()
                }
                case 'authenticated':
                    return row.authenticated ? 1 : 0
                case 'weight':
                    return row.weight ?? -1
                case 'distance':
                    return row.distance ?? -1
                case 'load_date':
                    return toMs(row.loadDate)
                case 'pack_date':
                    return toMs(row.packDate)
                case 'transit_days':
                    return row.transitDays ?? -1
                case 'rdd':
                    return toMs(row.rdd)
                default:
                    return toMs(row.created_at)
            }
        }

        return [...filteredRows].sort((a, b) => {
            const left = comparableValue(a)
            const right = comparableValue(b)

            let compare = 0
            if (typeof left === 'string' && typeof right === 'string') {
                compare = left.localeCompare(right)
            } else {
                compare = Number(left) - Number(right)
            }

            return sortDirection === 'asc' ? compare : -compare
        })
    }, [filteredRows, sortField, sortDirection])

    const normalizedRows = useMemo<DrillRow[]>(() => {
        return sortedRows.map((row) => {
            const enteredBy = row.userEmail
                ? row.userEmail
                : row.user_id
                    ? `User ${row.user_id.slice(0, 8)}`
                    : 'Anonymous'
            const identifier = row.identifier || 'N/A'

            return {
                id: row.id,
                createdAt: formatDateTime(row.created_at),
                identifier,
                enteredBy,
                authenticated: row.authenticated ? 'Yes' : 'No',
                weight: row.weight != null ? String(row.weight) : 'N/A',
                distance: row.distance != null ? String(row.distance) : 'N/A',
                pickupDate: formatDateTime(row.loadDate),
                packDate: formatDateTime(row.packDate),
                transitDays: row.transitDays != null ? String(row.transitDays) : 'N/A',
                rdd: formatDateTime(row.rdd),
            }
        })
    }, [sortedRows])

    const authenticatedCount = filteredRows.filter((row) => row.authenticated).length
    const anonymousCount = filteredRows.length - authenticatedCount

    const subtitle = view === 'time-of-day'
        ? `${bucketLabel} (ET time block)`
        : bucketLabel

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <p className={cn("text-sm", isFallout ? "fo-text-dim uppercase tracking-wider" : "mc-text-muted text-lg")}>Filtered Bucket</p>
                    <p className={cn(isFallout ? "fo-heading text-2xl border-none mb-1" : "mc-admin-heading text-3xl")}>{subtitle || 'All Calculations'}</p>
                    <p className={cn("text-sm", isFallout ? "fo-text-dim" : "mc-text-muted")}>
                        Rows: {normalizedRows.length} | Auth: {authenticatedCount} | Anonymous: {anonymousCount}
                    </p>
                </div>
                {embedded ? (
                    <Button variant="secondary" onClick={onClose}>Close Drilldown</Button>
                ) : (
                    <Link href="/admin">
                        <Button variant="secondary">Back to Dashboard</Button>
                    </Link>
                )}
            </div>

            <div className={cn(
                "p-2 sm:p-3 flex flex-wrap items-center gap-2",
                isFallout
                    ? "border border-[var(--fo-primary-dim)] bg-[rgba(0,0,0,0.25)]"
                    : "mc-slot"
            )}>
                <div className={cn("text-xs", isFallout ? "fo-text-dim uppercase tracking-wider" : "mc-text-muted")}>Sort</div>
                <div className="w-[190px] max-w-full">
                    <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-sm">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    variant="ghost"
                    className="h-8 text-xs px-2"
                    onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    title="Toggle sort direction"
                >
                    {sortDirection === 'desc' ? 'Newest/High ↓' : 'Oldest/Low ↑'}
                </Button>
            </div>

            <DataTable
                columns={[
                    { header: 'Time', accessor: 'createdAt', width: '170px' },
                    { header: 'Identifier', accessor: 'identifier', width: '160px' },
                    { header: 'Entered By', accessor: 'enteredBy', width: '170px' },
                    { header: 'Auth', accessor: 'authenticated', width: '80px' },
                    { header: 'Weight', accessor: 'weight', width: '90px' },
                    { header: 'Distance', accessor: 'distance', width: '90px' },
                    { header: 'Pickup', accessor: 'pickupDate', width: '170px' },
                    { header: 'Pack', accessor: 'packDate', width: '170px' },
                    { header: 'Transit Days', accessor: 'transitDays', width: '90px' },
                    { header: 'RDD', accessor: 'rdd', width: '170px' },
                ]}
                data={normalizedRows}
            />
        </div>
    )
}
