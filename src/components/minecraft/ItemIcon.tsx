"use client"

import React from 'react'

export type ItemType = 'clock' | 'compass' | 'feather' | 'paper' | 'chest' | 'book' | 'sign' | 'firework' | 'firework_star' | 'redstone_dust' | 'snowball' | 'pumpkin_pie' | 'banner' | 'pickaxe' | 'iron_pickaxe' | 'bell' | 'totem' | 'cookie' | 'poppy' | 'chain' | 'golden_helmet' | 'cooked_chicken' | 'cake' | 'torch' | 'wheat' | 'arrow_right' | 'arrow_down' | 'gear' | 'name_tag'

interface ItemIconProps {
  type: ItemType
  className?: string
  scale?: number
}

// Simplified pixel art representations (16x16 grid)
const ITEM_PATHS: Record<ItemType, string> = {
  clock: `
    <rect x="2" y="7" width="2" height="2" fill="#EBD159" />
    <rect x="12" y="7" width="2" height="2" fill="#EBD159" />
    <rect x="7" y="2" width="2" height="2" fill="#EBD159" />
    <rect x="7" y="12" width="2" height="2" fill="#EBD159" />
    <circle cx="8" cy="8" r="6" stroke="#C69E2E" stroke-width="2" fill="#F8E797" />
    <path d="M8 8 L10 5" stroke="#373737" stroke-width="1.5" />
    <path d="M8 8 L6 10" stroke="#373737" stroke-width="1.5" />
  `,
  compass: `
    <circle cx="8" cy="8" r="7" fill="#C6C6C6" stroke="#585858" stroke-width="2" />
    <path d="M8 8 L11 5 L8 8 L5 11" stroke="#AA0000" stroke-width="2" />
    <path d="M8 8 L11 11 L8 8 L5 5" stroke="#F8F8F8" stroke-width="2" />
    <circle cx="8" cy="8" r="1.5" fill="#373737" />
  `,
  feather: `
    <path d="M12 3 Q 14 2 13 5 Q 11 8 9 9 Q 7 10 5 12 L 4 13 L 3 12 L 4 11 Q 6 9 7 7 Q 9 4 12 3" fill="#F8F8F8" stroke="#C6C6C6" stroke-width="1" />
    <path d="M4 13 L2 15" stroke="#C6C6C6" stroke-width="1.5" />
  `,
  paper: `
    <rect x="4" y="2" width="9" height="12" fill="#F8F8F8" />
    <path d="M6 5 H 11 M 6 8 H 11 M 6 11 H 10" stroke="#C6C6C6" stroke-width="1" />
  `,
  chest: `
    <rect x="2" y="4" width="12" height="10" fill="#9C6F3C" stroke="#593D2E" stroke-width="1" />
    <rect x="2" y="4" width="12" height="3" fill="#593D2E" />
    <rect x="6" y="6" width="4" height="2" fill="#C6C6C6" />
  `,
  book: `
    <rect x="3" y="3" width="10" height="11" fill="#783E1E" />
    <rect x="4" y="4" width="8" height="9" fill="#F8F8F8" />
    <path d="M6 6 H 10 M 6 8 H 10" stroke="#C6C6C6" stroke-width="1" />
  `,
  sign: `
    <rect x="3" y="3" width="10" height="6" fill="#9C6F3C" stroke="#593D2E" stroke-width="1" />
    <rect x="7" y="9" width="2" height="5" fill="#593D2E" />
  `,
  firework: `
    <path d="M6 3 L10 3 L10 9 L6 9 Z" fill="#D93F3F" stroke="#9E2B2B" stroke-width="1" />
    <rect x="7" y="9" width="2" height="5" fill="#8B5E3C" />
    <path d="M8 2 L8 3" stroke="#FFFFFF" stroke-width="1" />
  `,
  redstone_dust: `
    <path d="M3 8 L5 6 L7 8 L9 6 L11 8 L13 6" stroke="#AA0000" stroke-width="2" fill="none" />
    <circle cx="3" cy="8" r="1" fill="#AA0000" />
    <circle cx="5" cy="6" r="1" fill="#AA0000" />
    <circle cx="7" cy="8" r="1" fill="#AA0000" />
    <circle cx="9" cy="6" r="1" fill="#AA0000" />
    <circle cx="11" cy="8" r="1" fill="#AA0000" />
    <circle cx="13" cy="6" r="1" fill="#AA0000" />
  `,
  snowball: `
    <circle cx="8" cy="8" r="5" fill="#FFFFFF" stroke="#A0A0A0" stroke-width="1" />
    <path d="M6 7 Q 8 9 10 7" stroke="#D0D0D0" stroke-width="1" fill="none" />
  `,
  pumpkin_pie: `
    <circle cx="8" cy="8" r="6" fill="#D98036" stroke="#9E5B26" stroke-width="1" />
    <path d="M8 8 L 14 8 A 6 6 0 0 0 8 2 Z" fill="#F0C080" stroke="#9E5B26" stroke-width="1" />
  `,
  banner: `
    <rect x="3" y="2" width="1" height="12" fill="#8B5E3C" />
    <rect x="4" y="3" width="8" height="5" fill="#FFFFFF" stroke="#C6C6C6" stroke-width="1" />
    <rect x="5" y="4" width="6" height="3" fill="#3C4CAD" />
  `,
  pickaxe: `
    <path d="M4 12 L12 4" stroke="#593D2E" stroke-width="2" />
    <path d="M9 3 Q 12 3 13 6 M 7 5 L 5 7" stroke="#707070" stroke-width="3" />
  `,
  bell: `
    <path d="M4 11 L12 11 Q 12 5 8 5 Q 4 5 4 11 Z" fill="#F8D040" stroke="#C69E2E" stroke-width="1" />
    <circle cx="8" cy="12" r="1" fill="#C69E2E" />
  `,
  totem: `
    <rect x="5" y="3" width="6" height="10" fill="#F8D040" stroke="#C69E2E" stroke-width="1" />
    <rect x="3" y="5" width="10" height="2" fill="#3C8D40" />
    <circle cx="6.5" cy="6" r="0.5" fill="#000" />
    <circle cx="9.5" cy="6" r="0.5" fill="#000" />
  `,
  cookie: `
    <circle cx="8" cy="8" r="5" fill="#C69E2E" stroke="#967826" stroke-width="1" />
    <circle cx="6" cy="7" r="0.5" fill="#593D2E" />
    <circle cx="9" cy="6" r="0.5" fill="#593D2E" />
    <circle cx="8" cy="9" r="0.5" fill="#593D2E" />
    <circle cx="10" cy="9" r="0.5" fill="#593D2E" />
  `,
  firework_star: `
    <path d="M8 2 L9 6 L13 6 L10 9 L11 13 L8 10 L5 13 L6 9 L3 6 L7 6 Z" fill="#FFDD00" stroke="#CC9900" stroke-width="0.5" />
    <circle cx="8" cy="7.5" r="2" fill="#FF6600" />
  `,
  iron_pickaxe: `
    <path d="M3 13 L13 3" stroke="#8B5E3C" stroke-width="2" />
    <path d="M10 2 L14 2 L14 6" stroke="#C6C6C6" stroke-width="3" fill="none" />
    <rect x="10" y="2" width="4" height="4" fill="#A0A0A0" stroke="#707070" stroke-width="0.5" />
  `,
  poppy: `
    <path d="M8 14 L8 8" stroke="#3C8D40" stroke-width="1.5" />
    <path d="M6 10 L8 8 L10 10" stroke="#3C8D40" stroke-width="1" fill="none" />
    <circle cx="8" cy="5" r="3.5" fill="#FF3333" stroke="#AA0000" stroke-width="0.5" />
    <circle cx="8" cy="5" r="1" fill="#1A1A1A" />
  `,
  chain: `
    <ellipse cx="8" cy="4" rx="2.5" ry="2" fill="none" stroke="#707070" stroke-width="1.5" />
    <ellipse cx="8" cy="8" rx="2.5" ry="2" fill="none" stroke="#707070" stroke-width="1.5" />
    <ellipse cx="8" cy="12" rx="2.5" ry="2" fill="none" stroke="#707070" stroke-width="1.5" />
  `,
  golden_helmet: `
    <path d="M3 10 Q 3 5 8 4 Q 13 5 13 10 L 12 12 L 4 12 Z" fill="#F8D040" stroke="#C69E2E" stroke-width="1" />
    <rect x="4" y="10" width="8" height="2" fill="#C69E2E" />
  `,
  cooked_chicken: `
    <ellipse cx="8" cy="9" rx="5" ry="4" fill="#C69E2E" stroke="#967826" stroke-width="1" />
    <path d="M4 8 Q 3 5 5 4" stroke="#F8F8F8" stroke-width="2" fill="none" />
    <path d="M12 8 Q 13 5 11 4" stroke="#F8F8F8" stroke-width="2" fill="none" />
  `,
  cake: `
    <rect x="2" y="8" width="12" height="6" fill="#F8E797" stroke="#C69E2E" stroke-width="1" />
    <rect x="2" y="6" width="12" height="3" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="0.5" />
    <rect x="7" y="3" width="2" height="4" fill="#FF3333" />
    <circle cx="8" cy="2.5" r="1" fill="#FFDD00" />
  `,
  torch: `
    <rect x="7" y="10" width="2" height="5" fill="#8B5E3C" />
    <rect x="6" y="9" width="4" height="1" fill="#8B5E3C" />
    <circle cx="8" cy="6" r="3" fill="#FFDD00" stroke="#FF9900" stroke-width="1" />
    <path d="M8 3 L8 5 M6 4 L7 5 M10 4 L9 5 M5 6 L7 7 M11 6 L9 7" stroke="#FF6600" stroke-width="1" />
  `,
  wheat: `
    <path d="M8 14 L8 8" stroke="#8B5E3C" stroke-width="1.5" />
    <path d="M6 10 L8 8 L10 10" stroke="#8B5E3C" stroke-width="1" fill="none" />
    <path d="M5 6 L6 8 L7 7 L8 9 L9 8 L10 10 L11 9" stroke="#F8E797" stroke-width="2" fill="none" />
    <circle cx="5" cy="6" r="0.5" fill="#F8E797" />
    <circle cx="7" cy="7" r="0.5" fill="#F8E797" />
    <circle cx="9" cy="8" r="0.5" fill="#F8E797" />
    <circle cx="11" cy="9" r="0.5" fill="#F8E797" />
  `,
  arrow_right: `
    <path d="M6 4 L10 8 L6 12" stroke="#505050" stroke-width="2" fill="none" />
  `,
  arrow_down: `
    <path d="M4 6 L8 10 L12 6" stroke="#505050" stroke-width="2" fill="none" />
  `,
  gear: `
    <circle cx="8" cy="8" r="6.5" fill="none" stroke="#707070" stroke-width="2" />
    <circle cx="8" cy="8" r="3" fill="#707070" />
    <rect x="7" y="0" width="2" height="3" fill="#707070" />
    <rect x="7" y="13" width="2" height="3" fill="#707070" />
    <rect x="0" y="7" width="3" height="2" fill="#707070" />
    <rect x="13" y="7" width="3" height="2" fill="#707070" />
    <rect x="3" y="3" width="2" height="2" fill="#707070" />
    <rect x="11" y="3" width="2" height="2" fill="#707070" />
    <rect x="3" y="11" width="2" height="2" fill="#707070" />
    <rect x="11" y="11" width="2" height="2" fill="#707070" />
  `,
  name_tag: `
    <path d="M4 11 L10 5 L13 5 L13 8 L7 14 Z" fill="#F8F8F8" stroke="#C6C6C6" stroke-width="1" />
    <circle cx="11.5" cy="6.5" r="1" fill="#707070" />
  `
}

