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
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Scale, MapPin, RotateCw, Copy } from 'lucide-react'
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
const PERSIST_TIMEOUT_MS = 8000


export function Calculator({
    initialAuthHint = false,
    initialSplashSeed,
}: {
    initialAuthHint?: boolean
    initialSplashSeed?: number
}) {
    const { data, loading, error: dataError } = useTransitData()
    const { calculate } = useCalculator(data)
    const { settings, resolvedTemplates, mounted } = useTheme()
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
            const secure = window.location.protocol === 'https:' || process.env.NODE_ENV === 'production' ? '; Secure' : ''
            if (value) {
                window.sessionStorage.setItem(AUTH_HINT_KEY, '1')
                document.cookie = `${AUTH_HINT_KEY}=1; path=/; SameSite=Lax${secure}`
            } else {
                window.sessionStorage.removeItem(AUTH_HINT_KEY)
                document.cookie = `${AUTH_HINT_KEY}=; path=/; Max-Age=0; SameSite=Lax${secure}`
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

    const persistCalculationRecord = async ({
        weightNum,
        distNum,
        loadDateIso,
        packDateIso,
        res,
    }: {
        weightNum: number
        distNum: number
        loadDateIso: string
        packDateIso: string | null
        res: CalculationResult
    }) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), PERSIST_TIMEOUT_MS)

        try {
            const response = await fetch('/api/calculations/record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    calculationName,
                    successful: !res?.error,
                    input: {
                        weight: weightNum,
                        distance: distNum,
                        loadDate: loadDateIso,
                        packDate: packDateIso,
                    },
                    result: res?.error
                        ? { error: res.error }
                        : {
                            transitDays: res?.transitDays ?? null,
                            seasonStatus: res?.seasonStatus ?? null,
                            rdd: res?.rdd?.toISOString?.() ?? null,
                            rddDisplay: res?.rddDisplay ?? null,
                            loadSpread: {
                                earliest: res?.loadSpread?.earliest?.toISOString?.() ?? null,
                                latest: res?.loadSpread?.latest?.toISOString?.() ?? null,
                            },
                        },
                }),
                signal: controller.signal,
            })

            const payload = await response.json().catch(() => null) as
                | { usageLogged?: boolean; calculationSaved?: boolean; usageError?: string | null; calculationError?: string | null }
                | null

            if (!response.ok || !payload?.usageLogged) {
                console.warn('Failed to log calculation usage:', payload?.usageError || `HTTP ${response.status}`)
            }

            if (!res?.error && (!response.ok || !payload?.calculationSaved)) {
                console.warn('Failed to save calculation:', payload?.calculationError || `HTTP ${response.status}`)
                return
            }

            if (!res?.error && user) {
                setRefreshHistory(prev => prev + 1)
                setCalculationName('')
            }
        } catch (persistErr) {
            if (!isAbortLikeError(persistErr)) {
                console.warn('Calculation persistence failed:', persistErr)
            }
        } finally {
            clearTimeout(timeoutId)
        }
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
        setTimeout(() => {
            const res = calculate(weightNum, distNum, loadDate)
            if (!res) {
                setIsProcessing(false)
                return
            }
            setResult(res)
            setSubmittedName(calculationName) // Save the name at time of calculation
            sounds.playSuccess()

            // Do not block UI on persistence; keep calculate responsive.
            setTimeout(() => setIsProcessing(false), 50)

            void persistCalculationRecord({
                weightNum,
                distNum,
                loadDateIso: loadDate.toISOString(),
                packDateIso: packDate?.toISOString() ?? null,
                res,
            })
        }, 300)
    }

    const copyResult = async (formatOverride?: CopyFormat) => {
        if (!result) return
        
        const fmt = formatOverride || copyFormat
        const pDateObj = packDate || null
        const lDateObj = loadDate || new Date()

        const text = generateCopyText(
            resolvedTemplates[fmt],
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
    const isChicago95 = settings.themeMode === 'chicago95'
    const isMinecraft = settings.themeMode === 'minecraft'
    const isAdmin = adminStatus === 'admin'
    const showAuthenticatedControls = Boolean(user) || (!authResolved && authHint)

    return (
        <div 
            className={`min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 relative`} 
            style={{ touchAction: 'auto' }}
        >
            {/* Title */}
            <div className={`relative text-center z-10 w-full max-w-4xl ${isFallout ? 'mb-4 md:mb-8 pb-2 md:pb-4 border-b-2 border-[var(--fo-primary)]' : 'mb-8 pb-4'}`}>
                {isFallout ? (
                    <div className="w-full font-mono flex items-start justify-between gap-2 md:gap-6">
                        <div className="min-w-0 text-left">
                            <div className="fo-text text-[11px] md:text-sm mb-1">STATUS: ONLINE SETTINGS VER 3.0.0</div>
                            <div className="fo-text text-[11px] md:text-sm mb-1 hidden min-[460px]:block">SUDCO INDUSTRIES UNIFIED OPERATING SYSTEM</div>
                            <div className="fo-text text-[11px] md:text-sm mb-2 md:mb-4 hidden min-[540px]:block">COPYRIGHT 2075-2077 SUDCO INDUSTRIES</div>
                            <h1 className="text-3xl md:text-4xl fo-title mt-3 md:mt-8 mb-2 md:mb-4 leading-tight">DATE CHANGE TOOL V3</h1>
                        </div>
                        <div className="shrink-0 pt-1 md:pt-0 relative z-20">
                            <div aria-hidden="true" className="fo-sgs-mark h-16 w-28 md:h-34 md:w-56 pointer-events-none" />
                        </div>
                    </div>
                ) : isChicago95 ? null : (
                    <div className="relative w-fit mx-auto">
                        <Image
                            src="/backgrounds/minecraft/DATE-CHANGE-TOOL-V3.svg"
                            alt="Date Change Tool V3"
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
                <div className={`p-0 relative ${isFallout ? 'bg-transparent' : isChicago95 ? 'chi95-window' : 'mc-panel p-2'}`}>
                    {isChicago95 && (
                        <>
                            <div className="chi95-titlebar">
                                <span>Date Change Tool V3</span>
                                <div className="flex items-center gap-[2px]">
                                    <button type="button" className="chi95-button chi95-control-btn chi95-control-btn-min" aria-label="Minimize">-</button>
                                    <button type="button" className="chi95-button chi95-control-btn chi95-control-btn-max" aria-label="Maximize">□</button>
                                    <button type="button" className="chi95-button chi95-control-btn chi95-control-btn-close" aria-label="Close">×</button>
                                </div>
                            </div>
                            <div className="chi95-menubar">
                                <div className="chi95-menubar-left">
                                    <button type="button" onClick={openSettings}>Settings</button>
                                    <button type="button" onClick={() => router.push('/training')}>Guide</button>
                                    <button
                                        type="button"
                                        onClick={() => { if (user) setIsHistoryOpen(true) }}
                                        disabled={!showAuthenticatedControls}
                                    >
                                        History
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/admin')}
                                        disabled={!isAdmin}
                                    >
                                        Admin
                                    </button>
                                    <span className="chi95-menubar-sep" aria-hidden="true">|</span>
                                    <button type="button" onClick={handleReset}>Reset</button>
                                </div>
                                <div className="chi95-menubar-right">
                                    <button
                                        type="button"
                                        onClick={showAuthenticatedControls ? handleLogout : openAuth}
                                    >
                                        {showAuthenticatedControls ? 'Log out' : 'Log in'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Minecraft Header */}
                    {isMinecraft && (
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 px-2 sm:px-4 py-2 mb-2 border-b-2 border-[var(--mc-dark-border)]">
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-base sm:text-xl mc-heading">Transit Guide</span>
                            </div>
                            <div className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar">
                                <div className="flex items-center gap-1 sm:gap-2 w-max min-w-full">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                    <Button size="sm" variant="primary" onClick={() => router.push('/training')} className="text-xs sm:text-sm min-w-[84px] sm:min-w-[104px] shrink-0">
                                        <ItemIcon type="book" className="mr-1 sm:mr-2" />
                                        Training
                                    </Button>
                                    <Button size="sm" onClick={openSettings} title="Settings" className="text-xs sm:text-sm min-w-[84px] sm:min-w-[104px] shrink-0">
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
                                            className="text-xs sm:text-sm min-w-[84px] sm:min-w-[104px] shrink-0"
                                        >
                                            <ItemIcon type="clock" className="mr-1 sm:mr-2" />
                                            History
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            disabled
                                            aria-hidden="true"
                                            className="text-xs sm:text-sm min-w-[84px] sm:min-w-[104px] shrink-0 invisible pointer-events-none"
                                        >
                                            <ItemIcon type="clock" className="mr-1 sm:mr-2" />
                                            History
                                        </Button>
                                    )}
                                    </div>
                                    <div className="ml-auto">
                                    {showAuthenticatedControls ? (
                                        <Button size="sm" onClick={handleLogout} className="text-xs sm:text-sm min-w-[84px] sm:min-w-[104px] shrink-0">
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={openAuth} className="text-xs sm:text-sm min-w-[84px] sm:min-w-[104px] shrink-0">
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
                        <div className="w-full mb-4 md:mb-8 border-b border-[var(--fo-primary-dim)] pb-2">
                            <div className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar">
                                <div className="flex items-center gap-1 sm:gap-3 w-max min-w-full">
                                    <button onClick={openSettings} className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-[11px] md:text-base justify-center whitespace-nowrap min-w-[84px] sm:min-w-[104px] shrink-0">[ SETTINGS ]</button>
                                    <button onClick={() => router.push('/training')} className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-[11px] md:text-base justify-center whitespace-nowrap min-w-[84px] sm:min-w-[104px] shrink-0">[ GUIDE ]</button>
                                    {showAuthenticatedControls && (
                                        <button
                                            onClick={() => {
                                                if (user) setIsHistoryOpen(true)
                                            }}
                                            className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-[11px] md:text-base justify-center whitespace-nowrap min-w-[84px] sm:min-w-[104px] shrink-0"
                                        >
                                            [ LOGS ]
                                        </button>
                                    )}
                                    {showAuthenticatedControls ? (
                                        <button onClick={handleLogout} className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-[11px] md:text-base justify-center whitespace-nowrap min-w-[84px] sm:min-w-[104px] shrink-0 ml-auto">[ LOGOUT ]</button>
                                    ) : (
                                        <button onClick={openAuth} className="fo-button fo-button-ghost px-1.5 sm:px-4 py-1 h-auto min-h-0 text-[11px] md:text-base justify-center whitespace-nowrap min-w-[84px] sm:min-w-[104px] shrink-0 ml-auto">[ LOGIN ]</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`flex flex-col gap-2 sm:gap-4 p-0 ${isMinecraft ? 'lg:flex-row p-2 items-start' : isChicago95 ? 'items-center w-full p-2' : 'items-center w-full p-3'}`}>
                        {/* Input Section */}
                        <div className={`w-full flex flex-col ${isMinecraft ? 'flex-1' : isChicago95 ? 'max-w-none' : 'max-w-2xl'}`}>
                            <div className={`${isChicago95 ? 'space-y-2' : isFallout ? 'space-y-3 md:space-y-6' : 'space-y-6'} h-full ${
                                isFallout 
                                    ? 'bg-transparent border-none p-0' 
                                    : isChicago95
                                        ? 'chi95-fieldset'
                                        : 'p-4 border-none mc-slot shadow-[inset_2px_2px_0_0_var(--mc-dark-border),inset_-2px_-2px_0_0_var(--mc-light-border)]'
                            }`}>
                                {isMinecraft && (
                                    <div className="text-base sm:text-lg border-b-2 pb-2 mb-2 flex items-center gap-2 mc-subheading border-[var(--mc-text-gray)]">
                                        Shipment Data
                                    </div>
                                )}
                                {isChicago95 && (
                                    <div className="chi95-text text-sm border-b border-[#808080] pb-2 mb-2 font-bold">
                                        Shipment Data
                                    </div>
                                )}
                                
                                <div
                                    className={`grid grid-cols-2 ${isChicago95 ? 'gap-2 sm:gap-x-4 sm:gap-y-2' : isFallout ? 'gap-2 sm:gap-3 md:gap-6' : 'gap-3 sm:gap-4 md:gap-6'} md:grid-cols-2`}
                                >
                                    <div className="space-y-1">
                                        <Label className={`${isFallout ? 'fo-label text-xs sm:text-sm md:text-lg mb-1 md:mb-2' : isChicago95 ? 'chi95-label block text-xs mb-1' : 'text-base sm:text-lg mc-label'}`}>
                                            {isFallout ? (
                                                <>
                                                    <span className="sm:hidden">PACK (OPT):</span>
                                                    <span className="hidden sm:inline">PACK DATE (OPTIONAL):</span>
                                                </>
                                            ) : (
                                                "PACK DATE (OPTIONAL):"
                                            )}
                                        </Label>
                                        <DatePicker 
                                            date={packDate}
                                            setDate={setPackDate}
                                            label={isFallout ? "[ SELECT ]" : "Select..."}
                                            fallbackDate={loadDate}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className={`${isFallout ? 'fo-label text-xs sm:text-sm md:text-lg mb-1 md:mb-2' : isChicago95 ? 'chi95-label block text-xs mb-1' : 'text-base sm:text-lg mc-label'}`}>
                                            {isFallout ? (
                                                <>
                                                    <span className="sm:hidden">PICKUP:</span>
                                                    <span className="hidden sm:inline">PICKUP DATE:</span>
                                                </>
                                            ) : (
                                                "PICKUP DATE:"
                                            )}
                                        </Label>
                                        <DatePicker 
                                            date={loadDate}
                                            setDate={setLoadDate}
                                            label={isFallout ? "[ SELECT ]" : "Select..."}
                                            fallbackDate={packDate}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className={`${isFallout ? 'fo-label text-xs sm:text-sm md:text-lg mb-1 md:mb-2' : isChicago95 ? 'chi95-label block text-xs mb-1' : 'text-base sm:text-lg mc-label'}`}>
                                            {isFallout ? (
                                                <>
                                                    <span className="sm:hidden">WEIGHT (LBS):</span>
                                                    <span className="hidden sm:inline">SHIPMENT WEIGHT (LBS):</span>
                                                </>
                                            ) : (
                                                "SHIPMENT WEIGHT (LBS):"
                                            )}
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                placeholder={isFallout ? "_" : "..."}
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                className={`relative z-20 ${isChicago95 ? 'text-sm h-9' : isFallout ? 'text-base md:text-lg' : 'text-lg'} ${isFallout ? 'fo-input pl-0' : 'pr-10'}`}
                                            />
                                            {isMinecraft && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <Scale className="h-5 w-5 text-[#707070]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className={`${isFallout ? 'fo-label text-xs sm:text-sm md:text-lg mb-1 md:mb-2' : isChicago95 ? 'chi95-label block text-xs mb-1' : 'text-base sm:text-lg mc-label'}`}>
                                            {isFallout ? (
                                                <>
                                                    <span className="sm:hidden">MILES:</span>
                                                    <span className="hidden sm:inline">DISTANCE (MILES):</span>
                                                </>
                                            ) : (
                                                "DISTANCE (MILES):"
                                            )}
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                placeholder={isFallout ? "_" : "..."}
                                                value={distance}
                                                onChange={(e) => setDistance(e.target.value)}
                                                className={`relative z-20 ${isChicago95 ? 'text-sm h-9' : isFallout ? 'text-base md:text-lg' : 'text-lg'} ${isFallout ? 'fo-input pl-0' : 'pr-10'}`}
                                            />
                                            {isMinecraft && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-[#707070]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={isChicago95 ? "mt-0.5" : "mt-4"}>
                                    {isFallout ? (
                                        <div className="space-y-1">
                                            <Label className="fo-label text-xs sm:text-sm md:text-lg mb-1 md:mb-2">
                                                <span className="sm:hidden">IDENTIFIER (OPT):</span>
                                                <span className="hidden sm:inline">IDENTIFIER (OPTIONAL):</span>
                                            </Label>
                                            <Input 
                                                value={calculationName}
                                                onChange={(e) => setCalculationName(e.target.value)}
                                                placeholder="_"
                                                className="text-base md:text-lg fo-input pl-0"
                                            />
                                        </div>
                                    ) : isChicago95 ? (
                                        <div className="space-y-1">
                                            <Label className="chi95-label block text-xs mb-1">IDENTIFIER (OPTIONAL):</Label>
                                            <Input
                                                value={calculationName}
                                                onChange={(e) => setCalculationName(e.target.value)}
                                                placeholder="Name or code..."
                                                className="text-sm h-9"
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
                                
                                <div className={`${isChicago95 ? 'pt-1 gap-1' : 'pt-2 sm:pt-4 gap-2'} flex items-center`}>
                                    <Button 
                                        onClick={handleCalculate} 
                                        disabled={loading || !loadDate || !packDate}
                                        className={`flex-1 ${isChicago95 ? 'text-sm h-9' : isFallout ? 'text-base md:text-xl h-10 md:h-12' : 'text-xl h-12'}`}
                                        variant={isFallout ? "ghost" : "default"}
                                    >
                                        {isFallout ? (loading ? '[ LOADING DATA... ]' : (
                                            <>
                                                <span className="sm:hidden">[ CALCULATE ]</span>
                                                <span className="hidden sm:inline">[ CALCULATE DELIVERY ]</span>
                                            </>
                                        )) : (loading ? 'Loading data...' : 'Calculate Delivery')}
                                    </Button>
                                    {isMinecraft && (
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
                                            className="text-base md:text-xl h-10 md:h-12"
                                        >
                                            [ RESET ]
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Arrow/Progress Divider (Minecraft Only) */}
                        {isMinecraft && (
                            <div className="flex items-center justify-center shrink-0 self-center py-1 sm:py-2 lg:py-0 lg:px-4">
                                <div className="rotate-90 lg:rotate-0 transition-transform">
                                    <FurnaceArrow isProcessing={isProcessing} />
                                </div>
                            </div>
                        )}

                        {/* Results Section */}
                        <div className={`w-full flex flex-col ${isMinecraft ? 'lg:w-72 xl:w-80 shrink-0' : isFallout ? 'mt-4 md:mt-8 border-t-2 border-[var(--fo-primary)] pt-4 md:pt-8 max-w-2xl' : isChicago95 ? 'mt-2 max-w-none' : 'mt-4 max-w-2xl'}`}>
                             <div className={`flex flex-col h-full ${
                                 isFallout 
                                     ? 'bg-transparent border-none p-0' 
                                     : isChicago95
                                        ? 'chi95-fieldset'
                                        : 'p-4 border-none mc-slot shadow-[inset_2px_2px_0_0_var(--mc-dark-border),inset_-2px_-2px_0_0_var(--mc-light-border)]'
                             }`}>
                                {isMinecraft && (
                                    <div className="text-base sm:text-lg border-b-2 pb-2 mb-2 sm:mb-3 flex items-center gap-2 mc-subheading border-[var(--mc-text-gray)]">
                                        {submittedName ? `Results for ${submittedName}` : 'Result'}
                                    </div>
                                )}
                                {isChicago95 && (
                                    <div className="chi95-text text-sm border-b border-[#808080] pb-2 mb-2 font-bold">
                                        {submittedName ? `Results for ${submittedName}` : 'Result'}
                                    </div>
                                )}

                                {result ? (
                                    <div className="flex-1 flex flex-col justify-between gap-2 sm:gap-3 animate-in fade-in zoom-in-95 duration-300">
                                        <div className={isChicago95 ? "space-y-3" : "space-y-6"}>
                                            {/* Main Result */}
                                            {isFallout ? (
                                                <div className="space-y-4 md:space-y-6 pt-1 md:pt-2">
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
                                                        <div className="text-2xl md:text-4xl fo-title text-center py-2 tracking-widest fo-text-glow">
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
                                            ) : isChicago95 ? (
                                                <>
                                                    <div className="chi95-panel p-3 text-center">
                                                        <div className="chi95-text font-bold text-sm">Required Delivery Date</div>
                                                        <div className="text-2xl font-bold mt-1">{result.rddDisplay}</div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <div className="chi95-panel p-2 flex justify-between chi95-text"><span>Transit Time</span><span>{result.transitDays} days</span></div>
                                                        <div className="chi95-panel p-2 flex justify-between chi95-text"><span>Rate Cycle</span><span>{result.seasonStatus === 'Peak Season' ? 'Peak' : 'Off-Peak'}</span></div>
                                                        <div className="chi95-panel p-2 flex justify-between chi95-text"><span>Pickup Spread</span><span>{formatDateForCopy(result.loadSpread.earliest)} - {formatDateForCopy(result.loadSpread.latest)}</span></div>
                                                    </div>
                                                </>
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
                                            <div className={isChicago95 ? "pt-2" : "pt-4 mt-auto"}>
                                                {isFallout ? (
                                                    <div className="flex flex-wrap justify-center gap-2 w-full">
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
                                                        <Label className={`text-sm ${isChicago95 ? 'chi95-label' : 'mc-label'}`}>Copy Format</Label>
                                                        <div className={cn(isChicago95 ? 'grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-1.5' : 'flex items-center gap-2')}>
                                                            <div className="flex-1">
                                                                <Select 
                                                                    value={copyFormat} 
                                                                    onValueChange={(val) => setCopyFormat(val as CopyFormat)}
                                                                >
                                                                    <SelectTrigger className={cn("text-sm", isChicago95 ? 'h-[23px] px-1 py-0 leading-none [&>span]:leading-none [&>span]:text-left' : 'h-10')}>
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
                                                            <Button
                                                                onClick={() => copyResult()}
                                                                title="Copy to Clipboard"
                                                                variant={isChicago95 ? "secondary" : "default"}
                                                                size="icon"
                                                                className={`${isChicago95 ? 'h-9 w-9 self-stretch min-h-0' : 'h-10 w-10'} p-0 inline-flex items-center justify-center leading-none`}
                                                            >
                                                                <Copy aria-hidden="true" className="h-4 w-4 shrink-0" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`${isChicago95 ? '' : 'flex-1 flex flex-col items-center justify-center text-center opacity-50 py-8'}`}>
                                        {isMinecraft ? (
                                            <>
                                                <div className="w-12 h-12 bg-[var(--mc-slot-bg)] border-2 border-[var(--mc-dark-border)] shadow-[inset_2px_2px_0_0_var(--mc-text-gray)] mb-3"></div>
                                                <div className="mc-body text-sm">Output Slot Empty</div>
                                            </>
                                        ) : isChicago95 ? (
                                            <div className="chi95-panel p-3 text-center opacity-70">
                                                <div className="chi95-text text-sm">No result yet.</div>
                                            </div>
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
                {isMinecraft && (
                    <div className="mt-8 text-center">
                        <div className="text-sm drop-shadow-sm mc-small">
                            Date Change Tool V3 v3.0.0 (Minecraft Edition)
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
