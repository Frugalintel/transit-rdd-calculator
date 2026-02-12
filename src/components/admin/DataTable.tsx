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
    const isChicago95 = settings.themeMode === 'chicago95'

    return (
        <div className={isFallout ? "fo-panel p-1" : isChicago95 ? "chi95-window p-1" : "mc-panel p-1"}>
            <div className={isFallout ? "fo-panel" : isChicago95 ? "chi95-panel" : "mc-slot"}>
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
                                            : isChicago95
                                                ? 'text-white text-[13px] font-semibold border-b border-[#808080]'
                                            : 'text-white font-vt323'
                                        }
                                    `}
                                    style={{ 
                                        width: col.width, 
                                        textShadow: isFallout || isChicago95 ? 'none' : '2px 2px 0 #1a1a1a' 
                                    }}
                                >
                                    {col.header}
                                </TableHead>
                            ))}
                            {actions && <TableHead className={isChicago95 ? "w-[100px] text-white text-[13px] border-b border-[#808080]" : "w-[100px]"}></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={columns.length + (actions ? 1 : 0)} 
                                    className={`text-center py-8 ${isFallout ? 'text-[var(--fo-primary-dim)]' : isChicago95 ? 'chi95-text' : 'mc-text-muted'}`}
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow 
                                    key={row.id} 
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={isChicago95 ? "transition-colors cursor-pointer hover:bg-[#d4d0c8]" : "admin-table-row transition-colors cursor-pointer"}
                                >
                                    {columns.map((col, i) => (
                                        <TableCell key={i} className={isFallout ? "fo-text text-lg py-3" : isChicago95 ? "chi95-text text-sm py-3" : "mc-admin-text text-lg py-3"}>
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
