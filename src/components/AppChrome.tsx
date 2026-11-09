'use client'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { useI18nReady } from '@/hooks/useI18nReady'

export function AppChrome({ children }: { children: React.ReactNode }) {
    const { t, isReady } = useI18nReady()
    const skip = isReady ? t('nav.skipToContent') : 'Skip to content'

    return (
        <>
            <a href="#main-content" className="skip-link">
                {skip}
            </a>
            <Header />
            <main id="main-content" className="flex-grow" tabIndex={-1}>
                {children}
            </main>
            <Footer />
        </>
    )
}
