'use client'

import {
    ArrowLeftIcon,
    ArrowSquareOutIcon,
    CheckIcon,
    CopyIcon,
    GithubLogoIcon,
    ImageIcon,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { CopyFeedback } from '@/components/CopyFeedback'
import { DrawerFront } from '@/components/DrawerFront'
import { normalizeLanguage } from '@/components/I18nProvider'
import { LabelRows } from '@/components/LabelRows'
import { ToolPreviewImage } from '@/components/ToolPreviewImage'
import type { Tool } from '@/data/tools'
import { WORKFLOWS } from '@/data/workflow'
import { useI18nReady } from '@/hooks/useI18nReady'
import { drawerOf, drawersInStage, stageLetter } from '@/lib/drawers'
import { explorerReturnHref } from '@/lib/exploration-context'
import { getDomain } from '@/lib/filter-tools'
import { copyCanvasAsImage, renderNoteCard } from '@/lib/note-card-image'

export function ToolDetail({ tool }: { tool: Tool }) {
    const { i18n, t } = useI18nReady()
    const lang = normalizeLanguage(i18n.language)
    const [noteState, setNoteState] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle')
    const [imageState, setImageState] = useState<'idle' | 'rendering' | 'copied' | 'downloaded' | 'failed'>('idle')
    const activeCopy = useRef<AbortController | null>(null)
    const nativeCopy = useRef<AbortController | null>(null)
    const clipboardTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [clipboardPending, setClipboardPending] = useState(false)
    const [copying, setCopying] = useState(false)
    const [showManualCopy, setShowManualCopy] = useState(false)
    const [backHref, setBackHref] = useState(() => explorerReturnHref('', tool.id))

    useEffect(() => {
        setBackHref(explorerReturnHref(window.location.search, tool.id))
    }, [tool.id])

    useEffect(() => {
        activeCopy.current?.abort()
        // A native clipboard request cannot be cancelled. Keep its lock across
        // context changes, but discard its outcome and any download fallback.
        if (activeCopy.current !== nativeCopy.current) activeCopy.current = null
        if (clipboardTimer.current) clearTimeout(clipboardTimer.current)
        setCopying(Boolean(activeCopy.current))
        setClipboardPending(Boolean(activeCopy.current))
        setShowManualCopy(false)
        setNoteState('idle')
        setImageState('idle')
        return () => {
            activeCopy.current?.abort()
            if (activeCopy.current !== nativeCopy.current) activeCopy.current = null
            if (clipboardTimer.current) clearTimeout(clipboardTimer.current)
        }
    }, [tool.id, lang])

    const drawer = drawerOf(tool.id)
    const stage = drawer?.stage ?? 0
    const flow = WORKFLOWS[stage]
    const name = tool.name[lang] || tool.name.en
    const note = tool.note?.[lang] || tool.note?.en
    const domain = getDomain(tool.url)
    const siblings = drawersInStage(stage).filter((entry) => entry.tool.id !== tool.id)
    const labelText = note ? `${name} — ${note}` : ''

    const beginCopy = () => {
        // A ref also guards two activations in the same render frame.
        if (activeCopy.current) return null
        const controller = new AbortController()
        activeCopy.current = controller
        setCopying(true)
        setClipboardPending(false)
        setShowManualCopy(false)
        setNoteState('idle')
        setImageState('idle')
        return controller
    }

    const waitForClipboard = (controller: AbortController) => {
        nativeCopy.current = controller
        if (clipboardTimer.current) clearTimeout(clipboardTimer.current)
        clipboardTimer.current = setTimeout(() => {
            if (activeCopy.current === controller && !controller.signal.aborted) setClipboardPending(true)
        }, 8000)
    }

    const finishCopy = (controller: AbortController) => {
        if (activeCopy.current !== controller) return
        activeCopy.current = null
        if (nativeCopy.current === controller) nativeCopy.current = null
        setCopying(false)
        if (clipboardTimer.current) clearTimeout(clipboardTimer.current)
        clipboardTimer.current = null
        setClipboardPending(false)
    }

    const copyNote = async () => {
        if (!note) return
        const controller = beginCopy()
        if (!controller) return
        setNoteState('copying')
        waitForClipboard(controller)
        try {
            await navigator.clipboard.writeText(labelText)
            if (!controller.signal.aborted) setNoteState('copied')
        } catch {
            if (!controller.signal.aborted) setNoteState('failed')
        } finally {
            finishCopy(controller)
        }
    }

    const copyImage = async () => {
        if (!note) return
        const controller = beginCopy()
        if (!controller) return
        setImageState('rendering')
        try {
            const canvas = await renderNoteCard(
                {
                    name,
                    note,
                    domain,
                    code: drawer?.code ?? '',
                    label: t('detail.whyIUseIt'),
                    attributionLabel: t('detail.curatorAttribution', { domain }).split(/[,，]/)[0].trim(),
                    color: tool.color,
                    brand: 'Wayseeker',
                },
                controller.signal,
            )
            const result = await copyCanvasAsImage(canvas, `${tool.id}-label.png`, {
                signal: controller.signal,
                onClipboardStart: () => waitForClipboard(controller),
            })
            if (!controller.signal.aborted) setImageState(result)
        } catch {
            if (!controller.signal.aborted) setImageState('failed')
        } finally {
            finishCopy(controller)
        }
    }

    return (
        <article className="wrap label-page">
            <Link href={backHref} className="back-link caps">
                <ArrowLeftIcon weight="bold" />
                {t('detail.back')}
            </Link>

            <div className="label-page-grid">
                <div className="big-label">
                    <div className="big-label-head caps">
                        <span className="code">{drawer?.code}</span>
                        <span>
                            {t('detail.column', { letter: stageLetter(stage) })} · {flow?.name[lang]}
                        </span>
                    </div>
                    <h1 className="display big-label-name">{name}</h1>
                    <p className="big-label-domain code">{domain}</p>
                    <p className="big-label-desc">{tool.description[lang]}</p>
                    <LabelRows tool={tool} lang={lang} />
                    <div className="big-label-actions">
                        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="btn btn--ink">
                            {t('counter.visit')}
                            <ArrowSquareOutIcon weight="bold" />
                            <span className="sr-only">({t('counter.opensInNewTab')})</span>
                        </a>
                        <button
                            type="button"
                            className="btn btn--line"
                            onClick={copyNote}
                            disabled={copying}
                            aria-busy={noteState === 'copying'}
                        >
                            {noteState === 'copied' ? <CheckIcon weight="bold" /> : <CopyIcon weight="bold" />}
                            {noteState === 'copying'
                                ? t('detail.copyingNote')
                                : noteState === 'copied'
                                  ? t('detail.noteCopied')
                                  : t('detail.copyNote')}
                        </button>
                        <button
                            type="button"
                            className="btn btn--quiet"
                            onClick={copyImage}
                            disabled={copying}
                            aria-busy={imageState === 'rendering'}
                        >
                            {imageState === 'copied' || imageState === 'downloaded' ? (
                                <CheckIcon weight="bold" />
                            ) : (
                                <ImageIcon weight="bold" />
                            )}
                            {imageState === 'rendering'
                                ? t('detail.renderingImage')
                                : imageState === 'copied'
                                  ? t('detail.imageCopied')
                                  : imageState === 'downloaded'
                                    ? t('detail.imageDownloaded')
                                    : t('detail.copyImage')}
                        </button>
                        {tool.githubUrl && (
                            <a
                                href={tool.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn--quiet"
                            >
                                <GithubLogoIcon weight="bold" />
                                {t('detail.github')}
                            </a>
                        )}
                    </div>
                    <p className="copy-status" role="status" aria-atomic="true">
                        {clipboardPending ? t('detail.clipboardPending') : ''}
                    </p>
                    {clipboardPending && !showManualCopy && (
                        <button type="button" className="btn btn--line" onClick={() => setShowManualCopy(true)}>
                            {t('detail.copyManually')}
                        </button>
                    )}
                    <p className="copy-status" role="status" aria-atomic="true">
                        {noteState === 'failed'
                            ? t('detail.copyFailed')
                            : noteState === 'copied'
                              ? t('detail.noteCopied')
                              : ''}
                    </p>
                    <p className="copy-status" role="status" aria-atomic="true">
                        {imageState === 'failed'
                            ? t('detail.imageFailed')
                            : imageState === 'copied'
                              ? t('detail.imageCopied')
                              : imageState === 'downloaded'
                                ? t('detail.imageDownloaded')
                                : ''}
                    </p>
                    {(noteState === 'failed' || showManualCopy) && (
                        <CopyFeedback text={labelText} label={t('detail.manualLabel')} hint={t('detail.manualHint')} />
                    )}
                </div>

                <figure className="label-page-shot">
                    <div className="label-page-shot-frame">
                        <ToolPreviewImage
                            tool={tool}
                            eager
                            sizes="(min-width: 1024px) 720px, 100vw"
                            alt={t('counter.previewAlt', { name })}
                        />
                    </div>
                    <figcaption className="label-page-shot-cap code">
                        <span>{domain}</span>
                        <span>{drawer?.code}</span>
                    </figcaption>
                </figure>
            </div>

            {siblings.length > 0 && (
                <section className="shelf" aria-labelledby="shelf-column">
                    <h2 id="shelf-column" className="display shelf-title">
                        {t('detail.sameColumn')}
                    </h2>
                    <ul className="shelf-row">
                        {siblings.map((entry) => (
                            <li key={entry.tool.id}>
                                <DrawerFront
                                    drawer={entry}
                                    lang={lang}
                                    href={`/t/${entry.tool.id}?${new URLSearchParams({ returnTo: backHref })}`}
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </article>
    )
}
