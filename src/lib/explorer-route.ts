import { parseSeed } from './shuffle.ts'

export interface ExplorerRoute {
    tool: string | null
    /** Seed of a generated plan; same base-36 alphabet the explorer seed used. */
    plan: string | null
    /** Raw picks string for the plan ('a.b.c' with empty segments, route order). */
    picks: string | null
    /** An optional known tool that sets a valid plan's direction. */
    anchor?: string | null
}

/** Picks are ids joined by dots; segments may be empty (seed default). */
const PICKS_PATTERN = /^[a-z0-9.-]{0,140}$/

/** Share only known tool IDs and well-formed plan state; keep unrelated query parameters and anchors. */
export function readExplorerRoute(search: string, knownIds: readonly string[]): ExplorerRoute {
    const params = new URLSearchParams(search)
    const tool = params.get('tool')
    const plan = params.get('plan')
    const picks = params.get('p')
    const anchor = params.get('anchor')
    const validPlan = plan && parseSeed(plan) !== null ? plan.toLowerCase() : null
    return {
        tool: tool && knownIds.includes(tool) ? tool : null,
        plan: validPlan,
        picks: picks && PICKS_PATTERN.test(picks) && picks.split('.').length <= 6 ? picks : null,
        ...(validPlan && anchor && knownIds.includes(anchor) ? { anchor } : {}),
    }
}

export function writeExplorerRoute(href: string, route: ExplorerRoute): URL {
    const url = new URL(href)
    // ?seed= was the pre-plan shuffle parameter. Reading it is gone; old shared
    // links must not keep feeding it into fresh URLs the explorer writes.
    url.searchParams.delete('seed')
    const entries = [
        ['tool', route.tool],
        ['plan', route.plan],
        ['p', route.picks],
        ['anchor', route.plan ? route.anchor : null],
    ] as const
    for (const [key, value] of entries) {
        if (value) url.searchParams.set(key, value)
        else url.searchParams.delete(key)
    }
    return url
}
