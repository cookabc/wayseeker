/**
 * Splitting a curator note into its three moves.
 *
 * Every note in the catalogue follows the same shape, and the data test
 * enforces it: a note says **when** the tool is the right one, **what it
 * replaces**, and what the **caveat** is. That is the whole editorial voice
 * of the site, and it is currently rendered as one grey paragraph — a reader
 * has to parse three separate claims out of a block of prose.
 *
 * This module pulls the three moves apart so the interface can show them as
 * three labelled lines. The note's exact wording is never changed: the
 * segments are the original sentences, only separated.
 *
 * The two languages mark the moves differently.
 *
 *  - English opens each move with a word: "When …", "Replaces …", "Caveat:".
 *    Splitting on those words is reliable, including when a sentence contains
 *    a full stop inside quotation marks.
 *  - Chinese has no such opening word for the first move — 时 appears in the
 *    middle of the sentence ("……的空提示时，我从这里起手"). The moves are
 *    separated by the sentence mark, and the second and third are found by
 *    the words they contain (替代 and 注意).
 *
 * The parser is deliberately forgiving. A note that does not split cleanly
 * falls back to showing the whole text as one line, so a future note with a
 * different shape still renders something honest rather than dropping text.
 */

/** The three moves a curator note makes. */
export interface Verdict {
    /** The situation where this tool is the right one. */
    when: string
    /** What it takes the place of. */
    replaces: string
    /** The thing to watch out for. */
    caveat: string
}

export type Language = 'en' | 'zh'

/** Split an English note on the three marker words. */
function splitEnglish(note: string): Verdict | null {
    const replacesAt = note.indexOf('Replaces')
    const caveatAt = note.indexOf('Caveat:')
    // The markers have to exist and be in order.
    if (replacesAt < 0 || caveatAt < 0 || caveatAt <= replacesAt) return null

    const when = note.slice(0, replacesAt).trim()
    const replaces = note.slice(replacesAt, caveatAt).trim()
    const caveat = note.slice(caveatAt).trim()
    if (!when || !replaces || !caveat) return null
    return { when, replaces, caveat }
}

/**
 * Split a Chinese note on the sentence mark, then find the second and third
 * moves by the words they carry.
 */
function splitChinese(note: string): Verdict | null {
    const sentences = note
        .split('。')
        .map((part) => part.trim())
        .filter(Boolean)
    if (sentences.length < 3) return null

    const replacesAt = sentences.findIndex((part) => part.includes('替代'))
    const caveatAt = sentences.findIndex((part) => part.includes('注意'))
    if (replacesAt < 0 || caveatAt < 0 || caveatAt <= replacesAt) return null
    // The "replaces" move is one sentence; the caveat is the rest.
    if (replacesAt !== caveatAt - 1) return null

    const when = sentences.slice(0, replacesAt).join('。')
    const replaces = sentences[replacesAt]
    const caveat = sentences.slice(caveatAt).join('。')
    if (!when || !replaces || !caveat) return null
    return { when, replaces, caveat }
}

/**
 * Split a note into its three moves.
 *
 * Returns null when the note does not carry all three markers — the caller
 * then shows the note whole, which is always honest.
 */
export function parseVerdict(note: string, language: Language): Verdict | null {
    return language === 'zh' ? splitChinese(note) : splitEnglish(note)
}
