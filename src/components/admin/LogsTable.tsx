"use client"
import { DataTable } from '@/components/admin/DataTable'
import { useTheme } from '@/context/ThemeContext'

interface Log {
    id: string
    created_at: string
    action_type: string
    details: any
    ip_address: string
}

export function LogsTable({ logs }: { logs: Log[] }) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'

    return (
        <DataTable 
            data={logs}
            columns={[
                { 
                    header: 'Time', 
                    accessor: (row: Log) => (
                        <span className={isFallout ? "fo-text" : isChicago95 ? "chi95-text" : "mc-admin-text"}>{new Date(row.created_at).toLocaleString()}</span>
                    ), 
                    width: '22%' 
                },
                { 
                    header: 'Action', 
                    accessor: (row: Log) => (
                        <span className={isFallout ? "fo-text font-bold capitalize" : isChicago95 ? "chi95-text font-bold capitalize" : "mc-admin-text font-bold capitalize"}>
                            {row.action_type?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                    ), 
                    width: '18%' 
                },
                { 
                    header: 'Details', 
                    accessor: (row: Log) => (
                        <code className={isFallout
                            ? "text-sm bg-black px-2 py-1 block max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--fo-primary)] border border-[var(--fo-primary-dim)]"
                            : isChicago95
                                ? "text-xs bg-white px-2 py-1 block max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap text-black border border-[#808080]"
                                : "text-sm bg-[#1a1a1a] px-2 py-1 block max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap text-[#55ff55] border border-[#333]"
                        }>
                            {JSON.stringify(row.details)}
                        </code>
                    )
                },
                { 
                    header: 'IP Address', 
                    accessor: (row: Log) => (
                        <span className={isFallout ? "fo-text-dim font-mono" : isChicago95 ? "chi95-text font-mono" : "mc-text-muted font-mono"}>{row.ip_address || 'N/A'}</span>
                    ), 
                    width: '15%' 
                },
            ]}
        />
    )
}

