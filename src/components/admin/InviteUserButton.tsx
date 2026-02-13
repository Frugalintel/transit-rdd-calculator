"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'

type InviteRole = 'user' | 'admin'
type InviteStatus = 'invited' | 'active'

export function InviteUserButton({ onInvited }: { onInvited?: () => void }) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const router = useRouter()

    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<InviteRole>('user')
    const [status, setStatus] = useState<InviteStatus>('invited')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!email.trim()) {
            toast.error('Enter an email address.')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/admin/invite-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), role, status }),
            })

            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(payload?.error || 'Failed to send invite.')
                return
            }

            toast.success(`Invite sent to ${email.trim()}.`)
            setEmail('')
            setRole('user')
            setStatus('invited')
            setIsOpen(false)
            router.refresh()
            onInvited?.()
        } catch {
            toast.error('Failed to send invite.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Button
                variant="primary"
                size="default"
                onClick={() => setIsOpen(true)}
                className={isFallout ? 'fo-button' : ''}
            >
                Invite User
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Invite User</DialogTitle>
                        <DialogDescription>
                            Send an email invite for admin tool access.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleInvite} className="space-y-4">
                        <Input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="user@example.com"
                            autoFocus
                            required
                            className={isFallout ? 'fo-input' : ''}
                        />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Initial Role</label>
                                <Select value={role} onValueChange={(value) => setRole(value as InviteRole)}>
                                    <SelectTrigger className={isFallout ? 'fo-input' : ''}>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Delegated Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Initial Status</label>
                                <Select value={status} onValueChange={(value) => setStatus(value as InviteStatus)}>
                                    <SelectTrigger className={isFallout ? 'fo-input' : ''}>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="invited">Invited</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Send Invite'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
