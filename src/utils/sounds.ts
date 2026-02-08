// Theme-aware sound effects using Web Audio API

type ThemeMode = 'minecraft' | 'fallout'

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private themeMode: ThemeMode = 'minecraft'

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn('Web Audio API not supported', e)
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setThemeMode(mode: ThemeMode) {
    this.themeMode = mode
  }

  // Resume audio context if suspended (required for Safari)
  private async resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (e) {
        console.warn('Could not resume audio context', e)
      }
    }
  }

  // Helper to play a tone
  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, delay: number = 0) {
    if (!this.enabled || !this.audioContext) return
    
    // Resume context if needed (Safari requirement)
    this.resumeContext()

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = freq
    oscillator.type = type

    gainNode.gain.setValueAtTime(vol, this.audioContext.currentTime + delay)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + duration)

    oscillator.start(this.audioContext.currentTime + delay)
    oscillator.stop(this.audioContext.currentTime + delay + duration)
  }

  // Click sound - theme aware
  playClick() {
    if (this.themeMode === 'fallout') {
      // Terminal beep - higher pitched, electronic
      this.playTone(1200, 'sine', 0.05, 0.08)
      this.playTone(800, 'sine', 0.03, 0.04, 0.02)
    } else {
      // Minecraft click - Sharp click + lower thump
      this.playTone(800, 'square', 0.05, 0.05)
      this.playTone(150, 'triangle', 0.05, 0.1)
    }
  }

  // UI Open sound - theme aware
  playOpen() {
    if (this.themeMode === 'fallout') {
      // Terminal power-on sequence
      this.playTone(400, 'sine', 0.1, 0.06)
      this.playTone(600, 'sine', 0.1, 0.05, 0.05)
      this.playTone(800, 'sine', 0.15, 0.04, 0.1)
    } else {
      // Minecraft chest open
      this.playTone(150, 'sawtooth', 0.1, 0.1)
      this.playTone(200, 'square', 0.1, 0.05, 0.05)
    }
  }

  // UI Close sound - theme aware
  playClose() {
    if (this.themeMode === 'fallout') {
      // Terminal shutdown
      this.playTone(600, 'sine', 0.08, 0.05)
      this.playTone(300, 'sine', 0.1, 0.04, 0.05)
    } else {
      // Minecraft chest close
      this.playTone(100, 'sawtooth', 0.1, 0.1)
    }
  }

  // Success sound - theme aware
  playSuccess() {
    if (this.themeMode === 'fallout') {
      // Pip-Boy acknowledgment - ascending tones
      this.playTone(600, 'sine', 0.1, 0.1)
      this.playTone(900, 'sine', 0.1, 0.08, 0.08)
      this.playTone(1200, 'sine', 0.15, 0.06, 0.16)
    } else {
      // Minecraft XP pickup
      const pitch = 1 + (Math.random() * 0.4 - 0.2)
      this.playTone(800 * pitch, 'sine', 0.3, 0.1)
      this.playTone(1200 * pitch, 'sine', 0.3, 0.05)
    }
  }

  // Error sound - theme aware
  playError() {
    if (this.themeMode === 'fallout') {
      // Terminal error - harsh buzz
      this.playTone(150, 'sawtooth', 0.15, 0.15)
      this.playTone(200, 'square', 0.1, 0.1, 0.05)
    } else {
      // Minecraft damage sound
      this.playTone(150, 'sawtooth', 0.2, 0.2)
      this.playTone(100, 'square', 0.2, 0.2)
    }
  }

  // Terminal typing sound (Fallout only)
  playTyping() {
    if (this.themeMode === 'fallout') {
      const pitch = 0.9 + Math.random() * 0.2
      this.playTone(1000 * pitch, 'sine', 0.02, 0.03)
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager()

// Hook for easy integration with React components
export function useSounds() {
  return {
    playClick: () => soundManager.playClick(),
    playOpen: () => soundManager.playOpen(),
    playClose: () => soundManager.playClose(),
    playSuccess: () => soundManager.playSuccess(),
    playError: () => soundManager.playError(),
    setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
  }
}
