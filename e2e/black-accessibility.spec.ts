import { expect, test } from '@playwright/test'

test('black remains playable with malformed progress and only resets it after confirmation', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => localStorage.setItem('bw-black', '{broken'))
    await page.goto('/puzzles/black.html')
    await expect(page.locator('#hint')).toHaveText('点击屏幕任意处')
    await expect(page.locator('#save-notice')).toBeVisible()
    await page.locator('#cv').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#keyboard-position')).toContainText('本关已完成')
    await expect(page.locator('#save-notice')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('bw-black'))).toBe('{broken')
    page.once('dialog', dialog => dialog.dismiss())
    await page.getByRole('button', { name: '重置无法读取的记录' }).click()
    expect(await page.evaluate(() => localStorage.getItem('bw-black'))).toBe('{broken')
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: '重置无法读取的记录' }).click()
    await expect(page.locator('#save-notice')).toBeHidden()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('bw-black') || '{}')[0])).toBe(1)
    await page.keyboard.press('Enter')
    await expect(page.locator('#lvl')).toHaveText('2 / 50')
    expect(errors).toEqual([])
})

test('failed reads never overwrite saved levels and a retry merges this session progress', async ({ page }) => {
    await page.addInitScript(() => {
        const read = Storage.prototype.getItem
        localStorage.setItem('bw-black', '{"9":1}')
        Object.defineProperty(Storage.prototype, 'getItem', {
            configurable: true,
            value(key: string) {
                if (key === 'bw-black' && !sessionStorage.getItem('allow-progress-read')) throw new DOMException('Denied', 'SecurityError')
                return read.call(this, key)
            },
        })
    })
    await page.goto('/puzzles/black.html')
    await page.locator('#cv').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#save-status')).toContainText('不会覆盖原记录')
    await page.evaluate(() => sessionStorage.setItem('allow-progress-read', '1'))
    expect(await page.evaluate(() => localStorage.getItem('bw-black'))).toBe('{"9":1}')
    await page.getByRole('button', { name: '重试保存进度' }).click()
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bw-black') || '{}'))).toEqual({ 0: 1, 9: 1 })
    await expect(page.locator('#save-notice')).toBeHidden()
})

test('a failed save reports failure and can be retried without losing the completed level', async ({ page }) => {
    await page.addInitScript(() => {
        const write = Storage.prototype.setItem
        Object.defineProperty(Storage.prototype, 'setItem', {
            configurable: true,
            value(key: string, value: string) {
                if (key === 'bw-black' && !sessionStorage.getItem('allow-black-save')) throw new DOMException('Denied', 'SecurityError')
                return write.call(this, key, value)
            },
        })
    })
    await page.goto('/puzzles/black.html')
    await page.locator('#cv').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#save-status')).toContainText('进度未保存')
    await expect(page.locator('#keyboard-position')).toContainText('本关已完成')
    await page.evaluate(() => sessionStorage.setItem('allow-black-save', '1'))
    await page.getByRole('button', { name: '重试保存进度' }).click()
    await expect(page.locator('#save-notice')).toBeHidden()
    await expect(page.locator('#cv')).toBeFocused()
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bw-black') || '{}')[0])).toBe(1)
})

test('black keyboard supports holding, letter input and an accessible level picker', async ({ page }) => {
    await page.goto('/puzzles/black.html?lv=4')
    await page.locator('#cv').focus()
    await page.keyboard.press('Space')
    await expect(page.locator('#keyboard-position')).toContainText('已按住')
    await page.keyboard.press('Tab')
    await page.waitForTimeout(1700)
    await expect(page.locator('#keyboard-position')).not.toContainText('本关已完成')
    await page.locator('#cv').focus()
    await page.keyboard.press('Space')
    await expect(page.locator('#keyboard-position')).toContainText('本关已完成', { timeout: 3500 })
    await page.getByRole('button', { name: '选关', exact: true }).click()
    await expect(page.locator('#mapPanel [aria-current="true"]')).toBeFocused()
    const smallTargets = await page.locator('#mapPanel button').evaluateAll(buttons => buttons.filter(button => {
        const rect = button.getBoundingClientRect()
        return rect.width < 44 || rect.height < 44
    }).length)
    expect(smallTargets).toBe(0)
    await page.getByRole('button', { name: '第 12 关，未完成', exact: true }).click()
    await expect(page.locator('#mapPanel')).toBeHidden()
    await expect(page.locator('#cv')).toBeFocused()
    await page.getByRole('button', { name: '选关', exact: true }).focus()
    await page.keyboard.type('BLACK')
    await expect(page.locator('#keyboard-position')).not.toContainText('本关已完成')
    await page.locator('#cv').focus()
    await page.keyboard.type('BLACK')
    await expect(page.locator('#keyboard-position')).toContainText('本关已完成')
    await page.getByRole('button', { name: '选关', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: '选关', exact: true })).toBeFocused()
})

test('keyboard dragging reaches slider endpoints and can move a disk beyond the canvas', async ({ page }) => {
    await page.goto('/puzzles/black.html?lv=9')
    await page.locator('#cv').focus()
    for (let step = 0; step < 4; step++) await page.keyboard.press('ArrowUp')
    for (let step = 0; step < 17; step++) await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Space')
    for (let step = 0; step < 9; step++) await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Space')
    for (let step = 0; step < 8; step++) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.locator('#keyboard-position')).toContainText('本关已完成')

    await page.goto('/puzzles/black.html?lv=18')
    await page.locator('#cv').focus()
    await page.keyboard.press('Space')
    for (let step = 0; step < 9; step++) await page.keyboard.press('Shift+ArrowLeft')
    await page.keyboard.press('Space')
    await expect(page.locator('#keyboard-position')).toContainText('本关已完成')
})
