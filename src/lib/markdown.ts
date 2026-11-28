import tools, { getRelatedTools, getToolById, getToolPath, type Tool } from '../data/tools.ts'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './site.ts'

/** Contact address published on the privacy and terms pages. */
const CONTACT_EMAIL = 'chuangcius@gmail.com'

/** Request header that carries the original page path through the proxy rewrite. */
export const MARKDOWN_PATH_HEADER = 'x-markdown-path'

export interface MarkdownResolution {
    status: number
    body: string
}

/**
 * True only when the client explicitly asks for `text/markdown` with a non-zero
 * q value. Wildcard accepts never trigger markdown — browsers send those and
 * must keep getting HTML.
 */
export function wantsMarkdown(acceptHeader: string | null | undefined): boolean {
    if (!acceptHeader) return false
    for (const part of acceptHeader.split(',')) {
        const [type, ...params] = part.trim().split(';')
        if (type.trim().toLowerCase() !== 'text/markdown') continue
        const qParam = params.map((p) => p.trim().toLowerCase()).find((p) => p.startsWith('q='))
        if (qParam) {
            const q = Number.parseFloat(qParam.slice(2))
            if (Number.isNaN(q) || q <= 0) continue
        }
        return true
    }
    return false
}

/** Normalize a raw request path for lookup: strip query/hash, keep a single leading slash. */
function normalizePath(rawPath: string): string {
    const withoutQuery = rawPath.split('?')[0].split('#')[0]
    if (!withoutQuery) return '/'
    return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
}

function toolLine(tool: Tool): string {
    return `- [${tool.name.en}](${SITE_URL}${getToolPath(tool.id)}) — ${tool.description.en}`
}

function buildHomeMarkdown(): string {
    const featured = tools.filter((tool) => tool.featured)
    return [
        `# ${SITE_NAME}`,
        '',
        `> ${SITE_DESCRIPTION}`,
        '',
        `Bilingual (English/中文) curated directory of ${tools.length} tools. Every entry carries a curator note: when to use it, what it replaces, and what to watch out for.`,
        '',
        '## Machine-readable resources',
        '',
        `- llms.txt: ${SITE_URL}/llms.txt`,
        `- Sitemap: ${SITE_URL}/sitemap.xml`,
        `- Tools catalog (JSON): ${SITE_URL}/tools.json`,
        `- Markdown: any page on this site answers with Markdown when requested with the header \`Accept: text/markdown\`, or via \`${SITE_URL}/api/markdown?path=/t/example\``,
        '',
        '## Featured tools',
        '',
        ...featured.map(toolLine),
        '',
        '## All tools',
        '',
        ...tools.map(toolLine),
        '',
        `Legal: [Privacy Policy](${SITE_URL}/privacy), [Terms of Service](${SITE_URL}/terms)`,
        '',
    ].join('\n')
}

function buildToolMarkdown(tool: Tool): string {
    const lines = [
        `# ${tool.name.en}${tool.name.zh !== tool.name.en ? ` ${tool.name.zh}` : ''}`,
        '',
        `> ${tool.description.en}${tool.description.zh !== tool.description.en ? ` / ${tool.description.zh}` : ''}`,
        '',
        `- Site: ${tool.url}`,
    ]
    if (tool.githubUrl) lines.push(`- GitHub: ${tool.githubUrl}`)
    lines.push(`- Tags: ${tool.tags.join(', ')}`, `- Detail page: ${SITE_URL}${getToolPath(tool.id)}`)
    if (tool.note) {
        lines.push('', '## Curator note', '', tool.note.en, '', tool.note.zh)
    }
    const related = getRelatedTools(tool, 3)
    if (related.length > 0) {
        lines.push('', '## Related tools', '', ...related.map(toolLine))
    }
    lines.push('', `_Listed on [${SITE_NAME}](${SITE_URL}) — ${SITE_URL}/llms.txt_`, '')
    return lines.join('\n')
}

