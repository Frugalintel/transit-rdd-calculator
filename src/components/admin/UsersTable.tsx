"use client"
import { DataTable } from '@/components/admin/DataTable'
import { ThemeIcon } from '@/components/ThemeIcon'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'

interface User {
    id: string
    role: string
    updated_at: string
}

export function UsersTable({ users }: { users: User[] }) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'

    return (
        <DataTable 
            data={users}
            columns={[
                { 
                    header: 'User ID', 
                    accessor: (row: User) => (
                        <span className={isFallout ? "fo-text font-mono text-sm" : "mc-admin-text font-mono text-sm"}>{row.id}</span>
                    ), 
                    width: '35%' 
                },
                { 
                    header: 'Role', 
                    accessor: (row: User) => (
                        <span className={`
                            px-3 py-1 text-sm font-bold uppercase tracking-wide
                            ${isFallout 
                                ? 'border border-[var(--fo-primary)] text-[var(--fo-primary)]' 
                                : row.role === 'admin'
                                    ? 'bg-[#aa3333] border-2 border-[#ff5555] text-white' 
                                    : 'bg-[#4455aa] border-2 border-[#7788ff] text-white'
                            }
                        `}
                        style={{ textShadow: isFallout ? 'none' : '1px 1px 0 #1a1a1a' }}
                        >
                            {row.role}
                        </span>
                    ),
                    width: '20%'
                },
                { 
                    header: 'Last Active', 
                    accessor: (row: User) => (
                        <span className={isFallout ? "fo-text" : "mc-admin-text"}>{new Date(row.updated_at).toLocaleDateString()}</span>
                    )
                },
            ]}
            actions={(row) => (
                <div className="flex gap-2">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        title="View Details"
                        className={isFallout ? "fo-button-ghost" : ""}
                    >
                        <ThemeIcon type="book" />
                    </Button>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        title="Manage Permissions"
                        className={isFallout ? "fo-button-ghost" : ""}
                    >
                        <ThemeIcon type="chain" />
                    </Button>
                </div>
            )}
        />
    )
}

