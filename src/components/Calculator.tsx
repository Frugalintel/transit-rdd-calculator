"use client"
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useTransitData } from '@/hooks/useTransitData'
import { useCalculator, CalculationResult } from '@/hooks/useCalculator'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'next/navigation'
import { SettingsMenu } from './SettingsMenu'
import { AuthForm } from './AuthForm'
import { generateCopyText, CopyFormat, FORMAT_LABELS } from '@/utils/textHelpers'
import { formatDateForCopy } from '@/utils/dateHelpers'
import { createClient, withTimeout } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useSounds } from '@/utils/sounds'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Scale, MapPin, RotateCw } from 'lucide-react'
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select'
// Minecraft components
import { ItemIcon } from './minecraft/ItemIcon'
import { SplashText } from './minecraft/SplashText'
import { FurnaceArrow } from './minecraft/FurnaceArrow'
import { NameTagInput } from './minecraft/NameTagInput'
// Fallout components
import { PipBoyIcon } from './fallout/PipBoyIcon'
import { BootText } from './fallout/BootText'
import { TerminalProgress } from './fallout/TerminalProgress'
// Shared components
import { HistorySidebar } from './HistorySidebar'

const AUTH_HINT_KEY = 'calc-auth-hint'


export function Calculator({
    initialAuthHint = false,
    initialSplashSeed,
}: {
    initialAuthHint?: boolean
    initialSplashSeed?: number
}) {
    const { data, loading, error: dataError } = useTransitData()
    const { calculate } = useCalculator(data)
    const { settings, mounted } = useTheme()
    const router = useRouter()
    const sounds = useSounds()
    
    // Inputs
    const [packDate, setPackDate] = useState<Date | undefined>()
    const [loadDate, setLoadDate] = useState<Date | undefined>()
    const [weight, setWeight] = useState('')
    const [distance, setDistance] = useState('')
    
    // Result
    const [result, setResult] = useState<CalculationResult | null>(null)
    const [copyFormat, setCopyFormat] = useState<CopyFormat>('simple')
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [calculationName, setCalculationName] = useState('')
    const [submittedName, setSubmittedName] = useState('')
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [refreshHistory, setRefreshHistory] = useState(0)
    const [authResolved, setAuthResolved] = useState(false)
    const [authHint, setAuthHint] = useState(initialAuthHint)
    type AdminStatus = 'unknown' | 'admin' | 'user'
    const [adminStatus, setAdminStatus] = useState<AdminStatus>('unknown')
    const lastAutoAdjustNoticeRef = useRef<{ key: string; at: number } | null>(null)

    // URL Params
    const searchParams = useSearchParams()
    const supabase = createClient()

    const isAbortLikeError = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err || '')
        return msg.includes('AbortError') || msg.includes('signal is aborted')
    }

    const getCurrentUserSafe = async (): Promise<any | undefined> => {
        // undefined => unable to determine (transient failure)
        try {
            const authResult = await withTimeout(supabase.auth.getUser(), 10000) as any
            if (authResult?.error) {
                if (isAbortLikeError(authResult.error)) return undefined
                return null
            }
            const directUser = authResult?.data?.user ?? null
            if (directUser) return directUser

            // Fallback: session can still have a user during transient refresh timing.
            const sessionResult = await withTimeout(supabase.auth.getSession(), 8000) as any
            return sessionResult?.data?.session?.user ?? null
        } catch (err) {
            if (!isAbortLikeError(err)) {
                console.warn('getUser failed, attempting getSession fallback:', err)
            }
            try {
                const sessionResult = await withTimeout(supabase.auth.getSession(), 8000) as any
                return sessionResult?.data?.session?.user ?? null
            } catch (fallbackErr) {
                if (!isAbortLikeError(fallbackErr)) {
                    console.warn('getSession fallback failed:', fallbackErr)
                }
                return undefined
            }
        }
    }

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const persistAuthHint = (value: boolean) => {
        setAuthHint(value)
        if (typeof window === 'undefined') return
        try {
            if (value) {
                window.sessionStorage.setItem(AUTH_HINT_KEY, '1')
                document.cookie = `${AUTH_HINT_KEY}=1; path=/; SameSite=Lax`
            } else {
                window.sessionStorage.removeItem(AUTH_HINT_KEY)
                document.cookie = `${AUTH_HINT_KEY}=; path=/; Max-Age=0; SameSite=Lax`
            }
        } catch {
            // Ignore storage errors.
        }
    }

    useLayoutEffect(() => {
        // Read auth hint before first paint to prevent login/logout flash.
        let nextHint = false
        try {
            nextHint = window.sessionStorage.getItem(AUTH_HINT_KEY) === '1'
        } catch {
            nextHint = false
        }
        setAuthHint(nextHint)
    }, [])

    // Check auth state and admin status
    useEffect(() => {
        let mounted = true

        const resolveAdminStatus = async (currentUser: any): Promise<void> => {
            if (!currentUser) {
                if (mounted) setAdminStatus('user')
                return
            }

            try {
                const query = supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', currentUser.id)
                    .single()
                const { data: profile, error } = await withTimeout(
                    query as unknown as Promise<any>,
                    15000 // 15s timeout
                ) as any
                if (!mounted) return

                if (error) {
                    if (!isAbortLikeError(error)) {
                        console.warn('Admin check failed:', error.message)
                    }
                    // Preserve current admin status on transient errors.
                    return
                }

                setAdminStatus(profile?.role === 'admin' ? 'admin' : 'user')
            } catch (err) {
                if (!isAbortLikeError(err)) {
                    console.warn('Admin check timed out or threw:', err)
                }
                // Preserve current admin status on timeouts/transient failures.
            }
        }
        
        const checkUser = async (): Promise<void> => {
            let currentUser: any | undefined = undefined
            for (let attempt = 0; attempt < 3; attempt++) {
                currentUser = await getCurrentUserSafe()

                // Retry transient indeterminate/empty states briefly to reduce refresh flicker.
                if (typeof currentUser === 'undefined' || currentUser === null) {
                    if (attempt < 2) {
                        await sleep(120 * (attempt + 1))
                        continue
                    }
                }
                break
            }

            if (!mounted) return

            // Fail-safe: resolve UI controls even if auth remains indeterminate.
            if (typeof currentUser === 'undefined') {
                setAuthResolved(true)
                return
            }

            setUser(currentUser)
            persistAuthHint(Boolean(currentUser))
            setAuthResolved(true)
            await resolveAdminStatus(currentUser)
        }
        
        // Check auth immediately
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
            if (!mounted) return

            // Token refresh can fire frequently; avoid repeated profile lookups.
            if (event === 'TOKEN_REFRESHED') return

            if (event === 'SIGNED_OUT') {
                setUser(null)
                setAdminStatus('user')
                persistAuthHint(false)
                setAuthResolved(true)
                return
            }

            const eventUser = session?.user ?? null
            // Avoid clearing user/admin on transient null-session events
            // (can happen briefly during refresh/bootstrap in production).
            if (!eventUser) {
                setAuthResolved(true)
                return
            }

            setUser(eventUser)
            persistAuthHint(true)
            setAuthResolved(true)

            await resolveAdminStatus(eventUser)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        // Read URL params
        const pDate = searchParams.get('packDate')
        const lDate = searchParams.get('loadDate')
        const w = searchParams.get('weight')
        const d = searchParams.get('distance')

        if (pDate) {
             const [y, m, dNum] = pDate.split('-').map(Number)
             setPackDate(new Date(y, m - 1, dNum))
        }
        if (lDate) {
            const [y, m, dNum] = lDate.split('-').map(Number)
            setLoadDate(new Date(y, m - 1, dNum))
        }
        if (w) setWeight(w)
        if (d) setDistance(d)
        
    }, [searchParams])

    // Initial load auto-calc
    useEffect(() => {
        const pDate = searchParams.get('packDate')
        const lDate = searchParams.get('loadDate')
        const w = searchParams.get('weight')
        const d = searchParams.get('distance')
        if (pDate && lDate && w && d && data) {
            const weightNum = parseFloat(w)
            const distNum = parseFloat(d)
            const [y, m, dNum] = lDate.split('-').map(Number)
            const localDate = new Date(y, m - 1, dNum)
            const res = calculate(weightNum, distNum, localDate)
            setResult(res)
        }
    }, [data, searchParams, calculate])

    // Clear submitted name when any input changes
    useEffect(() => {
        setSubmittedName('')
    }, [packDate, loadDate, weight, distance])

    const handleReset = () => {
        sounds.playClick()
        setCalculationName('')
        setSubmittedName('')
        setPackDate(undefined)
        setLoadDate(undefined)
        setWeight('')
        setDistance('')
        setResult(null)
    }

    const handleCalculate = async () => {
        sounds.playClick()
        if (!packDate) {
            sounds.playError()
            toast.error("Pack date required!")
            return
        }
        if (!loadDate) {
            sounds.playError()
            toast.error("Pickup date required!")
            return
        }
        
        const weightNum = parseFloat(weight)
        const distNum = parseFloat(distance)
        if (isNaN(weightNum) || isNaN(distNum)) {
             sounds.playError()
             toast.error("Invalid input!")
             return
        }

        // Trigger arrow animation
        setIsProcessing(true)
        
        // Quick animation, then show result
        setTimeout(async () => {
            const res = calculate(weightNum, distNum, loadDate)
            setResult(res)
            setSubmittedName(calculationName) // Save the name at time of calculation
            sounds.playSuccess()

            // Track all calculation attempts (including anonymous) for admin analytics.
            try {
                const { error: usageLogError } = await supabase.from('usage_logs').insert({
                    user_id: user?.id ?? null,
                    action_type: 'calculation',
                    details: {
                        authenticated: Boolean(user),
                        user_email: user?.email ?? null,
                        successful: !res?.error,
                        name: calculationName || null,
                        input_data: {
                            weight: weightNum,
                            distance: distNum,
                            loadDate: loadDate.toISOString(),
                            packDate: packDate?.toISOString() ?? null,
                        },
                        result_summary: res?.error ? { error: res.error } : {
                            transitDays: res?.transitDays ?? null,
                            seasonStatus: res?.seasonStatus ?? null,
                            rdd: res?.rdd?.toISOString?.() ?? null,
                        }
                    }
                })

                if (usageLogError) {
                    console.warn('Failed to log calculation usage:', usageLogError.message)
                }
            } catch (usageErr) {
                console.warn('Calculation usage logging threw:', usageErr)
            }
            
            // Save to history if logged in
            if (user && res && !res.error) {
                const { error: insertError } = await supabase.from('calculations').insert({
                    user_id: user.id,
                    name: calculationName || null,
                    input_data: {
                        weight: weightNum,
                        distance: distNum,
                        loadDate: loadDate.toISOString(),
                        packDate: packDate?.toISOString()
                    },
                    result_data: {
                        transitDays: res.transitDays,
                        rddDisplay: res.rddDisplay,
                        rdd: res.rdd.toISOString(),
                        seasonStatus: res.seasonStatus,
                        loadSpread: {
                            earliest: res.loadSpread.earliest.toISOString(),
                            latest: res.loadSpread.latest.toISOString()
                        }
                    }
                })
                
                if (insertError) {
                    console.error("Failed to save calculation:", insertError)
                } else {
                    setRefreshHistory(prev => prev + 1)
                    setCalculationName('') // Clear the name after saving
                }
            }

            // Reset processing state after animation completes
            setTimeout(() => setIsProcessing(false), 50)
        }, 300)
    }

    const copyResult = async (formatOverride?: CopyFormat) => {
        if (!result) return
        
        const fmt = formatOverride || copyFormat
        const pDateObj = packDate || null
        const lDateObj = loadDate || new Date()

        const text = generateCopyText(
            settings.templates[fmt],
            pDateObj,
            lDateObj,
            result.rdd,
            result.loadSpread.earliest,
            result.loadSpread.latest
        )
        
        try {
            // Clipboard write MUST happen first — before any audio/async
            // so the browser's user gesture activation isn't consumed
            await navigator.clipboard.writeText(text)
            sounds.playClick()
            toast.success("Copied to clipboard!")
        } catch (err) {
            console.error('Failed to copy', err)
            toast.error("Copy failed!")
        }
    }
    
    // Date validation
    useEffect(() => {
        if (packDate && loadDate && loadDate < packDate) {
            const adjustmentKey = `${packDate.toISOString()}::${loadDate.toISOString()}`
            const now = Date.now()
            const lastNotice = lastAutoAdjustNoticeRef.current
            const isDuplicateAdjustment =
                lastNotice !== null &&
                lastNotice.key === adjustmentKey &&
                now - lastNotice.at < 6000

            lastAutoAdjustNoticeRef.current = { key: adjustmentKey, at: now }
            setLoadDate(packDate)
            if (!isDuplicateAdjustment) {
                toast.info(`Pickup date was earlier than pack date and was adjusted to ${formatDateForCopy(packDate)}.`)
            }
        }
    }, [packDate, loadDate])

    const handleLogout = async () => {
        sounds.playClose()
        try {
            // Manually clear state first for immediate UI feedback
            setUser(null)
            setAdminStatus('user')
            persistAuthHint(false)
            
            const { error } = await supabase.auth.signOut()
            if (error) {
                // Log but don't fail - we've already cleared local state
                console.warn('SignOut returned error:', error)
            }
            toast.success("Logged out!")
        } catch (err) {
            console.error('Logout failed:', err)
            // State already cleared, so show success anyway
            toast.success("Logged out!")
        }
    }

    const openSettings = () => {
        sounds.playOpen()
        setIsSettingsOpen(true)
    }

    const openAuth = () => {
        sounds.playOpen()
        setIsAuthOpen(true)
    }

    const isFallout = settings.themeMode === 'fallout'
    const isAdmin = adminStatus === 'admin'
    const showAuthenticatedControls = Boolean(user) || (!authResolved && authHint)

    return (
        <div 
            className={`min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 relative ${isFallout ? 'fo-scanlines' : ''}`} 
            style={{ touchAction: 'pan-y' }}
        >
            {/* Title */}
            <div className={`mb-8 relative text-center z-10 w-full max-w-4xl pb-4 ${isFallout ? 'border-b-2 border-[var(--fo-primary)]' : ''}`}>
                {isFallout ? (
                    <div className="text-left w-full font-mono">
                        <div className="fo-text text-sm mb-2">STATUS: ONLINE SETTINGS VER 1.0.8</div>
                        <div className="fo-text text-sm mb-2">SUDCO INDUSTRIES UNIFIED OPERATING SYSTEM</div>
                        <div className="fo-text text-sm mb-4">COPYRIGHT 2075-2077 SUDCO INDUSTRIES</div>
                        <h1 className="text-4xl fo-title mt-8 mb-4">RDD CALCULATOR</h1>
                    </div>
                ) : (
                    <div className="relative w-fit mx-auto">
                        <Image
                            src="/backgrounds/minecraft/DATE-CHANGE-TOOL-V3.svg"
                            alt="RDD Calculator"
                            width={1200}
                            height={220}
                            priority
                            className="h-14 sm:h-20 md:h-28 w-auto drop-shadow-xl relative z-10"
                        />
                        <SplashText initialSeed={initialSplashSeed} />
                    </div>
                )}
            </div>

            <div className="w-full max-w-4xl z-10 relative">
                {/* Main Panel */}
                <div className={`p-0 relative ${isFallout ? 'bg-transparent' : 'mc-panel p-2'}`}>
                    {/* Minecraft Header */}
                    {!isFallout && (
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 px-2 sm:px-4 py-2 mb-2 border-b-2 border-[var(--mc-dark-border)]">
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-base sm:text-xl mc-heading">Transit Guide</span>
                            </div>
                            <div className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar">
                                <div className="flex items-center gap-1 sm:gap-2 w-max min-w-full">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                    <Button size="sm" variant="primary" onClick={() => router.push('/training')} className="text-xs sm:text-sm min-w-[104px] shrink-0">
                                        <ItemIcon type="book" className="mr-1 sm:mr-2" />
                                        Training
                                    </Button>
                                    <Button size="sm" onClick={openSettings} title="Settings" className="text-xs sm:text-sm min-w-[104px] shrink-0">
                                        <ItemIcon type="sign" className="mr-1 sm:mr-2" />
                                        Options
                                    </Button>
                                    {showAuthenticatedControls ? (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                if (user) setIsHistoryOpen(true)
                                            }}
                                            title="History"
                                            className="text-xs sm:text-sm min-w-[104px] shrink-0"
                                        >
                                            <ItemIcon type="clock" className="mr-1 sm:mr-2" />
                                            History
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            disabled
                                            aria-hidden="true"
                                            className="text-xs sm:text-sm min-w-[104px] shrink-0 invisible pointer-events-none"
                                        >
                                            <ItemIcon type="clock" className="mr-1 sm:mr-2" />
                                            History
                                        </Button>
                                    )}
                                    </div>
                                    <div className="ml-auto">
                                    {showAuthenticatedControls ? (
                                        <Button size="sm" onClick={handleLogout} className="text-xs sm:text-sm min-w-[104px] shrink-0">
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={openAuth} className="text-xs sm:text-sm min-w-[104px] shrink-0">
                                            Login
                                        </Button>
                                    )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fallout Header / Menu */}
                    {isFallout && (
                        <div className="w-full mb-8 border-b border-[var(--fo-primary-dim)] pb-2">
                            <div className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar">
                                <div className="flex items-center gap-1 sm:gap-3 w-max min-w-full">
                                    <button onClick={openSettings} className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-xs sm:text-base justify-center whitespace-nowrap min-w-[104px] shrink-0">[ SETTINGS ]</button>
                                    <button onClick={() => router.push('/training')} className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-xs sm:text-base justify-center whitespace-nowrap min-w-[104px] shrink-0">[ GUIDE ]</button>
                                    {showAuthenticatedControls && (
                                        <button
                                            onClick={() => {
                                                if (user) setIsHistoryOpen(true)
                                            }}
                                            className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-xs sm:text-base justify-center whitespace-nowrap min-w-[104px] shrink-0"
                                        >
                                            [ LOGS ]
                                        </button>
                                    )}
                                    {showAuthenticatedControls ? (
                                        <button onClick={handleLogout} className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-xs sm:text-base justify-center whitespace-nowrap min-w-[104px] shrink-0 ml-auto">[ LOGOUT ]</button>
                                    ) : (
                                        <button onClick={openAuth} className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-xs sm:text-base justify-center whitespace-nowrap min-w-[104px] shrink-0 ml-auto">[ LOGIN ]</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`flex flex-col gap-2 sm:gap-4 p-0 ${!isFallout ? 'lg:flex-row p-2 items-start' : 'items-center w-full'}`}>
                        {/* Input Section */}
                        <div className={`w-full flex flex-col ${!isFallout ? 'flex-1' : 'max-w-2xl'}`}>
                            <div className={`space-y-6 h-full ${
                                isFallout 
                                    ? 'bg-transparent border-none p-0' 
                                    : 'p-4 border-none mc-slot shadow-[inset_2px_2px_0_0_var(--mc-dark-border),inset_-2px_-2px_0_0_var(--mc-light-border)]'
                            }`}>
                                {!isFallout && (
                                    <div className="text-base sm:text-lg border-b-2 pb-2 mb-2 flex items-center gap-2 mc-subheading border-[var(--mc-text-gray)]">
                                        Shipment Data
                                    </div>
                                )}
                                
                                <div className={`grid grid-cols-1 gap-6 ${!isFallout ? 'md:grid-cols-2' : ''}`}>
                                    <div className="space-y-1">
                                        <Label className={`text-base sm:text-lg ${isFallout ? 'fo-label mb-2' : 'mc-label'}`}>PACK DATE (OPTIONAL):</Label>
                                        <DatePicker 
                                            date={packDate}
                                            setDate={setPackDate}
                                            label={isFallout ? "[ SELECT ]" : "Select..."}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className={`text-base sm:text-lg ${isFallout ? 'fo-label mb-2' : 'mc-label'}`}>PICKUP DATE:</Label>
                                        <DatePicker 
                                            date={loadDate}
                                            setDate={setLoadDate}
                                            label={isFallout ? "[ SELECT ]" : "Select..."}
                                        />
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 gap-6 ${!isFallout ? 'md:grid-cols-2' : ''}`}>
                                    <div className="space-y-1">
                                        <Label className={`text-base sm:text-lg ${isFallout ? 'fo-label mb-2' : 'mc-label'}`}>SHIPMENT WEIGHT (LBS):</Label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                placeholder={isFallout ? "_" : "..."}
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                className={`text-lg relative z-20 ${isFallout ? 'fo-input pl-0' : 'pr-10'}`}
                                            />
                                            {!isFallout && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <Scale className="h-5 w-5 text-[#707070]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className={`text-base sm:text-lg ${isFallout ? 'fo-label mb-2' : 'mc-label'}`}>DISTANCE (MILES):</Label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                placeholder={isFallout ? "_" : "..."}
                                                value={distance}
                                                onChange={(e) => setDistance(e.target.value)}
                                                className={`text-lg relative z-20 ${isFallout ? 'fo-input pl-0' : 'pr-10'}`}
                                            />
                                            {!isFallout && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-[#707070]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {isFallout ? (
                                        <div className="space-y-1">
                                            <Label className="fo-label text-base sm:text-lg mb-2">IDENTIFIER (OPTIONAL):</Label>
                                            <Input 
                                                value={calculationName}
                                                onChange={(e) => setCalculationName(e.target.value)}
                                                placeholder="_"
                                                className="text-lg fo-input pl-0"
                                            />
                                        </div>
                                    ) : (
                                        <NameTagInput 
                                            value={calculationName}
                                            onChange={setCalculationName}
                                            placeholder="Name or Code (optional)..."
                                        />
                                    )}
                                </div>
                                
                                <div className="pt-2 sm:pt-4 flex gap-2 items-center">
                                    <Button 
                                        onClick={handleCalculate} 
                                        disabled={loading || !loadDate || !packDate}
                                        className="flex-1 text-xl h-12"
                                        variant={isFallout ? "ghost" : "default"}
                                    >
                                        {isFallout ? (loading ? '[ CALCULATING... ]' : (
                                            <>
                                                <span className="sm:hidden">[ CALCULATE ]</span>
                                                <span className="hidden sm:inline">[ CALCULATE DELIVERY ]</span>
                                            </>
                                        )) : (loading ? 'Crafting...' : 'Calculate Delivery')}
                                    </Button>
                                    {!isFallout && (
                                        <Button
                                            onClick={handleReset}
                                            variant="destructive"
                                            title="Clear and Reset"
                                            className="w-14 h-12 flex items-center justify-center p-0"
                                        >
                                            <RotateCw className="h-5 w-5" aria-hidden="true" />
                                        </Button>
                                    )}
                                    {isFallout && (
                                         <Button
                                            onClick={handleReset}
                                            variant="ghost"
                                            className="text-xl h-12"
                                        >
                                            [ RESET ]
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Arrow/Progress Divider (Minecraft Only) */}
                        {!isFallout && (
                            <div className="flex items-center justify-center shrink-0 self-center py-1 sm:py-2 lg:py-0 lg:px-4">
                                <div className="rotate-90 lg:rotate-0 transition-transform">
                                    <FurnaceArrow isProcessing={isProcessing} />
                                </div>
                            </div>
                        )}

                        {/* Results Section */}
                        <div className={`w-full flex flex-col ${!isFallout ? 'lg:w-72 xl:w-80 shrink-0' : 'mt-8 border-t-2 border-[var(--fo-primary)] pt-8 max-w-2xl'}`}>
                             <div className={`flex flex-col h-full ${
                                 isFallout 
                                     ? 'bg-transparent border-none p-0' 
                                     : 'p-4 border-none mc-slot shadow-[inset_2px_2px_0_0_var(--mc-dark-border),inset_-2px_-2px_0_0_var(--mc-light-border)]'
                             }`}>
                                {!isFallout && (
                                    <div className="text-base sm:text-lg border-b-2 pb-2 mb-2 sm:mb-3 flex items-center gap-2 mc-subheading border-[var(--mc-text-gray)]">
                                        {submittedName ? `Results for ${submittedName}` : 'Result'}
                                    </div>
                                )}

                                {result ? (
                                    <div className="flex-1 flex flex-col justify-between gap-2 sm:gap-3 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="space-y-6">
                                            {/* Main Result */}
                                            {isFallout ? (
                                                <div className="space-y-6 pt-2">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="border border-[var(--fo-primary)] p-4 relative">
                                                            <div className="absolute -top-2.5 left-3 bg-[var(--fo-bg)] px-2">
                                                                <h3 className="fo-label text-xs tracking-wider opacity-100 mb-0">RATE CYCLE</h3>
                                                            </div>
                                                            <div className={`text-lg sm:text-xl font-bold tracking-wide mt-1 ${result.seasonStatus === 'Peak Season' ? 'text-red-500' : 'fo-text'}`}>
                                                                {result.seasonStatus === 'Peak Season' ? 'PEAK' : 'OFF-PEAK'}
                                                            </div>
                                                        </div>
                                                        <div className="border border-[var(--fo-primary)] p-4 relative">
                                                            <div className="absolute -top-2.5 left-3 bg-[var(--fo-bg)] px-2">
                                                                <h3 className="fo-label text-xs tracking-wider opacity-100 mb-0">TRANSIT TIME</h3>
                                                            </div>
                                                            <div className="text-lg sm:text-xl font-bold tracking-wide fo-text mt-1">{result.transitDays} DAYS</div>
                                                        </div>
                                                    </div>

                                                    <div className="border-2 border-[var(--fo-primary)] p-6 relative my-2">
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--fo-bg)] px-2">
                                                            <h3 className="fo-label text-sm tracking-widest text-center min-w-0 opacity-100 mb-0">REQUIRED DELIVERY DATE</h3>
                                                        </div>
                                                        <div className="text-3xl sm:text-4xl fo-title text-center py-2 tracking-widest fo-text-glow">
                                                            {result.rddDisplay}
                                                        </div>
                                                    </div>

                                                    <div className="border border-[var(--fo-primary)] p-4 relative mt-6">
                                                        <div className="absolute -top-2.5 left-3 bg-[var(--fo-bg)] px-2">
                                                            <h3 className="fo-label text-xs tracking-wider opacity-100 mb-0">PICKUP SPREAD</h3>
                                                        </div>
                                                        <div className="text-lg sm:text-xl fo-text tracking-wider mt-1">
                                                            {formatDateForCopy(result.loadSpread.earliest)} - {formatDateForCopy(result.loadSpread.latest)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-full justify-center py-4 flex-col items-center text-center mc-achievement">
                                                        <div className="text-3xl mb-1 mc-text-yellow">RDD</div>
                                                        <div className="text-2xl drop-shadow-md mc-text-white">{result.rddDisplay}</div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-1">
                                                        <div className="flex justify-between items-center px-2 py-1 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] shadow-[inset_1px_1px_0_0_var(--mc-text-gray)]">
                                                            <span className="text-base mc-text-white">Transit Time</span>
                                                            <span className="text-base mc-text-white">{result.transitDays} days</span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-2 py-1 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] shadow-[inset_1px_1px_0_0_var(--mc-text-gray)]">
                                                            <span className="text-base mc-text-white">Rate cycle</span>
                                                            <span className={`text-base ${result.seasonStatus === 'Peak Season' ? 'mc-text-red' : 'mc-text-green'}`}>
                                                                {result.seasonStatus === 'Peak Season' ? 'Peak' : 'Off-Peak'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-2 py-1 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] shadow-[inset_1px_1px_0_0_var(--mc-text-gray)]">
                                                            <span className="text-base mc-text-white">Pickup Spread</span>
                                                            <span className="text-sm wrap-break-word mc-text-white">
                                                                {formatDateForCopy(result.loadSpread.earliest)} - {formatDateForCopy(result.loadSpread.latest)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Copy Tools */}
                                        {settings.showFormat && (
                                            <div className="pt-4 mt-auto">
                                                {isFallout ? (
                                                    <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                        <style jsx>{`
                                                            div::-webkit-scrollbar {
                                                                display: none;
                                                            }
                                                        `}</style>
                                                        {Object.keys(settings.visibleFormats).map((format) => (
                                                            settings.visibleFormats[format as CopyFormat] && (
                                                                <button 
                                                                    key={format}
                                                                    onClick={() => {
                                                                        setCopyFormat(format as CopyFormat);
                                                                        copyResult(format as CopyFormat);
                                                                    }}
                                                                    className="fo-button fo-button-ghost text-base px-3 py-1 h-auto min-h-0"
                                                                    style={copyFormat === format ? { background: 'var(--fo-primary)', color: '#000', borderColor: 'var(--fo-primary)' } : undefined}
                                                                >
                                                                    [{FORMAT_LABELS[format as CopyFormat].split(' ')[0].toUpperCase()}]
                                                                </button>
                                                            )
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <Label className="text-sm mc-label">Copy Format</Label>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <Select 
                                                                    value={copyFormat} 
                                                                    onValueChange={(val) => setCopyFormat(val as CopyFormat)}
                                                                >
                                                                    <SelectTrigger className="text-sm h-10">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.entries(settings.visibleFormats)
                                                                            .filter(([_, visible]) => visible)
                                                                            .map(([format]) => (
                                                                                <SelectItem key={format} value={format} className="text-sm">
                                                                                    {FORMAT_LABELS[format as CopyFormat]}
                                                                                </SelectItem>
                                                                            ))
                                                                        }
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <Button onClick={() => copyResult()} title="Copy to Clipboard" className="h-10 w-10 p-0">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="shrink-0" stroke="currentColor" strokeWidth="1">
                                                                    <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                                                                </svg>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-8">
                                        {!isFallout ? (
                                            <>
                                                <div className="w-12 h-12 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)] mb-3"></div>
                                                <div className="mc-body text-sm">Output Slot Empty</div>
                                            </>
                                        ) : (
                                            <div className="text-left w-full">
                                                <div className="fo-text">--</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {!isFallout && (
                    <div className="mt-8 text-center">
                        <div className="text-sm drop-shadow-sm mc-small">
                            RDD Calculator v1.3.0 (Minecraft Edition)
                        </div>
                    </div>
                )}
            </div>

            <SettingsMenu 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                user={user}
                isAdmin={isAdmin}
            />
            <HistorySidebar 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                user={user}
                refreshTrigger={refreshHistory}
            />
            {isAuthOpen && <AuthForm onClose={() => setIsAuthOpen(false)} />}
        </div>
    )
}
