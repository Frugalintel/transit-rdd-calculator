import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { CalculationDrilldown } from '@/components/admin/CalculationDrilldown'
import { createClient } from '@/utils/supabase/server'
import { CalculationEventRow } from '@/types/dashboard'

export const revalidate = 0

function getFirstParam(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0]
    return value
}

export default async function CalculationDrillPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams
    const supabase = await createClient()

    const start = getFirstParam(params.start)
    const end = getFirstParam(params.end)
    const bucket = getFirstParam(params.bucket) || 'All calculations'
    const view = getFirstParam(params.view) || 'daily'
    const hourStartRaw = getFirstParam(params.hourStart)
    const hourEndRaw = getFirstParam(params.hourEnd)
    const hourStart = hourStartRaw ? Number.parseInt(hourStartRaw, 10) : undefined
    const hourEnd = hourEndRaw ? Number.parseInt(hourEndRaw, 10) : undefined

    let query = supabase
        .from('usage_logs')
        .select('id, created_at, user_id, details')
        .eq('action_type', 'calculation')
        .order('created_at', { ascending: false })
        .limit(1000)

    if (start) query = query.gte('created_at', start)
    if (end) query = query.lte('created_at', end)

    const { data: rows } = await query
    const flattenedRows: CalculationEventRow[] = (rows || []).map((row) => {
        const details = row.details && typeof row.details === 'object' ? row.details as Record<string, unknown> : {}
        const inputData = details.input_data && typeof details.input_data === 'object'
            ? details.input_data as Record<string, unknown>
            : {}
        const resultSummary = details.result_summary && typeof details.result_summary === 'object'
            ? details.result_summary as Record<string, unknown>
            : {}

        return {
            id: row.id,
            created_at: row.created_at,
            user_id: row.user_id ?? null,
            identifier: typeof details.name === 'string' ? details.name : null,
            userEmail: typeof details.user_email === 'string' ? details.user_email : null,
            authenticated: Boolean(details.authenticated),
            weight: typeof inputData.weight === 'number' ? inputData.weight : null,
            distance: typeof inputData.distance === 'number' ? inputData.distance : null,
            loadDate: typeof inputData.loadDate === 'string' ? inputData.loadDate : null,
            packDate: typeof inputData.packDate === 'string' ? inputData.packDate : null,
            transitDays: typeof resultSummary.transitDays === 'number' ? resultSummary.transitDays : null,
            rdd: typeof resultSummary.rdd === 'string' ? resultSummary.rdd : null,
        }
    })

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Calculation Drill-Down"
                icon="clock"
                subtitle="Click a chart bar to inspect detailed events"
            />
            <CalculationDrilldown
                rows={flattenedRows}
                bucketLabel={bucket}
                view={view}
                hourStart={Number.isFinite(hourStart) ? hourStart : undefined}
                hourEnd={Number.isFinite(hourEnd) ? hourEnd : undefined}
            />
        </div>
    )
}
