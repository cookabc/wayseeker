import { WORKFLOWS } from '../data/workflow.ts'
import { parseSeed } from './shuffle.ts'

export interface ExplorerRoute {
    tool: string | null
    /** Seed of a generated plan; same base-36 alphabet the explorer seed used. */
    plan: string | null
    /** Raw picks string for the plan ('a.b.c' with empty segments, route order). */
    picks: string | null
    /** An optional known tool that sets a valid plan's direction. */
    anchor?: string | null
    /** Free-text search; capped here so every consumer shares one bound. */
    query: string | null
    /** Selected workflow stage; valid only below the route count. */
    stage: number | null
}

/** Picks are ids joined by dots; segments may be empty (seed default). */
const PICKS_PATTERN = /^[a-z0-9.-]{0,140}$/

/** The search box shares one bound between typing, links and restores. */
export const QUERY_CAP = 200

/** A stage reference is a single digit within the real route count. */
function parseStage(value: string | null): number | null {
    if (!value || !/^\d$/.test(value)) return null
    const stage = Number(value)
    return stage < WORKFLOWS.length ? stage : null
}

/** Share only known tool IDs and well-formed plan state; keep unrelated query parameters and anchors. */
export function readExplorerRoute(search: string, knownIds: readonly string[]): ExplorerRoute {
    const params = new URLSearchParams(search)
    const tool = params.get('tool')
    const plan = params.get('plan')
    const picks = params.get('p')
    const anchor = params.get('anchor')
    const query = params.get('q')
    const validPlan = plan && parseSeed(plan) !== null ? plan.toLowerCase() : null
    return {
        tool: tool && knownIds.includes(tool) ? tool : null,
        plan: validPlan,
        picks: picks && PICKS_PATTERN.test(picks) && picks.split('.').length <= 6 ? picks : null,
        ...(validPlan && anchor && knownIds.includes(anchor) ? { anchor } : {}),
        query: query ? query.slice(0, QUERY_CAP) : null,
        stage: parseStage(params.get('stage')),
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
        ['q', route.query],
        ['stage', route.stage === null ? null : String(route.stage)],
    ] as const
    for (const [key, value] of entries) {
        if (value) url.searchParams.set(key, value)
        else url.searchParams.delete(key)
    }
    return url
}
