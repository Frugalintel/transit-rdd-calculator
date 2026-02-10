import { ThemeIcon } from '@/components/ThemeIcon'

interface StatsCardProps {
    title: string
    value: string | number
    icon: string
    description?: string
    trend?: string
}

export function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
    const isPositiveTrend = trend?.startsWith('+')
    
    return (
        <div className="mc-panel p-5">
            <div className="flex justify-between items-start mb-4">
                <div className="mc-slot-dark p-3">
                    <ThemeIcon type={icon} scale={1.5} />
                </div>
                {trend && (
                    <span className={`
                        mc-button h-8 px-3 text-base font-bold leading-none
                        ${isPositiveTrend 
                            ? 'mc-button-primary' 
                            : 'mc-button-destructive'
                        }
                    `}>
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="mc-admin-heading text-2xl mb-2">{title}</h3>
            <div className="mc-admin-value text-5xl">{value}</div>
            {description && (
                <p className="mc-text-muted mt-3 text-lg">{description}</p>
            )}
        </div>
    )
}
