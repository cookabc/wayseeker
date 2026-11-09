'use client'

import Link from 'next/link'
import { useI18nReady } from '@/hooks/useI18nReady'

export default function NotFound() {
    const { t } = useI18nReady()

    return (
        <section className="plain-page">
            <p className="code" style={{ color: 'var(--seal)' }}>
                {t('notFound.code')}
            </p>
            <h1>{t('notFound.title')}</h1>
            <div className="prose">
                <p>{t('notFound.body')}</p>
                <p>
                    <Link href="/" className="btn btn--ink">
                        {t('notFound.cta')}
                    </Link>
                </p>
                <details className="not-found-resources">
                    <summary>{t('notFound.resources')}</summary>
                    <nav aria-label={t('notFound.resources')} className="insert-links code">
                        <a href="/sitemap.xml">sitemap.xml</a>
                        <a href="/llms.txt">llms.txt</a>
                        <a href="/tools.json">tools.json</a>
                    </nav>
                </details>
            </div>
        </section>
    )
}
