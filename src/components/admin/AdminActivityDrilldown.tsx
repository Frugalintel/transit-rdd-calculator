"use client"

import { Button } from '@/components/ui/button'
import { AdminActivityLogRow } from '@/types/dashboard'
import { formatEasternDateTime } from '@/utils/timezone'

interface AdminActivityDrilldownProps {
    log: AdminActivityLogRow
    onClose?: () => void
}

export function AdminActivityDrilldown({ log, onClose }: AdminActivityDrilldownProps) {
    const actor = log.userEmail || (log.user_id ? `User ${log.user_id.slice(0, 8)}` : 'Unknown')

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <p className="mc-text-muted text-lg">Admin Activity Drilldown</p>
                    <p className="mc-admin-heading text-3xl capitalize">
                        {(log.action_type || 'unknown_action').replace(/_/g, ' ')}
                    </p>
                </div>
                <Button variant="secondary" onClick={onClose}>Close Drilldown</Button>
            </div>

            <div className="mc-panel p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="mc-slot-dark p-3">
                        <div className="mc-text-muted text-sm">Time (ET)</div>
                        <div className="mc-admin-text">{formatEasternDateTime(log.created_at)}</div>
                    </div>
                    <div className="mc-slot-dark p-3">
                        <div className="mc-text-muted text-sm">Actor</div>
                        <div className="mc-admin-text">{actor}</div>
                    </div>
                    <div className="mc-slot-dark p-3">
                        <div className="mc-text-muted text-sm">Role</div>
                        <div className="mc-admin-text">{log.userRole || 'admin'}</div>
                    </div>
                    <div className="mc-slot-dark p-3">
                        <div className="mc-text-muted text-sm">Action Type</div>
                        <div className="mc-admin-text capitalize">{(log.action_type || 'unknown_action').replace(/_/g, ' ')}</div>
                    </div>
                </div>

                <div className="mt-4 mc-slot-dark p-3">
                    <div className="mc-text-muted text-sm mb-2">Details</div>
                    <pre className="mc-admin-text text-sm whitespace-pre-wrap break-all">
                        {JSON.stringify(log.details || {}, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}

