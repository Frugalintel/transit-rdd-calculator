"use client"

export type PipBoyIconType = 
    | 'vault-boy'      // Generic vault boy silhouette
    | 'calendar'       // Date icon
    | 'weight'         // Scale/weight
    | 'distance'       // Map marker
    | 'cog'            // Settings
    | 'terminal'       // Computer terminal
    | 'radiation'      // Rad symbol
    | 'bottle-cap'     // Currency/success
    | 'power'          // Power button
    | 'signal'         // Radio waves
    | 'book'           // Training/manual
    | 'clock'          // Time/history
    | 'check'          // Checkmark
    | 'x'              // Close/error
    | 'arrow-right'    // Arrow
    | 'user'           // User/profile

interface PipBoyIconProps {
    type: PipBoyIconType
    className?: string
    size?: number
}

const ICON_PATHS: Record<PipBoyIconType, string> = {
    'vault-boy': `
        <circle cx="8" cy="4" r="2.5" fill="currentColor"/>
        <ellipse cx="8" cy="10" rx="4" ry="5" fill="currentColor"/>
        <circle cx="7" cy="3.5" r="0.4" fill="var(--fo-bg)"/>
        <circle cx="9" cy="3.5" r="0.4" fill="var(--fo-bg)"/>
        <path d="M6.5 5 Q8 6 9.5 5" stroke="var(--fo-bg)" stroke-width="0.5" fill="none"/>
    `,
    'calendar': `
        <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M2 6 H14" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 1 V4 M11 1 V4" stroke="currentColor" stroke-width="1.5"/>
        <rect x="4" y="8" width="2" height="2" fill="currentColor"/>
        <rect x="7" y="8" width="2" height="2" fill="currentColor"/>
        <rect x="10" y="8" width="2" height="2" fill="currentColor"/>
    `,
    'weight': `
        <path d="M8 2 L12 6 L12 14 L4 14 L4 6 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <circle cx="8" cy="9" r="2" stroke="currentColor" stroke-width="1" fill="none"/>
        <path d="M6 14 L6 12 M10 14 L10 12" stroke="currentColor" stroke-width="1"/>
    `,
    'distance': `
        <path d="M8 2 L12 8 L8 14 L4 8 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <circle cx="8" cy="7" r="2" fill="currentColor"/>
    `,
    'cog': `
        <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M8 1 L8 3 M8 13 L8 15 M1 8 L3 8 M13 8 L15 8" stroke="currentColor" stroke-width="2"/>
        <path d="M3 3 L4.5 4.5 M11.5 11.5 L13 13 M3 13 L4.5 11.5 M11.5 4.5 L13 3" stroke="currentColor" stroke-width="2"/>
    `,
    'terminal': `
        <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M4 6 L6 8 L4 10" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M8 10 H12" stroke="currentColor" stroke-width="1.5"/>
    `,
    'radiation': `
        <circle cx="8" cy="8" r="2" fill="currentColor"/>
        <path d="M8 8 L4 2 A7 7 0 0 1 12 2 Z" fill="currentColor"/>
        <path d="M8 8 L14 10 A7 7 0 0 1 10 15 Z" fill="currentColor"/>
        <path d="M8 8 L2 10 A7 7 0 0 1 6 15 Z" fill="currentColor"/>
    `,
    'bottle-cap': `
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1" fill="none"/>
        <path d="M8 3 L8 4 M8 12 L8 13 M3 8 L4 8 M12 8 L13 8" stroke="currentColor" stroke-width="1.5"/>
        <path d="M4.5 4.5 L5.5 5.5 M10.5 10.5 L11.5 11.5 M4.5 11.5 L5.5 10.5 M10.5 5.5 L11.5 4.5" stroke="currentColor" stroke-width="1.5"/>
    `,
    'power': `
        <circle cx="8" cy="9" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M8 4 L8 9" stroke="currentColor" stroke-width="2"/>
    `,
    'signal': `
        <path d="M8 12 L8 14" stroke="currentColor" stroke-width="2"/>
        <path d="M5 10 Q8 6 11 10" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M3 8 Q8 2 13 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M1 6 Q8 -2 15 6" stroke="currentColor" stroke-width="1.5" fill="none"/>
    `,
    'book': `
        <path d="M2 3 L8 2 L14 3 L14 13 L8 14 L2 13 Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M8 2 L8 14" stroke="currentColor" stroke-width="1"/>
        <path d="M4 5 L7 5 M4 7 L7 7 M4 9 L6 9" stroke="currentColor" stroke-width="1"/>
    `,
    'clock': `
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M8 4 L8 8 L11 10" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <circle cx="8" cy="8" r="1" fill="currentColor"/>
    `,
    'check': `
        <path d="M3 8 L6 12 L13 4" stroke="currentColor" stroke-width="2" fill="none"/>
    `,
    'x': `
        <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" stroke-width="2"/>
    `,
    'arrow-right': `
        <path d="M3 8 L13 8 M9 4 L13 8 L9 12" stroke="currentColor" stroke-width="2" fill="none"/>
    `,
    'user': `
        <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M2 15 Q2 10 8 10 Q14 10 14 15" stroke="currentColor" stroke-width="1.5" fill="none"/>
    `
}

export function PipBoyIcon({ type, className = '', size = 16 }: PipBoyIconProps) {
    return (
        <div 
            className={`inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size, color: 'var(--fo-primary)' }}
        >
            <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 16 16"
                style={{ filter: 'drop-shadow(0 0 2px var(--fo-primary-glow))' }}
            >
                <g dangerouslySetInnerHTML={{ __html: ICON_PATHS[type] }} />
            </svg>
        </div>
    )
}
