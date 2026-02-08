export interface DashboardData {
    userCount: number
    calcCount: number
    logCount: number
    chartData: { label: string; value: number }[]
    timeOfDayData: { hour: number; value: number }[]
    topRoutes: { route: string; count: number }[]
    recentCalcs: any[]
    recentLogs: any[]
    thisWeekCalcs: number
    dbLatency: number
    weeklyTrend: string
    uniqueRouteCount: number
}
