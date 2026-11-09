import assert from 'node:assert/strict'
import { test } from 'node:test'
import { explorerReturnHref, sectionNavigationHref, toolDetailHref } from './exploration-context.ts'

test('home section links retain the live query through native fragment resolution', () => {
    const href =
        'https://example.test/?tool=timing&plan=k4x9f2&anchor=timing&p=..paper-shaders&q=motion&stage=2#prescription'
    const result = new URL(sectionNavigationHref('/', new URL(href).search, 'cabinet'), href)
    assert.equal(result.search, new URL(href).search)
    assert.equal(result.hash, '#cabinet')
})

test('detail section links preserve only safe exploration return context', () => {
    const search = `?${new URLSearchParams({ returnTo: '/?tool=timing&plan=k4x9f2&anchor=timing&p=..paper-shaders&q=motion&stage=2#counter' })}`
    const result = new URL(sectionNavigationHref('/t/paper-shaders', search, 'cabinet'), 'https://example.test')
    assert.equal(result.pathname, '/')
    assert.equal(result.searchParams.get('tool'), 'timing')
    assert.equal(result.searchParams.get('plan'), 'k4x9f2')
    assert.equal(result.searchParams.get('anchor'), 'timing')
    assert.equal(result.searchParams.get('p'), '..paper-shaders')
    assert.equal(result.searchParams.get('q'), 'motion')
    assert.equal(result.searchParams.get('stage'), '2')
    assert.equal(result.hash, '#cabinet')
    assert.equal(
        sectionNavigationHref('/t/timing', '?returnTo=https://evil.test/', 'prescription'),
        '/?tool=timing#prescription',
    )
    assert.equal(sectionNavigationHref('/privacy', search, 'cabinet'), '/#cabinet')
})

test('a detail visit returns to the exact selected plan, query and stage', () => {
    const href = toolDetailHref(
        'mobbin',
        {
            tool: 'timing',
            plan: 'k4x9f2',
            picks: '..paper-shaders',
            query: '动效 & motion',
            stage: 2,
            anchor: 'timing',
        },
        'prescription',
    )
    const result = new URL(
        explorerReturnHref(new URL(href, 'https://example.test').search, 'mobbin'),
        'https://example.test',
    )
    assert.equal(result.pathname, '/')
    assert.equal(result.searchParams.get('tool'), 'timing')
    assert.equal(result.searchParams.get('plan'), 'k4x9f2')
    assert.equal(result.searchParams.get('p'), '..paper-shaders')
    assert.equal(result.searchParams.get('q'), '动效 & motion')
    assert.equal(result.searchParams.get('stage'), '2')
    assert.equal(result.searchParams.get('anchor'), 'timing')
    assert.equal(result.hash, '#prescription')
})

test('return destinations reject external, protocol-relative and non-home paths', () => {
    for (const destination of [
        'https://evil.test/',
        '//evil.test/',
        '/\\evil.test/',
        '/privacy',
        'javascript:alert(1)',
    ]) {
        assert.equal(
            explorerReturnHref(`?${new URLSearchParams({ returnTo: destination })}`, 'mobbin'),
            '/?tool=mobbin#counter',
        )
    }
})

test('return destinations drop malformed state and unapproved query parameters', () => {
    const search = `?${new URLSearchParams({ returnTo: '/?tool=unknown&plan=invalid!&p=mobbin&q=motion&stage=99&redirect=evil#arbitrary' })}`
    assert.equal(explorerReturnHref(search, 'timing'), '/?tool=timing&q=motion#counter')
})
