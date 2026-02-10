export interface CalculationEventRow {
    id: string
    created_at: string
    user_id: string | null
    identifier: string | null
    userEmail: string | null
    authenticated: boolean
    weight: number | null
    distance: number | null
    loadDate: string | null
    packDate: string | null
    transitDays: number | null
    rdd: string | null
}

export interface AdminActivityLogRow {
    id: string
    created_at: string
    action_type: string
    user_id: string | null
    userEmail: string | null
    userRole: string | null
    details: Record<string, unknown>
}

export interface DashboardData {
    userCount: number
    calcCount: number
    logCount: number
    calculationEventTimestamps: string[]
    calculationEventRows: CalculationEventRow[]
    topRoutes: { route: string; count: number }[]
    recentCalcs: any[]
    recentLogs: any[]
    recentAdminLogs: AdminActivityLogRow[]
    thisWeekCalcs: number
    dbLatency: number
    weeklyTrend: string
    uniqueRouteCount: number
}
