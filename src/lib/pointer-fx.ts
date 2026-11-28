/**
 * Pointer-driven material effects: lacquer sheen, drawer tilt, glass glint.
 *
 * Everything is written to CSS custom properties so the browser composites
 * the result; React never re-renders on pointer movement. Touch devices and
 * reduced-motion visitors get nothing — the static design is complete.
 */

function enabled(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
}

const lastItem = new WeakMap<HTMLElement, HTMLElement>()

function resetItem(item: HTMLElement | undefined) {
    if (!item) return
    // --gx 载入 glint 渐变；--rx/--ry 载入倾斜。--gy 无消费者，不写也不清。
    for (const name of ['--rx', '--ry', '--gx']) item.style.removeProperty(name)
}

/**
 * Track the pointer over `host`: sets --mx/--my (px) on the host, and tilt
 * (--rx/--ry) plus glint position (--gx/--gy) on the hovered item.
 */
export function trackPointer(event: React.PointerEvent<HTMLElement>, itemSelector: string, maxTilt: number) {
    if (!enabled()) return
    const host = event.currentTarget
    const box = host.getBoundingClientRect()
    host.style.setProperty('--mx', `${event.clientX - box.left}px`)
    host.style.setProperty('--my', `${event.clientY - box.top}px`)

    const item = (event.target as HTMLElement).closest<HTMLElement>(itemSelector) ?? undefined
    const previous = lastItem.get(host)
    if (previous && previous !== item) resetItem(previous)
    if (!item || !host.contains(item)) {
        lastItem.delete(host)
        return
    }
    lastItem.set(host, item)
    const rect = item.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    item.style.setProperty('--rx', `${(-py * maxTilt).toFixed(2)}deg`)
    item.style.setProperty('--ry', `${(px * maxTilt).toFixed(2)}deg`)
    item.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`)
}

export function releasePointer(event: React.PointerEvent<HTMLElement>) {
    const host = event.currentTarget
    host.style.removeProperty('--mx')
    host.style.removeProperty('--my')
    resetItem(lastItem.get(host))
    lastItem.delete(host)
}

export { enabled as pointerEffectsEnabled }
