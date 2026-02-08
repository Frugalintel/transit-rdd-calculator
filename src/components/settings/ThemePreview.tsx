import React from 'react'
import { ThemeColors } from '@/utils/themeConstants'
import { ItemIcon } from '@/components/minecraft/ItemIcon'

interface ThemePreviewProps {
    colors: ThemeColors
}

export function ThemePreview({ colors }: ThemePreviewProps) {
    return (
        <div className="w-full flex justify-center p-4 bg-black/20 rounded-lg">
            <div 
                className="w-72 p-3 relative"
                style={{
                    backgroundColor: colors.panelBg,
                    boxShadow: `
                        inset 2px 2px 0 0 ${colors.borderLight},
                        inset -2px -2px 0 0 ${colors.borderDark},
                        inset -4px -4px 0 0 ${colors.shadow},
                        0 0 0 2px #000000
                    `
                }}
            >
                {/* Header */}
                <div 
                    className="flex justify-between items-center px-2 py-1 mb-3"
                    style={{ borderBottom: `2px solid ${colors.borderDark}` }}
                >
                    <div className="flex items-center gap-2">
                        <ItemIcon type="compass" scale={1} />
                        <span style={{ 
                            color: colors.textDark, 
                            fontFamily: 'VT323', 
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            Transit Guide
                        </span>
                    </div>
                </div>

                {/* Content Slot */}
                <div 
                    className="p-3 mb-3"
                    style={{
                        backgroundColor: colors.slotBg,
                        borderBottom: `2px solid ${colors.borderLight}`,
                        borderRight: `2px solid ${colors.borderLight}`,
                        borderLeft: `2px solid ${colors.borderDark}`,
                        borderTop: `2px solid ${colors.borderDark}`
                    }}
                >
                    <div style={{ 
                        color: colors.textDark, 
                        fontFamily: 'VT323',
                        fontSize: '14px',
                        marginBottom: '8px'
                    }}>
                        Shipment Data
                    </div>
                    
                    {/* Input fields */}
                    <div className="flex gap-2 mb-2">
                        <div 
                            className="flex-1 h-7 border-2"
                            style={{
                                backgroundColor: colors.inputBg,
                                borderColor: '#a0a0a0',
                                color: colors.inputText,
                                fontFamily: 'VT323',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '6px'
                            }}
                        >
                            12/25/24
                        </div>
                        <div 
                            className="flex-1 h-7 border-2"
                            style={{
                                backgroundColor: colors.inputBg,
                                borderColor: '#a0a0a0',
                                color: colors.inputText,
                                fontFamily: 'VT323',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '6px'
                            }}
                        >
                            1500 lbs
                        </div>
                    </div>
                    
                    {/* Result display */}
                    <div 
                        className="p-2 text-center"
                        style={{
                            backgroundColor: '#212121',
                            border: '2px solid #ffffff'
                        }}
                    >
                        <div style={{ 
                            color: '#ffff55', 
                            fontFamily: 'VT323', 
                            fontSize: '11px',
                            textShadow: '1px 1px 0 #3f3f00'
                        }}>
                            Est. Delivery
                        </div>
                        <div style={{ 
                            color: '#ffffff', 
                            fontFamily: 'VT323', 
                            fontSize: '14px',
                            textShadow: `1px 1px 0 ${colors.textShadow}`
                        }}>
                            Jan 5, 2025
                        </div>
                    </div>
                </div>

                {/* Button */}
                <div 
                    className="h-9 flex items-center justify-center border-2 border-black cursor-pointer"
                    style={{
                        backgroundColor: colors.buttonBg,
                        boxShadow: `
                            inset 2px 2px 0 0 ${colors.borderLight},
                            inset -2px -2px 0 0 ${colors.borderDark}
                        `,
                        color: colors.textGray,
                        fontFamily: 'VT323',
                        fontSize: '16px',
                        textShadow: `1px 1px 0px ${colors.textShadow}`
                    }}
                >
                    Calculate Delivery
                </div>
                
                {/* Footer text sample */}
                <div 
                    className="mt-2 text-center"
                    style={{
                        color: colors.textGray,
                        fontFamily: 'VT323',
                        fontSize: '11px',
                        textShadow: `1px 1px 0px ${colors.textShadow}`
                    }}
                >
                    Sample preview text
                </div>
            </div>
        </div>
    )
}
