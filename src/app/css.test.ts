import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

/* globals.css 的类选择器必须有真实消费方（组件模板、状态类写入或 e2e 断言）。
   样式集中在同一个文件是既定约束（docs/design-constraints.md），死选择器在这里
   积累会让「改一处样式」重新变成「先考古哪些规则还活着」。用词边界匹配，
   防止 measure 被 measureText、insert 被 insert-links 这类子串误判为存活。 */

const CSS_PATH = 'src/app/globals.css'

function collectClassNames(css: string): string[] {
    const names = new Set<string>()
    for (const part of css.match(/[^{}]+\{/g) ?? []) {
        const selector = part.replace(/\{.*/, '')
        for (const match of selector.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
            names.add(match[1])
        }
    }
    return [...names]
}

function sourceCorpus(): string {
    const chunks: string[] = []
    const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name)
            if (entry.isDirectory()) walk(path)
            else if (/\.(tsx?|mjs|js)$/.test(entry.name)) chunks.push(readFileSync(path, 'utf8'))
        }
    }
    walk('src')
    walk('e2e')
    walk('scripts')
    return chunks.join('\n')
}

test('every class selector in globals.css has a consumer in the codebase', () => {
    const css = readFileSync(CSS_PATH, 'utf8')
    const corpus = sourceCorpus()
    const orphans = collectClassNames(css).filter((name) => {
        const used = new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(corpus)
        return !used
    })
    assert.deepEqual(orphans, [], `globals.css 中的类选择器没有任何消费方（孤儿样式）：${orphans.join(', ')}`)
})
