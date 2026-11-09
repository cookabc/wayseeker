import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

/** Optional WebKit regression; the default Chromium workflow stays unchanged. */
export default defineConfig({
    ...base,
    use: { ...base.use, channel: undefined },
    outputDir: './test-results/webkit',
    projects: [
        { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], browserName: 'webkit' } },
        { name: 'webkit-mobile', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    ],
})
