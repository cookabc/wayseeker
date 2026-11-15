import { test, type Page } from '@playwright/test'

export async function setLanguage(page: Page, language: string) {
    const url = test.info().project.use.baseURL
    if (!url) throw new Error('Language fixtures require the configured baseURL')
    await page.context().addCookies([{ name: 'i18next', value: language, url }])
}
