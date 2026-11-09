import assert from 'node:assert/strict'
import { test } from 'node:test'
import TOOLS, { type Tool } from '../data/tools.ts'
import { WORKFLOWS } from '../data/workflow.ts'
import { explorerReturnHref } from './exploration-context.ts'
import {
    encodePlanPicks,
    generatePlan,
    hasPicks,
    parsePlanPicks,
    planAnchor,
    planPicks,
    planTitleKey,
    planToMarkdown,
    rerollStep,
    stageCandidates,
} from './plan.ts'
import { SITE_URL } from './site.ts'

const SEED = 'k4x9f2'

test('existing seed-only plans preserve their published anchor and exact picks', () => {
    const fixtures = [
        {
            seed: '000000',
            anchor: 'before-click',
            steps: ['neal-fun', 'impeccable', '60fps', 'onepagelove', 'whatships'],
        },
        {
            seed: 'k4x9f2',
            anchor: 'taste-skill',
            steps: ['rebrand-gallery', 'taste-skill', 'awesome-ai-motion', 'namethatui', 'kenney'],
        },
        {
            seed: 'abcdef',
            anchor: 'open-design',
            steps: ['zhongguo-colors', 'open-design', 'awesome-ai-motion', 'namethatui', 'whatships'],
        },
    ]
    for (const fixture of fixtures) {
        const plan = generatePlan(fixture.seed)
        assert.equal(plan.anchor.id, fixture.anchor)
        assert.deepEqual(
            plan.steps.map((step) => step.tool.id),
            fixture.steps,
        )
        assert.deepEqual(generatePlan(fixture.seed, [], null), plan)
        assert.deepEqual(generatePlan(fixture.seed, [], 'unknown-tool'), plan)
    }
})

test('every explicit anchor is included on its own route and keeps suggestions reproducible', () => {
    for (const anchor of TOOLS) {
        const first = generatePlan(SEED, [], anchor.id)
        assert.equal(first.anchor.id, anchor.id)
        const stage = WORKFLOWS.findIndex((flow) => flow.toolIds.includes(anchor.id))
        assert.equal(first.steps[stage].tool.id, anchor.id)
        assert.deepEqual(generatePlan(SEED, [], anchor.id), first)
    }
})

test('explicit-anchor swaps keep the direction and the other four rows', () => {
    const anchorId = 'timing'
    const first = generatePlan(SEED, [], anchorId)
    for (let stage = 0; stage < WORKFLOWS.length; stage++) {
        const nextId = rerollStep(SEED, stage, first.steps[stage].tool.id, anchorId)
        const picks = WORKFLOWS.map((_, index) => (index === stage ? nextId : null))
        const next = generatePlan(SEED, picks, anchorId)
        assert.equal(next.anchor.id, anchorId)
        assert.notEqual(next.steps[stage].tool.id, first.steps[stage].tool.id)
        assert.deepEqual(
            next.steps.filter((_, index) => index !== stage),
            first.steps.filter((_, index) => index !== stage),
        )
    }
})

test('anchored markdown retains the reproducible anchor link', () => {
    const plan = generatePlan(SEED, [], 'timing')
    const shareHref = 'https://wayseeker.example/?plan=k4x9f2&anchor=timing'
    const markdown = planToMarkdown(plan, { lang: 'en', title: 'Timing plan', shareHref })
    assert.ok(markdown.includes(shareHref))
    assert.ok(markdown.includes('Timing'))
    const detailLinks = markdown.split('\n').filter((line) => line.startsWith(`${SITE_URL}/t/`))
    assert.equal(detailLinks.length, 5)
    for (const href of detailLinks) {
        const back = new URL(explorerReturnHref(new URL(href).search, 'timing'), SITE_URL)
        assert.equal(back.searchParams.get('anchor'), 'timing')
        assert.equal(back.searchParams.get('plan'), SEED)
        assert.equal(back.hash, '#prescription')
    }
})

test('a seed yields the same plan every time', () => {
    const first = generatePlan(SEED)
    const second = generatePlan(SEED)
    assert.deepEqual(
        first.steps.map((step) => [step.workflowId, step.tool.id, step.pinned]),
        second.steps.map((step) => [step.workflowId, step.tool.id, step.pinned]),
    )
    assert.equal(first.anchor.id, second.anchor.id)
})

test('every step stays on its own route', () => {
    const plan = generatePlan(SEED)
    assert.equal(plan.steps.length, WORKFLOWS.length)
    plan.steps.forEach((step, index) => {
        assert.equal(step.workflowId, WORKFLOWS[index].id)
        assert.ok(
            WORKFLOWS[index].toolIds.includes(step.tool.id),
            `${step.tool.id} does not belong to route ${step.workflowId}`,
        )
    })
})

