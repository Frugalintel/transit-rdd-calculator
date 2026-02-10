"use client"

import { useMemo } from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { CalculationEventRow } from '@/types/dashboard'
import { formatEasternDateTime, getEasternHour } from '@/utils/timezone'

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
    const normalizedRows = useMemo<DrillRow[]>(() => {
        return rows
            .filter((row) => {
                if (typeof hourStart !== 'number' || typeof hourEnd !== 'number') return true
                const hour = getEasternHour(row.created_at)
                if (hour === null) return false
                return hour >= hourStart && hour < hourEnd
            })
            .map((row) => {
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
    }, [rows, hourStart, hourEnd])

    const subtitle = view === 'time-of-day'
        ? `${bucketLabel} (ET time block)`
        : bucketLabel

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <p className="mc-text-muted text-lg">Filtered Bucket</p>
                    <p className="mc-admin-heading text-3xl">{subtitle || 'All Calculations'}</p>
                    <p className="mc-text-muted">Rows: {normalizedRows.length}</p>
                </div>
                {embedded ? (
                    <Button variant="secondary" onClick={onClose}>Close Drilldown</Button>
                ) : (
                    <Link href="/admin">
                        <Button variant="secondary">Back to Dashboard</Button>
                    </Link>
                )}
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
