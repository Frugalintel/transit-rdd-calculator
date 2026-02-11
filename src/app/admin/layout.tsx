import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ScanlineOverlay } from '@/components/fallout/ScanlineOverlay'

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

    // First choice: SQL helper tied to auth.uid(). Retry on transient errors.
    let isAdmin: boolean | null = null
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        const { data: isAdminFn, error: isAdminFnError } = await supabase.rpc('is_admin')
        if (!isAdminFnError) {
            isAdmin = isAdminFn === true
            break
        }
        if (attempt < RETRY_DELAYS_MS.length) {
            await sleep(RETRY_DELAYS_MS[attempt])
        }
    }

    // Fallback path: direct profile role lookup if RPC is unavailable.
    if (isAdmin === null) {
        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()

            if (!profileError) {
                isAdmin = profile?.role === 'admin'
                break
            }
            if (attempt < RETRY_DELAYS_MS.length) {
                await sleep(RETRY_DELAYS_MS[attempt])
            }
        }
    }

    // If checks remain indeterminate, deny by default.
    if (isAdmin !== true) {
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
