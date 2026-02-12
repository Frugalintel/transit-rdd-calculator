import { createClient } from '@/utils/supabase/server'
import { UsersTable } from '@/components/admin/UsersTable'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { InviteUserButton } from '@/components/admin/InviteUserButton'

// Cache for 30 seconds
export const revalidate = 30

export default async function UsersPage() {
    const supabase = await createClient()

    const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })

    return (
        <div className="space-y-6">
            <AdminPageHeader 
                title="User Management" 
                icon="totem"
                actions={<InviteUserButton />}
            />
            <UsersTable users={users || []} />
        </div>
    )
}