function buildLegalMarkdown(page: 'privacy' | 'terms'): string {
    if (page === 'privacy') {
        return [
            '# Privacy Policy',
            '',
            'Last updated — July 17, 2026',
            '',
            `${SITE_NAME} does not collect personal data, run analytics, or serve advertising cookies. The site only stores preferences on your device so the experience stays familiar between visits.`,
            '',
            'Specifically, we may use:',
            '',
            '- **localStorage** for theme preference (`wayseeker-theme`)',
            '- **cookie** for language preference (i18next)',
            '',
            "When you open a tool link, you leave this site and visit the tool provider's website. We are not responsible for the privacy practices of external sites.",
            '',
            `If this policy changes, we will update the date above. Questions: ${CONTACT_EMAIL}.`,
            '',
            `Canonical page: ${SITE_URL}/privacy`,
            '',
        ].join('\n')
    }
    return [
        '# Terms of Service',
        '',
        'Last updated — July 17, 2026',
        '',
        `${SITE_NAME} is a curated directory of third-party tools and resources. Links are provided for convenience and informational purposes only.`,
        '',
        "We do not endorse, operate, or control the external tools listed. Use them at your own risk and review each provider's terms of service and privacy policy. Tool availability, pricing, and features may change or break without notice.",
        '',
        `The content on this site is provided "as is" without warranties of any kind. We may update, reorder, or remove listings at any time. Site branding, copy, and presentation remain the property of ${SITE_NAME}; third-party product names and trademarks belong to their respective owners.`,
        '',
        `Questions: ${CONTACT_EMAIL}.`,
        '',
        `Canonical page: ${SITE_URL}/terms`,
        '',
    ].join('\n')
}

/** Markdown body for unknown paths: gives agents the recovery links instead of an app shell. */
function buildNotFoundMarkdown(path: string): string {
    return [
        `# 404 — Page not found`,
        '',
        `\`${path}\` does not exist on ${SITE_NAME}.`,
        '',
        'Where to look next:',
        '',
        `- Home: ${SITE_URL}/`,
        `- llms.txt (agent guide to this site): ${SITE_URL}/llms.txt`,
        `- Sitemap (every indexable page): ${SITE_URL}/sitemap.xml`,
        `- Tools catalog (JSON): ${SITE_URL}/tools.json`,
        '',
    ].join('\n')
}

/**
 * Resolve a request path to the markdown representation of that page, mirroring
 * the real router: known pages return 200, everything else returns a 404 with a
 * markdown body pointing at recovery resources.
 */
export function resolveMarkdownForPath(rawPath: string): MarkdownResolution {
    const path = normalizePath(rawPath)
    if (path === '/') return { status: 200, body: buildHomeMarkdown() }
    if (path === '/privacy') return { status: 200, body: buildLegalMarkdown('privacy') }
    if (path === '/terms') return { status: 200, body: buildLegalMarkdown('terms') }
    const toolMatch = path.match(/^\/t\/([^/]+)$/)
    if (toolMatch) {
        const tool = getToolById(decodeURIComponent(toolMatch[1]))
        if (tool) return { status: 200, body: buildToolMarkdown(tool) }
    }
    return { status: 404, body: buildNotFoundMarkdown(path) }
}

/** llms.txt per llmstxt.org: H1, blockquote summary, then H2 sections of link lists. */
export function buildLlmsTxt(): string {
    return [
        `# ${SITE_NAME}`,
        '',
        `> ${SITE_DESCRIPTION} Bilingual (English/中文).`,
        '',
        `${SITE_NAME} is a human-curated directory of ${tools.length} tools for design, code, and creative work. Each tool has a detail page at /t/{id} with a curator note covering when to use it, what it replaces, and caveats. Every page serves Markdown when requested with \`Accept: text/markdown\`; markdown for any path is also available at /api/markdown?path={path}.`,
        '',
        '## Machine-readable',
        '',
        `- [Tools catalog (JSON)](${SITE_URL}/tools.json): full structured list of every tool with bilingual names, descriptions, curator notes, and tags`,
        `- [Sitemap](${SITE_URL}/sitemap.xml): every indexable page`,
        `- [robots.txt](${SITE_URL}/robots.txt): crawling rules`,
        '',
        '## Tools',
        '',
        ...tools.map((tool) => `- [${tool.name.en}](${SITE_URL}${getToolPath(tool.id)}): ${tool.description.en}`),
        '',
        '## Site',
        '',
        `- [Home](${SITE_URL}/): the full tool wall with search`,
        `- [Privacy Policy](${SITE_URL}/privacy)`,
        `- [Terms of Service](${SITE_URL}/terms)`,
        '',
    ].join('\n')
}

/** Machine-readable catalog of the whole directory. */
export function buildToolsJson(): string {
    const catalog = {
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        languages: ['en', 'zh'],
        count: tools.length,
        tools: tools.map((tool) => ({
            id: tool.id,
            // tools.json 的公共契约字段：目录中每个条目都是链接型收录，
            // 内部 Tool 数据模型已不携带该恒定值，仅在导出处成形。
            type: 'link',
            name: tool.name,
            description: tool.description,
            note: tool.note ?? null,
            tags: tool.tags,
            url: tool.url,
            githubUrl: tool.githubUrl ?? null,
            featured: tool.featured ?? false,
            page: `${SITE_URL}${getToolPath(tool.id)}`,
        })),
    }
    return JSON.stringify(catalog, null, 2)
}
