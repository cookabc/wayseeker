'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Tool } from '@/data/tools'
import { useI18nReady } from '@/hooks/useI18nReady'
import { getIcon } from '@/lib/icon-map'

interface ToolPreviewImageProps {
    tool: Tool
    /** Layout sizes hint so the browser can pick a small optimized variant. */
    sizes: string
    /** Pass "" for decorative usage inside labelled links. */
    alt?: string
    /** Load immediately (above-the-fold mosaics) instead of lazily. */
    eager?: boolean
    /** Extra classes merged onto the image (e.g. hover transforms). */
    className?: string
    /** Size classes for the fallback icon. */
    iconClassName?: string
}

/**
 * Tool screenshot through next/image (responsive AVIF/WebP variants) with a
 * branded icon fallback when the preview file is missing. Fills its nearest
 * positioned parent — the parent owns cropping and aspect ratio.
 */
export function ToolPreviewImage({
    tool,
    sizes,
    alt = '',
    eager = false,
    className,
    iconClassName = 'h-12 w-12',
}: ToolPreviewImageProps) {
    const [failedId, setFailedId] = useState<string | null>(null)
    const { t } = useI18nReady()

    if (failedId === tool.id) {
        const Icon = getIcon(tool.icon)
        const icon = (
            <Icon className={iconClassName} style={{ color: tool.color }} weight="duotone" aria-hidden="true" />
        )
        if (!alt) {
            return (
                <div className={`preview-fallback is-decorative ${className ?? ''}`} aria-hidden="true">
                    {icon}
                </div>
            )
        }
        return (
            <div
                className={`preview-fallback ${className ?? ''}`}
                role="img"
                aria-label={`${alt}. ${t('media.previewUnavailable')}`}
            >
                {icon}
                <span>{t('media.previewUnavailable')}</span>
            </div>
        )
    }

    return (
        <Image
            src={`/previews/${tool.id}.png`}
            alt={alt}
            fill
            sizes={sizes}
            loading={eager ? 'eager' : 'lazy'}
            className={`object-cover object-top ${className ?? ''}`}
            onError={() => setFailedId(tool.id)}
        />
    )
}
