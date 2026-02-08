"use client"

import { FalloutColors } from '@/utils/themeConstants'

interface FalloutThemePreviewProps {
    colors: FalloutColors
}

export function FalloutThemePreview({ colors }: FalloutThemePreviewProps) {
    return (
        <div className="w-full flex justify-center p-4 bg-black rounded-sm">
            <div 
                className="w-72 p-4 relative"
                style={{
                    backgroundColor: colors.panelBg,
                    border: `2px solid ${colors.primary}`,
                    boxShadow: `0 0 15px ${colors.primaryDim}`
                }}
            >
                {/* Inner border */}
                <div 
                    className="absolute top-1 left-1 right-1 bottom-1 pointer-events-none"
                    style={{ border: `1px solid ${colors.primaryDim}` }}
                />
                
                {/* Title */}
                <div 
                    className="text-lg uppercase tracking-wider border-b mb-3 pb-2"
                    style={{ 
                        borderColor: colors.primaryDim,
                        color: colors.textPrimary,
                        textShadow: `0 0 10px ${colors.primaryGlow}`,
                        fontFamily: 'VT323, monospace'
                    }}
                >
                    Transit Guide
                </div>
                
                {/* Mock inputs */}
                <div className="space-y-3">
                    <div>
                        <div 
                            className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: colors.textPrimary, fontFamily: 'VT323, monospace' }}
                        >
                            Pack Date
                        </div>
                        <div 
                            className="p-2 text-sm"
                            style={{ 
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                borderBottom: `2px solid ${colors.primary}`,
                                color: colors.textDim,
                                fontFamily: 'VT323, monospace'
                            }}
                        >
                            {'>'} Select...
                        </div>
                    </div>
                    
                    <div>
                        <div 
                            className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: colors.textPrimary, fontFamily: 'VT323, monospace' }}
                        >
                            Weight
                        </div>
                        <div 
                            className="p-2 text-sm"
                            style={{ 
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                borderBottom: `2px solid ${colors.primary}`,
                                color: colors.textPrimary,
                                fontFamily: 'VT323, monospace'
                            }}
                        >
                            2500
                        </div>
                    </div>
                </div>
                
                {/* Result box */}
                <div 
                    className="mt-4 p-3 text-center relative"
                    style={{
                        backgroundColor: colors.bg,
                        border: `2px solid ${colors.primary}`,
                        boxShadow: `0 0 10px ${colors.primaryDim}, inset 0 0 15px rgba(26,255,128,0.05)`
                    }}
                >
                    {/* Corner decorations */}
                    <div 
                        className="absolute top-[-2px] left-[-2px] w-2 h-2"
                        style={{ borderTop: `2px solid ${colors.primary}`, borderLeft: `2px solid ${colors.primary}` }}
                    />
                    <div 
                        className="absolute bottom-[-2px] right-[-2px] w-2 h-2"
                        style={{ borderBottom: `2px solid ${colors.primary}`, borderRight: `2px solid ${colors.primary}` }}
                    />
                    
                    <div 
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ 
                            color: colors.textPrimary, 
                            textShadow: `0 0 8px ${colors.primaryGlow}`,
                            fontFamily: 'VT323, monospace'
                        }}
                    >
                        RDD
                    </div>
                    <div 
                        className="text-lg"
                        style={{ 
                            color: colors.textPrimary,
                            textShadow: `0 0 5px ${colors.primaryDim}`,
                            fontFamily: 'VT323, monospace'
                        }}
                    >
                        02/15/2026
                    </div>
                </div>
                
                {/* Button */}
                <button
                    className="w-full mt-4 p-2 text-sm uppercase tracking-wider transition-all"
                    style={{
                        backgroundColor: colors.primaryDim,
                        border: `2px solid ${colors.primary}`,
                        color: colors.textPrimary,
                        fontFamily: 'VT323, monospace'
                    }}
                >
                    Calculate
                </button>
                
                {/* Scanline effect overlay */}
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `repeating-linear-gradient(
                            0deg,
                            rgba(0, 0, 0, ${colors.scanlineOpacity}),
                            rgba(0, 0, 0, ${colors.scanlineOpacity}) 1px,
                            transparent 1px,
                            transparent 2px
                        )`
                    }}
                />
            </div>
        </div>
    )
}
