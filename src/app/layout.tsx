import type { Metadata, Viewport } from 'next'
import { Archivo, Fragment_Mono, Noto_Serif_SC } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { ThemeProvider } from 'next-themes'
import { ActivateChineseFont } from '@/components/ActivateChineseFont'
import { AppChrome } from '@/components/AppChrome'
import { I18nProvider } from '@/components/I18nProvider'
import { resolveRequestLanguage } from '@/lib/request-language'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'
import './globals.css'

const archivo = Archivo({
    subsets: ['latin'],
    axes: ['wdth'],
    variable: '--font-archivo',
    display: 'swap',
    preload: false,
})
const serifSc = Noto_Serif_SC({
    subsets: ['latin'],
    // One variable face covers both display weights. Separate weight entries
    // duplicate the entire CJK unicode-range stylesheet for the same files.
    variable: '--font-serif-sc',
    display: 'swap',
    preload: false,
})
const fragment = Fragment_Mono({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-fragment',
    display: 'swap',
    preload: false,
})

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_NAME} — What are you settling for?`,
        template: `%s — ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    openGraph: {
        title: `${SITE_NAME} — What are you settling for?`,
        description: SITE_DESCRIPTION,
        type: 'website',
        url: SITE_URL,
        siteName: SITE_NAME,
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: `${SITE_NAME} — What are you settling for?`,
        description: SITE_DESCRIPTION,
    },
    alternates: {
        canonical: '/',
    },
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#e8ebe3' },
        { media: '(prefers-color-scheme: dark)', color: '#0d1714' },
    ],
    width: 'device-width',
    initialScale: 1,
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()])
    const initialLanguage = resolveRequestLanguage(
        cookieStore.get('i18next')?.value,
        requestHeaders.get('accept-language'),
    )
    return (
        <html
            lang={initialLanguage}
            className={`${archivo.variable} ${fragment.variable}`}
            data-scroll-behavior="smooth"
            suppressHydrationWarning
        >
            <body className="antialiased min-w-[320px]">
                <ActivateChineseFont variableClass={serifSc.variable} />
                <I18nProvider initialLanguage={initialLanguage}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                        enableColorScheme
                        storageKey="wayseeker-theme"
                    >
                        <div className="flex flex-col min-h-screen">
                            <AppChrome>{children}</AppChrome>
                        </div>
                    </ThemeProvider>
                </I18nProvider>
            </body>
        </html>
    )
}
