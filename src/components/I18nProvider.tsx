'use client'

import { createInstance } from 'i18next'
import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import enTranslations from '@/../public/locales/en/common.json'
import enLegal from '@/../public/locales/en/legal.json'
import zhTranslations from '@/../public/locales/zh/common.json'
import zhLegal from '@/../public/locales/zh/legal.json'
import { readLanguagePreference, type SupportedLanguage } from '@/lib/request-language'

const resources = {
    en: { common: enTranslations, legal: enLegal },
    zh: { common: zhTranslations, legal: zhLegal },
}

function normalizeLanguage(lng: string | undefined): SupportedLanguage {
    if (!lng) return 'en'
    return lng.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

interface I18nProviderProps {
    children: React.ReactNode
    initialLanguage?: SupportedLanguage
}

function getCookiePreference(): SupportedLanguage | null {
    try {
        const value = document.cookie
            .split(';')
            .map((entry) => entry.trim())
            .find((entry) => entry.startsWith('i18next='))
            ?.slice('i18next='.length)
        return readLanguagePreference(value)
    } catch {
        // Cookies may be unreadable in a privacy-restricted context.
        return null
    }
}

export function I18nProvider({ children, initialLanguage = 'en' }: I18nProviderProps) {
    // Each server render and mounted provider owns its instance. A shared module
    // singleton can leak the most recent request's language into another request.
    const [i18nInstance] = useState(() => {
        const instance = createInstance()
        void instance.init({
            resources,
            lng: initialLanguage,
            initAsync: false,
            fallbackLng: 'en',
            supportedLngs: ['en', 'zh'],
            nonExplicitSupportedLngs: true,
            load: 'languageOnly',
            ns: ['common', 'legal'],
            defaultNS: 'common',
            react: { useSuspense: false },
            interpolation: {
                // React already escapes values; avoid double-escaping entities.
                escapeValue: false,
            },
        })
        return instance
    })

    useEffect(() => {
        const syncDocumentLang = (lng: string) => {
            const normalized = normalizeLanguage(lng)
            document.documentElement.lang = normalized
            try {
                // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store is not supported by every target browser; the value is a fixed en/zh token.
                document.cookie =
                    'i18next=' +
                    normalized +
                    '; Path=/; Max-Age=31536000; SameSite=Lax' +
                    (window.location.protocol === 'https:' ? '; Secure' : '')
            } catch {
                // Keep the current choice usable when cookies are blocked.
            }
        }

        i18nInstance.on('languageChanged', syncDocumentLang)
        // Keep hydration aligned with the server-readable language preference.
        const preferredLanguage = getCookiePreference() ?? initialLanguage
        if (normalizeLanguage(i18nInstance.language) !== preferredLanguage) {
            void i18nInstance.changeLanguage(preferredLanguage)
        } else {
            syncDocumentLang(preferredLanguage)
        }
        return () => {
            i18nInstance.off('languageChanged', syncDocumentLang)
        }
    }, [i18nInstance, initialLanguage])

    return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
}

export { normalizeLanguage }
