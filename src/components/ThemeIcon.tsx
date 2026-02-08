import { ItemIcon, ItemType } from '@/components/minecraft/ItemIcon'
import { PipBoyIcon, PipBoyIconType } from '@/components/fallout/PipBoyIcon'

/**
 * Maps Minecraft ItemType names to the closest PipBoy icon equivalent.
 * Used by ThemeIcon to render the correct icon per theme.
 */
const ICON_MAP: Record<string, PipBoyIconType> = {
    clock: 'clock',
    compass: 'distance',
    book: 'book',
    chest: 'terminal',
    paper: 'book',
    sign: 'terminal',
    totem: 'vault-boy',
    wheat: 'signal',
    redstone_dust: 'radiation',
    golden_helmet: 'vault-boy',
    firework_star: 'bottle-cap',
    firework: 'signal',
    bell: 'signal',
    arrow_right: 'arrow-right',
    arrow_down: 'arrow-right',
    chain: 'x',
    gear: 'cog',
    feather: 'terminal',
    snowball: 'radiation',
    torch: 'power',
    pickaxe: 'cog',
    iron_pickaxe: 'cog',
    name_tag: 'user',
    banner: 'terminal',
    poppy: 'radiation',
    cookie: 'bottle-cap',
    cooked_chicken: 'bottle-cap',
    cake: 'bottle-cap',
    pumpkin_pie: 'bottle-cap',
}

interface ThemeIconProps {
    type: string
    className?: string
    scale?: number
}

/**
 * Theme-aware icon component.
 * Renders both Minecraft (ItemIcon) and Fallout (PipBoyIcon) variants.
 * CSS classes `.minecraft-only` / `.fallout-only` show/hide based on
 * the active theme class on <html> (`.theme-minecraft` / `.theme-fallout`).
 *
 * Works in both server and client components.
 */
export function ThemeIcon({ type, className = '', scale = 1 }: ThemeIconProps) {
    const foType = ICON_MAP[type] || 'terminal'
    const foSize = Math.round(16 * scale)

    return (
        <>
            <span className={`minecraft-only inline-flex items-center justify-center ${className}`}>
                <ItemIcon type={type as ItemType} scale={scale} />
            </span>
            <span className={`fallout-only inline-flex items-center justify-center ${className}`}>
                <PipBoyIcon type={foType} size={foSize} />
            </span>
        </>
    )
}
