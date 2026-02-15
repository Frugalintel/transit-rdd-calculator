
export interface ThemeColors {
    panelBg: string
    borderDark: string
    borderLight: string
    shadow: string
    textShadow: string
    textDark: string
    textGray: string
    slotBg: string
    buttonBg: string
    inputBg: string
    inputText: string
    accent: string
}

export type ThemePreset = 'default' | 'nether' | 'ocean' | 'forest' | 'redstone' | 'custom'

export interface FalloutColors {
    primary: string       // Main terminal color (#1AFF80 green)
    primaryDim: string    // Dimmed version for borders
    primaryGlow: string   // Glow effect color
    bg: string            // Background (near black)
    panelBg: string       // Panel background (slightly lighter)
    textPrimary: string   // Primary text
    textDim: string       // Dimmed text
    scanlineOpacity: number // CRT scanline intensity (0-1)
}

export type FalloutPreset = 'green' | 'amber' | 'blue' | 'white' | 'red' | 'pink' | 'yellow' | 'purple' | 'cyan' | 'custom'

export interface Chicago95Colors {
    desktopBg: string
    windowBg: string
    titleBarBg: string
    titleBarText: string
    borderLight: string
    borderDark: string
    text: string
    textDim: string
    buttonFace: string
    buttonText: string
    inputBg: string
    inputText: string
    accent: string
}

export type Chicago95Preset = 'default' | 'classic-blue' | 'olive' | 'sgs' | 'sgs-sky' | 'custom'

export const THEMES: Record<ThemePreset, ThemeColors> = {
    default: {
        panelBg: '#C6C6C6',
        borderDark: '#373737',
        borderLight: '#FFFFFF',
        shadow: '#8B8B8B',
        textShadow: '#3F3F3F',
        textDark: '#404040',
        textGray: '#E0E0E0',
        slotBg: '#8B8B8B',
        buttonBg: '#8B8B8B',
        inputBg: '#000000',
        inputText: '#FFFFFF',
        accent: '#55FF55'
    },
    nether: {
        panelBg: '#A56A62',       // Warmer crimson-netherrack base
        borderDark: '#452525',    // Deep nether border edge
        borderLight: '#EFD1C8',   // Heated ash highlight
        shadow: '#6A3935',        // Lava-lit shadow tone
        textShadow: '#261313',    // Deep warm text shadow
        textDark: '#331E1A',      // Dark warm readable text
        textGray: '#FFF0EA',      // Bright warm UI text
        slotBg: '#885149',        // Richer nether slot tone
        buttonBg: '#9A5E54',      // Warmer button surface
        inputBg: '#120808',       // Very dark ember input
        inputText: '#FFE6DC',     // Warm high-contrast input text
        accent: '#FF8A2A'         // Hot lava accent
    },
    ocean: {
        panelBg: '#7AB8C2',       // Balanced prismarine tone
        borderDark: '#2D5560',    // Deep ocean border
        borderLight: '#DDF6FA',   // Sea-lantern-like highlight
        shadow: '#4A7D86',        // Mid ocean shadow
        textShadow: '#1C353A',    // Dark cyan text shadow
        textDark: '#1F3135',      // Neutralized deep text
        textGray: '#F0FCFF',      // Bright readable light text
        slotBg: '#649DA6',        // Sub-panel contrast
        buttonBg: '#6FAAB4',      // Button surface
        inputBg: '#0C1820',       // Dark input field
        inputText: '#E2F7FF',     // Soft cyan input text
        accent: '#66F2FF'         // Ocean accent
    },
    forest: {
        panelBg: '#A8B08A',       // Mossy green base (less beige)
        borderDark: '#3E442D',    // Deep bark-green border
        borderLight: '#E6EED0',   // Soft leaf-light bevel
        shadow: '#616A49',        // Woodland shadow depth
        textShadow: '#202416',    // Dark green-brown text shadow
        textDark: '#243020',      // Forest-readable primary text
        textGray: '#F2F8E8',      // Light foliage-tinted UI text
        slotBg: '#7D8760',        // Rich olive slot tone
        buttonBg: '#8E9A6A',      // Greened button tone
        inputBg: '#0E160D',       // Deep forest input background
        inputText: '#E6FFE0',     // Bright soft-green input text
        accent: '#6FCD54'         // Vivid leaf accent
    },
    redstone: {
        panelBg: '#BDAEAA',       // Stone-forward base with subtle warmth
        borderDark: '#4A3431',    // Brown-red dark border
        borderLight: '#EFE8E6',   // Neutral light bevel (less pink)
        shadow: '#6B5A57',        // Warm stone shadow
        textShadow: '#2A1A1A',    // Dark text shadow
        textDark: '#5C1212',      // Deep redstone label color
        textGray: '#FFF7F7',      // Bright readable UI text
        slotBg: '#8C6F6A',        // Redstone-tinged slot tone
        buttonBg: '#9A7A74',      // Warm button tone
        inputBg: '#140C0C',       // Deep dark input
        inputText: '#FFE1E1',     // High-contrast light text
        accent: '#FF2F2F'         // Strong true redstone accent
    },
    custom: {
        panelBg: '#C6C6C6',
        borderDark: '#373737',
        borderLight: '#FFFFFF',
        shadow: '#8B8B8B',
        textShadow: '#3F3F3F',
        textDark: '#404040',
        textGray: '#E0E0E0',
        slotBg: '#8B8B8B',
        buttonBg: '#8B8B8B',
        inputBg: '#000000',
        inputText: '#FFFFFF',
        accent: '#55FF55'
    }
}

