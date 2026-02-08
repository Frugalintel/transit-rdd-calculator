"use client"
import { DataTable } from '@/components/admin/DataTable'

interface Log {
    id: string
    created_at: string
    action_type: string
    details: any
    ip_address: string
}

export function LogsTable({ logs }: { logs: Log[] }) {
    return (
        <DataTable 
            data={logs}
            columns={[
                { 
                    header: 'Time', 
                    accessor: (row: Log) => (
                        <span className="mc-admin-text">{new Date(row.created_at).toLocaleString()}</span>
                    ), 
                    width: '22%' 
                },
                { 
                    header: 'Action', 
                    accessor: (row: Log) => (
                        <span className="mc-admin-text font-bold capitalize">
                            {row.action_type?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                    ), 
                    width: '18%' 
                },
                { 
                    header: 'Details', 
                    accessor: (row: Log) => (
                        <code className="text-sm bg-[#1a1a1a] px-2 py-1 block max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap text-[#55ff55] border border-[#333]">
                            {JSON.stringify(row.details)}
                        </code>
                    )
                },
                { 
                    header: 'IP Address', 
                    accessor: (row: Log) => (
                        <span className="mc-text-muted font-mono">{row.ip_address || 'N/A'}</span>
                    ), 
                    width: '15%' 
                },
            ]}
        />
    )
}

