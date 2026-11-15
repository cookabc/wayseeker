import { expect, test, type Page } from '@playwright/test'

async function enterBoard(page: Page, selector = '#grid') {
    for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab')
        if (await page.locator(`${selector} button:focus`).count()) return
    }
    throw new Error('The board is not reachable with Tab')
}

async function moveTo(page: Page, index: number, columns: number) {
    await page.keyboard.press('Control+Home')
    for (let r = 0; r < Math.floor(index / columns); r++) await page.keyboard.press('ArrowDown')
    for (let c = 0; c < index % columns; c++) await page.keyboard.press('ArrowRight')
}

for (const game of ['0hh1', 'binary', '0hn0']) {
    test(`${game}: keyboard reaches every cell, preserves givens, and cycles in both directions`, async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('ohh1-n', '4')
            localStorage.setItem('binary-n', '4')
            localStorage.setItem('ohn0-n', '5')
            let seed = 83
            Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
        })
        await page.goto(`/puzzles/${game}.html`)
        const cells = page.locator('#grid button')
        const columns = game === '0hn0' ? 5 : 4
        await expect(cells).toHaveCount(columns * columns)
        await expect(page.locator('#grid button[tabindex="0"]')).toHaveCount(1)
        await enterBoard(page)
        await page.keyboard.press('Control+End')
        await expect(cells.last()).toBeFocused()
        await expect(cells.last()).toHaveAccessibleName(new RegExp(`第 ${columns} 行，第 ${columns} 列`))
        const givenIndex = await cells.evaluateAll(els => els.findIndex(el => el.getAttribute('aria-disabled') === 'true'))
        await moveTo(page, givenIndex, columns)
        const given = cells.nth(givenIndex)
        const givenName = await given.getAttribute('aria-label')
        await page.keyboard.press('Space')
        await page.keyboard.press('Enter')
        await expect(given).toHaveAttribute('aria-label', givenName!)
        const editableIndex = await cells.evaluateAll(els => els.findIndex(el => el.getAttribute('aria-disabled') === 'false'))
        await moveTo(page, editableIndex, columns)
        const editable = cells.nth(editableIndex)
        const emptyName = await editable.getAttribute('aria-label')
        await page.keyboard.press('Space')
        await expect(editable).not.toHaveAttribute('aria-label', emptyName!)
        await page.keyboard.press('Shift+Enter')
        await expect(editable).toHaveAttribute('aria-label', emptyName!)
        await page.keyboard.press('Enter')
        await page.keyboard.press('Space')
        await page.keyboard.press('Space')
        await expect(editable).toHaveAttribute('aria-label', emptyName!)
        expect(await editable.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
        await expect(page.getByRole('status')).toContainText('已填')
        await page.keyboard.press('Tab')
        expect(await page.locator('#grid button:focus').count()).toBe(0)
    })
}

for (const game of ['0hh1', 'binary']) {
    test(`${game}: a keyboard-only 4×4 game reaches announced completion`, async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('ohh1-n', '4')
            localStorage.setItem('binary-n', '4')
            let seed = 54
            Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
        })
        await page.goto(`/puzzles/${game}.html`)
        const givens = await page.locator('#grid button').evaluateAll(els => els.map(el => ({
            fixed: el.getAttribute('aria-disabled') === 'true',
            value: el.classList.contains('b') ? 1 : 0,
        })))
        let answer: number[] | undefined
        for (let mask = 0; mask < 65536; mask++) {
            const values = Array.from({ length: 16 }, (_, i) => (mask >> i) & 1)
            if (givens.some((cell, i) => cell.fixed && cell.value !== values[i])) continue
            const rows = Array.from({ length: 4 }, (_, r) => values.slice(r * 4, r * 4 + 4))
            const columns = Array.from({ length: 4 }, (_, c) => rows.map(row => row[c]))
            if ([...rows, ...columns].some(line => line.reduce((a, b) => a + b, 0) !== 2
                || line.slice(0, 2).some((v, i) => v === line[i + 1] && v === line[i + 2]))) continue
            if (new Set(rows.map(row => row.join(''))).size !== 4 || new Set(columns.map(col => col.join(''))).size !== 4) continue
            answer = values; break
        }
        expect(answer).toBeDefined()
        await enterBoard(page)
        for (let i = 0; i < 16; i++) {
            await moveTo(page, i, 4)
            if (!givens[i].fixed) {
                await page.keyboard.press('Space')
                if (answer![i] === 0) await page.keyboard.press('Enter')
            }
        }
        await expect(page.getByRole('status')).toContainText('完成')
        await expect(page.locator('#grid button[aria-disabled="false"]')).toHaveCount(0)
        await expect(page.locator('#grid button:focus')).toHaveCount(1)
    })
}