// Fallout Pip-Boy color presets
export const FALLOUT_THEMES: Record<FalloutPreset, FalloutColors> = {
    green: {
        primary: '#1AFF80',
        primaryDim: '#0D7A3D',
        primaryGlow: '#00FF66',
        bg: '#0A0A0A',
        panelBg: '#111111',
        textPrimary: '#1AFF80',
        textDim: '#0D7A3D',
        scanlineOpacity: 0.15
    },
    amber: {
        primary: '#FFB000',
        primaryDim: '#7A5500',
        primaryGlow: '#FFCC00',
        bg: '#0A0808',
        panelBg: '#111008',
        textPrimary: '#FFB000',
        textDim: '#7A5500',
        scanlineOpacity: 0.12
    },
    blue: {
        primary: '#4080FF',
        primaryDim: '#102040',
        primaryGlow: '#0060FF',
        bg: '#050A14',
        panelBg: '#0A1420',
        textPrimary: '#4080FF',
        textDim: '#102040',
        scanlineOpacity: 0.15
    },
    white: {
        primary: '#E0E0E0',
        primaryDim: '#707070',
        primaryGlow: '#FFFFFF',
        bg: '#0A0A0A',
        panelBg: '#141414',
        textPrimary: '#E0E0E0',
        textDim: '#707070',
        scanlineOpacity: 0.1
    },
    red: {
        primary: '#FF3333',
        primaryDim: '#7A1A1A',
        primaryGlow: '#FF6666',
        bg: '#0F0505',
        panelBg: '#140808',
        textPrimary: '#FF3333',
        textDim: '#7A1A1A',
        scanlineOpacity: 0.15
    },
    pink: {
        primary: '#FF69B4',
        primaryDim: '#7A3256',
        primaryGlow: '#FF8CC6',
        bg: '#0F050A',
        panelBg: '#14080F',
        textPrimary: '#FF69B4',
        textDim: '#7A3256',
        scanlineOpacity: 0.12
    },
    yellow: {
        primary: '#FFFF00',
        primaryDim: '#7A7A00',
        primaryGlow: '#FFFF66',
        bg: '#0A0A00',
        panelBg: '#111100',
        textPrimary: '#FFFF00',
        textDim: '#7A7A00',
        scanlineOpacity: 0.12
    },
    purple: {
        primary: '#BD66FF',
        primaryDim: '#5A2E7A',
        primaryGlow: '#D18CFF',
        bg: '#08050F',
        panelBg: '#0F0A14',
        textPrimary: '#BD66FF',
        textDim: '#5A2E7A',
        scanlineOpacity: 0.15
    },
    cyan: {
        primary: '#00FFFF',
        primaryDim: '#007A7A',
        primaryGlow: '#66FFFF',
        bg: '#000A0A',
        panelBg: '#001111',
        textPrimary: '#00FFFF',
        textDim: '#007A7A',
        scanlineOpacity: 0.15
    },
    custom: {
        primary: '#1AFF80',
        primaryDim: '#0D7A3D',
        primaryGlow: '#00FF66',
        bg: '#0A0A0A',
        panelBg: '#111111',
        textPrimary: '#1AFF80',
        textDim: '#0D7A3D',
        scanlineOpacity: 0.15
    }
}

