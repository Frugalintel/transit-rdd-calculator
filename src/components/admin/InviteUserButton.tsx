"use client"

import { useState } from 'react'
import { toast } from 'sonner'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'

export function InviteUserButton() {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'

    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
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
                body: JSON.stringify({ email: email.trim() }),
            })

            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(payload?.error || 'Failed to send invite.')
                return
            }

            toast.success(`Invite sent to ${email.trim()}.`)
            setEmail('')
            setIsOpen(false)
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