test('0hn0: a known valid board can be completed using the keyboard', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('ohn0-n', '5')
        let count = 0
        Math.random = () => {
            const index = count++
            return index < 25 ? (Math.floor(index / 5) % 2 === 0 ? 0.25 : 0.75) : (index % 3 === 0 ? 0.1 : 0.9)
        }
    })
    await page.goto('/puzzles/0hn0.html')
    const cells = page.locator('#grid button')
    const fixed = await cells.evaluateAll(els => els.map(el => el.getAttribute('aria-disabled') === 'true'))
    await enterBoard(page)
    for (let i = 0; i < 25; i++) {
        await moveTo(page, i, 5)
        if (fixed[i]) continue
        await page.keyboard.press('Space')
        if (Math.floor(i / 5) % 2 !== 0) await page.keyboard.press('Enter')
    }
    await expect(page.getByRole('status')).toContainText('完成')
    await expect(cells.filter({ hasText: '4' }).first()).toHaveAccessibleName(/黑点，数字 4/)
})

test('iteration: keyboard moves keep focus and complete the target, then reset recovers', async ({ page }) => {
    await page.goto('/puzzles/iteration.html')
    await page.getByRole('combobox').selectOption('3')
    const target = await page.locator('#target > div').evaluateAll(els => els.map(el => el.classList.contains('on')))
    const targetMask = target.reduce((mask, value, i) => mask | (Number(value) << i), 0)
    let solution = 0
    for (let candidate = 0; candidate < 512; candidate++) {
        let mask = 0
        for (let i = 0; i < 9; i++) {
            if (!(candidate & (1 << i))) continue
            for (const j of [i, ...(i % 3 > 0 ? [i - 1] : []), ...(i % 3 < 2 ? [i + 1] : []), ...(i >= 3 ? [i - 3] : []), ...(i < 6 ? [i + 3] : [])]) mask ^= 1 << j
        }
        if (mask === targetMask) { solution = candidate; break }
    }
    expect(solution).not.toBe(0)
    await enterBoard(page, '#board')
    for (let i = 0; i < 9; i++) {
        if (!(solution & (1 << i))) continue
        await moveTo(page, i, 3)
        await page.keyboard.press('Space')
        await expect(page.locator(`#board button[data-cell-index="${i}"]`)).toBeFocused()
    }
    await expect(page.getByRole('status')).toContainText('完成')
    await expect(page.getByRole('img', { name: /目标图形，3 行 3 列/ })).toBeVisible()
    await page.getByRole('button', { name: '重 置', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('已匹配')
    await expect(page.locator('#board button[aria-disabled="false"]')).toHaveCount(9)
})

test('nonogram: clues, marking, fill, keyboard completion and resize preserve state', async ({ page }) => {
    await page.goto('/puzzles/nonogram.html')
    await expect(page.getByRole('button', { name: '■ 填充', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: '× 标记', exact: true }).click()
    await enterBoard(page)
    await page.keyboard.press('Control+Home')
    await page.keyboard.press('Enter')
    const first = page.locator('#grid button').first()
    await expect(first).toHaveAccessibleName(/第 1 行，第 1 列，标记为空白；本行提示 3；本列提示 2/)
    await page.setViewportSize({ width: 320, height: 844 })
    await expect(first).toBeFocused()
    await expect(first).toHaveAccessibleName(/标记为空白/)
    await page.keyboard.press('Space')
    await expect(first).toHaveAccessibleName(/第 1 行，第 1 列，未填/)
    await page.getByRole('button', { name: '■ 填充', exact: true }).click()
    await enterBoard(page)
    const heart = ['.###.', '#####', '#####', '.###.', '..#..'].join('')
    for (let i = 0; i < 25; i++) {
        if (heart[i] !== '#') continue
        await moveTo(page, i, 5)
        await page.keyboard.press('Space')
    }
    await expect(page.getByRole('status')).toHaveText('✓ 完成！')
    await expect(page.locator('#grid button[aria-disabled="false"]')).toHaveCount(0)
    const width = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }))
    expect(width.scroll).toBeLessThanOrEqual(width.viewport + 1)
    await page.getByRole('button', { name: '清 空', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('已填黑 0 格')
    await expect(page.locator('#grid button[aria-disabled="false"]')).toHaveCount(25)
})

test('nonogram: pointer drag still paints each cell exactly once', async ({ page }) => {
    await page.goto('/puzzles/nonogram.html')
    const first = await page.locator('#grid button').nth(0).boundingBox()
    const third = await page.locator('#grid button').nth(2).boundingBox()
    await page.mouse.move(first!.x + first!.width / 2, first!.y + first!.height / 2)
    await page.mouse.down()
    await page.mouse.move(third!.x + third!.width / 2, third!.y + third!.height / 2, { steps: 15 })
    await page.mouse.up()
    await expect(page.locator('#grid button.fill')).toHaveCount(3)
    await expect(page.locator('#grid button').nth(0)).toHaveAccessibleName(/黑格/)
})


test('large nonograms keep arrow-key focus visible within their own scroll area', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto('/puzzles/nonogram.html')
    await page.getByRole('combobox').selectOption('5')
    await enterBoard(page)
    await page.keyboard.press('Control+End')
    const last = page.locator('#grid button').last()
    await expect(last).toBeFocused()
    await expect(last).toHaveAccessibleName(/第 15 行，第 15 列/)
    const box = await last.boundingBox()
    const wrap = await page.locator('.nwrap').boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(wrap!.x)
    expect(box!.x + box!.width).toBeLessThanOrEqual(wrap!.x + wrap!.width + 1)
    expect(box!.width).toBeGreaterThanOrEqual(24)
    await page.keyboard.press('Enter')
    await expect(last).toHaveAccessibleName(/黑格/)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(last).toBeFocused()
    await expect(last).toHaveAccessibleName(/黑格/)
    for (let c = 0; c < 14; c++) await page.keyboard.press('ArrowLeft')
    const firstColumn = page.locator('#grid button').nth(210)
    await expect(firstColumn).toBeFocused()
    const firstBox = await firstColumn.boundingBox()
    const areaBox = await page.locator('.nwrap').boundingBox()
    expect(firstBox!.x).toBeGreaterThanOrEqual(areaBox!.x + 92)
})

for (const game of ['0hh1', 'binary', '0hn0', 'iteration', 'nonogram']) {
    test(`${game}: touch or mouse activation changes one cell action, not two`, async ({ page, isMobile }) => {
        await page.goto(`/puzzles/${game}.html`)
        const back = await page.getByRole('link', { name: '← 返回', exact: true }).boundingBox()
        expect(back!.height).toBeGreaterThanOrEqual(44)
        const sizeControl = await page.getByRole('combobox').boundingBox()
        expect(sizeControl!.height).toBeGreaterThanOrEqual(44)
        const board = game === 'iteration' ? '#board' : '#grid'
        const editable = page.locator(`${board} button[aria-disabled="false"]`).first()
        const before = await editable.getAttribute('aria-label')
        const box = await editable.boundingBox()
        if (isMobile) await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2)
        else await editable.click()
        await expect(editable).not.toHaveAttribute('aria-label', before!)
        if (game === 'iteration') await expect(page.locator('#moves')).toHaveText('1 步')
        else if (game === 'nonogram') await expect(page.locator('#grid button.fill')).toHaveCount(1)
        else {
            await expect(editable).toHaveAccessibleName(game === 'binary' ? /数字 1/ : game === '0hn0' ? /黑点/ : /黑色/)
            await editable.click({ button: 'right' })
            await expect(editable).toHaveAttribute('aria-label', before!)
        }
    })
}


