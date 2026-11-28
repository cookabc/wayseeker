import { formatTag, type Tool } from '../data/tools.ts'

/** Normalize free-text search so hyphens/spaces do not block matches. */
export function normalizeQuery(value: string): string {
    return value.toLowerCase().replace(/[-\s_./]+/g, '')
}

/** Hostname without www for domain matching in search. */
export function getDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return url
    }
}

/**
 * Filter the curated tool list by free-text query.
 * Matches name, description, curator note, tags, and domain (real shipped path).
 */
export function filterTools(list: Tool[], searchQuery: string): Tool[] {
    let result = list

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const qNorm = normalizeQuery(q)
        result = result.filter((tool) => {
            const nameMatch = tool.name.en.toLowerCase().includes(q) || tool.name.zh.toLowerCase().includes(q)
            const descMatch =
                tool.description.en.toLowerCase().includes(q) || tool.description.zh.toLowerCase().includes(q)
            const noteMatch =
                (tool.note?.en.toLowerCase().includes(q) ?? false) || (tool.note?.zh.toLowerCase().includes(q) ?? false)
            const tagMatch = tool.tags.some(
                (tag) =>
                    tag.includes(q) ||
                    normalizeQuery(tag).includes(qNorm) ||
                    formatTag(tag).toLowerCase().includes(q) ||
                    normalizeQuery(formatTag(tag)).includes(qNorm),
            )
            const domainMatch = getDomain(tool.url).toLowerCase().includes(q)
            return nameMatch || descMatch || noteMatch || tagMatch || domainMatch
        })
    }

    return result
}
