import { expect, test } from '@playwright/test'

test('unavailable previews preserve tool context and the route to its site', async ({ page }) => {
    let blocked = 0
    await page.route('**/_next/image?**', async (route) => {
        blocked += 1
        await route.abort('failed')
    })
    await page.goto('/?tool=timing')
    const fallback = page.getByRole('img', { name: /Timing.*Preview unavailable/ })
    await expect(fallback).toBeVisible()
    await expect(fallback).toContainText('Preview unavailable')
    await expect(page.locator('.slip-name')).toHaveText('Timing')
    await page.getByRole('link', { name: 'Full label', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Timing', exact: true })).toBeVisible()
    await expect(page.getByRole('img', { name: /Timing.*Preview unavailable/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Visit site/ }))
        .toHaveAttribute('href', 'https://timing.xiaolin.work/')
    await page.getByRole('link', { name: 'Back to the cabinet', exact: true }).click()
    await expect(page.locator('.slip-name')).toHaveText('Timing')
    await expect(page.getByRole('img', { name: /Timing.*Preview unavailable/ })).toBeVisible()
    expect(blocked).toBeGreaterThan(0)
})

test('image export waits for the requested font glyphs before measuring text', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
        const probe = {
            requests: [] as Array<{ font: string; text: string }>,
            released: false,
            measuresBeforeRelease: 0,
            release: () => {},
        }
        const gate = new Promise<void>((resolve) => {
            probe.release = () => {
                probe.released = true
                resolve()
            }
        })
        Object.defineProperty(window, '__fontProbe', { value: probe })
        const originalLoad = document.fonts.load.bind(document.fonts)
        Object.defineProperty(document.fonts, 'load', {
            configurable: true,
            value: async (font: string, text = '') => {
                probe.requests.push({ font, text })
                await gate
                return originalLoad(font, text)
            },
        })
        const originalMeasure = CanvasRenderingContext2D.prototype.measureText
        Object.defineProperty(CanvasRenderingContext2D.prototype, 'measureText', {
            configurable: true,
            value: function (this: CanvasRenderingContext2D, text: string) {
                if (!probe.released) probe.measuresBeforeRelease += 1
                return originalMeasure.call(this, text)
            },
        })
    })
    await page.goto('/t/timing')
    await page.getByRole('button', { name: 'Copy label as image', exact: true }).click()
    await expect.poll(() => page.evaluate(() => Reflect.get(window, '__fontProbe').requests.length)).toBe(3)
    await expect(page.getByRole('button', { name: 'Preparing image…', exact: true })).toBeDisabled()
    expect(await page.evaluate(() => Reflect.get(window, '__fontProbe').measuresBeforeRelease)).toBe(0)
    const requests = await page.evaluate(() => Reflect.get(window, '__fontProbe').requests)
    expect(requests[0].text).toBe('TIMING')
    expect(requests[1].text).toContain('Figma')
    expect(requests[2].text).toContain('WAYSEEKER')
    const downloadPromise = page.waitForEvent('download')
    await page.evaluate(() => Reflect.get(window, '__fontProbe').release())
    expect((await downloadPromise).suggestedFilename()).toBe('timing-label.png')
    await expect(page.getByRole('button', { name: 'Image downloaded', exact: true })).toBeEnabled()
})

test('font loading failures still allow an image export using fallback fonts', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
        Object.defineProperty(document.fonts, 'load', {
            configurable: true,
            value: async () => { throw new Error('Font unavailable') },
        })
    })
    await page.goto('/t/timing')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Copy label as image', exact: true }).click()
    expect((await downloadPromise).suggestedFilename()).toBe('timing-label.png')
    await expect(page.getByRole('button', { name: 'Image downloaded', exact: true })).toBeEnabled()
})
