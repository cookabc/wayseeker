import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

test('reduced motion shows complete content and keeps selection feedback', async ({ page }) => {
    await page.goto('/?plan=k4x9f2&anchor=timing')
    await expect(page.locator('.rx-name')).toHaveCount(5)
    const staticState = await page.locator('.rise, .slip, .rx-swap-in, .seal, .will-reveal').evaluateAll((nodes) =>
        nodes.map((node) => {
            const style = getComputedStyle(node)
            return { animation: style.animationName, opacity: style.opacity, filter: style.filter }
        }),
    )
    expect(staticState.length).toBeGreaterThan(5)
    for (const state of staticState) {
        expect(state.animation).toBe('none')
        expect(state.opacity).toBe('1')
        expect(state.filter).toBe('none')
    }
    const before = await page.locator('.slip-name').textContent()
    await page.getByRole('button', { name: 'Next drawer', exact: true }).click()
    await expect(page.locator('.slip-name')).not.toHaveText(before ?? '')
    const name = (await page.locator('.slip-name').textContent()) ?? ''
    await expect(page.locator('#counter-status')).toContainText(name)
    const strike = await page.locator('.habit[aria-pressed="true"] .habit-text').evaluate((node) => getComputedStyle(node).backgroundSize)
    expect(strike.startsWith('100%')).toBe(true)
})

test('recovery stays primary on the missing page and resources can be disclosed', async ({ page }) => {
    const response = await page.goto('/t/no-such-tool')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('link', { name: 'Back to the cabinet', exact: true })).toBeVisible()
    await expect(page.locator('.not-found-resources')).not.toHaveAttribute('open')
    await expect(page.locator('.not-found-resources nav')).toBeHidden()
    await page.locator('.not-found-resources summary').click()
    await expect(page.locator('.not-found-resources nav')).toBeVisible()
    await expect(page.locator('.not-found-resources a[href="/tools.json"]')).toBeVisible()
    await page.getByRole('link', { name: 'Back to the cabinet', exact: true }).click()
    await expect(page.locator('#hero-title')).toBeVisible()
})

for (const lang of ['en', 'zh']) {
    test('prescriptions and copy recovery fit a 320px screen in ' + lang, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 740 })
        await page.addInitScript((language) => {
            localStorage.setItem('i18nextLng', language)
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: () => Promise.reject(new Error('Denied')) },
            })
        }, lang)
        for (const anchor of ['timing', 'craftwork-websites', 'component-gallery']) {
            await page.goto('/?plan=k4x9f2&anchor=' + anchor + '#prescription')
            await expect(page.locator('html')).toHaveAttribute('lang', lang)
            await expect(page.locator('.rx-name')).toHaveCount(5)
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
        }
        const copyLabel = lang === 'en' ? 'Copy as Markdown' : '复制为 Markdown'
        await page.getByRole('button', { name: copyLabel, exact: true }).click()
        await expect(page.locator('.rx-slip textarea')).toBeFocused()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    })
}
