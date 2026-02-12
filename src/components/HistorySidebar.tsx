"use client"

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CalculationRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'
import { cn } from '@/lib/utils'
import { generateCopyText, DEFAULT_TEMPLATES, CopyFormat, FORMAT_ACRONYMS, FORMAT_LABELS } from '@/utils/textHelpers'
import { toast } from 'sonner'
import { useTheme } from '@/context/ThemeContext'


const FORMAT_ORDER: CopyFormat[] = ['simple', 'osnp', 'osp', 'isp', 'isnp', 'dpsr']

interface HistorySidebarProps {
    isOpen: boolean
    onClose: () => void
    user: any
    refreshTrigger?: number // Simple way to trigger refresh from parent
}

export function HistorySidebar({ isOpen, onClose, user, refreshTrigger }: HistorySidebarProps) {
    const [history, setHistory] = useState<CalculationRecord[]>([])
    const [loading, setLoading] = useState(false)
    // Track format per record using record ID
    const [formatPerRecord, setFormatPerRecord] = useState<Record<string, CopyFormat>>({})
    const supabase = createClient()
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'

    const getFormatForRecord = (recordId: string): CopyFormat => {
        return formatPerRecord[recordId] || 'simple'
    }

    const cycleFormat = (recordId: string, direction: 'next' | 'prev') => {
        const currentFormat = getFormatForRecord(recordId)
        const currentIndex = FORMAT_ORDER.indexOf(currentFormat)
        let newIndex: number
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % FORMAT_ORDER.length
        } else {
            newIndex = (currentIndex - 1 + FORMAT_ORDER.length) % FORMAT_ORDER.length
        }
        setFormatPerRecord(prev => ({ ...prev, [recordId]: FORMAT_ORDER[newIndex] }))
    }

    useEffect(() => {
        if (isOpen && user) {
            fetchHistory()
        }
    }, [isOpen, user, refreshTrigger])

    const fetchHistory = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('calculations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30)
        
        if (data) {
            setHistory(data)
        }
        setLoading(false)
    }

    const handleCopy = (record: CalculationRecord) => {
        const format = getFormatForRecord(record.id)
        // Parse strings back to Date objects
        const packDate = record.input_data.packDate ? new Date(record.input_data.packDate) : null
        const loadDate = new Date(record.input_data.loadDate)
        const rdd = new Date(record.result_data.rdd)
        const earliest = new Date(record.result_data.loadSpread.earliest)
        const latest = new Date(record.result_data.loadSpread.latest)

        const text = generateCopyText(
            DEFAULT_TEMPLATES[format],
            packDate, loadDate, rdd, earliest, latest
        )
        navigator.clipboard.writeText(text)
        toast.success(`Copied (${FORMAT_ACRONYMS[format]})`)
    }

    // Helper for relative time since date-fns might not be installed
    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed top-0 right-0 h-full w-[min(320px,85vw)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
                isFallout 
                    ? "bg-[var(--fo-panel-bg)] border-l-2 border-[var(--fo-primary)] shadow-[0_0_50px_rgba(0,0,0,0.8)]" 
                    : isChicago95
                        ? "chi95-window border-l-2 border-[#808080]"
                        : "bg-[var(--mc-bg)] border-l-4 border-[var(--mc-dark-border)]",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className={cn(
                    "p-4 flex justify-between items-center",
                    isFallout 
                        ? "bg-transparent border-b border-[var(--fo-primary-dim)]"
                        : isChicago95
                            ? "chi95-titlebar border-b border-[#808080]"
                        : "bg-[var(--mc-bg)] border-b-4 border-[var(--mc-dark-border)]"
                )}>
                    <div className="flex items-center gap-2">
                        <ThemeIcon type="book" scale={1.5} />
                        <h2 className={isFallout ? "fo-heading text-xl mb-0 border-none" : isChicago95 ? "text-white text-lg font-bold" : "mc-heading text-xl"}>
                            {isFallout ? 'DATA_LOGS' : isChicago95 ? 'History' : 'History'}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className={cn(
                            "h-9 w-9 flex items-center justify-center cursor-pointer group",
                            isFallout 
                                ? "fo-button p-0"
                                : isChicago95
                                    ? "chi95-button chi95-control-btn"
                                : "bg-[var(--mc-bg)] border-2 border-black shadow-[inset_2px_2px_0_0_var(--mc-light-border),inset_-2px_-2px_0_0_var(--mc-dark-border)] hover:brightness-110 active:shadow-[inset_2px_2px_0_0_var(--mc-dark-border),inset_-2px_-2px_0_0_var(--mc-light-border)] transition-all"
                        )}
                        aria-label="Close history"
                    >
                        {isChicago95 ? (
                            "x"
                        ) : (
                            <span className={cn(
                                "text-3xl leading-none pb-1",
                                isFallout ? "" : "mc-text-gray group-hover:text-black"
                            )}>×</span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className={cn(
                    "flex-1 overflow-y-auto p-2 space-y-3",
                    isFallout ? "bg-transparent scrollbar-thin scrollbar-thumb-[var(--fo-primary-dim)] scrollbar-track-transparent" : isChicago95 ? "bg-[#c0c0c0]" : "bg-[var(--mc-slot-bg)]"
                )}>
                    {loading && history.length === 0 ? (
                        <div className={cn(
                            "text-center p-4 text-xl",
                            isFallout ? "fo-text animate-pulse" : isChicago95 ? "chi95-text" : "mc-text-white"
                        )}>{isFallout ? 'ACCESSING ARCHIVES...' : 'Loading...'}</div>
                    ) : history.length === 0 ? (
                        <div className={cn(
                            "text-center p-8",
                            isFallout ? "fo-text" : isChicago95 ? "chi95-text" : "mc-text-white"
                        )}>
                            <p className="text-xl">{isFallout ? 'NO RECORDS FOUND' : 'No calculations yet.'}</p>
                            <p className={cn("text-base mt-2", isChicago95 ? "text-black" : "opacity-70")}>Calculations will appear here.</p>
                        </div>
                    ) : (
                        history.map((record) => {
                            const currentFormat = getFormatForRecord(record.id)
                            return (
                                <div 
                                    key={record.id}
                                    className={cn(
                                        "p-3 transition-all hover:bg-opacity-50",
                                        isFallout 
                                            ? "bg-[rgba(0,0,0,0.3)] border border-[var(--fo-primary-dim)] hover:border-[var(--fo-primary)]"
                                            : isChicago95
                                                ? "chi95-panel border border-[#808080]"
                                            : "bg-[var(--mc-bg)] border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-light-border),inset_-2px_-2px_0_0_var(--mc-shadow)]"
                                    )}
                                >
                                    {/* Header: Name + Time */}
                                    <div className="flex justify-between items-center mb-2">
                                        <div className={cn(
                                            "font-bold truncate pr-2 text-xl",
                                            isFallout ? "fo-text" : isChicago95 ? "chi95-text text-black" : "mc-text-dark"
                                        )}>
                                            {record.name || (isFallout ? "UNKNOWN_ENTRY" : "Untitled")}
                                        </div>
                                        <div className={cn(
                                            "text-base whitespace-nowrap",
                                            isFallout ? "fo-text-dim opacity-70" : isChicago95 ? "chi95-text text-black text-sm font-medium" : "mc-text-dark opacity-70"
                                        )}>
                                            {getRelativeTime(record.created_at)}
                                        </div>
                                    </div>

                                    {/* Dates Section - Primary Focus */}
                                    <div className={cn(
                                        "space-y-1 mb-2 py-2 border-y",
                                        isFallout ? "border-[var(--fo-primary-dim)] border-dashed" : isChicago95 ? "border-[#808080]" : "border-[var(--mc-dark-border)] border-y-2"
                                        )}
                                    >
                                        <div className={cn("flex justify-between items-center text-lg", isFallout ? "fo-text" : isChicago95 ? "chi95-text" : "mc-text-dark")}>
                                            <span className={isChicago95 ? "font-medium text-black" : "opacity-70"}>Pack:</span>
                                            <span className="font-bold">{record.input_data.packDate ? new Date(record.input_data.packDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className={cn("flex justify-between items-center text-lg", isFallout ? "fo-text" : isChicago95 ? "chi95-text" : "mc-text-dark")}>
                                            <span className={isChicago95 ? "font-medium text-black" : "opacity-70"}>Pickup:</span>
                                            <span className="font-bold">{record.input_data.loadDate ? new Date(record.input_data.loadDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 pt-1">
                                            <span className={cn("text-lg", isFallout ? "fo-text opacity-70" : isChicago95 ? "chi95-text text-black font-medium" : "mc-text-dark opacity-70")}>RDD:</span>
                                            <span className={cn(
                                                "font-bold text-lg",
                                                isFallout ? "fo-text-glow" : isChicago95 ? "chi95-text text-black" : "mc-text-yellow"
                                            )}>
                                                {record.result_data?.rddDisplay || "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Weight & Distance + Copy Controls */}
                                    <div className={cn("flex justify-between", isChicago95 ? "items-center" : "items-end")}>
                                        {/* Weight & Distance - Secondary */}
                                        <div className={cn(
                                            "flex flex-col text-base pb-1",
                                            isFallout ? "fo-text-dim opacity-80" : isChicago95 ? "chi95-text text-black" : "mc-text-dark opacity-80"
                                        )}>
                                            <span>{record.input_data.weight} lbs</span>
                                            <span>{record.input_data.distance} mi</span>
                                        </div>

                                        {/* Copy Controls - Compact Format Toggle with Copy */}
                                        <div className={cn("flex items-stretch", isChicago95 ? "gap-0.5" : "gap-1")}>
                                            {/* Previous Format */}
                                            <Button
                                                onClick={() => cycleFormat(record.id, 'prev')}
                                                className={cn(
                                                    "h-8 p-0 flex items-center justify-center text-sm leading-none",
                                                    isChicago95 ? "w-7" : "w-6"
                                                )}
                                                variant={isFallout ? 'outline' : 'default'}
                                                title="Previous format"
                                            >
                                                «
                                            </Button>
                                            
                                            {/* Copy Button with Format Display */}
                                            <div className="group relative">
                                                <Button
                                                    onClick={() => handleCopy(record)}
                                                    className={cn(
                                                        "h-8 px-2 flex items-center justify-center gap-1 text-sm leading-none",
                                                        isChicago95 ? "min-w-[80px]" : "min-w-[60px]"
                                                    )}
                                                    variant={isFallout ? 'outline' : 'default'}
                                                >
                                                    {FORMAT_ACRONYMS[currentFormat]}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="shrink-0 ml-1" stroke="currentColor" strokeWidth="1">
                                                        <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                                                    </svg>
                                                </Button>
                                                {/* Hover Tooltip */}
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    Copy to Clipboard
                                                </span>
                                            </div>
                                            
                                            {/* Next Format */}
                                            <Button
                                                onClick={() => cycleFormat(record.id, 'next')}
                                                className={cn(
                                                    "h-8 p-0 flex items-center justify-center text-sm leading-none",
                                                    isChicago95 ? "w-7" : "w-6"
                                                )}
                                                variant={isFallout ? 'outline' : 'default'}
                                                title="Next format"
                                            >
                                                »
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </>
    )
}