test('overflowing nonograms offer touch-safe navigation without taking away drag painting', async ({ page, isMobile }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto('/puzzles/nonogram.html')
    await page.getByRole('combobox').selectOption('5')
    const right = page.getByRole('button', { name: '向右查看棋盘', exact: true })
    await expect(right).toBeVisible()
    for (let i = 0; i < 10 && await right.isEnabled(); i++) {
        if (isMobile) await right.tap()
        else await right.click()
    }
    await expect(right).toBeDisabled()
    await expect(page.locator('#pan-position')).toContainText('15 列')
    const clue = await page.locator('.nclue.col').first().boundingBox()
    const firstCell = await page.locator('#grid button').first().boundingBox()
    expect(clue!.y + clue!.height).toBeLessThanOrEqual(firstCell!.y + 1)
    const cell = page.locator('#grid button').nth(14)
    const box = await cell.boundingBox()
    if (isMobile) await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2)
    else await cell.click()
    await expect(cell).toHaveAccessibleName(/第 1 行，第 15 列，黑格/)
    await page.keyboard.press('Control+End')
    const focusedLast = page.locator('#grid button').last()
    await expect(focusedLast).toBeFocused()
    expect(await focusedLast.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
    const left = page.getByRole('button', { name: '向左查看棋盘', exact: true })
    for (let i = 0; i < 10 && await left.isEnabled(); i++) await left.click()
    await expect(left).toBeDisabled()
    await page.getByRole('combobox').selectOption('0')
    await expect(right).toBeHidden()
})


test('a new keyboard visitor can choose a puzzle and return to the menu', async ({ page }) => {
    await page.goto('/puzzles/index.html')
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
    await expect(page.locator('a.card[href="/puzzles/nonogram.html"]')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/puzzles\/nonogram\.html$/)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: '← 返回', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/puzzles\/index\.html$/)
})
