'use client'

import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowSquareOutIcon,
    ArrowsClockwiseIcon,
    LinkIcon,
    MagnifyingGlassIcon,
    XIcon,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CopyFeedback } from '@/components/CopyFeedback'
import { DrawerFront, EmptyDrawer } from '@/components/DrawerFront'
import { ExplorerRouteObserver } from '@/components/ExplorerRouteObserver'
import { HabitPeek } from '@/components/HabitPeek'
import { normalizeLanguage } from '@/components/I18nProvider'
import { LabelRows } from '@/components/LabelRows'
import { ToolPreviewImage } from '@/components/ToolPreviewImage'
import TOOLS, { formatTag } from '@/data/tools'
import { WORKFLOWS } from '@/data/workflow'
import { useI18nReady } from '@/hooks/useI18nReady'
import { CABINET_ROWS, DRAWERS, type Drawer, drawerOf, drawersInStage, habitOf, stageLetter } from '@/lib/drawers'
import { toolDetailHref } from '@/lib/exploration-context'
import { readExplorerRoute, writeExplorerRoute } from '@/lib/explorer-route'
import { filterTools, getDomain } from '@/lib/filter-tools'
import {
    encodePlanPicks,
    generatePlan,
    hasPicks,
    parsePlanPicks,
    planTitleKey,
    planToMarkdown,
    rerollStep,
} from '@/lib/plan'
import { pointerEffectsEnabled, releasePointer, trackPointer } from '@/lib/pointer-fx'
import { randomSeed } from '@/lib/shuffle'

const DEFAULT_TOOL = 'timing'
const INITIAL_HABIT_COUNT = 3

interface PreviousPlan {
    seed: string
    picks: Array<string | null>
    anchor: string | null
}

interface CopyFallback {
    text: string
    reason: 'failed' | 'manual'
}

function planIdentity(seed: string | null, picks: ReadonlyArray<string | null>, anchor: string | null) {
    return JSON.stringify([seed, encodePlanPicks(picks), anchor])
}

function reducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function Dispensary() {
    const { i18n, t } = useI18nReady()
    const lang = normalizeLanguage(i18n.language)

    const [selectedId, setSelectedId] = useState(DEFAULT_TOOL)
    const [stageFilter, setStageFilter] = useState<number | null>(null)
    const [query, setQuery] = useState('')
    const [showAllHabits, setShowAllHabits] = useState(false)
    const searchRef = useRef<HTMLInputElement>(null)
    const [planSeed, setPlanSeed] = useState<string | null>(null)
    const [planAnchorId, setPlanAnchorId] = useState<string | null>(null)
    const [picks, setPicks] = useState<Array<string | null>>([])
    const currentPlanIdentity = useRef(planIdentity(null, [], null))
    const [previousPlan, setPreviousPlan] = useState<PreviousPlan | null>(null)
    const [planNotice, setPlanNotice] = useState<'written' | 'rewritten' | 'restored' | 'builtAround' | null>(null)
    const [flash, setFlash] = useState<string | null>(null)
    const [failedCopy, setFailedCopy] = useState<CopyFallback | null>(null)
    const [copying, setCopying] = useState<'plan' | 'planLink' | null>(null)
    const [copyWaiting, setCopyWaiting] = useState(false)
    const copyEpoch = useRef(0)
    const pendingCopy = useRef<{ epoch: number; timer: ReturnType<typeof setTimeout> | null } | null>(null)
    const copyMounted = useRef(true)
    const syncedSearch = useRef<string | null>(null)
    const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const counterRef = useRef<HTMLElement>(null)
    const [peek, setPeek] = useState<{ tool: (typeof TOOLS)[number]; x: number; y: number } | null>(null)

    // Sections settle into place once as they enter the viewport.
    useEffect(() => {
        const nodes = document.querySelectorAll<HTMLElement>('[data-reveal]')
        if (!('IntersectionObserver' in window)) return
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-in')
                        io.unobserve(entry.target)
                    }
                }
            },
            { rootMargin: '0px 0px -12% 0px' },
        )
        for (const node of nodes) {
            if (node.getBoundingClientRect().top > window.innerHeight) {
                node.classList.add('will-reveal')
                io.observe(node)
            }
        }
        return () => io.disconnect()
    }, [])
    const rxRef = useRef<HTMLElement>(null)
    const planTitleRef = useRef<HTMLHeadingElement>(null)

    const invalidateCopyFeedback = useCallback(() => {
        copyEpoch.current += 1
        if (flashTimer.current) clearTimeout(flashTimer.current)
        setFlash(null)
        setFailedCopy(null)
    }, [])

    useEffect(() => invalidateCopyFeedback(), [lang, invalidateCopyFeedback])

    // Restore shared state (?tool, ?plan, ?p; legacy ?seed is ignored) on load and history moves.
    const restoreRoute = useCallback(() => {
        if (syncedSearch.current === window.location.search) return
        syncedSearch.current = window.location.search
        const route = readExplorerRoute(
            window.location.search,
            TOOLS.map((tool) => tool.id),
        )
        setSelectedId(route.tool ?? DEFAULT_TOOL)
        const params = new URLSearchParams(window.location.search)
        setQuery(params.get('q')?.slice(0, 200) ?? '')
        const restoredStage = params.get('stage')
        setStageFilter(restoredStage !== null && /^[0-4]$/.test(restoredStage) ? Number(restoredStage) : null)
        setPlanSeed(route.plan)
        setPlanAnchorId(route.anchor ?? null)
        const restoredPicks = route.plan && route.picks ? [...parsePlanPicks(route.picks)] : []
        const restoredIdentity = planIdentity(route.plan, restoredPicks, route.anchor ?? null)
        setPicks(restoredPicks)
        if (restoredIdentity !== currentPlanIdentity.current) {
            invalidateCopyFeedback()
            setPreviousPlan(null)
            setPlanNotice(null)
        }
        currentPlanIdentity.current = restoredIdentity
        if (route.plan && !window.location.hash) {
            requestAnimationFrame(() =>
                rxRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth' }),
            )
        }
    }, [invalidateCopyFeedback])

    useEffect(() => {
        copyMounted.current = true
        restoreRoute()
        window.addEventListener('popstate', restoreRoute)
        return () => {
            copyMounted.current = false
            copyEpoch.current += 1
            if (pendingCopy.current?.timer) clearTimeout(pendingCopy.current.timer)
            window.removeEventListener('popstate', restoreRoute)
            if (flashTimer.current) clearTimeout(flashTimer.current)
        }
    }, [restoreRoute])

    const selected = drawerOf(selectedId) ?? DRAWERS[0]
    const stageDrawers = useMemo(() => drawersInStage(selected.stage), [selected.stage])
    const at = stageDrawers.findIndex((drawer) => drawer.tool.id === selected.tool.id)

    const matches = useMemo(() => {
        if (!query.trim()) return null
        const ids = new Set(filterTools(TOOLS, 'all', query).map((tool) => tool.id))
        // Habits are part of what a visitor searches for.
        for (const drawer of DRAWERS) {
            const q = query.toLowerCase().trim()
            if (habitOf(drawer.tool, 'en').toLowerCase().includes(q) || habitOf(drawer.tool, 'zh').includes(q))
                ids.add(drawer.tool.id)
        }
        return ids
    }, [query])

    const plan = useMemo(
        () => (planSeed ? generatePlan(planSeed, picks, planAnchorId) : null),
        [planSeed, picks, planAnchorId],
    )

    const say = (key: string) => {
        setFlash(key)
        setFailedCopy(null)
        if (flashTimer.current) clearTimeout(flashTimer.current)
        flashTimer.current = setTimeout(() => setFlash(null), 2000)
    }

    const writeUrl = (next: {
        tool?: string | null
        plan?: string | null
        picks?: Array<string | null>
        anchor?: string | null
    }) => {
        const nextPlan = next.plan !== undefined ? next.plan : planSeed
        const nextPicks = next.picks ?? picks
        const nextAnchor = nextPlan ? (next.anchor !== undefined ? next.anchor : planAnchorId) : null
        const url = writeExplorerRoute(window.location.href, {
            seed: null,
            tool: next.tool !== undefined ? next.tool : selected.tool.id,
            plan: nextPlan,
            picks: nextPlan && hasPicks(nextPicks) ? encodePlanPicks(nextPicks) : null,
            anchor: nextAnchor,
        })
        if (query.trim()) url.searchParams.set('q', query.slice(0, 200))
        else url.searchParams.delete('q')
        if (stageFilter !== null) url.searchParams.set('stage', String(stageFilter))
        else url.searchParams.delete('stage')
        window.history.replaceState(window.history.state, '', url)
        syncedSearch.current = window.location.search
        currentPlanIdentity.current = planIdentity(nextPlan, nextPicks, nextAnchor)
        return url
    }

    const select = (drawer: Drawer, options: { reveal?: boolean; focusCounter?: boolean } = {}) => {
        setSelectedId(drawer.tool.id)
        setPeek(null)
        setFlash(null)
        writeUrl({ tool: drawer.tool.id })
        if (options.reveal && counterRef.current) {
            const rect = counterRef.current.getBoundingClientRect()
            if (rect.top < 0 || rect.top > window.innerHeight * 0.6) {
                counterRef.current.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' })
            }
        }
        if (options.focusCounter) counterRef.current?.focus({ preventScroll: true })
    }

    const step = (delta: number) => {
        if (stageDrawers.length === 0) return
        const next = stageDrawers[(at + delta + stageDrawers.length) % stageDrawers.length]
        if (next) select(next)
    }

    const pickStage = (stage: number | null) => {
        setStageFilter(stage)
        setShowAllHabits(false)
        const url = new URL(window.location.href)
        if (stage === null) url.searchParams.delete('stage')
        else url.searchParams.set('stage', String(stage))
        window.history.replaceState(window.history.state, '', url)
        syncedSearch.current = window.location.search
        if (stage === null) return
        const first = drawersInStage(stage)[0]
        if (first) {
            setSelectedId(first.tool.id)
            setPeek(null)
            setFlash(null)
            url.searchParams.set('tool', first.tool.id)
            window.history.replaceState(window.history.state, '', url)
            syncedSearch.current = window.location.search
        }
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        const target = event.target as HTMLElement
        if (event.altKey || event.ctrlKey || event.metaKey || target.closest('input,textarea,select')) return
        let handled = true
        if (event.key === 'ArrowRight') step(1)
        else if (event.key === 'ArrowLeft') step(-1)
        else if (event.key === 'ArrowDown') pickStage(Math.min(selected.stage + 1, WORKFLOWS.length - 1))
        else if (event.key === 'ArrowUp') pickStage(Math.max(selected.stage - 1, 0))
        else if (event.key === 'Home' && stageDrawers[0]) select(stageDrawers[0])
        else if (event.key === 'End' && stageDrawers.length > 0) select(stageDrawers[stageDrawers.length - 1])
        else handled = false
        if (handled) {
            event.preventDefault()
            if (target.closest('.habit')) {
                requestAnimationFrame(() => {
                    document
                        .querySelector<HTMLButtonElement>('.habit[aria-pressed="true"]')
                        ?.focus({ preventScroll: true })
                })
            }
        }
    }

    const updateQuery = (value: string) => {
        const nextQuery = value.slice(0, 200)
        setQuery(nextQuery)
        const url = new URL(window.location.href)
        if (nextQuery.trim()) url.searchParams.set('q', nextQuery)
        else url.searchParams.delete('q')
        window.history.replaceState(window.history.state, '', url)
        syncedSearch.current = window.location.search
    }

    const clearSearch = () => {
        updateQuery('')
        searchRef.current?.focus()
    }

    const copy = async (text: string, key: 'plan' | 'planLink') => {
        if (pendingCopy.current) return
        const operation = { epoch: copyEpoch.current, timer: null as ReturnType<typeof setTimeout> | null }
        pendingCopy.current = operation
        setCopying(key)
        setCopyWaiting(false)
        setFlash(null)
        setFailedCopy(null)
        if (flashTimer.current) clearTimeout(flashTimer.current)
        operation.timer = setTimeout(() => {
            if (copyMounted.current && pendingCopy.current === operation) setCopyWaiting(true)
        }, 8000)
        try {
            await navigator.clipboard.writeText(text)
            if (copyMounted.current && operation.epoch === copyEpoch.current) say(key)
        } catch {
            if (copyMounted.current && operation.epoch === copyEpoch.current) {
                setFlash(null)
                setFailedCopy({ text, reason: 'failed' })
            }
        } finally {
            if (operation.timer) clearTimeout(operation.timer)
            if (pendingCopy.current === operation) pendingCopy.current = null
            if (copyMounted.current) {
                setCopying(null)
                setCopyWaiting(false)
            }
        }
    }

    const planTitle = (anchorName: string, key: string) => t(`plan.titles.${key}`, { name: anchorName })

    const revealPlan = () => {
        const url = new URL(window.location.href)
        url.hash = 'prescription'
        window.history.replaceState(window.history.state, '', url)
        requestAnimationFrame(() => {
            planTitleRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' })
            planTitleRef.current?.focus({ preventScroll: true })
        })
    }

    const writePlan = (anchorId: string | null = null) => {
        invalidateCopyFeedback()
        const value = randomSeed()
        setPreviousPlan(planSeed ? { seed: planSeed, picks: [...picks], anchor: planAnchorId } : null)
        setFailedCopy(null)
        setFlash(null)
        setPlanSeed(value)
        setPlanAnchorId(anchorId)
        setPicks([])
        setPlanNotice(anchorId ? 'builtAround' : planSeed ? 'rewritten' : 'written')
        writeUrl({ plan: value, picks: [], anchor: anchorId })
        revealPlan()
    }

    const undoPlan = () => {
        if (!previousPlan) return
        invalidateCopyFeedback()
        setPlanSeed(previousPlan.seed)
        setPlanAnchorId(previousPlan.anchor)
        setPicks([...previousPlan.picks])
        setFailedCopy(null)
        setFlash(null)
        writeUrl({ plan: previousPlan.seed, picks: previousPlan.picks, anchor: previousPlan.anchor })
        setPreviousPlan(null)
        setPlanNotice('restored')
        revealPlan()
    }

    const swap = (index: number) => {
        if (!plan || !planSeed) return
        const current = plan.steps[index]
        if (!current) return
        invalidateCopyFeedback()
        setFailedCopy(null)
        setFlash(null)
        const nextId = rerollStep(planSeed, index, current.tool.id, planAnchorId)
        const next = WORKFLOWS.map((_, i) => (i === index ? nextId : (picks[i] ?? null)))
        setPicks(next)
        writeUrl({ picks: next })
    }

    const planHref = () =>
        writeExplorerRoute(new URL('/', window.location.origin).href, {
            seed: null,
            tool: null,
            plan: planSeed,
            picks: planSeed && hasPicks(picks) ? encodePlanPicks(picks) : null,
            anchor: planAnchorId,
        }).href

    const planMarkdown = () => {
        if (!plan) return ''
        const title = planTitle(plan.anchor.name[lang] || plan.anchor.name.en, planTitleKey(plan.anchor))
        return planToMarkdown(plan, { lang, title, shareHref: planHref() })
    }

    const copyPlan = () => {
        if (plan) return copy(planMarkdown(), 'plan')
    }

    const context = {
        tool: selected.tool.id,
        plan: planSeed,
        picks: planSeed && hasPicks(picks) ? encodePlanPicks(picks) : null,
        query,
        stage: stageFilter,
        anchor: planAnchorId,
    }
    const habitDrawers = stageFilter === null ? DRAWERS : drawersInStage(stageFilter)

    const tool = selected.tool
    const name = tool.name[lang] || tool.name.en
    const domain = getDomain(tool.url)

    return (
        <div>
            <Suspense fallback={null}>
                <ExplorerRouteObserver onChange={restoreRoute} />
            </Suspense>
            <HabitPeek tool={peek?.tool ?? null} origin={peek ? { x: peek.x, y: peek.y } : null} />
            {/* ── First viewport: the habits, and the label that answers one ── */}
            <section className="hero" aria-labelledby="hero-title" onKeyDown={onKeyDown}>
                <div className="wrap hero-grid">
                    <div>
                        <h1 id="hero-title" className="display hero-title" aria-label={t('hero.title')}>
                            {(lang === 'zh' ? [...t('hero.title')] : t('hero.title').split(' ')).map((word, index) => (
                                <Fragment key={`${word}-${index}`}>
                                    {index > 0 && lang !== 'zh' ? ' ' : null}
                                    <span
                                        className="rise"
                                        aria-hidden="true"
                                        style={{ '--i': index } as React.CSSProperties}
                                    >
                                        {word}
                                    </span>
                                </Fragment>
                            ))}
                        </h1>
                        <p className="hero-lede">{t('hero.lede', { count: TOOLS.length })}</p>

                        <div className="stage-tabs" role="group" aria-label={t('hero.stagesLabel')}>
                            <button
                                type="button"
                                className="stage-tab"
                                aria-pressed={stageFilter === null}
                                onClick={() => pickStage(null)}
                            >
                                <span className="caps">{t('hero.allStages')}</span>
                            </button>
                            {WORKFLOWS.map((flow, index) => (
                                <button
                                    type="button"
                                    key={flow.id}
                                    className="stage-tab"
                                    aria-pressed={stageFilter === index}
                                    onClick={() => pickStage(index)}
                                >
                                    <span className="code">{stageLetter(index)}</span>
                                    <span className="caps">{flow.name[lang]}</span>
                                </button>
                            ))}
                        </div>

                        <ul
                            id="habit-field"
                            className={`habit-field${showAllHabits ? ' is-expanded' : ''}`}
                            aria-label={t('hero.fieldLabel')}
                        >
                            {habitDrawers.map((drawer, index) => {
                                const current = drawer.tool.id === tool.id
                                return (
                                    <li
                                        key={drawer.tool.id}
                                        className={
                                            index >= INITIAL_HABIT_COUNT && !current ? 'habit-overflow' : undefined
                                        }
                                    >
                                        <button
                                            type="button"
                                            className="habit"
                                            aria-pressed={current}
                                            onClick={() => select(drawer, { reveal: true })}
                                            onPointerEnter={(event) => {
                                                if (pointerEffectsEnabled() && !current)
                                                    setPeek({ tool: drawer.tool, x: event.clientX, y: event.clientY })
                                            }}
                                            onPointerLeave={() => setPeek(null)}
                                        >
                                            <span className="habit-text">{habitOf(drawer.tool, lang)}</span>
                                            <span className="habit-code">{drawer.code}</span>
                                            <span className="habit-sep" aria-hidden="true">
                                                /
                                            </span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                        {habitDrawers.length > INITIAL_HABIT_COUNT && (
                            <button
                                type="button"
                                className="habit-expand btn btn--quiet"
                                aria-expanded={showAllHabits}
                                aria-controls="habit-field"
                                onClick={() => setShowAllHabits(!showAllHabits)}
                            >
                                {showAllHabits
                                    ? t('hero.showFewerHabits')
                                    : t('hero.showAllHabits', { count: habitDrawers.length })}
                            </button>
                        )}

                        <p className="hero-keys code" aria-hidden="true">
                            <span>
                                <kbd>←</kbd>
                                <kbd>→</kbd>
                                {t('hero.keys')}
                            </span>
                            <span>
                                <kbd>↑</kbd>
                                <kbd>↓</kbd>
                                {t('hero.keysColumn')}
                            </span>
                        </p>
                    </div>

                    <aside
                        ref={counterRef}
                        id="counter"
                        tabIndex={-1}
                        className="counter"
                        onPointerMove={(event) => trackPointer(event, '.slip', 3)}
                        onPointerLeave={releasePointer}
                        aria-labelledby="counter-name"
                    >
                        <div className="counter-head">
                            <span className="counter-code">{t('counter.drawer', { code: selected.code })}</span>
                            <span className="caps">{WORKFLOWS[selected.stage]?.name[lang]}</span>
                            <span className="counter-pos">
                                {t('counter.of', { at: at + 1, total: stageDrawers.length })}
                            </span>
                        </div>
                        <div className="counter-slot">
                            <article key={tool.id} className="slip">
                                <div className="slip-shot">
                                    <ToolPreviewImage
                                        tool={tool}
                                        eager
                                        sizes="(min-width: 1024px) 560px, 100vw"
                                        alt={t('counter.previewAlt', { name })}
                                    />
                                </div>
                                <div className="slip-body">
                                    <div className="slip-title-row">
                                        <h2 id="counter-name" className="display slip-name">
                                            {name}
                                        </h2>
                                        <span className="slip-domain code">{domain}</span>
                                    </div>
                                    <p className="slip-desc">{tool.description[lang]}</p>
                                    <LabelRows tool={tool} lang={lang} />
                                </div>
                            </article>
                        </div>
                        <div className="counter-actions">
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={() => step(-1)}
                                aria-label={t('counter.previous')}
                            >
                                <ArrowLeftIcon weight="bold" />
                            </button>
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={() => step(1)}
                                aria-label={t('counter.next')}
                            >
                                <ArrowRightIcon weight="bold" />
                            </button>
                            <span className="spacer" />
                            <Link href={toolDetailHref(tool.id, context)} className="btn btn--quiet">
                                {t('counter.fullLabel')}
                            </Link>
                            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="btn btn--brass">
                                {t('counter.visit')}
                                <ArrowSquareOutIcon weight="bold" />
                                <span className="sr-only">({t('counter.opensInNewTab')})</span>
                            </a>
                        </div>
                        <div className="counter-tools">
                            <button type="button" className="btn btn--quiet" onClick={() => writePlan(tool.id)}>
                                {t('plan.buildAround', { name })}
                            </button>
                        </div>
                    </aside>
                    <p id="counter-status" className="sr-only" role="status" aria-atomic="true">
                        {t('counter.selectionStatus', {
                            name,
                            stage: WORKFLOWS[selected.stage]?.name[lang],
                            code: selected.code,
                            at: at + 1,
                            total: stageDrawers.length,
                        })}
                    </p>
                </div>
            </section>

            {/* ── The cabinet: every drawer, by stage ── */}
            <section id="cabinet" className="cabinet" aria-labelledby="cabinet-title">
                <div className="wrap">
                    <div className="cabinet-head">
                        <div>
                            <h2 id="cabinet-title" tabIndex={-1} className="display cabinet-title" data-reveal>
                                {t('cabinet.title')}
                            </h2>
                            <p className="cabinet-lede">{t('cabinet.lede', { count: TOOLS.length })}</p>
                        </div>
                        <div className="cabinet-search">
                            <label htmlFor="drawer-search" className="caps">
                                {t('cabinet.search')}
                            </label>
                            <div className="search-field">
                                <MagnifyingGlassIcon weight="bold" />
                                <input
                                    id="drawer-search"
                                    ref={searchRef}
                                    type="search"
                                    maxLength={200}
                                    value={query}
                                    placeholder={t('cabinet.searchPlaceholder')}
                                    onChange={(event) => updateQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Escape' && !event.nativeEvent.isComposing) clearSearch()
                                    }}
                                />
                                {query && (
                                    <button
                                        type="button"
                                        className="chrome-btn"
                                        onClick={clearSearch}
                                        aria-label={t('cabinet.clearSearch')}
                                    >
                                        <XIcon weight="bold" />
                                    </button>
                                )}
                            </div>
                            <p className="cabinet-count" role="status">
                                {matches
                                    ? matches.size > 0
                                        ? t('cabinet.matches', { count: matches.size })
                                        : t('cabinet.noMatches')
                                    : ''}
                            </p>
                        </div>
                    </div>

                    <div
                        className={`cabinet-frame${matches !== null ? ' is-searching' : ''}`}
                        data-reveal
                        onPointerMove={(event) => trackPointer(event, '.drawer', 9)}
                        onPointerLeave={releasePointer}
                    >
                        {WORKFLOWS.map((flow, stage) => {
                            const column = drawersInStage(stage).filter(
                                (drawer) => matches === null || matches.has(drawer.tool.id),
                            )
                            if (matches !== null && column.length === 0) return null
                            return (
                                <section key={flow.id} className="cabinet-col" aria-labelledby={`col-${flow.id}`}>
                                    <header className="col-head">
                                        <span className="col-letter" aria-hidden="true">
                                            {stageLetter(stage)}
                                        </span>
                                        <h3 id={`col-${flow.id}`} className="col-name">
                                            {flow.name[lang]}
                                        </h3>
                                        <p className="col-question">{flow.question[lang]}</p>
                                    </header>
                                    <ul className="drawers">
                                        {Array.from(
                                            { length: matches === null ? CABINET_ROWS : column.length },
                                            (_, row) => {
                                                const drawer = column[row]
                                                return (
                                                    <li key={drawer?.tool.id ?? `empty-${row}`}>
                                                        {drawer ? (
                                                            <DrawerFront
                                                                drawer={drawer}
                                                                lang={lang}
                                                                current={drawer.tool.id === tool.id}
                                                                onSelect={(d) =>
                                                                    select(d, { reveal: true, focusCounter: true })
                                                                }
                                                            />
                                                        ) : (
                                                            <EmptyDrawer label={t('cabinet.empty')} />
                                                        )}
                                                    </li>
                                                )
                                            },
                                        )}
                                    </ul>
                                </section>
                            )
                        })}
                    </div>
                    {matches?.size === 0 && (
                        <button type="button" className="btn btn--brass" onClick={clearSearch}>
                            {t('cabinet.resetSearch')}
                        </button>
                    )}
                </div>
            </section>

            {/* ── The prescription: one drawer per column ── */}
            <section id="prescription" ref={rxRef} className="rx" aria-labelledby="rx-title">
                <div className="wrap rx-grid">
                    <div className="rx-intro">
                        <h2 id="rx-title" tabIndex={-1} className="display rx-title">
                            {t('plan.title')}
                        </h2>
                        <p className="rx-lede">{t('plan.lede')}</p>
                        <div className="rx-intro-actions">
                            <button type="button" className="btn btn--ink" onClick={() => writePlan()}>
                                {plan ? <ArrowsClockwiseIcon weight="bold" /> : null}
                                {plan ? t('plan.rewrite') : t('plan.write')}
                            </button>
                        </div>
                        {previousPlan && (
                            <div className="rx-undo">
                                <button type="button" className="btn btn--line" onClick={undoPlan}>
                                    <ArrowLeftIcon weight="bold" />
                                    {t('plan.undo')}
                                </button>
                                <p>{t('plan.undoHint')}</p>
                            </div>
                        )}
                        <p className="sr-only" role="status" aria-atomic="true">
                            {planNotice
                                ? t(`plan.${planNotice}`, { name: plan?.anchor.name[lang] || plan?.anchor.name.en })
                                : ''}
                        </p>
                    </div>

                    <section className="rx-slip" data-reveal aria-label={t('plan.label')}>
                        <p className="sr-only" role="status" aria-atomic="true">
                            {flash === 'plan' ? t('plan.copied') : flash === 'planLink' ? t('plan.linkCopied') : ''}
                        </p>
                        <div className="rx-head">
                            <span className="rx-mark" aria-hidden="true">
                                Rx
                            </span>
                            <span className="caps">Wayseeker</span>
                            <span className="rx-meta code">
                                {t('plan.number')} {planSeed ?? '——————'}
                            </span>
                        </div>

                        {plan ? (
                            <>
                                <h3 ref={planTitleRef} tabIndex={-1} className="display rx-plan-title">
                                    {planTitle(
                                        plan.anchor.name[lang] || plan.anchor.name.en,
                                        planTitleKey(plan.anchor),
                                    )}
                                </h3>
                                <p className="rx-basis">
                                    {t('plan.basis', { name: plan.anchor.name[lang] || plan.anchor.name.en })}
                                </p>
                                <ol className="rx-lines">
                                    {plan.steps.map((line, index) => {
                                        const flow = WORKFLOWS[index]
                                        const toolName = line.tool.name[lang] || line.tool.name.en
                                        const sharedTags = line.tool.tags.filter((tag) =>
                                            plan.anchor.tags.includes(tag),
                                        )
                                        return (
                                            <li
                                                key={line.workflowId}
                                                className={`rx-line${line.tool.id === plan.anchor.id ? ' is-anchor' : ''}`}
                                            >
                                                <span
                                                    className="rx-letter"
                                                    title={
                                                        line.tool.id === plan.anchor.id ? t('plan.anchor') : undefined
                                                    }
                                                >
                                                    {stageLetter(index)}
                                                </span>
                                                <div key={line.tool.id} className="rx-swap-in min-w-0">
                                                    <span className="rx-stage caps">
                                                        {flow?.name[lang]}
                                                        {line.tool.id === plan.anchor.id
                                                            ? ` · ${t('plan.anchor')}`
                                                            : ''}
                                                        {line.pinned ? ` · ${t('plan.pinned')}` : ''}
                                                    </span>
                                                    <Link
                                                        href={toolDetailHref(line.tool.id, context, 'prescription')}
                                                        className="rx-name"
                                                    >
                                                        {toolName}
                                                    </Link>
                                                    <span className="rx-instead">
                                                        {t('plan.instead')}{' '}
                                                        <s className="strike">{habitOf(line.tool, lang)}</s>
                                                    </span>
                                                    <span className="rx-relation">
                                                        {line.tool.id === plan.anchor.id
                                                            ? t('plan.anchorBasis')
                                                            : sharedTags.length > 0
                                                              ? t('plan.sharedTags', {
                                                                    tags: sharedTags.map(formatTag).join(' · '),
                                                                })
                                                              : t('plan.noSharedTags')}
                                                    </span>
                                                </div>
                                                <div className="rx-line-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn--quiet"
                                                        onClick={() => swap(index)}
                                                        aria-label={t('plan.swapLabel', { stage: flow?.name[lang] })}
                                                    >
                                                        <ArrowsClockwiseIcon weight="bold" />
                                                        {t('plan.swap')}
                                                    </button>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ol>
                                <div className="rx-foot">
                                    <button
                                        type="button"
                                        className="btn btn--ink"
                                        onClick={copyPlan}
                                        disabled={copying !== null}
                                        aria-busy={copying === 'plan'}
                                    >
                                        {copying === 'plan'
                                            ? t('plan.copying')
                                            : flash === 'plan'
                                              ? t('plan.copied')
                                              : t('plan.copy')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn--line"
                                        onClick={() => copy(planHref(), 'planLink')}
                                        disabled={copying !== null}
                                        aria-busy={copying === 'planLink'}
                                    >
                                        <LinkIcon weight="bold" />
                                        {copying === 'planLink'
                                            ? t('plan.copying')
                                            : flash === 'planLink'
                                              ? t('plan.linkCopied')
                                              : t('plan.copyLink')}
                                    </button>
                                    {failedCopy?.reason === 'failed' && (
                                        <p role="status" className="notice">
                                            {t('plan.copyFailed')}
                                        </p>
                                    )}
                                    <span key={planSeed} className="seal" aria-hidden="true">
                                        <span>寻</span>
                                        <span>路</span>
                                    </span>
                                </div>
                                <p className="copy-status" role="status" aria-atomic="true">
                                    {copyWaiting ? t('plan.clipboardPending') : ''}
                                </p>
                                {copyWaiting && (
                                    <button
                                        type="button"
                                        className="btn btn--line"
                                        onClick={() =>
                                            setFailedCopy({
                                                text: copying === 'planLink' ? planHref() : planMarkdown(),
                                                reason: 'manual',
                                            })
                                        }
                                    >
                                        {t('plan.copyFallbackTitle')}
                                    </button>
                                )}
                                {failedCopy !== null && (
                                    <CopyFeedback
                                        text={failedCopy.text}
                                        label={t('plan.copyFallbackTitle')}
                                        hint={t('plan.copyFallbackHint')}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <ol className="rx-lines">
                                    {WORKFLOWS.map((flow, index) => (
                                        <li key={flow.id} className="rx-line is-blank">
                                            <span className="rx-letter">{stageLetter(index)}</span>
                                            <div>
                                                <span className="rx-stage caps">{flow.name[lang]}</span>
                                                <div className="rx-blank" />
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                                <div className="rx-foot">
                                    <p className="rx-blank-note">{t('plan.blank')}</p>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </section>
        </div>
    )
}
