import { expect, test } from '@playwright/test'

test('stalled fonts fall back locally instead of blocking image export', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
        Object.defineProperty(document.fonts, 'ready', { configurable: true, value: new Promise(() => {}) })
        Object.defineProperty(document.fonts, 'load', { configurable: true, value: () => new Promise(() => {}) })
        const measuredFonts: string[] = []
        Reflect.set(window, '__measuredExportFonts', measuredFonts)
        const measure = CanvasRenderingContext2D.prototype.measureText
        CanvasRenderingContext2D.prototype.measureText = function (text) {
            measuredFonts.push(this.font)
            return measure.call(this, text)
        }
    })
    await page.goto('/t/timing')
    const download = page.waitForEvent('download', { timeout: 7000 })
    await page.getByRole('button', { name: 'Copy label as image', exact: true }).click()
    expect((await download).suggestedFilename()).toBe('timing-label.png')
    await expect(page.getByRole('button', { name: 'Image downloaded', exact: true })).toBeEnabled()
    const fonts: string[] = await page.evaluate(() => Reflect.get(window, '__measuredExportFonts'))
    expect(fonts.length).toBeGreaterThan(0)
    expect(fonts.every((font) => font.includes('PingFang SC'))).toBe(true)
})

test('text and image exports share a busy lock while native clipboard work is pending', async ({ page }) => {
    await page.addInitScript(() => {
        const probe = { writes: [] as string[], release: () => {} }
        Reflect.set(window, '__exportProbe', probe)
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                write: () => {
                    probe.writes.push('image')
                    return new Promise<void>((resolve) => { probe.release = resolve })
                },
                writeText: async () => { probe.writes.push('text') },
            },
        })
    })
    await page.goto('/t/timing')
    await page.getByRole('button', { name: 'Copy label as image', exact: true }).click()
    await expect.poll(() => page.evaluate(() => Reflect.get(window, '__exportProbe').writes)).toEqual(['image'])
    const text = page.getByRole('button', { name: 'Copy label text', exact: true })
    await expect(text).toBeDisabled()
    await text.evaluate((button: HTMLButtonElement) => button.click())
    expect(await page.evaluate(() => Reflect.get(window, '__exportProbe').writes)).toEqual(['image'])
    await page.evaluate(() => Reflect.get(window, '__exportProbe').release())
    await expect(page.getByRole('button', { name: 'Image copied', exact: true })).toBeEnabled()
    await text.click()
    await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeEnabled()
    expect(await page.evaluate(() => Reflect.get(window, '__exportProbe').writes)).toEqual(['image', 'text'])
})

for (const change of ['language', 'tool'] as const) {
    test(`a stale clipboard rejection after a ${change} change never triggers a download`, async ({ page }) => {
        await page.addInitScript(() => {
            const probe = { reject: (_reason: Error) => {}, started: false, downloads: [] as string[] }
            Reflect.set(window, '__staleExportProbe', probe)
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: { write: () => new Promise((_resolve, reject) => {
                    probe.started = true
                    probe.reject = reject
                }) },
            })
            const click = HTMLAnchorElement.prototype.click
            HTMLAnchorElement.prototype.click = function () {
                if (this.download) probe.downloads.push(this.download)
                else click.call(this)
            }
        })
        await page.goto('/t/timing')
        await page.getByRole('button', { name: 'Copy label as image', exact: true }).click()
        await expect.poll(() => page.evaluate(() => Reflect.get(window, '__staleExportProbe').started)).toBe(true)
        if (change === 'language') {
            await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
            await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
            await expect(page.locator('.big-label-actions button[disabled]')).toHaveCount(2)
            await expect(page.getByRole('status').filter({ hasText: '浏览器尚未完成复制' })).toBeVisible()
            await expect(page.locator('textarea')).toHaveCount(0)
            await page.getByRole('button', { name: '手动复制文字', exact: true }).click()
            await expect(page.getByRole('textbox', { name: '标签文本', exact: true })).toHaveValue(/Figma 弹簧/)
        } else {
            await page.locator('.shelf-row a').first().click()
            await expect(page.locator('.big-label-name')).not.toHaveText('Timing')
        }
        await page.evaluate(async () => {
            Reflect.get(window, '__staleExportProbe').reject(new Error('Denied'))
            await new Promise(requestAnimationFrame)
        })
        expect(await page.evaluate(() => Reflect.get(window, '__staleExportProbe').downloads)).toEqual([])
        await expect(page.locator('.big-label-actions button[disabled]')).toHaveCount(0)
        expect(await page.locator('.copy-status').allTextContents()).toEqual(['', '', ''])
    })
}

test('a pending native copy keeps both actions locked and explains the unresolved browser request', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: () => new Promise(() => {}) },
        })
    })
    await page.goto('/t/timing')
    await page.clock.install()
    await page.getByRole('button', { name: 'Copy label text', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Copying…', exact: true })).toBeDisabled()
    await page.clock.fastForward(8100)
    await expect(page.getByRole('status').filter({ hasText: 'The browser has not finished copying.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy label as image', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Copying…', exact: true })).toBeDisabled()
    await expect(page.locator('textarea')).toHaveCount(0)
    await page.getByRole('button', { name: 'Copy text manually', exact: true }).click()
    const manual = page.getByRole('textbox', { name: 'Label text', exact: true })
    await expect(manual).toBeFocused()
    await expect(manual).toHaveValue(/^Timing — /)
})
