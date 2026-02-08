import { createClient } from '@/utils/supabase/server'
import { DataManager } from '@/components/admin/DataManager'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Cache for 60 seconds - reference data changes rarely
export const revalidate = 60

export default async function DataPage() {
    const supabase = await createClient()

    // Run all queries in parallel
    const [
        { data: holidays },
        { data: seasons },
        { data: weights }
    ] = await Promise.all([
        supabase.from('federal_holidays').select('*').order('date'),
        supabase.from('peak_seasons').select('*').order('start_date'),
        supabase.from('transit_weights').select('*').order('min_weight')
    ])

    return (
        <div className="space-y-6">
            <AdminPageHeader title="Data Management" icon="book" />
            <DataManager 
                holidays={holidays || []} 
                seasons={seasons || []} 
                weights={weights || []} 
            />
        </div>
    )
}
