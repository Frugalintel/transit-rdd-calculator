import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ScanlineOverlay } from '@/components/fallout/ScanlineOverlay'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Use both checks to avoid false negatives when one endpoint is flaky.
    const [{ data: userData }, { data: sessionData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
    ])
    const user = userData.user ?? sessionData.session?.user ?? null

    if (!user) {
        redirect('/')
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    let isAdmin = profile?.role === 'admin'

    // Fallback path: if profile query fails, rely on existing SQL helper.
    if (!isAdmin && profileError) {
        const { data: isAdminFn, error: isAdminFnError } = await supabase.rpc('is_admin')
        if (!isAdminFnError && isAdminFn === true) {
            isAdmin = true
        }
    }

    if (!isAdmin) {
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
