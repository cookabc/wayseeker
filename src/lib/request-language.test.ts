import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readLanguagePreference, resolveRequestLanguage } from './request-language.ts'

test('a valid explicit cookie takes priority over browser language', () => {
    assert.equal(resolveRequestLanguage('en', 'zh-CN,zh;q=0.9'), 'en')
    assert.equal(resolveRequestLanguage('zh', 'en-US,en;q=0.9'), 'zh')
    assert.equal(resolveRequestLanguage(' ZH ', 'en'), 'zh')
})

test('only app-supported cookie values are treated as explicit preferences', () => {
    for (const value of [undefined, null, '', 'fr', 'english', 'zh-CN', '%7A%68', '<script>']) {
        assert.equal(readLanguagePreference(value), null)
        assert.equal(resolveRequestLanguage(value, 'zh-CN'), 'zh')
    }
})

test('regional language tags negotiate to the supported family', () => {
    for (const value of ['zh-CN', 'zh-Hant-TW', 'ZH-hans', 'fr-FR,zh-HK;q=0.8']) {
        assert.equal(resolveRequestLanguage(null, value), 'zh')
    }
    assert.equal(resolveRequestLanguage(null, 'en-US'), 'en')
})

test('quality values determine preference instead of header position', () => {
    assert.equal(resolveRequestLanguage(null, 'en;q=0.3,zh;q=0.9'), 'zh')
    assert.equal(resolveRequestLanguage(null, 'zh;q=0.2,en;q=0.8'), 'en')
    assert.equal(resolveRequestLanguage(null, 'fr;q=1,en;q=0.4,zh;q=0.7'), 'zh')
    assert.equal(resolveRequestLanguage(null, 'en;q=0.1,zh'), 'zh')
})

test('equal-quality supported languages preserve the browser order', () => {
    assert.equal(resolveRequestLanguage(null, 'zh;q=0.8,en;q=0.8'), 'zh')
    assert.equal(resolveRequestLanguage(null, 'en;q=0.8,zh;q=0.8'), 'en')
})

test('zero quality never selects the rejected language', () => {
    assert.equal(resolveRequestLanguage(null, 'zh;q=0,en;q=0.2'), 'en')
    assert.equal(resolveRequestLanguage(null, 'en;q=0.000,zh;q=0.001'), 'zh')
    assert.equal(resolveRequestLanguage(null, 'zh;q=0'), 'en')
})

test('malformed quality and invalid language tags do not override a valid option', () => {
    for (const quality of ['-1', '2', '1.1', '0.1234', '0.8oops', '', 'NaN']) {
        assert.equal(resolveRequestLanguage(null, 'zh;q=' + quality + ',en;q=0.1'), 'en')
    }
    assert.equal(resolveRequestLanguage(null, 'zho,zh<script>,zh_CN,en'), 'en')
    assert.equal(resolveRequestLanguage(null, 'en;Q=0.2,zh;q=0.9'), 'zh')
})

test('unsupported, wildcard-only and absent headers fall back to English', () => {
    for (const value of [undefined, null, '', '*', 'fr-FR,de;q=0.9', 'zh;q=0,en;q=0']) {
        assert.equal(resolveRequestLanguage(null, value), 'en')
    }
})
