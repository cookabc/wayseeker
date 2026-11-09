import { expect, test } from '@playwright/test'

test('the declared display, Chinese and mono faces are actually rendered', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Rendered font inspection requires Chromium CDP')
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const session = await context.newCDPSession(page)
    await session.send('DOM.enable')
    await session.send('CSS.enable')
    const platformFonts = async (selector: string) => {
        const { root } = await session.send('DOM.getDocument')
        const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector })
        return (await session.send('CSS.getPlatformFontsForNode', { nodeId })).fonts
    }
    await expect.poll(async () => (await platformFonts('#hero-title')).some((font) => font.isCustomFont && font.familyName.startsWith('Archivo'))).toBe(true)
    await expect.poll(async () => (await platformFonts('.counter-code')).some((font) => font.isCustomFont && font.familyName === 'Fragment Mono')).toBe(true)
    await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
    await page.evaluate(() => document.fonts.ready)
    await expect.poll(async () => (await platformFonts('#hero-title')).some((font) => font.isCustomFont && font.familyName.startsWith('Noto Serif SC'))).toBe(true)
})

test('without JavaScript the root font tokens still resolve and Chinese has a local fallback', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
        await page.goto('/')
        const fonts = await page.locator('#hero-title').evaluate((heading) => ({
            display: getComputedStyle(heading).fontFamily,
            mono: getComputedStyle(document.querySelector('.counter-code') as HTMLElement).fontFamily,
            chineseVariable: getComputedStyle(document.documentElement).getPropertyValue('--font-serif-sc').trim(),
        }))
        expect(fonts.display).toContain('Archivo')
        expect(fonts.display).toContain('Songti SC')
        expect(fonts.mono).toContain('Fragment Mono')
        expect(fonts.chineseVariable).toBe('')
    } finally {
        await context.close()
    }
})
