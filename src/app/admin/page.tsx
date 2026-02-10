import { createClient } from '@/utils/supabase/server'
import { DashboardContent } from '@/components/admin/DashboardContent'
import { CalculationEventRow } from '@/types/dashboard'

// Cache for 30 seconds - admin dashboard doesn't need real-time data
export const revalidate = 30

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Calculate date ranges
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Measure DB latency with the first query
    const startTime = Date.now()

    // Run ALL queries in parallel for maximum performance
    // Added fetch for route analysis (last 100 calculations)
    const [
        { count: userCount },
        { count: calcCount },
        { count: logCount },
        { data: calcEventsForAnalytics },
        { data: recentCalcs },
        { data: recentLogs },
        { count: lastWeekCalcs },
        { count: thisWeekCalcs },
        { data: routeAnalysisData }
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        // Total calculation runs, including anonymous usage.
        supabase.from('usage_logs').select('*', { count: 'exact', head: true }).eq('action_type', 'calculation'),
        supabase.from('usage_logs').select('*', { count: 'exact', head: true }),
        supabase.from('usage_logs')
            .select('id, created_at, user_id, details')
            .eq('action_type', 'calculation')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: true }),
        supabase.from('calculations')
            .select('id, created_at, name, origin_date')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase.from('usage_logs')
            .select('id, created_at, action_type, details, user_id')
            .order('created_at', { ascending: false })
            .limit(25),
        supabase.from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('action_type', 'calculation')
            .gte('created_at', twoWeeksAgo.toISOString())
            .lt('created_at', oneWeekAgo.toISOString()),
        supabase.from('usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('action_type', 'calculation')
            .gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('calculations')
            .select('name, input_data')
            .order('created_at', { ascending: false })
            .limit(100)
    ])

    const dbLatency = Date.now() - startTime
    
    // Calculate Top Date Changes / Unique Calculations
    const routeCounts: Record<string, number> = {}
    routeAnalysisData?.forEach(calc => {
        let routeKey = 'Unknown Route'
        
        // Try to get origin -> destination from input_data
        if (calc.input_data && typeof calc.input_data === 'object') {
            const origin = (calc.input_data as any).origin || '?'
            const destination = (calc.input_data as any).destination || '?'
            if (origin !== '?' || destination !== '?') {
                routeKey = `${origin} → ${destination}`
            } else if (calc.name) {
                routeKey = calc.name
            }
        } else if (calc.name) {
            routeKey = calc.name
        }
        
        routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1
    })

    const topRoutes = Object.entries(routeCounts)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    const weeklyChange = (thisWeekCalcs || 0) - (lastWeekCalcs || 0)
    const weeklyTrend = weeklyChange >= 0 ? `+${weeklyChange} this week` : `${weeklyChange} this week`

    const logUserIds = Array.from(
        new Set(
            (recentLogs || [])
                .map((log: any) => (typeof log.user_id === 'string' ? log.user_id : null))
                .filter((id: string | null): id is string => Boolean(id))
        )
    )

    const profilesResult = logUserIds.length > 0
        ? await supabase.from('profiles').select('id, email, role').in('id', logUserIds)
        : { data: [] as Array<{ id: string; email: string | null; role: string | null }> }

    const profileById = new Map(
        (profilesResult.data || []).map((profile) => [profile.id, profile])
    )

    const recentAdminLogs = (recentLogs || [])
        .map((log: any) => {
            const profile = typeof log.user_id === 'string' ? profileById.get(log.user_id) : undefined
            const actionType = typeof log.action_type === 'string' ? log.action_type : ''
            const details = log.details && typeof log.details === 'object'
                ? log.details as Record<string, unknown>
                : {}
            const detailsRole = typeof details.role === 'string' ? details.role : null
            const isAdminAction = (profile?.role === 'admin') || (detailsRole === 'admin') || actionType.includes('admin')

            return {
                id: log.id,
                created_at: log.created_at,
                action_type: actionType,
                user_id: log.user_id ?? null,
                userEmail: profile?.email ?? (typeof details.user_email === 'string' ? details.user_email : null),
                userRole: profile?.role ?? detailsRole,
                details,
                isAdminAction
            }
        })
        .filter((log) => log.isAdminAction)
        .map(({ isAdminAction: _isAdminAction, ...log }) => log)
        .slice(0, 10)

    const calculationEventRows: CalculationEventRow[] = (calcEventsForAnalytics || []).map((row) => {
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

    const dashboardData = {
        userCount: userCount || 0,
        calcCount: calcCount || 0,
        logCount: logCount || 0,
        calculationEventTimestamps: calculationEventRows.map((row) => row.created_at),
        calculationEventRows,
        topRoutes,
        recentCalcs: recentCalcs || [],
        recentLogs: recentLogs || [],
        recentAdminLogs,
        thisWeekCalcs: thisWeekCalcs || 0,
        dbLatency,
        weeklyTrend,
        uniqueRouteCount: Object.keys(routeCounts).length
    }

    return <DashboardContent data={dashboardData} />
}
