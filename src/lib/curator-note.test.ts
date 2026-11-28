import assert from 'node:assert/strict'
import { test } from 'node:test'
import tools from '../data/tools.ts'
import { parseVerdict } from './curator-note.ts'

test('every curator note splits into its three moves', () => {
    for (const tool of tools) {
        const en = tool.note?.en
        const zh = tool.note?.zh
        assert.ok(en, `${tool.id} has no en note`)
        assert.ok(zh, `${tool.id} has no zh note`)

        const parsedEn = parseVerdict(en, 'en')
        assert.ok(parsedEn, `${tool.id} en note did not split into three moves`)

        const parsedZh = parseVerdict(zh, 'zh')
        assert.ok(parsedZh, `${tool.id} zh note did not split into three moves`)
    }
})

test('the three moves reassemble into the original note', () => {
    // Splitting must not lose or rewrite a single character.
    for (const tool of tools) {
        const en = tool.note?.en ?? ''
        const parsed = parseVerdict(en, 'en')
        assert.ok(parsed)
        const rejoined = `${parsed.when} ${parsed.replaces} ${parsed.caveat}`.replace(/\s+/g, ' ')
        assert.equal(rejoined, en.trim().replace(/\s+/g, ' '), `${tool.id} en note changed when split`)
    }
})

test('no character of a Chinese note is dropped by the split', () => {
    // The Chinese split works on sentence marks, so it has to be checked
    // separately: dropping a trailing 。 would silently change the note.
    for (const tool of tools) {
        const zh = tool.note?.zh ?? ''
        const parsed = parseVerdict(zh, 'zh')
        assert.ok(parsed)
        const stripped = (value: string) => value.replace(/[。\s]/g, '')
        assert.equal(
            stripped(`${parsed.when}${parsed.replaces}${parsed.caveat}`),
            stripped(zh),
            `${tool.id} zh note lost text when split`,
        )
    }
})

test('each move carries its own sentence', () => {
    for (const tool of tools) {
        const parsed = parseVerdict(tool.note?.en ?? '', 'en')
        assert.ok(parsed)
        // The "when" move opens with the situation.
        assert.match(parsed.when, /\bWhen\b/)
        // The "replaces" move names what it takes the place of.
        assert.match(parsed.replaces, /\bReplaces\b/)
        // The caveat is the last move.
        assert.match(parsed.caveat, /\bCaveat:/)
        // None of the three is empty.
        for (const move of [parsed.when, parsed.replaces, parsed.caveat]) {
            assert.ok(move.trim().length > 0)
        }
    }
})

test('the Chinese moves split on the Chinese markers', () => {
    for (const tool of tools) {
        const parsed = parseVerdict(tool.note?.zh ?? '', 'zh')
        assert.ok(parsed, `${tool.id} zh note did not split`)
        assert.match(parsed.when, /[当时]/)
        assert.match(parsed.replaces, /(?:能替代|替代)/)
        assert.match(parsed.caveat, /注意/)
    }
})

test('a note without the markers does not split (callers then show it whole)', () => {
    assert.equal(parseVerdict('A note with no structure at all.', 'en'), null)
})

test('a note whose markers are out of order is not split', () => {
    assert.equal(parseVerdict('Caveat: be careful. When you need it, use it. Replaces nothing.', 'en'), null)
})
