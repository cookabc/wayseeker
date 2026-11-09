/** Reproducible cold-cache startup probe; run against an existing production server. */
import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
const origin = option('--origin', 'http://127.0.0.1:4000')
const runs = Number(option('--runs', '3'))
const output = option('--output', '/tmp/wayseeker-startup.json')
const label = option('--label', 'startup')
const settings = { latencyMs: 400, downloadBytesPerSecond: 50 * 1024, cpuSlowdown: 4, viewport: { width: 390, height: 844 } }
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true })
const environment = { browser: browser.version(), node: process.version }
const samples = []
try {
    for (const lang of ['en', 'zh']) {
        for (let run = 1; run <= runs; run++) {
            const context = await browser.newContext({ viewport: settings.viewport, locale: lang === 'zh' ? 'zh-CN' : 'en-US' })
            await context.addInitScript((language) => {
                localStorage.setItem('i18nextLng', language)
                localStorage.setItem('wayseeker-theme', 'light')
                window.__startup = { lcp: 0, cls: 0, longTasks: 0 }
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) window.__startup.lcp = entry.startTime
                }).observe({ type: 'largest-contentful-paint', buffered: true })
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__startup.cls += entry.value
                }).observe({ type: 'layout-shift', buffered: true })
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) window.__startup.longTasks += Math.max(0, entry.duration - 50)
                }).observe({ type: 'longtask', buffered: true })
            }, lang)
            const page = await context.newPage()
            const session = await context.newCDPSession(page)
            let navigationTimestamp = 0
            const fontRequestStarts = []
            session.on('Network.requestWillBeSent', (event) => {
                if (event.type === 'Document') navigationTimestamp = event.timestamp
                if (event.type === 'Font') fontRequestStarts.push({
                    name: new URL(event.request.url).pathname.split('/').pop(),
                    startMs: (event.timestamp - navigationTimestamp) * 1000,
                })
            })
            await session.send('Network.enable')
            await session.send('Network.clearBrowserCache')
            await session.send('Network.setCacheDisabled', { cacheDisabled: true })
            await session.send('Network.emulateNetworkConditions', {
                offline: false, latency: settings.latencyMs, downloadThroughput: settings.downloadBytesPerSecond,
                uploadThroughput: settings.downloadBytesPerSecond, connectionType: 'cellular3g',
            })
            await session.send('Emulation.setCPUThrottlingRate', { rate: settings.cpuSlowdown })
            await page.goto(origin + '/?plan=k4x9f2&anchor=timing#prescription', { waitUntil: 'commit', timeout: 90000 })
            await page.waitForFunction((language) => document.documentElement.lang === language && document.querySelectorAll('.rx-name').length === 5, lang, { timeout: 90000 })
            const sample = await page.evaluate(() => ({
                fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
                planReadyMs: performance.now(),
                lcpAtReadyMs: window.__startup.lcp, clsAtReady: window.__startup.cls, longTaskExcessAtReadyMs: window.__startup.longTasks,
                resources: performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/_next/')).map((entry) => ({
                    name: new URL(entry.name).pathname.split('/').pop(),
                    type: /\.css(?:\?|$)/.test(entry.name) ? 'css' : /\.woff2(?:\?|$)/.test(entry.name) ? 'font' : entry.name.includes('/_next/image?') ? 'image' : 'js',
                    startMs: entry.startTime, endMs: entry.responseEnd, encodedBytes: entry.encodedBodySize, decodedBytes: entry.decodedBodySize,
                })),
            }))
            samples.push({ lang, run, ...sample, fontRequestStarts })
            console.log(JSON.stringify({ label, lang, run, fcpMs: sample.fcpMs, planReadyMs: sample.planReadyMs, lcpAtReadyMs: sample.lcpAtReadyMs, clsAtReady: sample.clsAtReady }))
            await context.close()
        }
    }
} finally {
    await browser.close()
}
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const medians = Object.fromEntries(['en', 'zh'].map((lang) => {
    const group = samples.filter((sample) => sample.lang === lang)
    return [lang, { fcpMs: median(group.map((sample) => sample.fcpMs)), planReadyMs: median(group.map((sample) => sample.planReadyMs)) }]
}))
await writeFile(output, JSON.stringify({ label, environment, settings, samples, medians }, null, 2) + '\n')
console.log(JSON.stringify({ label, medians, output }))
