import { StepType } from '@/types'

// ── Step type colors per theme ──────────────────────────────────────────────
interface TypeColors {
    bg: string
    border: string
    label: string
}

const MC_TYPE_COLORS: Record<StepType | 'default', TypeColors> = {
    info:          { bg: '#8b8b8b', border: '#373737', label: 'Info' },
    input:         { bg: '#8080ff', border: '#0000aa', label: 'Input' },
    quiz:          { bg: '#ffaa00', border: '#aa5500', label: 'Quiz' },
    decision:      { bg: '#55ff55', border: '#00aa00', label: 'Decision' },
    simulation:    { bg: '#ff55ff', border: '#aa00aa', label: 'Simulation' },
    copy_template: { bg: '#55ffff', border: '#00aaaa', label: 'Template' },
    default:       { bg: '#8b8b8b', border: '#373737', label: 'Unknown' },
}

const FO_TYPE_COLORS: Record<StepType | 'default', TypeColors> = {
    info:          { bg: '#1a2a1a', border: '#3a6a3a', label: 'Info' },
    input:         { bg: '#1a1a30', border: '#5555aa', label: 'Input' },
    quiz:          { bg: '#2a2200', border: '#aa8800', label: 'Quiz' },
    decision:      { bg: '#0a2a0a', border: '#22aa44', label: 'Decision' },
    simulation:    { bg: '#2a0a2a', border: '#aa44aa', label: 'Simulation' },
    copy_template: { bg: '#0a2a2a', border: '#44aaaa', label: 'Template' },
    default:       { bg: '#1a2a1a', border: '#3a6a3a', label: 'Unknown' },
}

const CHI95_TYPE_COLORS: Record<StepType | 'default', TypeColors> = {
    info:          { bg: '#d4d0c8', border: '#808080', label: 'Info' },
    input:         { bg: '#b8c8ff', border: '#000080', label: 'Input' },
    quiz:          { bg: '#f2d28b', border: '#9b6a00', label: 'Quiz' },
    decision:      { bg: '#b8e0b8', border: '#008000', label: 'Decision' },
    simulation:    { bg: '#e0b8e0', border: '#800080', label: 'Simulation' },
    copy_template: { bg: '#b8e0e0', border: '#008080', label: 'Template' },
    default:       { bg: '#d4d0c8', border: '#808080', label: 'Unknown' },
}

export function getTypeColor(type: StepType, themeMode: 'minecraft' | 'fallout' | 'chicago95'): TypeColors {
    const palette = themeMode === 'fallout' ? FO_TYPE_COLORS : themeMode === 'chicago95' ? CHI95_TYPE_COLORS : MC_TYPE_COLORS
    return palette[type] || palette.default
}

// ── Editor-wide theme tokens ────────────────────────────────────────────────
export interface EditorTheme {
    font: string
    canvasBg: string
    canvasGrid: string
    panelBg: string
    panelBorder: string
    controlBg: string
    controlBorder: string
    textColor: string
    textDim: string
    textShadow: string
    selectionColor: string
    selectionGlow: string
    edgeColor: string
    optionEdgeColor: string
    bevelShadow: string
    nodeBorderWidth: string
}

const MC_EDITOR: EditorTheme = {
    font: "'VT323', monospace",
    canvasBg: '#1a1a1a',
    canvasGrid: '#333',
    panelBg: '#2a2a2a',
    panelBorder: '#373737',
    controlBg: '#373737',
    controlBorder: '#555',
    textColor: '#ffffff',
    textDim: '#aaaaaa',
    textShadow: '2px 2px 0 #000',
    selectionColor: '#55ff55',
    selectionGlow: '0 0 20px #55ff55',
    edgeColor: '#555',
    optionEdgeColor: '#ffaa00',
    bevelShadow: 'inset 2px 2px 0 0 rgba(255,255,255,0.3), inset -2px -2px 0 0 rgba(0,0,0,0.3)',
    nodeBorderWidth: '4px',
}

const FO_EDITOR: EditorTheme = {
    font: "var(--fo-font-stack, 'Monofonto', monospace)",
    canvasBg: '#0a0a0a',
    canvasGrid: '#1a1a1a',
    panelBg: 'rgba(0, 0, 0, 0.8)',
    panelBorder: 'var(--fo-primary-dim, #0D7A3D)',
    controlBg: '#0a0a0a',
    controlBorder: 'var(--fo-primary-dim, #0D7A3D)',
    textColor: 'var(--fo-primary, #1AFF80)',
    textDim: 'var(--fo-primary-dim, #0D7A3D)',
    textShadow: 'none',
    selectionColor: 'var(--fo-primary, #1AFF80)',
    selectionGlow: '0 0 15px var(--fo-primary-dim, #0D7A3D)',
    edgeColor: 'var(--fo-primary-dim, #0D7A3D)',
    optionEdgeColor: '#cc8800',
    bevelShadow: 'none',
    nodeBorderWidth: '2px',
}

const CHI95_EDITOR: EditorTheme = {
    font: "'MS Sans Serif', 'Arial', sans-serif",
    canvasBg: '#008080',
    canvasGrid: '#0a6f6f',
    panelBg: '#c0c0c0',
    panelBorder: '#808080',
    controlBg: '#c0c0c0',
    controlBorder: '#808080',
    textColor: '#000000',
    textDim: '#333333',
    textShadow: 'none',
    selectionColor: '#000080',
    selectionGlow: '0 0 0 2px rgba(0,0,128,0.35)',
    edgeColor: '#404040',
    optionEdgeColor: '#000080',
    bevelShadow: 'inset 1px 1px 0 0 #ffffff, inset -1px -1px 0 0 #000000',
    nodeBorderWidth: '2px',
}

export function getEditorTheme(themeMode: 'minecraft' | 'fallout' | 'chicago95'): EditorTheme {
    if (themeMode === 'fallout') return FO_EDITOR
    if (themeMode === 'chicago95') return CHI95_EDITOR
    return MC_EDITOR
}
