"use client"
import { Suspense } from 'react'
import { Calculator } from '@/components/Calculator'

export default function Home() {
    return (
        <main style={{ touchAction: 'pan-y', overscrollBehaviorY: 'contain' }}>
            <Suspense fallback={<div className="container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>}>
                <Calculator />
            </Suspense>
        </main>
    )
}
