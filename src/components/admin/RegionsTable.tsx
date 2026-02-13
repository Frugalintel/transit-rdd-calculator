"use client"

import { useState } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'
import { toast } from 'sonner'
import { useTheme } from '@/context/ThemeContext'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface RegionUser {
    id: string
    email: string
}

interface Region {
    id: string
    name: string
    slug: string
    user_1_id: string | null
    user_2_id: string | null
    user1?: RegionUser
    user2?: RegionUser
    updated_at: string
}

interface RegionsTableProps {
    initialRegions: Region[]
    users: RegionUser[]
}

export function RegionsTable({ initialRegions, users }: RegionsTableProps) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'
    
    const [regions, setRegions] = useState<Region[]>(initialRegions)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    
    // Edit state
    const [user1Id, setUser1Id] = useState<string>('none')
    const [user2Id, setUser2Id] = useState<string>('none')

    const refreshRegions = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/admin/regions')
            const data = await response.json()
            if (response.ok) {
                setRegions(data.regions || [])
            }
        } catch {
            toast.error('Failed to refresh regions')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (region: Region) => {
        setSelectedRegion(region)
        setUser1Id(region.user_1_id || 'none')
        setUser2Id(region.user_2_id || 'none')
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selectedRegion) return

        setIsSaving(true)
        try {
            const response = await fetch('/api/admin/regions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedRegion.id,
                    user_1_id: user1Id === 'none' ? null : user1Id,
                    user_2_id: user2Id === 'none' ? null : user2Id,
                }),
            })

            if (!response.ok) throw new Error('Failed to update')

            toast.success('Region updated')
            setIsDialogOpen(false)
            refreshRegions()
        } catch {
            toast.error('Failed to update region')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <DataTable
                data={regions}
                columns={[
                    { header: 'Region Name', accessor: 'name', width: '30%' },
                    { 
                        header: 'User 1', 
                        accessor: (row) => row.user1?.email || <span className="opacity-50 italic">Unassigned</span>,
                        width: '30%'
                    },
                    { 
                        header: 'User 2', 
                        accessor: (row) => row.user2?.email || <span className="opacity-50 italic">Unassigned</span>,
                        width: '30%'
                    }
                ]}
                actions={(row) => (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(row)}
                        className={isFallout ? "fo-button-ghost" : isChicago95 ? "chi95-button-ghost" : ""}
                    >
                        <ThemeIcon type="name_tag" />
                    </Button>
                )}
            />

            {isLoading && (
                <p className="mt-2 text-sm opacity-70">Refreshing regions...</p>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Region: {selectedRegion?.name}</DialogTitle>
                        <DialogDescription>Assign users to this region.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">User 1 (Primary)</label>
                            <Select value={user1Id} onValueChange={setUser1Id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select user..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Unassigned --</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={`u1-${u.id}`} value={u.id}>
                                            {u.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">User 2 (Secondary)</label>
                            <Select value={user2Id} onValueChange={setUser2Id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select user..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Unassigned --</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={`u2-${u.id}`} value={u.id}>
                                            {u.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving || (user1Id !== 'none' && user1Id === user2Id)}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
