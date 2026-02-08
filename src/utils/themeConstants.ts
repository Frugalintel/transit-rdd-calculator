
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
        panelBg: '#8B4545',       // Lighter crimson wood tone
        borderDark: '#5C2E2E',    // Nether brick dark
        borderLight: '#C47272',   // Crimson highlight
        shadow: '#4A1E1E',        // Deep nether shadow
        textShadow: '#2A0E0E',    // Very dark shadow
        textDark: '#2A1515',      // Dark readable text
        textGray: '#FFE8E8',      // Cream white for light text
        slotBg: '#6B3535',        // Darker crimson for slots
        buttonBg: '#7A4040',      // Medium crimson button
        inputBg: '#2A0505',       // Very dark red input
        inputText: '#FFD4D4',     // Light pink text
        accent: '#FFAA00'         // Gold/fire orange
    },
    ocean: {
        panelBg: '#6BB5B5',       // Bright prismarine
        borderDark: '#3D7A7A',    // Dark prismarine
        borderLight: '#A8E0E0',   // Sea lantern glow
        shadow: '#3D7A7E',        // Prismarine shadow
        textShadow: '#1E4447',    // Deep ocean shadow
        textDark: '#1A4545',      // Dark teal text
        textGray: '#E8FFFF',      // Bright cyan-white
        slotBg: '#4A9595',        // Darker prismarine for slots
        buttonBg: '#5AA5A5',      // Medium prismarine button
        inputBg: '#0A1A2A',       // Deep ocean input
        inputText: '#D0F5F7',     // Light cyan text
        accent: '#55FFFF'         // Cyan (diamond/water)
    },
    forest: {
        panelBg: '#B5A57A',       // Warm oak/birch tone
        borderDark: '#6B5A3D',    // Dark oak border
        borderLight: '#E0D4B0',   // Birch highlight
        shadow: '#5A7842',        // Leafy shadow
        textShadow: '#2D3D20',    // Dark green shadow
        textDark: '#3D3520',      // Dark brown text
        textGray: '#FFF8E8',      // Cream white
        slotBg: '#8B7A55',        // Darker wood for slots
        buttonBg: '#A08A5A',      // Medium wood button
        inputBg: '#1A2A10',       // Dark forest input
        inputText: '#E8FFE8',     // Light green text
        accent: '#55FF55'         // Minecraft green
    },
    redstone: {
        panelBg: '#B8B8B8',       // Lighter smooth stone
        borderDark: '#606060',    // Stone brick dark
        borderLight: '#E8E8E8',   // Iron highlight
        shadow: '#707070',        // Stone shadow
        textShadow: '#404040',    // Dark gray shadow
        textDark: '#CC0000',      // Bright redstone red
        textGray: '#404040',      // Dark gray for button text
        slotBg: '#8A8A8A',        // Darker stone slots
        buttonBg: '#A0A0A0',      // Stone button
        inputBg: '#2A2A2A',       // Dark stone input
        inputText: '#FF5555',     // Redstone light text
        accent: '#FF3333'         // Bright redstone glow
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
