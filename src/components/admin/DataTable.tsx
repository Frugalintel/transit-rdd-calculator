"use client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTheme } from "@/context/ThemeContext"

interface DataTableProps<T> {
    columns: { header: string; accessor: keyof T | ((row: T) => React.ReactNode); width?: string }[]
    data: T[]
    onRowClick?: (row: T) => void
    actions?: (row: T) => React.ReactNode
}

export function DataTable<T extends { id: string | number }>({ columns, data, onRowClick, actions }: DataTableProps<T>) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'

    return (
        <div className="mc-panel p-1">
            <div className="mc-slot">
                <Table>
                    <TableHeader className="admin-table-header">
                        <TableRow className="hover:bg-transparent">
                            {columns.map((col, i) => (
                                <TableHead 
                                    key={i} 
                                    className={`
                                        text-lg py-3 font-normal tracking-wide
                                        ${isFallout 
                                            ? 'text-[var(--fo-primary)] font-mono border-b border-[var(--fo-primary-dim)]' 
                                            : 'text-white font-vt323'
                                        }
                                    `}
                                    style={{ 
                                        width: col.width, 
                                        textShadow: isFallout ? 'none' : '2px 2px 0 #1a1a1a' 
                                    }}
                                >
                                    {col.header}
                                </TableHead>
                            ))}
                            {actions && <TableHead className="w-[100px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length + (actions ? 1 : 0)} 
                                    className={`text-center py-8 ${isFallout ? 'text-[var(--fo-primary-dim)]' : 'mc-text-muted'}`}
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow 
                                    key={row.id} 
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className="admin-table-row transition-colors cursor-pointer"
                                >
                                    {columns.map((col, i) => (
                                        <TableCell key={i} className="mc-admin-text text-lg py-3">
                                            {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                                        </TableCell>
                                    ))}
                                    {actions && (
                                        <TableCell className="py-3">
                                            {actions(row)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
