"use client"

import { useState, useEffect } from 'react'

const BOOT_MESSAGES = [
    "SUDCO INDUSTRIES (TM) TERMLINK",
    "RDD CALCULATOR v1.3.0",
    "VAULT-TEC LOGISTICS SYSTEM",
    "TERMINAL READY",
    "WELCOME OVERSEER",
    "SYSTEM OPERATIONAL",
    "DELIVERY DATE ESTIMATOR",
    "TRANSIT TIME CALCULATOR",
    "LOADING PROTOCOL...",
    "WASTELAND LOGISTICS CO."
]

export function BootText() {
    const [text, setText] = useState('')
    const [showCursor, setShowCursor] = useState(true)
    const [isTyping, setIsTyping] = useState(true)
    
    useEffect(() => {
        const message = BOOT_MESSAGES[Math.floor(Math.random() * BOOT_MESSAGES.length)]
        let index = 0
        
        // Typewriter effect
        const typeInterval = setInterval(() => {
            if (index <= message.length) {
                setText(message.slice(0, index))
                index++
            } else {
                clearInterval(typeInterval)
                setIsTyping(false)
            }
        }, 50)
        
        // Cursor blink
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev)
        }, 530)
        
        return () => {
            clearInterval(typeInterval)
            clearInterval(cursorInterval)
        }
    }, [])
    
    return (
        <div className="fo-text text-sm tracking-wider mt-2 text-center">
            <span className="fo-text-dim">{'>'}</span>{' '}
            <span>{text}</span>
            <span 
                className={`inline-block w-2 h-4 ml-1 align-middle transition-opacity duration-100 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
                style={{ 
                    backgroundColor: 'var(--fo-primary)',
                    boxShadow: '0 0 8px var(--fo-primary-glow)'
                }}
            />
        </div>
    )
}
