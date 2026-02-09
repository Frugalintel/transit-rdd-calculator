"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface TrainingAccessCheckProps {
    children: React.ReactNode
}

export function TrainingAccessCheck({ children }: TrainingAccessCheckProps) {
    const [isChecking, setIsChecking] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        checkAccess()
    }, [])

    const checkAccess = async () => {
        try {
            // Check if user is admin
            const { data: { session } } = await supabase.auth.getSession()
            let isAdmin = false
            
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()
                
                isAdmin = profile?.role === 'admin'
            }

            // If admin, allow access
            if (isAdmin) {
                setHasAccess(true)
                setIsChecking(false)
                return
            }

            // Check coming soon settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'training_coming_soon')
                .single()

            // Default to showing coming soon if:
            // 1. Settings table doesn't exist (error) - defaults to restricted
            // 2. No settings data found - defaults to restricted  
            // 3. Settings explicitly enabled
            const comingSoonEnabled = !settingsData || settingsData.value?.enabled !== false

            if (comingSoonEnabled) {
                // Redirect to main training page to show coming soon message
                router.push('/training')
                return
            }

            // Allow access if coming soon is disabled
            setHasAccess(true)
        } catch (error) {
            console.error('Access check failed:', error)
            // On error, redirect to main training page
            router.push('/training')
        } finally {
            setIsChecking(false)
        }
    }

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="mc-panel p-8 text-center">
                    <div className="animate-pulse mc-heading text-xl">Loading...</div>
                </div>
            </div>
        )
    }

    if (!hasAccess) {
        return null
    }

    return <>{children}</>
}
