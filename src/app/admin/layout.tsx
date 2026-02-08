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

    // Run auth check and profile fetch in parallel
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
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
