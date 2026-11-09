'use client'

import Link from 'next/link'
import tools from '@/data/tools'
import { useI18nReady } from '@/hooks/useI18nReady'

export const Footer = () => {
    const { t } = useI18nReady()

    return (
        <footer className="site-footer">
            <div className="wrap site-footer-inner">
                <div>
                    <p className="wordmark-name">{t('brand.name')}</p>
                    <p className="mt-2">{t('footer.meta', { count: tools.length })}</p>
                    <p className="code mt-4">© {new Date().getFullYear()} Wayseeker</p>
                </div>
                <nav aria-label={t('nav.site')}>
                    <Link href="/">{t('nav.home')}</Link>
                    <a href="/llms.txt">llms.txt</a>
                    <a href="/tools.json">tools.json</a>
                    <Link href="/privacy">{t('nav.privacy')}</Link>
                    <Link href="/terms">{t('nav.terms')}</Link>
                </nav>
            </div>
        </footer>
    )
}
