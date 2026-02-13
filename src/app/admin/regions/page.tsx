import { createClient } from '@/utils/supabase/server'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { RegionsTable } from '@/components/admin/RegionsTable'
import { hasAdminPermission } from '@/utils/adminPermissions'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function RegionsPage() {
    const supabase = await createClient()
    
    // Authorization check
    const canManageData = await hasAdminPermission(supabase, 'data.manage')
    if (!canManageData) {
        redirect('/admin')
    }

    // Load regions with assigned user details
    const { data: regions } = await supabase
        .from('regions')
        .select(`
            *,
            user1:profiles!regions_user_1_id_fkey ( id, email ),
            user2:profiles!regions_user_2_id_fkey ( id, email )
        `)
        .order('name', { ascending: true })

    // Load candidate users for dropdowns (active users only)
    const { data: users } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('status', 'active')
        .like('email', 'region%.user%@regions.local')
        .order('email', { ascending: true })

    // Clean up user data to ensure email is present
    const validUsers = (users || [])
        .filter(u => u.email)
        .map(u => ({ id: u.id, email: u.email! }))

    return (
        <div className="space-y-6">
            <AdminPageHeader 
                title="Region Management" 
                icon="compass" 
            />
            
            <RegionsTable 
                initialRegions={regions || []} 
                users={validUsers} 
            />
        </div>
    )
}
