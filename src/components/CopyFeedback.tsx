'use client'

import { useEffect, useId, useRef } from 'react'

/** Keep the exact payload available when clipboard permissions are denied. */
export function CopyFeedback({ text, label, hint }: { text: string; label: string; hint: string }) {
    const id = useId()
    const field = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        const target = field.current
        if (!target) return
        // Set the native selection before focus, then reveal it once. Focusing
        // without scrolling alone can leave the recovery content below the fold.
        target.setSelectionRange(0, target.value.length)
        target.scrollTop = 0
        target.focus({ preventScroll: true })
        target.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' })
    }, [text])

    return (
        <div className="manual-copy">
            <label htmlFor={id}>{label}</label>
            <p id={`${id}-hint`}>{hint}</p>
            <textarea
                ref={field}
                id={id}
                value={text}
                readOnly
                rows={6}
                spellCheck={false}
                aria-describedby={`${id}-hint`}
            />
        </div>
    )
}
