import { expect, test } from '@playwright/test'
import tools from '../src/data/tools'

test.use({ reducedMotion: 'reduce' })

for (const lang of ['en', 'zh'] as const) {
    test(`every tool label fits its real content in ${lang}`, async ({ page, isMobile }) => {
        test.setTimeout(120_000)
        if (isMobile) await page.setViewportSize({ width: 320, height: 740 })
        await page.addInitScript((language) => localStorage.setItem('i18nextLng', language), lang)
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        for (const tool of tools) {
            const response = await page.goto(`/t/${tool.id}`)
            expect(response?.status(), tool.id).toBe(200)
            await expect(page.locator('html')).toHaveAttribute('lang', lang)
            await expect(page.getByRole('heading', { level: 1 })).toHaveText(tool.name[lang])
            await expect(page.locator('.big-label-actions a').first()).toHaveAttribute('href', tool.url)
            const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
            expect(fits, `${tool.id} at ${page.viewportSize()?.width}px`).toBe(true)
        }
        expect(errors).toEqual([])
    })
}

test('home, legal pages and missing tools have a usable way home', async ({ page }) => {
    for (const route of ['/', '/privacy', '/terms', '/t/no-such-tool']) {
        const response = await page.goto(route)
        expect(response?.status()).toBe(route.includes('no-such-tool') ? 404 : 200)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.locator('.wordmark')).toHaveAttribute('href', '/')
        await expect(page.locator('.site-nav-link')).toHaveCount(2)
        for (const link of await page.locator('.site-nav-link').all()) await expect(link).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    }
})

test('keyboard users can skip navigation before entering the page', async ({ page, browserName }) => {
    await page.goto('/')
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
})