test('the anchor bends every stage toward the best tag overlap available', () => {
    // Across a spread of seeds: the first candidate of each stage must realize
    // the best overlap any tool on that route has with the anchor. Stages with
    // no shared tags fall back to the seeded shuffle, which this assertion
    // still covers (best overlap is 0 there).
    for (const seed of ['000000', 'zzzzzz', 'k4x9f2', 'abcdef', 'q1w2e3']) {
        const anchor = planAnchor(seed)
        const anchorTags = new Set(anchor.tags)
        WORKFLOWS.forEach((flow, index) => {
            const candidates = stageCandidates(index, anchor, seed)
            const best = Math.max(
                ...flow.toolIds
                    .map((id) => TOOLS.find((tool) => tool.id === id))
                    .filter((tool): tool is Tool => Boolean(tool))
                    .map((tool) => tool.tags.filter((tag) => anchorTags.has(tag)).length),
            )
            assert.equal(candidates[0] && candidates[0].tags.filter((tag) => anchorTags.has(tag)).length, best)
        })
    }
})

test('a games anchor pulls the games tool forward where one exists', () => {
    // kenney is the catalogue's games-tagged anchor: the inspiration route has
    // exactly one games tool (neal.fun), so it must lead the candidates.
    const kenney = TOOLS.find((tool) => tool.id === 'kenney')
    assert.ok(kenney)
    const candidates = stageCandidates(0, kenney, SEED)
    assert.equal(candidates[0] && candidates[0].id, 'neal-fun')
})

test('pinned picks win over seed defaults; bogus pins fall back', () => {
    const plan = generatePlan(SEED, ['neal-fun', null, 'not-a-tool', null, 'kenney'])
    assert.equal(plan.steps[0] && plan.steps[0].tool.id, 'neal-fun')
    assert.equal(plan.steps[0] && plan.steps[0].pinned, true)
    // 'not-a-tool' is not on the motion route — the pin is dropped.
    assert.equal(plan.steps[2] && plan.steps[2].pinned, false)
    assert.equal(plan.steps[4] && plan.steps[4].tool.id, 'kenney')
    assert.ok(hasPicks(planPicks(plan)))
})

test('rerolling a step cycles its route deterministically', () => {
    const plan = generatePlan(SEED)
    const stage = 1
    const route = WORKFLOWS[stage]
    assert.ok(route)
    let current = plan.steps[stage] && plan.steps[stage].tool.id
    assert.ok(current)
    for (let i = 0; i < route.toolIds.length; i++) {
        const next = rerollStep(SEED, stage, current as string)
        assert.notEqual(next, current)
        assert.ok(route.toolIds.includes(next), `${next} left its route`)
        // Same input, same output.
        assert.equal(next, rerollStep(SEED, stage, current as string))
        current = next
    }
    // After a full cycle the sequence returns to where it started.
    assert.equal(current, plan.steps[stage] && plan.steps[stage].tool.id)
})

test('picks reproduce the plan they came from', () => {
    const plan = generatePlan(SEED)
    const rebuilt = generatePlan(SEED, planPicks(plan))
    assert.deepEqual(
        rebuilt.steps.map((step) => [step.tool.id, step.pinned]),
        plan.steps.map((step) => [step.tool.id, step.pinned]),
    )
})

test('the title key follows the anchor’s most specific tag', () => {
    const asAnchor = (tags: string[]) => ({ tags }) as unknown as Tool
    assert.equal(planTitleKey(asAnchor(['ui', 'motion'])), 'motion')
    assert.equal(planTitleKey(asAnchor(['ai', 'motion'])), 'motion')
    assert.equal(planTitleKey(asAnchor(['games'])), 'games')
    assert.equal(planTitleKey(asAnchor(['ai', 'ui'])), 'ai')
    assert.equal(planTitleKey(asAnchor(['design'])), 'design')
    assert.equal(planTitleKey(asAnchor(['design', 'games'])), 'games')
})

test('markdown carries every tool, its note, and both link kinds', () => {
    const plan = generatePlan(SEED)
    const markdown = planToMarkdown(plan, {
        lang: 'en',
        title: 'A test plan',
        shareHref: 'https://wayseeker.example/?plan=k4x9f2',
    })
    for (const step of plan.steps) {
        assert.ok(markdown.includes(step.tool.name.en), `missing ${step.tool.id}`)
        assert.ok(markdown.includes(`${SITE_URL}/t/${step.tool.id}`))
        if (step.tool.note) assert.ok(markdown.includes(step.tool.note.en.slice(0, 30)))
    }
    assert.ok(markdown.includes('# A test plan'))
    assert.ok(markdown.includes('https://wayseeker.example/?plan=k4x9f2'))
})

test('markdown localizes stage and tool names', () => {
    const plan = generatePlan(SEED)
    const zh = planToMarkdown(plan, { lang: 'zh', title: '测试方案', shareHref: 'https://wayseeker.example/' })
    const first = plan.steps[0]
    assert.ok(first)
    assert.ok(zh.includes(first.tool.name.zh))
})

test('picks serialization trims trailing defaults and parses back', () => {
    assert.equal(encodePlanPicks(['a', null, null, null, null]), 'a')
    assert.equal(encodePlanPicks([null, 'b']), '.b')
    assert.equal(encodePlanPicks([null, null, null, null, null]), '')
    assert.deepEqual([...parsePlanPicks('.b')], [null, 'b'])
    assert.deepEqual([...parsePlanPicks('a.b.')], ['a', 'b', null])
})
