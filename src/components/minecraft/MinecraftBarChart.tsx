"use client"

import { useMemo, useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

interface ChartData {
    label: string
    value: number
    color?: string
}

interface MinecraftBarChartProps {
    data: ChartData[]
    title?: string
    subtitle?: string
    height?: number
    barColor?: string
    className?: string
    showValues?: boolean
}

export function MinecraftBarChart({ 
    data, 
    title, 
    subtitle,
    height = 200, 
    barColor = '#55aa55',
    className = '',
    showValues = true
}: MinecraftBarChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'

    const maxValue = useMemo(() => {
        return Math.max(...data.map(d => d.value), 1)
    }, [data])

    const getBarHeight = (value: number) => {
        // Leave room for value labels
        const maxPercent = showValues ? 85 : 100
        return `${(value / maxValue) * maxPercent}%`
    }

    // Minecraft block highlight/shadow colors
    const highlightColor = 'rgba(255,255,255,0.35)'
    const shadowColor = 'rgba(0,0,0,0.35)'

    // Fallout uses the primary color for bars
    const foBarColor = 'var(--fo-primary)'

    return (
        <div className={`${className}`}>
            {title && (
                <h3 className="mc-admin-heading text-xl mb-1">{title}</h3>
            )}
            {subtitle && (
                <p className="mc-text-muted text-sm mb-4">{subtitle}</p>
            )}
            
            <div 
                className="relative flex items-end gap-2 w-full pl-10 pb-8"
                style={{ height: `${height}px` }}
            >
                {/* Y-Axis Labels */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between mc-admin-text text-sm w-8 text-right pr-2">
                    <span>{maxValue}</span>
                    <span>{Math.round(maxValue / 2)}</span>
                    <span>0</span>
                </div>

                {/* Horizontal Grid Lines */}
                <div className="absolute left-10 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
                    <div className={`border-t-2 border-dashed w-full ${isFallout ? 'border-[var(--fo-primary-dim)] opacity-30' : 'border-[#555555] opacity-40'}`}></div>
                    <div className={`border-t-2 border-dashed w-full ${isFallout ? 'border-[var(--fo-primary-dim)] opacity-30' : 'border-[#555555] opacity-40'}`}></div>
                    <div className={`border-t-2 w-full ${isFallout ? 'border-[var(--fo-primary-dim)]' : 'border-[#373737]'}`}></div>
                </div>

                {/* Bars */}
                {data.map((item, index) => {
                    const isHovered = hoveredIndex === index
                    const baseColor = isFallout ? foBarColor : (item.color || barColor)
                    
                    return (
                        <div 
                            key={index}
                            className="relative flex-1 flex flex-col justify-end items-center h-full"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Value Label */}
                            {showValues && (
                                <div 
                                    className="absolute mc-admin-text text-sm font-bold"
                                    style={{ 
                                        bottom: `calc(${getBarHeight(item.value)} + 4px)`,
                                        opacity: isHovered ? 1 : 0.7
                                    }}
                                >
                                    {item.value}
                                </div>
                            )}
                            
                            {/* Bar */}
                            <div 
                                className="w-full relative cursor-pointer transition-all duration-200"
                                style={isFallout ? {
                                    // Fallout terminal-style bars
                                    height: getBarHeight(item.value),
                                    minHeight: item.value > 0 ? '8px' : '0',
                                    backgroundColor: baseColor,
                                    border: '1px solid var(--fo-primary)',
                                    boxShadow: isHovered ? '0 0 10px var(--fo-primary-glow)' : '0 0 5px var(--fo-primary-dim)',
                                    opacity: isHovered ? 1 : 0.85,
                                    transformOrigin: 'bottom'
                                } : {
                                    // Minecraft block 3D bars
                                    height: getBarHeight(item.value),
                                    minHeight: item.value > 0 ? '8px' : '0',
                                    backgroundColor: baseColor,
                                    borderTop: `4px solid ${highlightColor}`,
                                    borderLeft: `4px solid ${highlightColor}`,
                                    borderRight: `4px solid ${shadowColor}`,
                                    borderBottom: `4px solid ${shadowColor}`,
                                    backgroundImage: `
                                        linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.1) 50%, transparent 52%),
                                        linear-gradient(-45deg, transparent 48%, rgba(0,0,0,0.1) 50%, transparent 52%)
                                    `,
                                    backgroundSize: '8px 8px',
                                    filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
                                    transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                                    transformOrigin: 'bottom'
                                }}
                            >
                                {/* Hover Tooltip */}
                                {isHovered && (
                                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 mc-tooltip whitespace-nowrap">
                                        <div className="mc-text-yellow font-bold">{item.label}</div>
                                        <div className={isFallout ? 'text-[var(--fo-primary)]' : 'text-white'}>{item.value} calculations</div>
                                    </div>
                                )}
                            </div>
                            
                            {/* X-Axis Label */}
                            <div className="absolute -bottom-7 left-0 right-0 text-center">
                                <span 
                                    className="mc-admin-text text-sm block"
                                    style={{ opacity: isHovered ? 1 : 0.8 }}
                                >
                                    {item.label}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
