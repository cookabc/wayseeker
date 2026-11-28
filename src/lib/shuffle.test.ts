import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSeed, randomSeed, seededShuffle, seedToNumber } from './shuffle.ts'

test('seededShuffle is deterministic for the same seed', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const first = seededShuffle(input, 12345)
    const second = seededShuffle(input, 12345)
    assert.deepEqual(first, second)
    assert.deepEqual([...first].sort(), [...input].sort(), 'must preserve the same elements')
})

test('seededShuffle returns a new array (does not mutate the input)', () => {
    const input = [1, 2, 3, 4, 5]
    const snapshot = input.slice()
    const result = seededShuffle(input, 42)
    assert.notEqual(result, input, 'should be a new array reference')
    assert.deepEqual(input, snapshot, 'input must not be mutated')
})

test('seededShuffle handles empty and single-element arrays', () => {
    assert.deepEqual(seededShuffle([], 1), [])
    assert.deepEqual(seededShuffle([42], 1), [42])
})

test('seededShuffle differs across seeds for a larger input', () => {
    const input = Array.from({ length: 30 }, (_, i) => i)
    const a = seededShuffle(input, 1)
    const b = seededShuffle(input, 2)
    assert.notDeepEqual(a, b)
})

test('randomSeed round-trips through parseSeed and seedToNumber', () => {
    const seed = randomSeed()
    const parsed = parseSeed(seed)
    assert.ok(parsed !== null)
    assert.equal(seedToNumber(seed), parsed)
})

test('parseSeed rejects invalid values', () => {
    assert.equal(parseSeed(null), null)
    assert.equal(parseSeed(''), null)
    assert.equal(parseSeed('not a seed!'), null)
    assert.equal(parseSeed('waytoolongseedvalue'), null)
})
