import TOOLS from '../data/tools.ts'
import { WORKFLOWS } from '../data/workflow.ts'
import { readExplorerRoute } from './explorer-route.ts'

export interface ExplorationContext {
    tool: string
    plan: string | null
    picks: string | null
    query: string
    stage: number | null
    anchor?: string | null
}

const KNOWN_IDS = TOOLS.map((tool) => tool.id)
const BASE = 'https://wayseeker.invalid'

/** Only the homepage and known exploration parameters can be a return destination. */
export function explorerReturnHref(search: string, fallbackToolId: string): string {
    const fallback = `/?tool=${encodeURIComponent(fallbackToolId)}#counter`
    const value = new URLSearchParams(search).get('returnTo')
    if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
    let url: URL
    try {
        url = new URL(value, BASE)
    } catch {
        return fallback
    }
    if (url.origin !== BASE || url.pathname !== '/') return fallback
    const route = readExplorerRoute(url.search, KNOWN_IDS)
    const params = new URLSearchParams()
    params.set('tool', route.tool ?? fallbackToolId)
    if (route.plan) params.set('plan', route.plan)
    if (route.plan && route.picks) params.set('p', route.picks)
    if (route.plan && route.anchor) params.set('anchor', route.anchor)
    const query = url.searchParams.get('q')?.slice(0, 200)
    if (query) params.set('q', query)
    const stage = url.searchParams.get('stage')
    if (stage && /^[0-4]$/.test(stage) && Number(stage) < WORKFLOWS.length) params.set('stage', stage)
    const hash = ['#counter', '#cabinet', '#prescription'].includes(url.hash) ? url.hash : '#counter'
    return `/?${params}${hash}`
}

export function toolDetailHref(
    toolId: string,
    context: ExplorationContext,
    anchor: 'counter' | 'cabinet' | 'prescription' = 'counter',
): string {
    const params = new URLSearchParams({ tool: context.tool })
    if (context.plan) params.set('plan', context.plan)
    if (context.plan && context.picks) params.set('p', context.picks)
    if (context.plan && context.anchor) params.set('anchor', context.anchor)
    if (context.query) params.set('q', context.query.slice(0, 200))
    if (context.stage !== null) params.set('stage', String(context.stage))
    return `/t/${encodeURIComponent(toolId)}?${new URLSearchParams({ returnTo: `/?${params}#${anchor}` })}`
}

/** Fragment-only home links resolve against the live URL, including unsent selection changes. */
export function sectionNavigationHref(pathname: string, search: string, section: 'cabinet' | 'prescription'): string {
    if (pathname === '/') return `#${section}`
    const toolId = pathname.match(/^\/t\/([a-z0-9-]+)$/)?.[1]
    if (!toolId || !KNOWN_IDS.includes(toolId)) return `/#${section}`
    const url = new URL(explorerReturnHref(search, toolId), BASE)
    return `${url.pathname}${url.search}#${section}`
}
