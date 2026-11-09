import TOOLS, { type Tool } from '../data/tools.ts'
import { WORKFLOWS, type WorkflowId } from '../data/workflow.ts'
import type { Language } from './curator-note.ts'
import { toolDetailHref } from './exploration-context.ts'
import { readExplorerRoute } from './explorer-route.ts'
import { seededShuffle, seedToNumber } from './shuffle.ts'
import { SITE_URL } from './site.ts'

/**
 * A generated plan: one committed tool per workflow stage.
 *
 * The explorer's seed only shuffles browsing order — it never decides. A plan
 * is the step past that: five picks that a visitor can take away as-is. The
 * picks are not drawn independently. One anchor tool is drawn from the seed
 * first, and every stage then prefers candidates that share tags with it, so
 * a plan keeps a direction instead of reading like five strangers.
 *
 * Identity is deterministic: (seed, picks, optional anchor) reproduces a plan.
 * Without an explicit anchor, existing seed links keep their original picks.
 * Swapping a step never changes the anchor or the other four steps.
 */

export interface PlanStep {
    workflowId: WorkflowId
    tool: Tool
    /** True when the visitor committed this step (a URL pick), not the seed default. */
    pinned: boolean
}

export interface Plan {
    seed: string
    anchor: Tool
    steps: PlanStep[]
}

/** Per-route tool picks in workflow order; null entries fall back to the seed default. */
export type PlanPicks = ReadonlyArray<string | null>

const STAGE_SALT = 0x9e3779b1

/** An explicit known tool can set the direction; otherwise keep legacy seed selection. */
export function planAnchor(seed: string, anchorId?: string | null): Tool {
    const explicit = anchorId ? TOOLS.find((tool) => tool.id === anchorId) : undefined
    if (explicit) return explicit
    const anchor = seededShuffle(TOOLS, seedToNumber(seed))[0]
    if (!anchor) throw new Error('planAnchor: the catalogue is empty')
    return anchor
}

/**
 * One stage's candidates: a seeded shuffle, then a stable sort by tag overlap
 * with the anchor. Sorting the shuffle (instead of sorting the raw route)
 * keeps equal-overlap tools in seeded order, so coherence steers the pick
 * without killing variety — and the whole sequence stays deterministic.
 */
export function stageCandidates(workflowIndex: number, anchor: Tool, seed: string): Tool[] {
    const flow = WORKFLOWS[workflowIndex]
    if (!flow) return []
    const routeTools = flow.toolIds
        .map((id) => TOOLS.find((tool) => tool.id === id))
        .filter((tool): tool is Tool => Boolean(tool))
    const stageSeed = (seedToNumber(seed) ^ Math.imul(workflowIndex + 1, STAGE_SALT)) >>> 0
    const shuffled = seededShuffle(routeTools, stageSeed)
    const anchorTags = new Set(anchor.tags)
    return shuffled
        .map((tool, order) => ({ tool, order, overlap: tool.tags.filter((tag) => anchorTags.has(tag)).length }))
        .sort((a, b) => b.overlap - a.overlap || a.order - b.order)
        .map((entry) => entry.tool)
}

/** Build the plan for a seed. Picks are trusted only when they name a tool on that route. */
export function generatePlan(seed: string, picks: PlanPicks = [], anchorId?: string | null): Plan {
    const anchor = planAnchor(seed, anchorId)
    const steps = WORKFLOWS.map((flow, index) => {
        const wanted = picks[index] ?? null
        const pinned = Boolean(wanted && flow.toolIds.includes(wanted))
        const defaultPick =
            anchorId === anchor.id && flow.toolIds.includes(anchor.id)
                ? anchor
                : stageCandidates(index, anchor, seed)[0]
        const tool = (pinned && wanted ? TOOLS.find((entry) => entry.id === wanted) : undefined) ?? defaultPick
        if (!tool) throw new Error(`generatePlan: route "${flow.id}" has no tools`)
        return { workflowId: flow.id, tool, pinned }
    })
    return { seed, anchor, steps }
}

/**
 * The tool a stage rerolls to: the candidate after the current one in that
 * stage's sequence. Cycling through the whole route returns to the start, so
 * repeated swaps never dead-end and every outcome is reproducible from the seed.
 */
export function rerollStep(seed: string, workflowIndex: number, currentId: string, anchorId?: string | null): string {
    const candidates = stageCandidates(workflowIndex, planAnchor(seed, anchorId), seed)
    const at = candidates.findIndex((tool) => tool.id === currentId)
    const next = candidates[(at + 1 + candidates.length) % candidates.length] ?? candidates[0]
    if (!next) throw new Error(`rerollStep: route at ${workflowIndex} has no tools`)
    return next.id
}

/** The picks that reproduce this plan, in workflow order. */
export function planPicks(plan: Plan): PlanPicks {
    return plan.steps.map((step) => (step.pinned ? step.tool.id : null))
}

const TITLE_PRIORITY = ['motion', 'games', 'ai', 'ui'] as const

/**
 * Which naming template fits the anchor. The first highly specific tag wins —
 * an anchor tagged ui+motion is a motion anchor, one tagged design is the
 * general visual case and lands on the default template.
 */
export function planTitleKey(anchor: Tool): string {
    return TITLE_PRIORITY.find((tag) => anchor.tags.includes(tag)) ?? 'design'
}

/** Serialize picks for the URL: ids joined by dots, unpinned stages empty. */
export function encodePlanPicks(picks: PlanPicks): string {
    // Trailing defaults carry no information — generatePlan falls back for
    // missing segments — so they are trimmed to keep shared URLs short.
    return picks
        .map((pick) => pick ?? '')
        .join('.')
        .replace(/\.+$/, '')
}

/** Parse the URL picks string; empty segments become null. */
export function parsePlanPicks(value: string): PlanPicks {
    return value.split('.').map((segment) => (segment ? segment : null))
}

/** Whether any stage carries a committed pick. */
export function hasPicks(picks: PlanPicks): boolean {
    return picks.some((pick) => pick !== null)
}

/**
 * The plan as pasteable Markdown — the reuse exit. Notes travel with the
 * tools so the text works as agent-ready context, not just a link list.
 */
export function planToMarkdown(plan: Plan, options: { lang: Language; title: string; shareHref: string }): string {
    const lang = options.lang
    const lines: string[] = [`# ${options.title}`, '']
    const shared = readExplorerRoute(
        new URL(options.shareHref, SITE_URL).search,
        TOOLS.map((tool) => tool.id),
    )
    const picks = planPicks(plan)
    plan.steps.forEach((step, index) => {
        const flow = WORKFLOWS.find((entry) => entry.id === step.workflowId)
        const name = step.tool.name[lang] || step.tool.name.en
        lines.push(`## ${index + 1}. ${flow?.name[lang] ?? step.workflowId} — ${name}`, '')
        lines.push(step.tool.description[lang], '')
        if (step.tool.note) lines.push(step.tool.note[lang], '')
        lines.push(
            `${SITE_URL}${toolDetailHref(
                step.tool.id,
                {
                    tool: step.tool.id,
                    plan: plan.seed,
                    picks: hasPicks(picks) ? encodePlanPicks(picks) : null,
                    anchor: shared.anchor === plan.anchor.id ? shared.anchor : null,
                    query: '',
                    stage: null,
                },
                'prescription',
            )}`,
            '',
        )
    })
    lines.push('---', '', options.shareHref)
    return lines.join('\n')
}
