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

export function SplashText() {
  // Use a stable splash based on date to avoid hydration mismatch, or just simple random client-side
  const [text, setText] = React.useState("")

  React.useEffect(() => {
    setText(SPLASHES[Math.floor(Math.random() * SPLASHES.length)])
  }, [])

  if (!text) return null

  return (
    <div 
      className="absolute top-0 right-0 -mr-20 mt-8 transform -rotate-12 animate-bounce-splash pointer-events-none select-none z-20"
      style={{
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