// Map of item types that have Minecraft wiki images available
const ITEM_IMAGES: Partial<Record<ItemType, string>> = {
  compass: '/textures/compass.gif',
  clock: '/textures/clock.gif',
  // All items with real Minecraft textures
  book: '/textures/book.png',
  chest: '/textures/chest.png',
  sign: '/textures/sign.png',
  pickaxe: '/textures/pickaxe.png',
  cookie: '/textures/cookie.png',
  feather: '/textures/feather.png',
  firework: '/textures/firework.png',
  firework_star: '/textures/firework_star.png',
  golden_helmet: '/textures/golden_helmet.png',
  iron_pickaxe: '/textures/iron_pickaxe.png',
  poppy: '/textures/poppy.png',
  wheat: '/textures/wheat.png',
  bell: '/textures/bell.png',
  totem: '/textures/totem.png',
  chain: '/textures/chain.png',
  cooked_chicken: '/textures/cooked_chicken.png',
  cake: '/textures/cake.png',
  banner: '/textures/banner.png',
  torch: '/textures/torch.png',
  redstone_dust: '/textures/redstone_dust.png',
  paper: '/textures/paper.png',
  snowball: '/textures/snowball.png',
  pumpkin_pie: '/textures/pumpkin_pie.png',
  gear: '/textures/gear.png',
}

export function ItemIcon({ type, className = '', scale = 1 }: ItemIconProps) {
  const imagePath = ITEM_IMAGES[type]
  
  // Use image if available, otherwise fall back to SVG
  if (imagePath) {
    return (
      <div 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ 
          width: `${16 * scale}px`, 
          height: `${16 * scale}px` 
        }}
      >
        <img 
          src={imagePath}
          alt={type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
          style={{ 
            width: '100%', 
            height: '100%', 
            imageRendering: 'pixelated',
            objectFit: 'contain'
          }}
        />
      </div>
    )
  }

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ 
        width: `${16 * scale}px`, 
        height: `${16 * scale}px` 
      }}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 16 16" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
      >
        <g dangerouslySetInnerHTML={{ __html: ITEM_PATHS[type] }} />
      </svg>
    </div>
  )
}
