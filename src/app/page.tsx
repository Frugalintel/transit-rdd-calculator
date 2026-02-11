import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Calculator } from '@/components/Calculator'

const AUTH_HINT_KEY = 'calc-auth-hint'

export default async function Home() {
    const cookieStore = await cookies()
    const initialAuthHint = cookieStore.get(AUTH_HINT_KEY)?.value === '1'
    const initialSplashSeed = Date.now()

    return (
        <main style={{ touchAction: 'pan-y', overscrollBehaviorY: 'contain' }}>
            <Suspense fallback={<div className="container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>Loading...</div>}>
                <Calculator initialAuthHint={initialAuthHint} initialSplashSeed={initialSplashSeed} />
            </Suspense>
        </main>
    )
}
