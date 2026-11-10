import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

for (const lang of ['en', 'zh']) for (const theme of ['light', 'dark']) {
    test(`real fonts keep every layout within its viewport in ${lang} ${theme}`, async ({ page }) => {
        test.slow() // Eight real-font navigations across four viewport widths.
        await page.addInitScript(({ lang, theme }) => {
            localStorage.setItem('i18nextLng', lang)
            localStorage.setItem('wayseeker-theme', theme)
        }, { lang, theme })
        for (const width of [320, 390, 768, 1440]) {
            await page.setViewportSize({ width, height: 900 })
            for (const path of ['/?tool=timing&plan=k4x9f2&anchor=timing#counter', '/t/craftwork-websites']) {
                await page.goto(path)
                await expect(page.locator('html')).toHaveAttribute('lang', lang)
                await expect(page.getByRole('button', { name: lang === 'zh' ? '切换到英文' : 'Switch to Chinese', exact: true })).toBeVisible()
                await page.evaluate(() => document.fonts.ready)
                expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
            }
        }
    })
}

test('blocked local storage keeps language and theme controls usable', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
        get() { throw new DOMException('Storage blocked', 'SecurityError') },
    }))
    await page.goto('/?tool=mobbin#counter')
    await expect(page.locator('.slip-name')).toHaveText('Mobbin')
    await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
    await page.locator('.site-preferences button').last().click()
    await expect(page.locator('html')).toHaveClass(/light/)
    expect(errors).toEqual([])
})

test('an unrecognized stored theme recovers without losing the explorer', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => localStorage.setItem('wayseeker-theme', 'retired-theme'))
    await page.goto('/?tool=mobbin#counter')
    await expect(page.locator('.slip-name')).toHaveText('Mobbin')
    await expect(page.getByRole('button', { name: 'Theme: System. Click to switch to Light.', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Next drawer', exact: true }).click()
    await expect(page.locator('.slip-name')).not.toHaveText('Mobbin')
    expect(errors).toEqual([])
})

test('keyboard entry and changing workflow keep focus on visible controls', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/?tool=mobbin')
    await expect(page.locator('.slip-name')).toHaveText('Mobbin')
    // macOS WebKit uses Option-Tab for links when full keyboard access is off.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
    await page.locator('.habit').first().focus()
    await page.keyboard.press('ArrowUp')
    const selected = page.locator('.habit[aria-pressed="true"]')
    await expect(selected).toBeFocused()
    expect(await selected.evaluate(element => {
        const rect = element.getBoundingClientRect()
        const header = document.querySelector('.site-header')?.getBoundingClientRect()
        return rect.top >= (header?.bottom ?? 0) && rect.bottom <= innerHeight
    })).toBe(true)
})

test('forced colors retain visible selected stages, habits and drawers', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    test.skip(!await page.evaluate(() => matchMedia('(forced-colors: active)').matches), 'Engine does not emulate forced colors')
    await page.goto('/?tool=timing&stage=2#counter')
    // The stage/picks arrive in a post-hydration effect; the server-rendered
    // DOM already has a pressed "All stages" tab, so toHaveCount(1) alone
    // does not prove the URL state has been applied. Wait for stage 2 itself.
    const stage = page.locator('.stage-tab[aria-pressed="true"]').filter({ hasText: /MAKE IT MOVE/i })
    await expect(stage).toHaveCount(1)
    await expect(stage).toHaveCSS('text-decoration-line', /underline/)
    const habit = page.locator('.habit[aria-pressed="true"] .habit-text')
    await expect(habit).toHaveCSS('text-decoration-line', /line-through/)
    const current = page.locator('.drawer[aria-current="true"] .drawer-label')
    await expect.poll(async () => current.evaluate(element => Number.parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(2)
})

for (const percent of [200, 400]) test(`${percent} percent text keeps the page and visit actions within their columns`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    for (const path of ['/?tool=mobbin&plan=k4x9f2#counter', '/t/timing']) {
        await page.goto(path)
        await expect(page.getByRole('button', { name: 'Switch to Chinese', exact: true })).toBeVisible()
        await page.evaluate(percent => { document.documentElement.style.fontSize = percent + '%' }, percent)
        await page.evaluate(() => document.fonts.ready)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
        const visit = page.getByRole('link', { name: /^Visit site/ })
        await expect(visit).toBeVisible()
        expect(await visit.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    }
})

test('a cancelled native touch gesture does not block later page scrolling', async ({ page, context, browserName, isMobile }) => {
    test.skip(browserName !== 'chromium' || !isMobile, 'Chromium mobile CDP touch synthesis')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#counter')
    await page.evaluate(() => document.fonts.ready)
    const session = await context.newCDPSession(page)
    const before = await page.evaluate(() => scrollY)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: 680, id: 1 }] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: 500, id: 1 }] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: 680, id: 2 }] })
    for (const y of [600, 500, 400]) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y, id: 2 }] })
        await page.evaluate(() => new Promise(requestAnimationFrame))
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)
    await expect(page.locator('.habit-peek')).toBeHidden()
    await session.detach()
})
