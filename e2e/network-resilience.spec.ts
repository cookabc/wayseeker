import { expect, test } from '@playwright/test'

test('loaded exploration keeps working when the connection is lost', async ({ page, context }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    })
    await page.goto('/?tool=timing&plan=k4x9f2&anchor=timing&p=..paper-shaders#prescription')
    await expect(page.locator('.rx-name')).toHaveCount(5)
    const originalNames = await page.locator('.rx-name').allTextContents()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await context.setOffline(true)
    try {
        await page.getByLabel('Find a drawer').fill('Mobbin')
        await expect(page.locator('.cabinet-frame .drawer')).toHaveCount(1)
        await page.getByRole('button', { name: 'Write a new one', exact: true }).click()
        expect(new URL(page.url()).searchParams.get('plan')).not.toBe('k4x9f2')
        await page.getByRole('button', { name: 'Restore previous prescription', exact: true }).click()
        await expect.poll(() => page.locator('.rx-name').allTextContents()).toEqual(originalNames)
        await page.getByRole('button', { name: 'Copy as Markdown', exact: true }).click()
        const fallback = page.locator('.manual-copy textarea')
        await expect(fallback).toBeFocused()
        await expect(fallback).toHaveValue(/plan=k4x9f2.*anchor=timing/)
        expect(errors).toEqual([])
    } finally {
        await context.setOffline(false)
    }
})

test('delayed previews do not block reading, searching or making a prescription', async ({ page }) => {
    let release: () => void = () => {}
    const held = new Promise<void>(resolve => { release = resolve })
    let intercepted = 0
    await page.route('**/_next/image?**', async route => {
        intercepted += 1
        await held
        await route.abort('failed')
    })
    try {
        await page.goto('/?tool=timing', { waitUntil: 'domcontentloaded' })
        await expect.poll(() => intercepted).toBeGreaterThan(0)
        await expect(page.locator('.slip-name')).toHaveText('Timing')
        await expect(page.locator('.counter-actions a[target="_blank"]')).toHaveAttribute('href', 'https://timing.xiaolin.work/')
        await page.getByLabel('Find a drawer').fill('Mobbin')
        await expect(page.locator('.cabinet-frame .drawer')).toHaveCount(1)
        await page.getByRole('button', { name: 'Build around Timing', exact: true }).click()
        await expect(page.locator('.rx-name')).toHaveCount(5)
        release()
        await expect(page.getByRole('img', { name: /Timing.*Preview unavailable/ })).toBeAttached()
    } finally {
        release()
    }
})

for (const language of ['en', 'zh']) {
    test('font failures and the completed ink animation do not widen the prescription in ' + language, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.addInitScript(language => localStorage.setItem('i18nextLng', language), language)
        await page.route('**/*.woff2', route => route.abort('failed'))
        await page.goto('/?plan=k4x9f2&anchor=timing#prescription')
        await expect(page.locator('html')).toHaveAttribute('lang', language)
        await expect(page.locator('.rx-name')).toHaveCount(5)
        await page.locator('.seal').evaluate(async seal => {
            await Promise.all(seal.getAnimations({ subtree: true }).map(animation => animation.finished))
        })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
        await page.setViewportSize({ width: 320, height: 844 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
    })
}
