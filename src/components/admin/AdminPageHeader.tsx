"use client"

import { useTheme } from '@/context/ThemeContext'
import { ThemeIcon } from '@/components/ThemeIcon'
import { ReactNode } from 'react'

interface AdminPageHeaderProps {
    title: string
    icon?: string
    actions?: ReactNode
    subtitle?: string
}

export function AdminPageHeader({ title, icon, actions, subtitle }: AdminPageHeaderProps) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'

    if (isFallout) {
        return (
            <div className="border-b-2 border-[var(--fo-primary)] mb-8 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-end uppercase w-full gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-widest text-[var(--fo-primary)] flex items-center gap-3 flex-wrap">
                        {icon && <ThemeIcon type={icon} scale={1.5} />}
                        {title}
                    </h1>
                    {subtitle && (
                        <div className="text-sm opacity-80 mt-1 text-[var(--fo-primary-dim)]">{subtitle}</div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {actions}
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-[var(--fo-primary)]">SYS_STATUS: ONLINE</div>
                    </div>
                </div>
            </div>
        )
    }

    if (isChicago95) {
        return (
            <div className="chi95-window mb-6">
                <div className="chi95-titlebar">
                    <span>{title}</span>
                    <span>Admin Console</span>
                </div>
                <div className="px-3 py-2 border-b border-[#808080] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        {icon && <ThemeIcon type={icon} scale={1.25} />}
                        <div>
                            <h1 className="chi95-text text-xl font-bold">{title}</h1>
                            {subtitle && (
                                <p className="chi95-text text-xs opacity-80">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                </div>
            </div>
        )
    }

    // Minecraft Header
    return (
        <div className="flex items-center justify-between border-b-4 border-[var(--mc-dark-border)] pb-4 mb-6">
            <div>
                <h1 className="mc-admin-heading text-4xl flex items-center gap-3">
                    {icon && <ThemeIcon type={icon} scale={2} />}
                    {title}
                </h1>
                {subtitle && (
                    <p className="mc-text-muted mt-1 text-lg">{subtitle}</p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {actions}
            </div>
        </div>
    )
}
