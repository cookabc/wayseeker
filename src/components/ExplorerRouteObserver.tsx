'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/** Observe Next's same-page navigations without making the explorer client-only. */
export function ExplorerRouteObserver({ onChange }: { onChange: () => void }) {
    const search = useSearchParams().toString()

    useEffect(() => onChange(), [search, onChange])

    return null
}
