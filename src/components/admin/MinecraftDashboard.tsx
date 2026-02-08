import { StatsCard } from '@/components/admin/StatsCard'
import { ThemeIcon } from '@/components/ThemeIcon'
import { MinecraftBarChart } from '@/components/minecraft/MinecraftBarChart'
import { DashboardData } from '@/types/dashboard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

export function MinecraftDashboard({ data }: { data: DashboardData }) {
    const {
        userCount,
        calcCount,
        logCount,
        chartData,
        timeOfDayData,
        topRoutes,
        recentCalcs,
        recentLogs,
        thisWeekCalcs,
        dbLatency,
        weeklyTrend
    } = data

    // Prepare Time of Day chart data (grouped into 4-hour blocks for cleaner visualization)
    const timeBlocks = [
        { label: 'Night (0-6)', value: 0 },
        { label: 'Morning (6-12)', value: 0 },
        { label: 'Afternoon (12-18)', value: 0 },
        { label: 'Evening (18-24)', value: 0 },
    ]
    
    timeOfDayData.forEach(d => {
        if (d.hour < 6) timeBlocks[0].value += d.value
        else if (d.hour < 12) timeBlocks[1].value += d.value
        else if (d.hour < 18) timeBlocks[2].value += d.value
        else timeBlocks[3].value += d.value
    })

    return (
        <div className="space-y-6">
            <AdminPageHeader 
                title="Server Dashboard" 
                actions={
                    <div className="flex items-center gap-2 px-4 py-2 mc-slot">
                        <div className="w-3 h-3 bg-[#55ff55] animate-pulse" style={{ boxShadow: '0 0 8px #55ff55' }}></div>
                        <span className="mc-admin-text">Server Online</span>
                    </div>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard 
                    title="Total Users" 
                    value={userCount} 
                    icon="totem" 
                    description="Registered players"
                />
                <StatsCard 
                    title="Calculations" 
                    value={calcCount} 
                    icon="clock" 
                    description="Total Date Changes calculated"
                    trend={weeklyTrend}
                />
                <StatsCard 
                    title="System Logs" 
                    value={logCount} 
                    icon="paper" 
                    description="Recorded events"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <div className="mc-panel p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <ThemeIcon type="wheat" />
                        <span className="mc-admin-heading text-2xl">Daily Activity</span>
                    </div>
                    <MinecraftBarChart 
                        data={chartData}
                        subtitle="Calculations over the last 7 days"
                        height={220}
                        barColor="#55aa55"
                        showValues={true}
                    />
                </div>

                {/* Time of Day Chart */}
                <div className="mc-panel p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <ThemeIcon type="clock" />
                        <span className="mc-admin-heading text-2xl">Peak Hours</span>
                    </div>
                    <MinecraftBarChart 
                        data={timeBlocks}
                        subtitle="Activity distribution by time of day"
                        height={220}
                        barColor="#ffaa00"
                        showValues={true}
                    />
                </div>
            </div>

            {/* Detailed Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Date Changes */}
                <div className="mc-panel p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ThemeIcon type="compass" />
                        <span className="mc-admin-heading text-2xl">Top Date Changes</span>
                    </div>
                    <div className="space-y-2">
                        {topRoutes.map((route, i) => (
                            <div key={i} className="flex justify-between items-center p-3 mc-slot-dark">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--mc-button-bg)] border border-[var(--mc-dark-border)] font-bold text-sm">
                                        {i + 1}
                                    </span>
                                    <span className="mc-admin-text text-lg truncate max-w-[250px]" title={route.route}>
                                        {route.route}
                                    </span>
                                </div>
                                <span className="mc-text-green font-bold">{route.count} runs</span>
                            </div>
                        ))}
                        {topRoutes.length === 0 && (
                            <div className="text-center mc-text-muted py-8 text-lg">
                                No Date Change data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="mc-panel p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ThemeIcon type="book" />
                        <span className="mc-admin-heading text-2xl">Recent Activity</span>
                    </div>
                    <div className="space-y-2">
                        {recentCalcs?.map((calc) => (
                            <div key={calc.id} className="flex justify-between items-center p-3 mc-slot-dark">
                                <div className="flex items-center gap-3">
                                    <ThemeIcon type="compass" />
                                    <div>
                                        <span className="mc-admin-text text-lg font-bold">
                                            {calc.name || 'Calculation'}
                                        </span>
                                        <span className="mc-text-muted ml-2">
                                            {calc.origin_date ? new Date(calc.origin_date).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <span className="mc-text-muted">
                                    {new Date(calc.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {recentLogs?.slice(0, 3).map((log) => (
                            <div key={log.id} className="flex justify-between items-center p-3 mc-slot-dark">
                                <div className="flex items-center gap-3">
                                    <ThemeIcon type="paper" />
                                    <div>
                                        <span className="mc-admin-text text-lg font-bold capitalize">
                                            {log.action_type?.replace(/_/g, ' ') || 'System Event'}
                                        </span>
                                    </div>
                                </div>
                                <span className="mc-text-muted">
                                    {new Date(log.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
