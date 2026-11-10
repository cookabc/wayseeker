import { expect, test } from '@playwright/test'

test('the address bar always links to the dispensed drawer', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await page.getByRole('button', { name: 'Next drawer' }).click()
    const name = await page.locator('.slip-name').textContent()
    const href = page.url()
    expect(new URL(href).searchParams.get('tool')).toBeTruthy()
    await page.goto(href)
    await expect(page.locator('.slip-name')).toHaveText(name ?? '')
    expect(errors).toEqual([])
})

test('habits, drawers and search all dispense the same label', async ({ page }) => {
    await page.goto('/')
    const showAll = page.getByRole('button', { name: 'Show all 29 habits' })
    if (await showAll.isVisible()) await showAll.click()
    await page.locator('.habit', { hasText: 'endless Awwwards tabs' }).click()
    await expect(page.locator('.slip-name')).toHaveText(/Craftwork Websites/i)
    await page.getByRole('button', { name: /Mobbin/ }).click()
    await expect(page.locator('.slip-name')).toHaveText(/Mobbin/i)
    await page.getByLabel('Find a drawer').fill('no-such-tool-000')
    await expect(page.locator('.cabinet-count')).toContainText('No drawer')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})

test('a prescription is reproducible and swaps one line at a time', async ({ page }) => {
    await page.goto('/?plan=k4x9f2')
    // The plan is restored in a post-hydration effect; wait for all five names
    // to be present before taking the baseline snapshot.
    const names = page.locator('.rx-name')
    await expect(names).toHaveCount(5)
    const before = await names.allTextContents()
    await page.getByRole('button', { name: /Swap the Make it move line/ }).click()
    // Swapping re-renders the line with an entry animation; poll until the new
    // set of five names has settled instead of reading a mid-render snapshot.
    await expect.poll(async () => {
        const after = await names.allTextContents()
        return after.length === 5 && after[2] !== before[2] &&
            after.filter((n, i) => n === before[i]).length === 4
    }).toBe(true)
    expect(new URL(page.url()).searchParams.get('p')).toBeTruthy()
})

test('Chinese and English cover the label, the label page and the way back', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
    await expect(page.locator('#hero-title')).toContainText('将就')
    await expect(page.locator('.counter')).toContainText('注意')
    await page.getByRole('link', { name: '完整标签' }).click()
    await expect(page.locator('.big-label')).toBeVisible()
    await page.getByRole('button', { name: '切换到英文', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.goBack()
    await expect(page.locator('.counter')).toBeVisible()
})
