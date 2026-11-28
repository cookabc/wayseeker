/**
 * mulberry32 — tiny deterministic PRNG so a generated plan is reproducible
 * from the seed carried in the URL (?plan=...). Plan seeds share the same
 * lowercase base-36 alphabet as the explorer seed format they replaced.
 */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** Deterministic Fisher–Yates driven by a numeric seed. */
export function seededShuffle<T>(array: readonly T[], seed: number): T[] {
    const rand = mulberry32(seed)
    const result = array.slice()
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

const SEED_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

/** Random seed encoded as a short lowercase base-36 string (e.g. "k4x9f2"). */
export function randomSeed(): string {
    return Math.floor(Math.random() * 36 ** 6)
        .toString(36)
        .padStart(6, '0')
}

/** Parse a URL seed string; returns null when the value is not a valid seed. */
export function parseSeed(value: string | null): number | null {
    if (!value || value.length > 12) return null
    const lowered = value.toLowerCase()
    if (!lowered.split('').every((ch) => SEED_ALPHABET.includes(ch))) return null
    const parsed = Number.parseInt(lowered, 36)
    return Number.isSafeInteger(parsed) ? parsed : null
}

/** URL seed string → numeric seed for seededShuffle (assumes parseSeed passed). */
export function seedToNumber(seed: string): number {
    return Number.parseInt(seed.toLowerCase(), 36)
}
