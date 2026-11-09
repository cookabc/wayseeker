'use client'

import { useEffect, useRef } from 'react'
import { ToolPreviewImage } from '@/components/ToolPreviewImage'
import type { Tool } from '@/data/tools'
import { pointerEffectsEnabled } from '@/lib/pointer-fx'

/**
 * A screenshot that trails the cursor while a habit is hovered: the remedy
 * shows itself before you commit to it. Position is eased in a rAF loop and
 * written straight to the element, so hovering never re-renders the page.
 */
export function HabitPeek({ tool, origin }: { tool: Tool | null; origin: { x: number; y: number } | null }) {
    const ref = useRef<HTMLDivElement>(null)
    const target = useRef({ x: 0, y: 0 })
    const current = useRef({ x: 0, y: 0, r: 0 })

    useEffect(() => {
        if (!origin) return
        target.current = origin
    }, [origin])

    useEffect(() => {
        if (!tool) return
        // Start where the pointer is, not where the last peek ended.
        current.current = { ...target.current, r: 0 }
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
        const width = ref.current?.offsetWidth || 240
        const height = ref.current?.offsetHeight || 150
        let enabled = pointerEffectsEnabled()
        let frame = 0
        const tick = () => {
            frame = 0
            if (!enabled) return
            const c = current.current
            const t = target.current
            const dx = t.x - c.x
            c.x += dx * 0.18
            c.y += (t.y - c.y) * 0.18
            c.r += (Math.max(-9, Math.min(9, dx * 0.25)) - c.r) * 0.15
            if (ref.current) {
                // Float above-right of the cursor so the hovered phrase stays readable;
                // drop below it when the top of the viewport has no room.
                const y = c.y - height - 22 < 72 ? c.y + 30 : c.y - height - 22
                const x = Math.max(16, Math.min(c.x + 18, window.innerWidth - width - 16))
                ref.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${c.r.toFixed(2)}deg)`
            }
            // Stop at rest instead of scheduling frames for the whole hover.
            if (Math.abs(t.x - c.x) > 0.1 || Math.abs(t.y - c.y) > 0.1 || Math.abs(c.r) > 0.05) {
                frame = requestAnimationFrame(tick)
            }
        }
        const move = (event: PointerEvent) => {
            target.current = { x: event.clientX, y: event.clientY }
            if (enabled && !frame) frame = requestAnimationFrame(tick)
        }
        const syncMotion = () => {
            enabled = pointerEffectsEnabled()
            if (!enabled) {
                cancelAnimationFrame(frame)
                frame = 0
            } else if (!frame) {
                frame = requestAnimationFrame(tick)
            }
        }
        window.addEventListener('pointermove', move, { passive: true })
        motion.addEventListener('change', syncMotion)
        if (enabled) frame = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('pointermove', move)
            motion.removeEventListener('change', syncMotion)
        }
    }, [tool])

    return (
        <div ref={ref} className={`habit-peek${tool ? ' is-on' : ''}`} aria-hidden="true">
            {tool && (
                <div key={tool.id} className="habit-peek-card">
                    <ToolPreviewImage tool={tool} sizes="260px" />
                </div>
            )}
        </div>
    )
}