export const CHICAGO95_THEMES: Record<Chicago95Preset, Chicago95Colors> = {
    default: {
        desktopBg: '#008080',
        windowBg: '#c0c0c0',
        titleBarBg: '#000080',
        titleBarText: '#ffffff',
        borderLight: '#ffffff',
        borderDark: '#808080',
        text: '#000000',
        textDim: '#404040',
        buttonFace: '#c0c0c0',
        buttonText: '#000000',
        inputBg: '#ffffff',
        inputText: '#000000',
        accent: '#000080',
    },
    'classic-blue': {
        desktopBg: '#005a9e',
        windowBg: '#c6d6e6',
        titleBarBg: '#0a246a',
        titleBarText: '#ffffff',
        borderLight: '#ffffff',
        borderDark: '#6f8193',
        text: '#000000',
        textDim: '#34404f',
        buttonFace: '#c6d6e6',
        buttonText: '#000000',
        inputBg: '#ffffff',
        inputText: '#000000',
        accent: '#0a246a',
    },
    olive: {
        desktopBg: '#4f6b3c',
        windowBg: '#d0d6c8',
        titleBarBg: '#3d5d29',
        titleBarText: '#ffffff',
        borderLight: '#f8faf4',
        borderDark: '#76856a',
        text: '#141a10',
        textDim: '#46523e',
        buttonFace: '#d0d6c8',
        buttonText: '#141a10',
        inputBg: '#ffffff',
        inputText: '#141a10',
        accent: '#3d5d29',
    },
    sgs: {
        desktopBg: '#1f3f73',
        windowBg: '#c3c3c7',
        titleBarBg: '#0c2a78',
        titleBarText: '#ffffff',
        borderLight: '#ffffff',
        borderDark: '#767676',
        text: '#101010',
        textDim: '#4a4a4a',
        buttonFace: '#c9c9ce',
        buttonText: '#000000',
        inputBg: '#ffffff',
        inputText: '#000000',
        accent: '#8f1d1d',
    },
    'sgs-sky': {
        desktopBg: '#2d4f88',
        windowBg: '#c6c7cb',
        titleBarBg: '#10327f',
        titleBarText: '#ffffff',
        borderLight: '#ffffff',
        borderDark: '#767676',
        text: '#101010',
        textDim: '#4a4a4a',
        buttonFace: '#ccced3',
        buttonText: '#000000',
        inputBg: '#ffffff',
        inputText: '#000000',
        accent: '#245aa8',
    },
    custom: {
        desktopBg: '#008080',
        windowBg: '#c0c0c0',
        titleBarBg: '#000080',
        titleBarText: '#ffffff',
        borderLight: '#ffffff',
        borderDark: '#808080',
        text: '#000000',
        textDim: '#404040',
        buttonFace: '#c0c0c0',
        buttonText: '#000000',
        inputBg: '#ffffff',
        inputText: '#000000',
        accent: '#000080',
    },
}
