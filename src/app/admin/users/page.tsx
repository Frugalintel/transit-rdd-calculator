import { createClient } from '@/utils/supabase/server'
import { UsersTable } from '@/components/admin/UsersTable'
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

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
                actions={<Button variant="primary" size="default">Invite User</Button>}
            />
            <UsersTable users={users || []} />
        </div>
    )
}
