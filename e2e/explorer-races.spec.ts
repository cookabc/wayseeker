import { expect, type Page, test } from '@playwright/test'

declare global {
    interface Window {
        __explorerCopies: Array<{ text: string; resolve: () => void; reject: () => void }>
    }
}

test.use({ reducedMotion: 'reduce' })

async function deferClipboard(page: Page) {
    await page.addInitScript(() => {
        window.__explorerCopies = []
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: (text: string) => new Promise<void>((resolve, reject) => {
                    window.__explorerCopies.push({ text, resolve, reject: () => reject(new Error('Delayed denial')) })
                }),
            },
        })
    })
}

test('a delayed copy denial cannot replace a new prescription with the old fallback', async ({ page }) => {
    await deferClipboard(page)
    await page.goto('/?plan=k4x9f2#prescription')
    await page.getByRole('button', { name: 'Copy as Markdown', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Copy link', exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Write a new one', exact: true }).click()
    const currentSeed = new URL(page.url()).searchParams.get('plan')
    expect(currentSeed).not.toBe('k4x9f2')
    await page.evaluate(() => window.__explorerCopies[0].reject())
    await expect(page.getByRole('button', { name: 'Copy as Markdown', exact: true })).toBeEnabled()
    await expect(page.locator('.rx-slip .manual-copy')).toHaveCount(0)
    await expect(page.locator('.rx-meta')).toContainText(currentSeed ?? '')
})

test('a late success after changing language cannot announce a copy of the new language', async ({ page }) => {
    await deferClipboard(page)
    await page.goto('/?plan=k4x9f2#prescription')
    await page.getByRole('button', { name: 'Copy as Markdown', exact: true }).click()
    await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
    await page.evaluate(() => window.__explorerCopies[0].resolve())
    await expect(page.getByRole('button', { name: '复制为 Markdown', exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: '方子已复制', exact: true })).toHaveCount(0)
    await expect(page.locator('.rx-slip .manual-copy')).toHaveCount(0)
})

test('a slow native clipboard request offers current text only after an explicit manual action', async ({ page }) => {
    await page.clock.install()
    await deferClipboard(page)
    await page.goto('/?plan=k4x9f2#prescription')
    await page.getByRole('button', { name: 'Copy as Markdown', exact: true }).click()
    await page.getByRole('button', { name: 'Write a new one', exact: true }).click()
    const currentSeed = new URL(page.url()).searchParams.get('plan')
    // "Write a new one" reveals the prescription and focuses its title in a
    // requestAnimationFrame. Let that focus settle before moving it to the nav
    // link, otherwise the rAF can fire later and steal focus back mid-test.
    await expect(page.locator('.rx-plan-title')).toBeFocused()
    const navLink = page.locator('.site-nav-link').first()
    await navLink.focus()
    await expect(navLink).toBeFocused()
    await page.clock.fastForward(8001)
    await expect(page.locator('.rx-slip .copy-status')).toContainText('still waiting for the browser')
    await expect(navLink).toBeFocused()
    await expect(page.locator('.rx-slip .manual-copy')).toHaveCount(0)
    await page.getByRole('button', { name: 'Copy manually', exact: true }).click()
    const fallback = page.locator('.rx-slip .manual-copy textarea')
    await expect(fallback).toBeVisible()
    expect(await fallback.inputValue()).toContain(`plan=${currentSeed}`)
    expect(await fallback.inputValue()).not.toContain('plan=k4x9f2')
    await page.evaluate(() => window.__explorerCopies[0].resolve())
    await expect(page.getByRole('button', { name: 'Copy as Markdown', exact: true })).toBeEnabled()
    await expect(page.locator('.rx-slip .notice')).toHaveCount(0)
})

test('same-page Home navigation resets URL and visible state together, including history moves', async ({ page }) => {
    const origin = '/?tool=mobbin&plan=k4x9f2&q=Mobbin&stage=3#cabinet'
    await page.goto(origin)
    await expect(page.locator('#drawer-search')).toHaveValue('Mobbin')
    await expect(page.locator('.rx-name')).toHaveCount(5)
    await page.locator('.wordmark').click()
    await page.waitForURL((url) => url.search === '' && url.hash === '')
    await expect(page.locator('#drawer-search')).toHaveValue('')
    await expect(page.locator('.slip-name')).toHaveText('Timing')
    await expect(page.locator('.rx-name')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'All stages', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.goBack()
    await expect(page.locator('#drawer-search')).toHaveValue('Mobbin')
    await expect(page.locator('.slip-name')).toHaveText('Mobbin')
    await expect(page.locator('.rx-name')).toHaveCount(5)
    await page.goForward()
    await expect(page.locator('#drawer-search')).toHaveValue('')
    await expect(page.locator('.rx-name')).toHaveCount(0)
    await page.goBack()
    await expect(page.locator('#drawer-search')).toHaveValue('Mobbin')
    await page.getByRole('link', { name: 'Home', exact: true }).click()
    await expect(page.locator('#drawer-search')).toHaveValue('')
    await expect(page.locator('.rx-name')).toHaveCount(0)
})

test('long searches use the same bounded text before and after refresh', async ({ page }) => {
    await page.goto('/#cabinet')
    const query = `Mobbin${' '.repeat(194)}not`
    await page.locator('#drawer-search').fill(query)
    await expect(page.locator('#drawer-search')).toHaveValue(query.slice(0, 200))
    expect(new URL(page.url()).searchParams.get('q')).toBe(query.slice(0, 200))
    await expect(page.locator('.cabinet-frame .drawer')).toHaveCount(1)
    await page.reload()
    await expect(page.locator('#drawer-search')).toHaveValue(query.slice(0, 200))
    await expect(page.locator('.cabinet-frame .drawer')).toHaveCount(1)
})

test('Escape during IME composition preserves the query while a normal Escape clears it', async ({ page }) => {
    await page.goto('/#cabinet')
    const search = page.locator('#drawer-search')
    await search.fill('motion')
    await search.dispatchEvent('keydown', { key: 'Escape', code: 'Escape', isComposing: true })
    await expect(search).toHaveValue('motion')
    await search.press('Escape')
    await expect(search).toHaveValue('')
})
