import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { VT323 } from 'next/font/google'
import './globals.css'
import { ThemeProvider as AppSettingsProvider } from '@/context/ThemeContext'
import type { ThemeMode } from '@/context/ThemeContext'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ThemeBackground } from '@/components/ThemeBackground'
import { TrainingProvider } from '@/components/training/TrainingContext'
import { TrainingMode } from '@/components/training/TrainingMode'
import { 
  THEMES, 
  FALLOUT_THEMES, 
  ThemePreset, 
  FalloutPreset 
} from '@/utils/themeConstants'

export const metadata: Metadata = {
  title: 'RDD Calculator',
  description: 'Calculate delivery dates',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

const vt323 = VT323({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-vt323',
  display: 'block',
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read theme preference from cookie so the server renders the correct theme
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('themeMode')?.value
  const activeThemeCookie = cookieStore.get('activeTheme')?.value as ThemePreset | undefined
  const falloutThemeCookie = cookieStore.get('falloutTheme')?.value as FalloutPreset | undefined

  const themeMode: ThemeMode = themeCookie === 'fallout' ? 'fallout' : 'minecraft'
  const themeClass = themeMode === 'fallout' ? 'theme-fallout' : 'theme-minecraft'
  const minecraftBackgroundByTheme: Record<ThemePreset, string> = {
    default: '/backgrounds/minecraft/default-office.webp',
    nether: '/backgrounds/minecraft/nether.webp',
    ocean: '/backgrounds/minecraft/ocean.webp',
    forest: '/backgrounds/minecraft/forest.webp',
    redstone: '/backgrounds/minecraft/redstone.webp',
    custom: '/backgrounds/minecraft/default-office.webp',
  }

  // Calculate initial CSS variables for server-side rendering to prevent flash
  let initialStyle: React.CSSProperties = {}
  let initialMinecraftBg: string | null = null

  if (themeMode === 'fallout') {
    const presetName = falloutThemeCookie && FALLOUT_THEMES[falloutThemeCookie] ? falloutThemeCookie : 'green'
    const colors = FALLOUT_THEMES[presetName]
    initialStyle = {
      '--fo-primary': colors.primary,
      '--fo-primary-dim': colors.primaryDim,
      '--fo-primary-glow': colors.primaryGlow,
      '--fo-bg': colors.bg,
      '--fo-panel-bg': colors.panelBg,
      '--fo-text': colors.textPrimary,
      '--fo-text-dim': colors.textDim,
      '--fo-scanline-opacity': String(colors.scanlineOpacity),
    } as React.CSSProperties
  } else {
    const presetName = activeThemeCookie && THEMES[activeThemeCookie] ? activeThemeCookie : 'default'
    const colors = THEMES[presetName]
    initialMinecraftBg = minecraftBackgroundByTheme[presetName]
    initialStyle = {
      '--mc-bg': colors.panelBg,
      '--mc-dark-border': colors.borderDark,
      '--mc-light-border': colors.borderLight,
      '--mc-shadow': colors.shadow,
      '--mc-text-shadow': colors.textShadow,
      '--mc-input-bg': colors.inputBg,
      '--mc-input-text': colors.inputText,
      '--mc-accent': colors.accent,
      '--mc-button-bg': colors.buttonBg,
      '--mc-text-dark': colors.textDark,
      '--mc-text-gray': colors.textGray,
      '--mc-slot-bg': colors.slotBg,
      // Pre-hydration paint: mirror hydrated Panorama look as closely as possible
      // to prevent dark/contrast flash on refresh.
      backgroundImage: `radial-gradient(circle at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.58) 100%), url(${initialMinecraftBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#1a1a1a',
    } as React.CSSProperties
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${vt323.variable} dark ${themeClass}`} style={initialStyle}>
      <head>
        {initialMinecraftBg ? (
          <link
            rel="preload"
            as="image"
            href={initialMinecraftBg}
          />
        ) : null}
        {initialMinecraftBg ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var root=document.documentElement;var imageUrl='${initialMinecraftBg}';root.classList.add('mc-preload-pending');var fontReady=document.fonts?document.fonts.load('16px "VT323"').catch(function(){}):Promise.resolve();var imageReady=new Promise(function(resolve){var img=new Image();img.onload=function(){resolve()};img.onerror=function(){resolve()};img.src=imageUrl;if(img.complete&&img.naturalWidth>0){resolve()}});Promise.all([fontReady,imageReady]).then(function(){root.classList.remove('mc-preload-pending')}).catch(function(){root.classList.remove('mc-preload-pending')});})();`,
            }}
          />
        ) : null}
      </head>
      <body className="min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AppSettingsProvider serverThemeMode={themeMode}>
              <ThemeBackground />
              <TrainingProvider>
                  {children}
                  <TrainingMode />
                  <Toaster position="top-center" />
              </TrainingProvider>
            </AppSettingsProvider>
          </ThemeProvider>
      </body>
    </html>
  )
}
