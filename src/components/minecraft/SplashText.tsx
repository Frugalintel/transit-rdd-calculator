"use client"

import React from 'react'

const SPLASHES = [
  "Now with RDD!",
  "Calculates fast!",
  "Creeper aww man!",
  "Don't dig down!",
  "100% Accurate!",
  "Logistics Craft!",
  "Transit Guide!",
  "Blocky Dates!",
  "Peak Season Ready!",
  "Load Spread Included!",
  "Not a Mimic!",
  "Diamond Tier!",
  "Also try Terraria!",
  "Check your dates!"
]

type SplashSelection = {
  text: string
  index: number
  source: 'seed' | 'day-key'
  seed?: number
  dayKey?: string
  hash?: number
}

function getSplashBySeed(seed: number) {
  const index = Math.abs(Math.trunc(seed)) % SPLASHES.length
  return {
    index,
    text: SPLASHES[index],
  }
}

function getStableSplashSelection(date = new Date()) {
  // Stable per UTC day, avoids first-paint null and hydration drift.
  const dayKey = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`
  let hash = 0
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % SPLASHES.length
  return {
    dayKey,
    hash,
    index,
    text: SPLASHES[index],
  }
}

export function SplashText({ initialSeed }: { initialSeed?: number }) {
  const [selection] = React.useState<SplashSelection>(() => {
    if (typeof initialSeed === 'number' && Number.isFinite(initialSeed)) {
      const seeded = getSplashBySeed(initialSeed)
      return {
        text: seeded.text,
        index: seeded.index,
        source: 'seed',
        seed: Math.trunc(initialSeed),
      }
    }
    const stable = getStableSplashSelection()
    return {
      text: stable.text,
      index: stable.index,
      source: 'day-key',
      dayKey: stable.dayKey,
      hash: stable.hash,
    }
  })
  const text = selection.text

  if (!text) return null

  return (
    <div 
      className="absolute bottom-0 right-0 -mr-10 -mb-1 pointer-events-none select-none z-20"
      style={{
        transform: 'rotate(-20deg) scale(1)',
        animation: 'minecraft-splash 0.8s infinite alternate ease-in-out'
      }}
    >
      <span 
        className={`${text.length > 20 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} text-[#FFFF55] drop-shadow-md text-stroke whitespace-nowrap`}
        style={{ 
          textShadow: '2px 2px 0px #3f3f00',
          fontWeight: 'normal'
        }}
      >
        {text}
      </span>
      <style jsx>{`
        @keyframes minecraft-splash {
          from { transform: rotate(-20deg) scale(1); }
          to { transform: rotate(-20deg) scale(1.1); }
        }
        .text-stroke {
          -webkit-text-stroke: 0px transparent; /* VT323 is too thin for stroke, rely on shadow */
        }
      `}</style>
    </div>
  )
}

