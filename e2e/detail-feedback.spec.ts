import { expect, test } from '@playwright/test'

test('denied clipboard access keeps the exact label text available for manual copying', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: async () => { throw new DOMException('Permission denied', 'NotAllowedError') } },
        })
    })
    await page.goto('/t/timing')
    await page.getByRole('button', { name: 'Copy label text', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'The clipboard is unavailable.' })).toBeVisible()
    const fallback = page.getByRole('textbox', { name: 'Label text', exact: true })
    await expect(fallback).toBeVisible()
    await expect(fallback).toBeFocused()
    await expect(fallback).toHaveValue(/^Timing — .+/)
    expect(await fallback.evaluate((node: HTMLTextAreaElement) => node.selectionEnd - node.selectionStart))
        .toBeGreaterThan(20)
    await expect(page.getByRole('button', { name: 'Copy label text', exact: true })).toBeEnabled()
})

test('image download fallback reports the actual outcome', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    })
    await page.goto('/t/timing')
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Copy label as image', exact: true }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('timing-label.png')
    await expect(page.getByRole('button', { name: 'Image downloaded', exact: true })).toBeEnabled()
    await expect(page.getByRole('status').filter({ hasText: 'Image downloaded' })).toBeVisible()
})

test('detail and related drawers retain the originating prescription', async ({ page }) => {
    const returnTo = '/?tool=timing&plan=k4x9f2&q=motion&stage=2#prescription'
    await page.goto(`/t/timing?${new URLSearchParams({ returnTo })}`)
    await expect(page.getByRole('link', { name: 'Back to the cabinet', exact: true }))
        .toHaveAttribute('href', returnTo)
    const related = page.locator('.shelf-row a').first()
    await related.click()
    await expect(page.getByRole('link', { name: 'Back to the cabinet', exact: true }))
        .toHaveAttribute('href', returnTo)
})
