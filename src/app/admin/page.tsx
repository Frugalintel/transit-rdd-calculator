import { createClient } from '@/utils/supabase/server'
import { DashboardContent } from '@/components/admin/DashboardContent'

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
        { data: recentCalcsForChart },
        { data: recentCalcs },
        { data: recentLogs },
        { count: lastWeekCalcs },
        { count: thisWeekCalcs },
        { data: routeAnalysisData } 
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('calculations').select('*', { count: 'exact', head: true }),
        supabase.from('usage_logs').select('*', { count: 'exact', head: true }),
        supabase.from('calculations')
            .select('created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: true }),
        supabase.from('calculations')
            .select('id, created_at, name, origin_date')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase.from('usage_logs')
            .select('id, created_at, action_type, details')
            .order('created_at', { ascending: false })
            .limit(5),
        supabase.from('calculations')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', twoWeeksAgo.toISOString())
            .lt('created_at', oneWeekAgo.toISOString()),
        supabase.from('calculations')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('calculations')
            .select('name, input_data')
            .order('created_at', { ascending: false })
            .limit(100)
    ])

    const dbLatency = Date.now() - startTime
    
    // Aggregate calculations by day for chart
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const chartData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        
        const count = recentCalcsForChart?.filter(calc => {
            const calcDate = new Date(calc.created_at)
            return calcDate >= dayStart && calcDate <= dayEnd
        }).length || 0
        
        return {
            label: dayNames[dayStart.getDay()],
            value: count
        }
    })

    // Calculate Time of Day Distribution (0-23h)
    const timeOfDayCounts = new Array(24).fill(0)
    recentCalcsForChart?.forEach(calc => {
        const hour = new Date(calc.created_at).getHours()
        timeOfDayCounts[hour]++
    })
    
    const timeOfDayData = timeOfDayCounts.map((count, hour) => ({
        hour,
        value: count
    }))

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

    const dashboardData = {
        userCount: userCount || 0,
        calcCount: calcCount || 0,
        logCount: logCount || 0,
        chartData,
        timeOfDayData,
        topRoutes,
        recentCalcs: recentCalcs || [],
        recentLogs: recentLogs || [],
        thisWeekCalcs: thisWeekCalcs || 0,
        dbLatency,
        weeklyTrend,
        uniqueRouteCount: Object.keys(routeCounts).length
    }

    return <DashboardContent data={dashboardData} />
}
