import { createClient } from '@/utils/supabase/server'
import { LogsTable } from '@/components/admin/LogsTable'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Cache for 15 seconds - logs update more frequently
export const revalidate = 15

export default async function LogsPage() {
    const supabase = await createClient()

    // Fetch recent logs
    const { data: logs } = await supabase
        .from('usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <div className="space-y-6">
            <AdminPageHeader title="System Logs" icon="paper" />
            <LogsTable logs={logs || []} />
        </div>
    )
}
