"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/context/ThemeContext"
import { cn } from "@/lib/utils"

export function AuthForm({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [view, setView] = useState<'login' | 'signup'>('login')
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'

    const supabase = createClient()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                toast.success("Login successful!")
                onClose()
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password
                })
                if (error) throw error
                toast.success("Account created!")
                onClose()
            }
        } catch (err: any) {
            toast.error(err.message || "Authentication failed!")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md data-[state=open]:animate-none data-[state=closed]:animate-none">
                <DialogHeader>
                    <DialogTitle className={cn("text-2xl", isFallout ? "fo-heading border-none mb-0 pb-0" : "mc-heading")}>
                        {view === 'login' 
                            ? (isFallout ? 'ACCESS TERMINAL' : 'Login to Server')
                            : (isFallout ? 'NEW USER REGISTRATION' : 'Create Account')}
                    </DialogTitle>
                    <DialogDescription className={cn("text-base", isFallout ? "fo-text-dim mt-1" : "mc-body")}>
                        {view === 'login' 
                            ? (isFallout ? 'Enter credentials to access system' : 'Enter your credentials to continue')
                            : (isFallout ? 'Register new user account' : 'Register a new account')}
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAuth} className="space-y-6">
                    {isFallout && (
                        <div className="text-xs fo-text-dim border-b border-[var(--fo-primary-dim)] pb-2 mb-4">
                            SECURE CONNECTION ESTABLISHED
                        </div>
                    )}

                    <div className={cn(
                        "space-y-4",
                        !isFallout && "p-4 mc-slot"
                    )}>
                        <div className="space-y-1">
                            <Label className={isFallout ? "fo-label text-xs" : ""}>{isFallout ? 'USER ID' : 'Email Address'}</Label>
                            <Input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                placeholder={isFallout ? "user@vault-tec.com" : "player@minecraft.net"}
                                className={isFallout ? "fo-input" : ""}
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <Label className={isFallout ? "fo-label text-xs" : ""}>{isFallout ? 'PASSWORD' : 'Password'}</Label>
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                                placeholder={isFallout ? "••••••••" : "••••••••"}
                                className={isFallout ? "fo-input" : ""}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button 
                            type="submit" 
                            variant={isFallout ? "ghost" : "primary"} 
                            disabled={loading} 
                            className={cn("w-full", isFallout && "fo-button border-2 hover:bg-[var(--fo-primary)] hover:text-black")}
                        >
                            {loading 
                                ? (isFallout ? 'PROCESSING...' : 'Please wait...') 
                                : (view === 'login' 
                                    ? (isFallout ? '[ LOGIN ]' : 'Login') 
                                    : (isFallout ? '[ CREATE ACCOUNT ]' : 'Create Account'))}
                        </Button>
                        
                        <Button 
                            type="button"
                            variant="ghost"
                            className={cn("w-full text-sm", isFallout && "fo-button-link opacity-70 hover:opacity-100")}
                            onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                        >
                            {view === 'login' 
                                ? (isFallout ? '> Register New User' : 'New player? Register') 
                                : (isFallout ? '> Back to Login' : 'Back to Login')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
