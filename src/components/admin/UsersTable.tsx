"use client"
import { DataTable } from '@/components/admin/DataTable'
import { ThemeIcon } from '@/components/ThemeIcon'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ADMIN_PERMISSION_KEYS, AdminPermissionKey } from '@/utils/adminPermissions'

interface User {
    id: string
    role: string
    status?: 'invited' | 'active' | 'suspended' | 'disabled'
    is_owner?: boolean
    email?: string | null
    updated_at: string
}

interface ActorPermissions {
    canUpdateStatus: boolean
    canUpdateRole: boolean
    canManagePermissions: boolean
    canOverrideTemplates: boolean
}

interface PermissionGrantRow {
    permission_key: string
    granted_by: string | null
    granted_at: string
}

interface TemplateOverrideRow {
    format_key: string
    template_text: string
    updated_at: string
}

const RESTRICTED_PERMISSION_KEYS: AdminPermissionKey[] = ['users.permissions.update', 'users.role.update']
const COPY_FORMATS = ['simple', 'osnp', 'osp', 'isp', 'isnp', 'dpsr'] as const

export function UsersTable({ users: initialUsers }: { users: User[] }) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [isLoading, setIsLoading] = useState(false)
    const [actorPermissions, setActorPermissions] = useState<ActorPermissions>({
        canUpdateStatus: false,
        canUpdateRole: false,
        canManagePermissions: false,
        canOverrideTemplates: false,
    })

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [roleDraft, setRoleDraft] = useState<'user' | 'admin'>('user')
    const [statusDraft, setStatusDraft] = useState<'invited' | 'active' | 'suspended' | 'disabled'>('active')
    const [isSavingProfile, setIsSavingProfile] = useState(false)

    const [permissionRows, setPermissionRows] = useState<PermissionGrantRow[]>([])
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
    const [isSavingPermission, setIsSavingPermission] = useState(false)

    const [templateRows, setTemplateRows] = useState<TemplateOverrideRow[]>([])
    const [selectedFormat, setSelectedFormat] = useState<(typeof COPY_FORMATS)[number]>('simple')
    const [templateDraft, setTemplateDraft] = useState('')
    const [isSavingTemplate, setIsSavingTemplate] = useState(false)

    const permissionSet = useMemo(
        () => new Set(permissionRows.map((row) => row.permission_key)),
        [permissionRows]
    )

    const templateMap = useMemo(() => {
        const map = new Map<string, string>()
        for (const row of templateRows) {
            map.set(row.format_key, row.template_text)
        }
        return map
    }, [templateRows])

    useEffect(() => {
        setTemplateDraft(templateMap.get(selectedFormat) || '')
    }, [selectedFormat, templateMap])

    useEffect(() => {
        void refreshUsers()
    }, [])

    async function refreshUsers() {
        setIsLoading(true)
        try {
            const response = await fetch('/api/admin/users', { cache: 'no-store' })
            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(payload?.error || 'Failed to load users.')
                return
            }
            setUsers(payload.users || [])
            if (payload.actorPermissions) {
                setActorPermissions(payload.actorPermissions)
            }
        } catch {
            toast.error('Failed to load users.')
        } finally {
            setIsLoading(false)
        }
    }

    async function quickToggleStatus(user: User) {
        if (!actorPermissions.canUpdateStatus || user.is_owner) return
        const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
            })
            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(payload?.error || 'Failed to update status.')
                return
            }
            toast.success(`Status changed to ${nextStatus}.`)
            await refreshUsers()
        } catch {
            toast.error('Failed to update status.')
        }
    }

    async function openUserDialog(user: User) {
        setSelectedUser(user)
        setRoleDraft((user.role === 'admin' ? 'admin' : 'user'))
        setStatusDraft(user.status || 'active')
        setPermissionRows([])
        setTemplateRows([])
        setSelectedFormat('simple')
        setTemplateDraft('')
        setIsDialogOpen(true)

        if (actorPermissions.canManagePermissions && user.role === 'admin' && !user.is_owner) {
            setIsLoadingPermissions(true)
            try {
                const response = await fetch(`/api/admin/users/${user.id}/permissions`, {
                    cache: 'no-store',
                })
                const payload = await response.json().catch(() => ({}))
                if (response.ok) {
                    setPermissionRows(payload.permissions || [])
                }
            } finally {
                setIsLoadingPermissions(false)
            }
        }

        if (actorPermissions.canOverrideTemplates && !user.is_owner) {
            try {
                const response = await fetch(`/api/admin/users/${user.id}/template-overrides`, {
                    cache: 'no-store',
                })
                const payload = await response.json().catch(() => ({}))
                if (response.ok) {
                    const overrides = payload.overrides || []
                    setTemplateRows(overrides)
                    if (overrides.length > 0) {
                        const firstFormat = overrides[0]?.format_key
                        if (COPY_FORMATS.includes(firstFormat)) {
                            setSelectedFormat(firstFormat)
                        }
                    }
                }
            } catch {
                // Non-blocking: keep dialog usable even if template query fails.
            }
        }
    }

    async function saveProfileChanges() {
        if (!selectedUser) return
        setIsSavingProfile(true)
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: roleDraft,
                    status: statusDraft,
                }),
            })
            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(payload?.error || 'Failed to update user.')
                return
            }
            toast.success('User updated.')
            const refreshedUser = payload?.user as User | undefined
            if (refreshedUser) {
                setSelectedUser(refreshedUser)
            }
            await refreshUsers()
        } catch {
            toast.error('Failed to update user.')
        } finally {
            setIsSavingProfile(false)
        }
    }

    async function togglePermission(permissionKey: AdminPermissionKey) {
        if (!selectedUser) return
        setIsSavingPermission(true)
        try {
            const granted = permissionSet.has(permissionKey)
            const response = await fetch(`/api/admin/users/${selectedUser.id}/permissions`, {
                method: granted ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissionKey }),
            })
            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(payload?.error || 'Failed to update permission.')
                return
            }
            toast.success(granted ? 'Permission revoked.' : 'Permission granted.')

            const permissionsResponse = await fetch(`/api/admin/users/${selectedUser.id}/permissions`, {
                cache: 'no-store',
            })
            const permissionsPayload = await permissionsResponse.json().catch(() => ({}))
            if (permissionsResponse.ok) {
                setPermissionRows(permissionsPayload.permissions || [])
            }
        } catch {
            toast.error('Failed to update permission.')
        } finally {
            setIsSavingPermission(false)
        }
    }

    async function saveTemplateOverride() {
        if (!selectedUser) return
        setIsSavingTemplate(true)
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}/template-overrides`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formatKey: selectedFormat,
                    templateText: templateDraft,
                }),
            })
            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(payload?.error || 'Failed to save template override.')
                return
            }
            toast.success('Template override saved.')
            await openUserDialog(selectedUser)
        } catch {
            toast.error('Failed to save template override.')
        } finally {
            setIsSavingTemplate(false)
        }
    }

    async function deleteTemplateOverride() {
        if (!selectedUser) return
        setIsSavingTemplate(true)
        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}/template-overrides`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formatKey: selectedFormat,
                }),
            })
            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                toast.error(payload?.error || 'Failed to remove template override.')
                return
            }
            toast.success('Template override removed.')
            await openUserDialog(selectedUser)
        } catch {
            toast.error('Failed to remove template override.')
        } finally {
            setIsSavingTemplate(false)
        }
    }

    return (
        <>
            <DataTable
                data={users}
                columns={[
                    {
                        header: 'User',
                        accessor: (row: User) => (
                            <div className="space-y-1">
                                <div className={isFallout ? 'fo-text font-mono text-sm' : isChicago95 ? 'chi95-text font-mono text-xs' : 'mc-admin-text font-mono text-sm'}>
                                    {row.email || row.id}
                                </div>
                                {row.email && (
                                    <div className={isFallout ? 'fo-small text-xs opacity-70' : isChicago95 ? 'chi95-text text-xs opacity-70' : 'mc-text-muted text-xs'}>
                                        {row.id}
                                    </div>
                                )}
                            </div>
                        ),
                        width: '35%',
                    },
                    {
                        header: 'Role',
                        accessor: (row: User) => (
                            <span
                                className={`
                                    px-3 py-1 text-sm font-bold uppercase tracking-wide
                                    ${isFallout
                                        ? 'border border-[var(--fo-primary)] text-[var(--fo-primary)]'
                                        : isChicago95
                                            ? row.role === 'admin'
                                                ? 'border border-[#800000] bg-[#d7a4a4] text-[#4a0000]'
                                                : 'border border-[#000080] bg-[#b8c8ff] text-[#000040]'
                                            : row.role === 'admin'
                                                ? 'bg-[#aa3333] border-2 border-[#ff5555] text-white'
                                                : 'bg-[#4455aa] border-2 border-[#7788ff] text-white'
                                    }
                                `}
                                style={{ textShadow: isFallout || isChicago95 ? 'none' : '1px 1px 0 #1a1a1a' }}
                            >
                                {row.is_owner ? 'owner' : row.role}
                            </span>
                        ),
                        width: '18%',
                    },
                    {
                        header: 'Status',
                        accessor: (row: User) => (
                            <span
                                className={`px-2 py-1 text-xs font-semibold uppercase tracking-wide border ${
                                    row.status === 'active'
                                        ? 'border-green-600 text-green-700'
                                        : row.status === 'suspended'
                                            ? 'border-yellow-600 text-yellow-700'
                                            : row.status === 'disabled'
                                                ? 'border-red-600 text-red-700'
                                                : 'border-blue-600 text-blue-700'
                                }`}
                            >
                                {row.status || 'active'}
                            </span>
                        ),
                        width: '16%',
                    },
                    {
                        header: 'Last Active',
                        accessor: (row: User) => (
                            <span className={isFallout ? 'fo-text' : isChicago95 ? 'chi95-text' : 'mc-admin-text'}>
                                {new Date(row.updated_at).toLocaleDateString()}
                            </span>
                        ),
                    },
                ]}
                actions={(row) => (
                    <div className="flex gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            title="Manage User"
                            onClick={(event) => {
                                event.stopPropagation()
                                void openUserDialog(row)
                            }}
                            className={isFallout ? 'fo-button-ghost' : isChicago95 ? 'chi95-button-ghost' : ''}
                        >
                            <ThemeIcon type="book" />
                        </Button>
                        {actorPermissions.canUpdateStatus && !row.is_owner && (
                            <Button
                                size="sm"
                                variant={row.status === 'suspended' ? 'primary' : 'warning'}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    void quickToggleStatus(row)
                                }}
                            >
                                {row.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </Button>
                        )}
                    </div>
                )}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>User Management</DialogTitle>
                        <DialogDescription>
                            {selectedUser?.email || selectedUser?.id || 'Selected user'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <Select
                                        value={roleDraft}
                                        onValueChange={(value) => setRoleDraft(value as 'user' | 'admin')}
                                        disabled={!actorPermissions.canUpdateRole || selectedUser.is_owner}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Delegated Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={statusDraft}
                                        onValueChange={(value) => setStatusDraft(value as 'invited' | 'active' | 'suspended' | 'disabled')}
                                        disabled={!actorPermissions.canUpdateStatus || selectedUser.is_owner}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="invited">Invited</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                            <SelectItem value="disabled">Disabled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {(actorPermissions.canUpdateRole || actorPermissions.canUpdateStatus) && (
                                <div className="flex justify-end">
                                    <Button
                                        variant="primary"
                                        onClick={() => void saveProfileChanges()}
                                        disabled={isSavingProfile || selectedUser.is_owner}
                                    >
                                        {isSavingProfile ? 'Saving...' : 'Save User Changes'}
                                    </Button>
                                </div>
                            )}

                            {actorPermissions.canManagePermissions && selectedUser.role === 'admin' && !selectedUser.is_owner && (
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="text-lg font-semibold">Restricted Admin Permissions</h3>
                                    {isLoadingPermissions ? (
                                        <p className="text-sm opacity-75">Loading permissions...</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {RESTRICTED_PERMISSION_KEYS.filter((key) => ADMIN_PERMISSION_KEYS.includes(key)).map((permissionKey) => (
                                                <Button
                                                    key={permissionKey}
                                                    size="sm"
                                                    variant={permissionSet.has(permissionKey) ? 'destructive' : 'secondary'}
                                                    onClick={() => void togglePermission(permissionKey)}
                                                    disabled={isSavingPermission}
                                                >
                                                    {permissionSet.has(permissionKey) ? `Revoke ${permissionKey}` : `Grant ${permissionKey}`}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {actorPermissions.canOverrideTemplates && !selectedUser.is_owner && (
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="text-lg font-semibold">Copy Template Overrides</h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Select
                                            value={selectedFormat}
                                            onValueChange={(value) => setSelectedFormat(value as (typeof COPY_FORMATS)[number])}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COPY_FORMATS.map((format) => (
                                                    <SelectItem key={format} value={format}>
                                                        {format.toUpperCase()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-2 text-sm opacity-75">
                                            {templateMap.has(selectedFormat) ? 'Override exists' : 'No override for this format'}
                                        </div>
                                    </div>

                                    <Textarea
                                        value={templateDraft}
                                        onChange={(event) => setTemplateDraft(event.target.value)}
                                        className="min-h-[140px]"
                                        placeholder="Template override text..."
                                    />

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="destructive"
                                            onClick={() => void deleteTemplateOverride()}
                                            disabled={!templateMap.has(selectedFormat) || isSavingTemplate}
                                        >
                                            Remove Override
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={() => void saveTemplateOverride()}
                                            disabled={!templateDraft.trim() || isSavingTemplate}
                                        >
                                            {isSavingTemplate ? 'Saving...' : 'Save Override'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {isLoading && (
                <p className={`mt-2 text-sm ${isFallout ? 'fo-text-dim' : isChicago95 ? 'chi95-text' : 'mc-text-muted'}`}>
                    Refreshing users...
                </p>
            )}
        </>
    )
}

