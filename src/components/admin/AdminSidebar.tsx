"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeIcon } from '@/components/ThemeIcon'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin', icon: 'wheat' },
    { label: 'Users', path: '/admin/users', icon: 'totem' },
    { label: 'Data', path: '/admin/data', icon: 'book' },
    { label: 'Training', path: '/admin/training', icon: 'firework_star' },
    { label: 'Logs', path: '/admin/logs', icon: 'paper' },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'

    const TabButton = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
        const isActive = pathname === item.path
        
        return (
            <Link href={item.path} className="block w-full mb-2">
                <div
                    className={cn(
                        "relative flex items-center gap-3 px-4 py-3 transition-all duration-75 select-none cursor-pointer w-full",
                        // Base borders
                        isFallout
                            ? "border border-[var(--fo-primary-dim)] hover:bg-[rgba(26,255,128,0.1)]"
                            : isChicago95
                                ? "chi95-panel border border-[#808080]"
                            : "border-t-2 border-l-2 border-b-2 border-[var(--mc-dark-border)]",
                        // Active vs Inactive
                        isActive 
                            ? isFallout
                                ? "bg-[rgba(26,255,128,0.15)] z-30 -mr-1 pr-5 border-r-0 border-[var(--fo-primary)] shadow-[0_0_15px_rgba(26,255,128,0.2)]"
                                : isChicago95
                                    ? "bg-[#000080] text-white z-30"
                                : "bg-[var(--mc-bg)] z-30 -mr-1 pr-5 border-r-0"
                            : isFallout
                                ? "bg-transparent z-10 mr-0 opacity-80 hover:opacity-100 hover:bg-[rgba(26,255,128,0.05)]"
                                : isChicago95
                                    ? "bg-[#c0c0c0] z-10 mr-0 hover:bg-[#d4d0c8]"
                                : "bg-[#707070] hover:bg-[#808080] z-10 mr-0 border-r-2"
                    )}
                    style={{
                        boxShadow: isFallout
                            ? (isActive ? '0 0 10px var(--fo-primary-dim)' : 'none')
                            : isChicago95
                                ? undefined
                            : (isActive 
                                ? "inset 2px 2px 0 0 #ffffff, inset 0 -2px 0 0 #555555" 
                                : "inset 2px 2px 0 0 #909090, inset -2px -2px 0 0 #404040")
                    }}
                >
                    <ThemeIcon type={item.icon} scale={1} className={isActive ? "" : "opacity-80"} />
                    <span 
                        className={cn(
                            "text-lg sm:text-xl",
                            isFallout ? "fo-text font-mono tracking-wider" : isChicago95 ? "chi95-text" : "mc-body",
                            isActive 
                                ? isFallout ? "text-[var(--fo-primary)]" : isChicago95 ? "text-white" : "text-[var(--mc-text-dark)]"
                                : isFallout ? "text-[var(--fo-primary-dim)]" : isChicago95 ? "text-black" : "text-[#f0f0f0] drop-shadow-sm"
                        )}
                    >
                        {item.label}
                    </span>
                </div>
            </Link>
        )
    }

    return (
        <div className={cn(
            "w-56 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto",
            isFallout ? "bg-[var(--fo-panel-bg)] border-r border-[var(--fo-primary-dim)]" : isChicago95 ? "chi95-window bg-[#c0c0c0]" : "bg-[var(--mc-bg)]"
        )}>
            {/* Header */}
            <div className={cn(
                "p-4 border-b-4",
                isFallout 
                    ? "bg-[var(--fo-panel-bg)] border-[var(--fo-primary-dim)]" 
                    : isChicago95
                        ? "border-[#808080] bg-[#c0c0c0]"
                    : "border-[var(--mc-dark-border)] bg-[var(--mc-bg)]"
            )}>
                <div className="flex items-center gap-3 mb-1">
                    <ThemeIcon type="golden_helmet" scale={1.5} />
                    <span className={cn(
                        "text-2xl font-bold",
                        isFallout ? "text-[var(--fo-primary)] font-mono tracking-widest uppercase" : isChicago95 ? "chi95-text" : "mc-admin-heading"
                    )}>
                        Admin
                    </span>
                </div>
                <p className={cn(
                    "text-sm",
                    isFallout ? "text-[var(--fo-primary-dim)] font-mono" : isChicago95 ? "chi95-text opacity-80" : "mc-text-muted"
                )}>Server Control Panel</p>
            </div>

            {/* Navigation Tabs - Vertical */}
            <div className="flex-1 pt-4 pr-0 pl-2 flex flex-col">
                {/* Tabs with vertical line */}
                <div className="relative">
                    {/* Vertical line on right side of tabs */}
                    <div className={cn(
                        "absolute right-0 top-0 bottom-0 z-10",
                        isFallout ? "w-px bg-[var(--fo-primary-dim)]" : isChicago95 ? "w-px bg-[#808080]" : "w-[4px] bg-[var(--mc-dark-border)]"
                    )} />
                    <nav className="space-y-1 relative z-20">
                        {NAV_ITEMS.map((item) => (
                            <TabButton key={item.path} item={item} />
                        ))}
                    </nav>
                </div>
                {/* Closing area - fills remaining space with vertical line */}
                <div className="flex-1 relative min-h-8">
                    <div className={cn(
                        "absolute right-0 top-0 bottom-0",
                        isFallout ? "w-px bg-[var(--fo-primary-dim)]" : isChicago95 ? "w-px bg-[#808080]" : "w-[4px] bg-[var(--mc-dark-border)]"
                    )} />
                    {/* Horizontal closing bar at the very bottom */}
                    <div className={cn(
                        "absolute bottom-0 left-0 right-0",
                        isFallout ? "h-px bg-[var(--fo-primary-dim)]" : isChicago95 ? "h-px bg-[#808080]" : "h-[4px] bg-[var(--mc-dark-border)]"
                    )} />
                </div>
            </div>

            {/* Footer with Back Button */}
            <div className={cn(
                "p-4",
                isFallout ? "bg-[var(--fo-panel-bg)]" : isChicago95 ? "bg-[#c0c0c0]" : "bg-[var(--mc-bg)]"
            )}>
                <Link 
                    href="/" 
                    className={cn(
                        "w-full h-12 flex items-center justify-center gap-2 whitespace-nowrap text-base",
                        isFallout ? "fo-button" : isChicago95 ? "chi95-button" : "mc-button"
                    )}
                >
                    <ThemeIcon type="compass" />
                    <span>Back</span>
                </Link>
            </div>
        </div>
    )
}
