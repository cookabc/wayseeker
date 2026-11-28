'use client'

import Link from 'next/link'
import { ToolPreviewImage } from '@/components/ToolPreviewImage'
import type { Language } from '@/lib/curator-note'
import type { Drawer } from '@/lib/drawers'

interface DrawerFrontProps {
    drawer: Drawer
    lang: Language
    current?: boolean
    /** Render as a button that selects in place… */
    onSelect?: (drawer: Drawer) => void
    /** …or as a link to the tool's label page. */
    href?: string
}

/** One drawer front: code, a brass-framed paper label, and a pull. */
export function DrawerFront({ drawer, lang, current = false, onSelect, href }: DrawerFrontProps) {
    const name = drawer.tool.name[lang] || drawer.tool.name.en
    const className = 'drawer'
    const inner = (
        <>
            <span className="drawer-code">{drawer.code}</span>
            {/* Glass-fronted drawer: the contents show through the window. */}
            <span className="drawer-window" aria-hidden="true">
                <ToolPreviewImage tool={drawer.tool} sizes="(min-width: 900px) 240px, 45vw" />
                <span className="drawer-glint" />
            </span>
            <span className="drawer-label">{name}</span>
            <span className="drawer-pull" aria-hidden="true" />
        </>
    )
    if (href) {
        return (
            <Link href={href} className={className}>
                {inner}
            </Link>
        )
    }
    return (
        <button
            type="button"
            className={className}
            aria-current={current ? 'true' : undefined}
            aria-label={`${drawer.code} · ${name}`}
            onClick={() => onSelect?.(drawer)}
        >
            {inner}
        </button>
    )
}

export function EmptyDrawer({ label }: { label: string }) {
    return (
        <div className="drawer is-empty" aria-hidden="true" title={label}>
            <span className="drawer-code">&nbsp;</span>
            <span className="drawer-window" />
            <span className="drawer-label" />
            <span className="drawer-pull" />
        </div>
    )
}
