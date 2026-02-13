import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ScanlineOverlay } from '@/components/fallout/ScanlineOverlay'
import { hasAdminPermission } from '@/utils/adminPermissions'

const RETRY_DELAYS_MS = [120, 250]

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Prefer validated user lookup; retry briefly to avoid transient false negatives.
    let user: { id: string } | null = null
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        const { data, error } = await supabase.auth.getUser()
        if (data.user) {
            user = data.user
            break
        }
        if (!error) break
        if (attempt < RETRY_DELAYS_MS.length) {
            await sleep(RETRY_DELAYS_MS[attempt])
        }
    }

    // Fallback: session cookie read can still contain user context while
    // validated getUser() is transiently unavailable.
    if (!user) {
        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            const sessionUser = sessionData.session?.user ?? null
            if (sessionUser) {
                user = sessionUser
                break
            }
            if (!sessionError) break
            if (attempt < RETRY_DELAYS_MS.length) {
                await sleep(RETRY_DELAYS_MS[attempt])
            }
        }
    }

    if (!user) {
        redirect('/')
    }

    // Permission-first gate for admin panel access.
    let hasPanelAccess: boolean | null = null
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        try {
            const hasAccess = await hasAdminPermission(supabase, 'admin.panel.access')
            hasPanelAccess = hasAccess
            break
        } catch {
            // Retry below.
        }
        if (attempt < RETRY_DELAYS_MS.length) {
            await sleep(RETRY_DELAYS_MS[attempt])
        }
    }

    // Legacy fallback if permission function is unavailable.
    if (hasPanelAccess === null) {
        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, status')
                .eq('id', user.id)
                .maybeSingle()

            if (!profileError) {
                hasPanelAccess = profile?.role === 'admin' && (profile?.status ?? 'active') === 'active'
                break
            }
            if (attempt < RETRY_DELAYS_MS.length) {
                await sleep(RETRY_DELAYS_MS[attempt])
            }
        }
    }

    // If checks remain indeterminate, deny by default.
    if (hasPanelAccess !== true) {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-[var(--mc-bg)]">
            <ScanlineOverlay />
            <AdminSidebar />
            {/* Main content area */}
            <div className="ml-56 min-h-screen overflow-x-hidden">
                <div className="min-h-screen p-6 max-w-7xl">
                    {children}
                </div>
            </div>
        </div>
    )
}
