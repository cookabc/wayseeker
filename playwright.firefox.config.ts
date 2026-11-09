import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

/** Firefox desktop and narrow-window coverage; Firefox has no Playwright isMobile emulation. */
export default defineConfig({
    ...base,
    use: { ...base.use, channel: undefined },
    outputDir: './test-results/firefox',
    projects: [
        { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], browserName: 'firefox' } },
        { name: 'firefox-narrow', use: { ...devices['Desktop Firefox'], browserName: 'firefox', viewport: { width: 390, height: 844 } } },
    ],
})
