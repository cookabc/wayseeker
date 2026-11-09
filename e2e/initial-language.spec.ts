import { expect, test } from '@playwright/test'
import en from '../public/locales/en/common.json' with { type: 'json' }
import zh from '../public/locales/zh/common.json' with { type: 'json' }

declare global {
    interface Window {
        __initialLanguageHeadings: string[]
    }
}

test.use({ reducedMotion: 'reduce' })

function expectServerLanguage(html: string, language: 'en' | 'zh') {
    expect(html).toMatch(new RegExp('<html[^>]*lang="' + language + '"'))
    const heading = html.match(/<h1\b[^>]*id="hero-title"[\s\S]*?<\/h1>/)?.[0] ?? ''
    expect(heading).toContain('aria-label="' + (language === 'zh' ? zh.hero.title : en.hero.title) + '"')
}

test('request headers render Chinese in actual server HTML before JavaScript', async ({ request }) => {
    const response = await request.get('/', { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.2' } })
    expect(response.ok()).toBe(true)
    expectServerLanguage(await response.text(), 'zh')
})

test('Chinese homepage and legal text are readable with JavaScript disabled', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
        baseURL,
        javaScriptEnabled: false,
        locale: 'zh-Hant',
        extraHTTPHeaders: { 'Accept-Language': 'zh-Hant,zh;q=0.9,en;q=0.1' },
    })
    try {
        const page = await context.newPage()
        await page.goto('/')
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
        await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', zh.hero.title)
        await expect(page.locator('#drawer-search')).toHaveAttribute('placeholder', zh.cabinet.searchPlaceholder)
        await page.goto('/privacy')
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('隐私政策')
        await expect(page.locator('.prose')).toContainText('不收集个人数据')
    } finally {
        await context.close()
    }
})

test('explicit cookie beats both a conflicting browser header and legacy storage', async ({ page, context, request, baseURL }) => {
    const response = await request.get('/', {
        headers: { Cookie: 'i18next=en', 'Accept-Language': 'zh-CN,zh;q=0.9' },
    })
    expectServerLanguage(await response.text(), 'en')
    await context.addCookies([{ name: 'i18next', value: 'zh', url: baseURL ?? 'http://127.0.0.1:4381' }])
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'))
    await page.goto('/')
    await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', zh.hero.title)
    await expect(page.getByRole('button', { name: '切换到英文', exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('i18nextLng'))).toBe('zh')
})

test('concurrent English and Chinese responses do not share language state', async ({ request }) => {
    await Promise.all(Array.from({ length: 12 }, async (_, index) => {
        const language = index % 2 ? 'zh' : 'en'
        const response = await request.get('/', {
            headers: { Cookie: 'i18next=' + language, 'Accept-Language': language === 'en' ? 'zh-CN' : 'en-US' },
        })
        expect(response.ok()).toBe(true)
        expectServerLanguage(await response.text(), language)
    }))
})

test('switching writes a server-readable preference and refresh never renders the opposite heading', async ({ page, context }) => {
    await page.addInitScript(() => {
        window.__initialLanguageHeadings = []
        const observer = new MutationObserver(() => {
            const title = document.getElementById('hero-title')?.getAttribute('aria-label')
            if (title && window.__initialLanguageHeadings.at(-1) !== title) window.__initialLanguageHeadings.push(title)
        })
        observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-label'] })
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
    expect((await context.cookies()).find((cookie) => cookie.name === 'i18next')?.value).toBe('zh')
    const response = await page.reload()
    expectServerLanguage(await response!.text(), 'zh')
    await expect(page.getByRole('button', { name: '切换到英文', exact: true })).toBeVisible()
    expect(await page.evaluate(() => window.__initialLanguageHeadings)).toEqual([zh.hero.title])
    await page.getByRole('button', { name: '切换到英文', exact: true }).click()
    await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', en.hero.title)
    expect((await context.cookies()).find((cookie) => cookie.name === 'i18next')?.value).toBe('en')
})

test('legacy localStorage-only Chinese preference migrates once and reaches the next server render', async ({ page, context }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'zh-CN'))
    const firstResponse = await page.goto('/')
    // The server cannot read localStorage. This old-client migration can still
    // change language once; the cookie makes subsequent full loads consistent.
    expectServerLanguage(await firstResponse!.text(), 'en')
    await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', zh.hero.title)
    expect((await context.cookies()).find((cookie) => cookie.name === 'i18next')?.value).toBe('zh')
    const reloaded = await page.reload()
    expectServerLanguage(await reloaded!.text(), 'zh')
})

test('language switching remains usable when cookies and localStorage are unavailable', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(document, 'cookie', { configurable: true, get() { throw new Error('Blocked cookie') }, set() { throw new Error('Blocked cookie') } })
        Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Blocked storage') } })
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
    await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', zh.hero.title)
    await page.getByRole('button', { name: '切换到英文', exact: true }).click()
    await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', en.hero.title)
})
