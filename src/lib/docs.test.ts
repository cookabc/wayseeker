import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

/* 文档集只有设计/产品/约束三份，加各自的 README。验收过程记录不进仓库：
   它们描述的是某一次评审发现了什么，改完即为过期，读者会被旧结论误导。 */
test('docs holds only the living documents', () => {
    const files = readdirSync('docs').filter((name) => name.endsWith('.md'))
    assert.deepEqual(files, ['design-constraints.md'])
})

test('no process records are left behind', () => {
    for (const name of ['USABILITY_STUDY', 'UX_REVIEW', 'UX_ACCEPTANCE_CHECKLIST']) {
        const hit = readdirSync('docs').filter((file) => file.includes(name))
        assert.deepEqual(hit, [], `${name} 是过程记录，不进仓库`)
    }
})

test('every document referenced from the README exists', () => {
    for (const readme of ['README.md', 'README.zh-CN.md']) {
        const text = readFileSync(readme, 'utf8')
        for (const [, target] of text.matchAll(/\]\(([^)\s]+\.md)\)/g)) {
            assert.ok(existsSync(target), `${readme} 指向不存在的 ${target}`)
        }
    }
})

test('the constraints doc states the unverified boundaries instead of claiming them', () => {
    const text = readFileSync('docs/design-constraints.md', 'utf8')
    for (const boundary of ['VoiceOver', '输入法', 'WCAG', '未验证']) {
        assert.ok(text.includes(boundary), `约束文档要说清 ${boundary} 的边界`)
    }
    assert.doesNotMatch(text, /全部(?:体验)?已验证|整站(?:符合|通过)\s*WCAG\s*合规/)
})
