export interface DashboardData {
    userCount: number
    calcCount: number
    logCount: number
    calculationEventTimestamps: string[]
    topRoutes: { route: string; count: number }[]
    recentCalcs: any[]
    recentLogs: any[]
    thisWeekCalcs: number
    dbLatency: number
    weeklyTrend: string
    uniqueRouteCount: number
}
