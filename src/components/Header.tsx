'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type MouseEvent, useEffect, useRef, useState } from 'react'
import { ThemeSwitch } from '@/components/theme-switch'
import { useI18nReady } from '@/hooks/useI18nReady'
import { sectionNavigationHref } from '@/lib/exploration-context'
import { LanguageSwitcher } from './LanguageSwitcher'

/** Two-by-two drawer front, one drawer marked: the cabinet at favicon size. */
export function CabinetMark({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <rect x="1" y="1" width="22" height="22" rx="3" fill="var(--lacquer)" />
            <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1" fill="var(--paper-hi)" />
            <rect x="13" y="3.5" width="7.5" height="7.5" rx="1" fill="var(--paper-hi)" />
            <rect x="3.5" y="13" width="7.5" height="7.5" rx="1" fill="var(--paper-hi)" />
            <rect x="13" y="13" width="7.5" height="7.5" rx="1" fill="var(--seal)" />
        </svg>
    )
}

export const Header = () => {
    const { t } = useI18nReady()
    const brand = t('brand.name')
    const pathname = usePathname() ?? '/'
    const [search, setSearch] = useState('')
    const headerRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const header = headerRef.current
        if (!header) return
        const measure = () => {
            const height = header.getBoundingClientRect().height
            const tall = height > window.innerHeight * 0.45
            header.dataset.tall = String(tall)
            document.documentElement.style.setProperty('--sticky-header-h', `${tall ? 0 : height}px`)
        }
        const observer = new ResizeObserver(measure)
        observer.observe(header)
        window.addEventListener('resize', measure)
        measure()
        return () => {
            observer.disconnect()
            window.removeEventListener('resize', measure)
            document.documentElement.style.removeProperty('--sticky-header-h')
        }
    }, [])

    useEffect(() => {
        const syncSearch = () => setSearch(window.location.search)
        syncSearch()
        window.addEventListener('popstate', syncSearch)
        return () => window.removeEventListener('popstate', syncSearch)
    }, [pathname])

    const navigateSection = (event: MouseEvent<HTMLAnchorElement>, section: 'cabinet' | 'prescription') => {
        // Resolve detail return context at activation time as well as after hydration.
        event.currentTarget.setAttribute(
            'href',
            sectionNavigationHref(window.location.pathname, window.location.search, section),
        )
        if (
            window.location.pathname !== '/' ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.altKey ||
            event.shiftKey
        )
            return
        const heading = document.getElementById(section === 'cabinet' ? 'cabinet-title' : 'rx-title')
        if (!heading) return
        event.preventDefault()
        const oldURL = window.location.href
        const url = new URL(oldURL)
        url.hash = section
        if (url.href !== oldURL) {
            window.history.pushState(window.history.state, '', url)
            window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: url.href }))
        }
        heading.focus({ preventScroll: true })
        heading.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            block: 'start',
        })
    }

    return (
        <header ref={headerRef} className="site-header">
            <div className="wrap site-header-inner">
                <Link href="/" className="wordmark" aria-label={brand}>
                    <CabinetMark />
                    <span className="wordmark-name">{brand}</span>
                </Link>

                <nav className="site-nav" aria-label={t('nav.primary')}>
                    <a
                        href={sectionNavigationHref(pathname, search, 'cabinet')}
                        className="site-nav-link caps"
                        onClick={(event) => navigateSection(event, 'cabinet')}
                    >
                        {t('nav.cabinet')}
                    </a>
                    <a
                        href={sectionNavigationHref(pathname, search, 'prescription')}
                        className="site-nav-link caps"
                        onClick={(event) => navigateSection(event, 'prescription')}
                    >
                        {t('nav.prescription')}
                    </a>
                </nav>
                <div className="site-preferences">
                    <LanguageSwitcher />
                    <ThemeSwitch />
                </div>
            </div>
        </header>
    )
}
