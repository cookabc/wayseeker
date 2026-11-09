'use client'

import { ArrowLeftIcon } from '@phosphor-icons/react'
import Link from 'next/link'
import { Trans, useTranslation } from 'react-i18next'
import { SITE_NAME } from '@/lib/site'

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
    const { t } = useTranslation('legal')

    return (
        <section className="plain-page">
            <Link href="/" className="back-link caps">
                <ArrowLeftIcon weight="bold" aria-hidden="true" />
                {t('back')}
            </Link>
            <h1>{t(`${kind}.title`)}</h1>
            <p className="code">
                {t('lastUpdated')} — <time dateTime="2026-07-17">{t('date')}</time>
            </p>
            <div className="prose mt-8">
                <p>{t(`${kind}.intro`, { site: SITE_NAME })}</p>
                {kind === 'privacy' && (
                    <>
                        <p>{t('privacy.storageIntro')}</p>
                        <ul className="list-disc pl-5 space-y-2">
                            {(['themeStorage', 'languageStorage'] as const).map((key) => (
                                <li key={key}>
                                    <Trans
                                        ns="legal"
                                        i18nKey={`privacy.${key}`}
                                        components={{
                                            storage: <strong className="text-foreground" />,
                                            key: <code className="text-xs" />,
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <p>{t(`${kind}.external`)}</p>
                {kind === 'terms' && <p>{t('terms.ownership', { site: SITE_NAME })}</p>}
                <p>
                    {kind === 'privacy' ? `${t('privacy.changes')} ` : null}
                    {t('contact')}{' '}
                    <a
                        href="mailto:chuangcius@gmail.com"
                        className="text-foreground underline underline-offset-4 hover:opacity-70"
                    >
                        chuangcius@gmail.com
                    </a>
                    {t('period')}
                </p>
            </div>
        </section>
    )
}
