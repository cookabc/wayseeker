'use client'

import { useEffect } from 'react'

/** Activate the CJK face after hydration so its glyph requests cannot delay the app's scripts. */
export function ActivateChineseFont({ variableClass }: { variableClass: string }) {
    useEffect(() => {
        document.documentElement.classList.add(variableClass)
        return () => document.documentElement.classList.remove(variableClass)
    }, [variableClass])

    return null
}
