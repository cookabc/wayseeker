import { expect, test } from '@playwright/test'

const scenarios = [
    { width: 320, height: 844, lang: 'en', surface: 'detail', reducedMotion: 'no-preference' },
    { width: 390, height: 844, lang: 'zh', surface: 'detail', reducedMotion: 'reduce' },
    { width: 1440, height: 900, lang: 'en', surface: 'detail', reducedMotion: 'no-preference' },
    { width: 320, height: 844, lang: 'zh', surface: 'plan', reducedMotion: 'reduce' },
    { width: 390, height: 844, lang: 'en', surface: 'plan', reducedMotion: 'no-preference' },
    { width: 1440, height: 900, lang: 'zh', surface: 'plan', reducedMotion: 'reduce' },
] as const

for (const scenario of scenarios) {
    test(`${scenario.surface} copy recovery is visible and selectable at ${scenario.width}px in ${scenario.lang}`, async ({ page }) => {
        await page.setViewportSize({ width: scenario.width, height: scenario.height })
        await page.emulateMedia({ reducedMotion: scenario.reducedMotion })
        await page.addInitScript((lang) => {
            localStorage.setItem('i18nextLng', lang)
            Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Denied')) } })
        }, scenario.lang)
        await page.goto(scenario.surface === 'detail' ? '/t/timing' : '/?plan=k4x9f2#prescription')
        await page.evaluate(() => document.fonts.ready)
        const action = scenario.surface === 'detail'
            ? scenario.lang === 'zh' ? '复制标签文字' : 'Copy label text'
            : scenario.lang === 'zh' ? '复制为 Markdown' : 'Copy as Markdown'
        await page.getByRole('button', { name: action, exact: true }).click()
        const field = page.locator('.manual-copy textarea')
        await expect(field).toBeFocused()
        const geometry = () => field.evaluate((element: HTMLTextAreaElement) => {
            const rect = element.getBoundingClientRect()
            const header = document.querySelector('.site-header')?.getBoundingClientRect()
            const viewport = window.visualViewport
            const top = Math.max(header?.bottom ?? 0, viewport?.offsetTop ?? 0)
            const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight)
            return { visible: rect.top >= top && rect.bottom <= bottom, top: rect.top, bottom: rect.bottom, safeTop: top, safeBottom: bottom }
        })
        await expect.poll(async () => (await geometry()).visible).toBe(true)
        const selection = await field.evaluate((element: HTMLTextAreaElement) => ({
            start: element.selectionStart, end: element.selectionEnd, length: element.value.length,
        }))
        expect(selection.start).toBe(0)
        expect(selection.end).toBe(selection.length)
        const scrollPositions = await page.evaluate(async () => {
            const positions: number[] = []
            for (let frame = 0; frame < 4; frame++) {
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
                positions.push(scrollY)
            }
            return positions
        })
        expect(Math.max(...scrollPositions) - Math.min(...scrollPositions)).toBeLessThanOrEqual(1)
        // Recovery remains a native field: selecting a fragment and Select All still work.
        await field.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(3, 12))
        expect(await field.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe(9)
        await field.press('ControlOrMeta+A')
        expect(await field.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe((await field.inputValue()).length)
        expect((await geometry()).visible).toBe(true)
    })
}
