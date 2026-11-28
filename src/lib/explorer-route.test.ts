import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readExplorerRoute, writeExplorerRoute } from './explorer-route.ts'

test('only a known anchor attached to a valid prescription is honored', () => {
    assert.equal(readExplorerRoute('?plan=k4x9f2&anchor=timing', ['timing']).anchor, 'timing')
    for (const search of ['?anchor=timing', '?plan=invalid!&anchor=timing', '?plan=k4x9f2&anchor=unknown']) {
        assert.equal(readExplorerRoute(search, ['timing']).anchor ?? null, null)
    }
    const url = writeExplorerRoute('https://wayseeker.example/?anchor=old', {
        tool: 'timing',
        plan: 'k4x9f2',
        picks: null,
        anchor: 'timing',
        query: null,
        stage: null,
    })
    assert.equal(readExplorerRoute(url.search, ['timing']).anchor, 'timing')
    const cleared = writeExplorerRoute(url.href, {
        tool: 'timing',
        plan: null,
        picks: null,
        anchor: 'timing',
        query: null,
        stage: null,
    })
    assert.equal(cleared.searchParams.has('anchor'), false)
})

test('sharing restores the current tool and keeps unrelated parameters', () => {
    const url = writeExplorerRoute('https://wayseeker.example/?lang=zh#notes', {
        tool: 'motion',
        plan: null,
        picks: null,
        query: null,
        stage: null,
    })
    assert.deepEqual(readExplorerRoute(url.search, ['motion', 'design']), {
        tool: 'motion',
        plan: null,
        picks: null,
        query: null,
        stage: null,
    })
    assert.equal(url.searchParams.get('lang'), 'zh')
    assert.equal(url.hash, '#notes')
})

test('unknown tools cannot select an arbitrary scene and legacy seed params are cleaned', () => {
    assert.deepEqual(readExplorerRoute('?tool=missing', ['motion']), {
        tool: null,
        plan: null,
        picks: null,
        query: null,
        stage: null,
    })
    assert.deepEqual(readExplorerRoute('?tool=motion', ['motion']), {
        tool: 'motion',
        plan: null,
        picks: null,
        query: null,
        stage: null,
    })
    // seed was the pre-plan shuffle parameter; old shared links must not keep
    // feeding it back into fresh URLs written by the explorer.
    assert.equal(
        writeExplorerRoute('https://wayseeker.example/?seed=abc&tool=motion', {
            tool: null,
            plan: null,
            picks: null,
            query: null,
            stage: null,
        }).search,
        '',
    )
})

test('a plan seed and its picks ride the same link and survive round-trips', () => {
    const url = writeExplorerRoute('https://wayseeker.example/', {
        tool: null,
        plan: 'k4x9f2',
        picks: 'kenney..paper-shaders.',
        query: null,
        stage: null,
    })
    assert.deepEqual(readExplorerRoute(url.search, ['kenney', 'paper-shaders']), {
        tool: null,
        plan: 'k4x9f2',
        picks: 'kenney..paper-shaders.',
        query: null,
        stage: null,
    })
})

test('malformed plan state is dropped, not trusted', () => {
    // Bad seed alphabet, over-long picks, too many segments, and stray capitals.
    assert.equal(readExplorerRoute('?plan=%3Cscript%3E', []).plan, null)
    assert.equal(readExplorerRoute('?plan=abc123&p=x'.replace('x', 'a'.repeat(200)), []).picks, null)
    assert.equal(readExplorerRoute('?plan=abc123&p=a.b.c.d.e.f.g', []).picks, null)
    assert.equal(readExplorerRoute('?plan=abc123&p=Kenney', []).picks, null)
    assert.equal(readExplorerRoute('?p=kenney', []).plan, null, 'picks without a plan seed are meaningless')
})

test('search text is bounded and stage is validated against the real route count', () => {
    const longQuery = 'a'.repeat(250)
    assert.equal(readExplorerRoute(`?q=${longQuery}`, []).query, 'a'.repeat(200))
    assert.equal(readExplorerRoute('?stage=4', []).stage, 4)
    assert.equal(readExplorerRoute('?stage=0', []).stage, 0)
    // Out of range, multi-digit, or garbage all mean "no stage".
    for (const stage of ['5', '9', '00', '-1', 'abc', '%3Cscript%3E']) {
        assert.equal(readExplorerRoute(`?stage=${stage}`, []).stage, null, `stage=${stage} must be rejected`)
    }
})

test('query and stage ride the same link and are cleared when null', () => {
    const url = writeExplorerRoute('https://wayseeker.example/', {
        tool: 'timing',
        plan: null,
        picks: null,
        query: 'motion',
        stage: 2,
    })
    assert.deepEqual(readExplorerRoute(url.search, ['timing']), {
        tool: 'timing',
        plan: null,
        picks: null,
        query: 'motion',
        stage: 2,
    })
    const cleared = writeExplorerRoute(url.href, {
        tool: 'timing',
        plan: null,
        picks: null,
        query: null,
        stage: null,
    })
    assert.equal(cleared.searchParams.has('q'), false)
    assert.equal(cleared.searchParams.has('stage'), false)
    assert.equal(cleared.searchParams.get('tool'), 'timing')
})
