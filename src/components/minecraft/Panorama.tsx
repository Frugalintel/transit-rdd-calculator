"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

export function Panorama() {
  const { settings } = useTheme()
  const [resolvedImage, setResolvedImage] = useState<string>('/backgrounds/minecraft/default-office.webp')

  const minecraftBackgrounds: Record<string, string[]> = useMemo(() => ({
    default: [
      '/backgrounds/minecraft/default-office.webp',
      '/backgrounds/minecraft/default-office.png',
      '/backgrounds/minecraft/default-office.jpg',
      '/backgrounds/minecraft/default-office.jpeg',
      '/default-office.png',
      '/default-office.jpg',
      '/default-office.jpeg',
      '/default-office.webp',
    ],
    nether: [
      '/backgrounds/minecraft/nether.webp',
      '/backgrounds/minecraft/nether.png',
      '/backgrounds/minecraft/nether.jpg',
      '/backgrounds/minecraft/nether.jpeg',
    ],
    ocean: [
      '/backgrounds/minecraft/ocean.webp',
      '/backgrounds/minecraft/ocean.png',
      '/backgrounds/minecraft/ocean.jpg',
      '/backgrounds/minecraft/ocean.jpeg',
    ],
    forest: [
      '/backgrounds/minecraft/forest.webp',
      '/backgrounds/minecraft/forest.png',
      '/backgrounds/minecraft/forest.jpg',
      '/backgrounds/minecraft/forest.jpeg',
    ],
    redstone: [
      '/backgrounds/minecraft/redstone.webp',
      '/backgrounds/minecraft/redstone.png',
      '/backgrounds/minecraft/redstone.jpg',
      '/backgrounds/minecraft/redstone.jpeg',
    ],
    custom: [
      '/backgrounds/minecraft/default-office.webp',
      '/backgrounds/minecraft/default-office.png',
      '/backgrounds/minecraft/default-office.jpg',
      '/backgrounds/minecraft/default-office.jpeg',
    ],
  }), [])

  const selectedImages = minecraftBackgrounds[settings.activeTheme] || minecraftBackgrounds.default
  const fallbackImages = minecraftBackgrounds.default

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false
    const candidates = [
      ...selectedImages,
      ...fallbackImages.filter((path) => !selectedImages.includes(path)),
    ]

    // Paint immediately with the preferred image to avoid a dark flash on refresh.
    if (candidates[0]) {
      setResolvedImage(candidates[0])
    }

    const resolveFirstAvailable = (index: number) => {
      if (cancelled) return
      if (index >= candidates.length) {
        // Keep the currently shown image if probing fails.
        return
      }

      const probe = new window.Image()
      probe.onload = () => {
        if (!cancelled) {
          setResolvedImage(candidates[index])
        }
      }
      probe.onerror = () => {
        resolveFirstAvailable(index + 1)
      }
      probe.src = candidates[index]
    }

    resolveFirstAvailable(0)
    return () => {
      cancelled = true
    }
  }, [selectedImages, fallbackImages])

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#1a1a1a] pointer-events-none">
      {resolvedImage && (
        <div
          className="mc-pan-bg"
          style={{ backgroundImage: `url(${resolvedImage})` }}
        />
      )}
      
      {/* Lighter vignette so scene stays visible */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.58)_100%)]" />
    </div>
  )
}
