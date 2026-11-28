import assert from 'node:assert/strict'
import { test } from 'node:test'
import tools from '../data/tools.ts'
import { filterTools, getDomain, normalizeQuery } from './filter-tools.ts'

test('normalizeQuery collapses separators used in tags and queries', () => {
    assert.equal(normalizeQuery('AI Design'), 'aidesign')
    assert.equal(normalizeQuery('ai-design'), 'aidesign')
    assert.equal(normalizeQuery('ai_design'), 'aidesign')
})

test('getDomain strips protocol and www', () => {
    assert.equal(getDomain('https://www.example.com/path'), 'example.com')
    assert.equal(getDomain('https://namethatui.com/'), 'namethatui.com')
    assert.equal(getDomain('not-a-url'), 'not-a-url')
})

test('filterTools with an empty query returns the full list', () => {
    const result = filterTools(tools, '')
    assert.equal(result.length, tools.length)
    assert.deepEqual(
        result.map((t) => t.id),
        tools.map((t) => t.id),
    )
})

test('filterTools free-text matches a tag word of a real tool', () => {
    // Tag words are one of the query surfaces (full-text, not a tag filter):
    // a motion-tagged tool must be reachable by searching its tag word.
    const sample = tools.find((t) => t.tags.includes('motion')) ?? tools[0]
    const result = filterTools(tools, 'motion')
    assert.ok(result.some((t) => t.id === sample.id))
})

test('filterTools free-text matches English name of a real tool', () => {
    const sample = tools.find((t) => t.id === 'namethatui') ?? tools[0]
    const result = filterTools(tools, sample.name.en.slice(0, 6))
    assert.ok(result.some((t) => t.id === sample.id))
})

test('filterTools free-text matches domain from a real tool URL', () => {
    const sample = tools.find((t) => t.url.includes('namethatui')) ?? tools[0]
    const domain = getDomain(sample.url)
    const result = filterTools(tools, domain.split('.')[0])
    assert.ok(result.some((t) => t.id === sample.id))
})

test('filterTools free-text matches curator note content', () => {
    const withNote = tools.find((t) => t.note?.en.includes('When '))
    assert.ok(withNote)
    // Pick a distinctive mid-word from the note that is unlikely in every description.
    const token = 'Caveat'
    const result = filterTools(tools, token)
    assert.ok(result.length > 0)
    for (const tool of result) {
        const hay =
            `${tool.name.en} ${tool.name.zh} ${tool.description.en} ${tool.description.zh} ${tool.note?.en ?? ''} ${tool.note?.zh ?? ''} ${tool.tags.join(' ')} ${getDomain(tool.url)}`.toLowerCase()
        assert.ok(hay.includes(token.toLowerCase()), `${tool.id} should mention ${token}`)
    }
})

test('filterTools with impossible query returns empty array', () => {
    const result = filterTools(tools, 'zzz-not-a-real-tool-xyz-999')
    assert.equal(result.length, 0)
})
