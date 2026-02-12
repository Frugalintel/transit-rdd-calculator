"use client"

import { Button } from '@/components/ui/button'
import { AdminActivityLogRow } from '@/types/dashboard'
import { formatEasternDateTime } from '@/utils/timezone'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface AdminActivityDrilldownProps {
    log: AdminActivityLogRow
    onClose?: () => void
}

export function AdminActivityDrilldown({ log, onClose }: AdminActivityDrilldownProps) {
    const actor = log.userEmail || (log.user_id ? `User ${log.user_id.slice(0, 8)}` : 'Unknown')
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <p className={cn(isFallout ? "fo-text-dim text-sm" : isChicago95 ? "chi95-text text-xs" : "mc-text-muted text-lg")}>Admin Activity Drilldown</p>
                    <p className={cn(isFallout ? "fo-heading text-2xl border-none capitalize" : isChicago95 ? "chi95-text text-xl font-bold capitalize" : "mc-admin-heading text-3xl capitalize")}>
                        {(log.action_type || 'unknown_action').replace(/_/g, ' ')}
                    </p>
                </div>
                <Button variant="secondary" onClick={onClose}>Close Drilldown</Button>
            </div>

            <div className={isFallout ? "fo-panel p-4" : isChicago95 ? "chi95-window p-4" : "mc-panel p-4"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={isFallout ? "border border-[var(--fo-primary-dim)] p-3" : isChicago95 ? "chi95-panel p-3" : "mc-slot-dark p-3"}>
                        <div className={isFallout ? "fo-text-dim text-sm" : isChicago95 ? "chi95-text text-xs" : "mc-text-muted text-sm"}>Time (ET)</div>
                        <div className={isFallout ? "fo-text" : isChicago95 ? "chi95-text" : "mc-admin-text"}>{formatEasternDateTime(log.created_at)}</div>
                    </div>
                    <div className={isFallout ? "border border-[var(--fo-primary-dim)] p-3" : isChicago95 ? "chi95-panel p-3" : "mc-slot-dark p-3"}>
                        <div className={isFallout ? "fo-text-dim text-sm" : isChicago95 ? "chi95-text text-xs" : "mc-text-muted text-sm"}>Actor</div>
                        <div className={isFallout ? "fo-text" : isChicago95 ? "chi95-text" : "mc-admin-text"}>{actor}</div>
                    </div>
                    <div className={isFallout ? "border border-[var(--fo-primary-dim)] p-3" : isChicago95 ? "chi95-panel p-3" : "mc-slot-dark p-3"}>
                        <div className={isFallout ? "fo-text-dim text-sm" : isChicago95 ? "chi95-text text-xs" : "mc-text-muted text-sm"}>Role</div>
                        <div className={isFallout ? "fo-text" : isChicago95 ? "chi95-text" : "mc-admin-text"}>{log.userRole || 'admin'}</div>
                    </div>
                    <div className={isFallout ? "border border-[var(--fo-primary-dim)] p-3" : isChicago95 ? "chi95-panel p-3" : "mc-slot-dark p-3"}>
                        <div className={isFallout ? "fo-text-dim text-sm" : isChicago95 ? "chi95-text text-xs" : "mc-text-muted text-sm"}>Action Type</div>
                        <div className={isFallout ? "fo-text capitalize" : isChicago95 ? "chi95-text capitalize" : "mc-admin-text capitalize"}>{(log.action_type || 'unknown_action').replace(/_/g, ' ')}</div>
                    </div>
                </div>

                <div className={isFallout ? "mt-4 border border-[var(--fo-primary-dim)] p-3" : isChicago95 ? "mt-4 chi95-panel p-3" : "mt-4 mc-slot-dark p-3"}>
                    <div className={isFallout ? "fo-text-dim text-sm mb-2" : isChicago95 ? "chi95-text text-xs mb-2" : "mc-text-muted text-sm mb-2"}>Details</div>
                    <pre className={isFallout ? "fo-text text-sm whitespace-pre-wrap break-all" : isChicago95 ? "chi95-text text-xs whitespace-pre-wrap break-all" : "mc-admin-text text-sm whitespace-pre-wrap break-all"}>
                        {JSON.stringify(log.details || {}, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}

