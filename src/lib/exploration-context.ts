import TOOLS from '../data/tools.ts'
import { QUERY_CAP, readExplorerRoute, writeExplorerRoute } from './explorer-route.ts'

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
    // 参数校验与重建都交给 explorer-route：q 截断、stage 边界、plan→picks/anchor 门控
    // 只有一份实现，这里不再复述。
    const route = readExplorerRoute(url.search, KNOWN_IDS)
    const home = writeExplorerRoute(new URL('/', BASE).href, {
        tool: route.tool ?? fallbackToolId,
        plan: route.plan,
        picks: route.plan ? route.picks : null,
        anchor: route.anchor ?? null,
        query: route.query,
        stage: route.stage,
    })
    const hash = ['#counter', '#cabinet', '#prescription'].includes(url.hash) ? url.hash : '#counter'
    return `${home.pathname}${home.search}${hash}`
}

export function toolDetailHref(
    toolId: string,
    context: ExplorationContext,
    anchor: 'counter' | 'cabinet' | 'prescription' = 'counter',
): string {
    const home = writeExplorerRoute(new URL('/', BASE).href, {
        tool: context.tool,
        plan: context.plan,
        picks: context.plan ? context.picks : null,
        anchor: context.plan ? (context.anchor ?? null) : null,
        query: context.query ? context.query.slice(0, QUERY_CAP) : null,
        stage: context.stage,
    })
    return `/t/${encodeURIComponent(toolId)}?${new URLSearchParams({ returnTo: `/?${home.searchParams}#${anchor}` })}`
}

/** Fragment-only home links resolve against the live URL, including unsent selection changes. */
export function sectionNavigationHref(pathname: string, search: string, section: 'cabinet' | 'prescription'): string {
    if (pathname === '/') return `#${section}`
    const toolId = pathname.match(/^\/t\/([a-z0-9-]+)$/)?.[1]
    if (!toolId || !KNOWN_IDS.includes(toolId)) return `/#${section}`
    const url = new URL(explorerReturnHref(search, toolId), BASE)
    return `${url.pathname}${url.search}#${section}`
}
