"use client"

import React, { useEffect, useRef } from 'react'

export function Panorama() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = 0.5
    // Safari may block autoplay — attempt to play and ignore errors
    video.play().catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#1a1a1a] pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      
      {/* Heavy Vignette for focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  )
}
