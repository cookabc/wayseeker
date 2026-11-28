import assert from 'node:assert/strict'
import { test } from 'node:test'
import tools, { getToolPath } from '../data/tools.ts'
import { SITE_NAME, SITE_URL } from '../lib/site.ts'
import { buildLlmsTxt, buildToolsJson, resolveMarkdownForPath, wantsMarkdown } from './markdown.ts'

test('wantsMarkdown only accepts an explicit text/markdown token', () => {
    assert.equal(wantsMarkdown('text/markdown'), true)
    assert.equal(wantsMarkdown('text/markdown; charset=utf-8'), true)
    assert.equal(wantsMarkdown('text/html, application/xhtml+xml, text/markdown;q=0.9'), true)
    assert.equal(wantsMarkdown('Text/Markdown'), true)

    assert.equal(wantsMarkdown(null), false)
    assert.equal(wantsMarkdown(''), false)
    assert.equal(wantsMarkdown('text/html'), false)
    assert.equal(wantsMarkdown('*/*'), false)
    assert.equal(wantsMarkdown('text/*'), false)
    assert.equal(wantsMarkdown('application/xhtml+xml, text/html;q=0.9'), false)
    // An explicit q=0 refuses markdown even though the token is present.
    assert.equal(wantsMarkdown('text/markdown;q=0'), false)
    assert.equal(wantsMarkdown('text/markdown;q=0.0, text/html'), false)
    // Lookalike types must not match.
    assert.equal(wantsMarkdown('text/x-markdown'), false)
    assert.equal(wantsMarkdown('application/markdown'), false)
})

test('home markdown describes the site and lists every tool', () => {
    const { status, body } = resolveMarkdownForPath('/')
    assert.equal(status, 200)
    assert.ok(body.startsWith(`# ${SITE_NAME}`), 'home markdown opens with the site name as H1')
    assert.ok(body.includes(`${SITE_URL}/llms.txt`))
    assert.ok(body.includes(`${SITE_URL}/sitemap.xml`))
    assert.ok(body.includes(`${SITE_URL}/tools.json`))
    assert.ok(body.includes('Accept: text/markdown'))
    for (const tool of tools) {
        assert.ok(body.includes(`${SITE_URL}${getToolPath(tool.id)}`), `home markdown links to tool "${tool.id}"`)
    }
})

test('tool markdown covers name, urls, tags, and the curator note', () => {
    const tool = tools[0]
    const { status, body } = resolveMarkdownForPath(`/t/${tool.id}`)
    assert.equal(status, 200)
    assert.ok(body.startsWith(`# ${tool.name.en}`))
    assert.ok(body.includes(tool.url), 'tool markdown links to the tool site')
    assert.ok(body.includes(`${SITE_URL}/t/${tool.id}`))
    assert.ok(body.includes(tool.note!.en), 'tool markdown includes the en curator note')
    assert.ok(body.includes(tool.note!.zh), 'tool markdown includes the zh curator note')
    for (const tag of tool.tags) {
        assert.ok(body.includes(tag), `tool markdown lists tag "${tag}"`)
    }
    if (tool.githubUrl) {
        assert.ok(body.includes(tool.githubUrl))
    }
})

test('privacy and terms resolve to their markdown copy', () => {
    const privacy = resolveMarkdownForPath('/privacy')
    assert.equal(privacy.status, 200)
    assert.ok(privacy.body.startsWith('# Privacy Policy'))
    assert.ok(privacy.body.includes('localStorage'))

    const terms = resolveMarkdownForPath('/terms')
    assert.equal(terms.status, 200)
    assert.ok(terms.body.startsWith('# Terms of Service'))
    assert.ok(terms.body.includes('curated directory'))
})

test('unknown paths return a 404 markdown body with recovery links', () => {
    for (const path of ['/some-path-that-does-not-exist', '/t/does-not-exist', '/t', '/PRIVACY']) {
        const { status, body } = resolveMarkdownForPath(path)
        assert.equal(status, 404, `${path} should resolve to a 404`)
        assert.ok(body.startsWith('# 404'), `${path} markdown should be headed as a 404`)
        assert.ok(body.includes(`${SITE_URL}/llms.txt`), '404 body links to llms.txt')
        assert.ok(body.includes(`${SITE_URL}/sitemap.xml`), '404 body links to the sitemap')
        assert.ok(body.includes(`${SITE_URL}/tools.json`), '404 body links to the JSON catalog')
    }
})

test('path lookup ignores query strings and hash fragments', () => {
    assert.equal(resolveMarkdownForPath('/?ref=agent').status, 200)
    assert.equal(resolveMarkdownForPath(`/t/${tools[0].id}?utm_source=x#top`).status, 200)
    assert.equal(resolveMarkdownForPath('').status, 200, 'empty path falls back to home')
})

test('llms.txt follows the llmstxt.org structure', () => {
    const llms = buildLlmsTxt()
    const lines = llms.split('\n')
    assert.equal(lines[0], `# ${SITE_NAME}`, 'llms.txt must open with an H1')
    assert.ok(lines[2].startsWith('> '), 'llms.txt needs a blockquote summary')
    assert.ok(llms.includes('## Machine-readable'))
    assert.ok(llms.includes('## Tools'))
    assert.ok(llms.includes('## Site'))
    assert.ok(llms.includes(`${SITE_URL}/tools.json`))
    assert.ok(llms.includes(`${SITE_URL}/sitemap.xml`))
    for (const tool of tools) {
        assert.ok(
            llms.includes(`- [${tool.name.en}](${SITE_URL}${getToolPath(tool.id)})`),
            `llms.txt links to tool "${tool.id}"`,
        )
    }
})

test('tools.json is a parseable catalog covering every tool', () => {
    const catalog = JSON.parse(buildToolsJson())
    assert.equal(catalog.name, SITE_NAME)
    assert.equal(catalog.url, SITE_URL)
    assert.equal(catalog.count, tools.length)
    assert.equal(catalog.tools.length, tools.length)
    for (const entry of catalog.tools) {
        assert.ok(entry.id && entry.url && entry.page, 'each entry has id, url, and page')
        assert.ok(entry.page.startsWith(`${SITE_URL}/t/`), 'page links stay on the canonical domain')
        assert.ok(entry.name.en && entry.name.zh, 'names stay bilingual')
        assert.ok(entry.note.en && entry.note.zh, 'curator notes stay bilingual')
        assert.ok(Array.isArray(entry.tags) && entry.tags.length > 0)
    }
})

test('tools.json entry keys are a locked public contract', () => {
    // tools.json 是对外契约：键集合的增删是破坏性变更，必须显式评审而非顺手漂移。
    const catalog = JSON.parse(buildToolsJson())
    assert.deepEqual(Object.keys(catalog).sort(), ['count', 'description', 'languages', 'name', 'tools', 'url'])
    for (const entry of catalog.tools) {
        assert.deepEqual(Object.keys(entry).sort(), [
            'description',
            'featured',
            'githubUrl',
            'id',
            'name',
            'note',
            'page',
            'tags',
            'type',
            'url',
        ])
        assert.equal(entry.type, 'link', '目录中每个条目都是链接型收录（导出处成形的常量）')
    }
})
