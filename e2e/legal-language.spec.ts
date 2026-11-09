import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

for (const pageKind of [
    {
        route: '/privacy',
        en: 'Privacy Policy',
        zh: '隐私政策',
        english: 'does not collect personal data',
        chinese: '不收集个人数据',
    },
    {
        route: '/terms',
        en: 'Terms of Service',
        zh: '服务条款',
        english: 'curated directory',
        chinese: '经过筛选整理的第三方工具',
    },
]) {
    test(`${pageKind.route} switches its full content and keeps the original policy date`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 740 })
        await page.goto(pageKind.route)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(pageKind.en)
        await expect(page.locator('.prose')).toContainText(pageKind.english)
        await expect(page.locator('time')).toHaveAttribute('dateTime', '2026-07-17')
        await expect(page.locator('time')).toHaveText('July 17, 2026')
        await page.getByRole('button', { name: 'Switch to Chinese', exact: true }).click()
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(pageKind.zh)
        await expect(page.locator('.prose')).toContainText(pageKind.chinese)
        await expect(page.locator('.plain-page')).not.toContainText(pageKind.english)
        await expect(page.locator('time')).toHaveText('2026 年 7 月 17 日')
        await expect(page.getByRole('link', { name: '返回首页', exact: true })).toHaveAttribute('href', '/')
        await expect(page.locator('.prose a')).toHaveAttribute('href', 'mailto:chuangcius@gmail.com')
        await expect(page.locator('.prose')).not.toContainText('{{site}}')
        await expect(page.locator('.prose')).not.toContainText('<storage>')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
        await page.reload()
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(pageKind.zh)
        await page.getByRole('button', { name: '切换到英文', exact: true }).click()
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(pageKind.en)
        await expect(page.locator('.prose')).toContainText(pageKind.english)
        if (pageKind.route === '/privacy') {
            await expect(page.locator('.prose code')).toHaveText('wayseeker-theme')
        } else {
            await expect(page.locator('.prose')).toContainText('without warranties of any kind')
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    })
}

test('the preferred legal language survives the way home and the next legal page', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'zh'))
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('隐私政策')
    await page.getByRole('link', { name: '返回首页', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
    await page.getByRole('link', { name: '条款', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('服务条款')
    await expect(page.locator('.prose')).toContainText('不作任何形式的保证')
})
