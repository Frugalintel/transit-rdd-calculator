import { ItemIcon, ItemType } from '@/components/minecraft/ItemIcon'
import { PipBoyIcon, PipBoyIconType } from '@/components/fallout/PipBoyIcon'
import {
    Archive,
    ArrowDown,
    ArrowRight,
    Bell,
    BookOpen,
    CakeSlice,
    Clock3,
    Cog,
    Compass,
    Cookie,
    Drumstick,
    Feather,
    FileText,
    Flag,
    Flower2,
    Hammer,
    Lightbulb,
    Link2,
    MapPinned,
    Shield,
    Signpost,
    Snowflake,
    Sparkles,
    Square,
    Tag,
    UserRound,
    Wheat,
    Zap,
    type LucideIcon,
} from 'lucide-react'

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

const CHI95_ICON_MAP: Record<string, LucideIcon> = {
    clock: Clock3,
    compass: Compass,
    distance: MapPinned,
    book: BookOpen,
    chest: Archive,
    paper: FileText,
    sign: Signpost,
    totem: UserRound,
    wheat: Wheat,
    redstone_dust: Zap,
    golden_helmet: Shield,
    firework_star: Sparkles,
    firework: Sparkles,
    bell: Bell,
    arrow_right: ArrowRight,
    arrow_down: ArrowDown,
    chain: Link2,
    gear: Cog,
    feather: Feather,
    snowball: Snowflake,
    torch: Lightbulb,
    pickaxe: Hammer,
    iron_pickaxe: Hammer,
    name_tag: Tag,
    banner: Flag,
    poppy: Flower2,
    cookie: Cookie,
    cooked_chicken: Drumstick,
    cake: CakeSlice,
    pumpkin_pie: CakeSlice,
}

/**
 * Theme-aware icon component.
 * Renders Minecraft (ItemIcon), Fallout (PipBoyIcon), and Chicago95 variants.
 * CSS visibility classes show/hide based on the active theme class on <html>.
 *
 * Works in both server and client components.
 */
export function ThemeIcon({ type, className = '', scale = 1 }: ThemeIconProps) {
    const foType = ICON_MAP[type] || 'terminal'
    const foSize = Math.round(16 * scale)
    const chiSize = Math.round(14 * scale)
    const ChicagoIcon = CHI95_ICON_MAP[type] || Square

    return (
        <>
            <span className={`minecraft-only inline-flex items-center justify-center ${className}`}>
                <ItemIcon type={type as ItemType} scale={scale} />
            </span>
            <span className={`fallout-only inline-flex items-center justify-center ${className}`}>
                <PipBoyIcon type={foType} size={foSize} />
            </span>
            <span className={`chicago95-only inline-flex items-center justify-center ${className}`}>
                <ChicagoIcon size={chiSize} strokeWidth={1.75} />
            </span>
        </>
    )
}
