export type SupportedLanguage = 'en' | 'zh'

/** Only values written by the app are accepted as an explicit cookie preference. */
export function readLanguagePreference(value: string | null | undefined): SupportedLanguage | null {
    if (!value) return null
    const language = value.trim().toLowerCase()
    return language === 'en' || language === 'zh' ? language : null
}

/** Pure request negotiation, shared by the server layout and unit tests. */
export function resolveRequestLanguage(
    cookieLanguage: string | null | undefined,
    acceptLanguage: string | null | undefined,
): SupportedLanguage {
    const preference = readLanguagePreference(cookieLanguage)
    if (preference) return preference

    const candidates: Array<{ language: SupportedLanguage; quality: number; order: number }> = []
    for (const [order, item] of (acceptLanguage ?? '').split(',').entries()) {
        const [rawTag, ...parameters] = item.trim().split(';')
        const tag = rawTag.trim().toLowerCase()
        if (!/^(?:en|zh)(?:-[a-z0-9]{1,8})*$/.test(tag)) continue
        const qualityParameter = parameters.find((parameter) => /^q\s*=/i.test(parameter.trim()))
        const rawQuality = qualityParameter?.slice(qualityParameter.indexOf('=') + 1).trim()
        if (rawQuality !== undefined && !/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(rawQuality)) continue
        const quality = rawQuality === undefined ? 1 : Number(rawQuality)
        if (quality === 0) continue
        candidates.push({ language: tag.startsWith('zh') ? 'zh' : 'en', quality, order })
    }
    candidates.sort((a, b) => b.quality - a.quality || a.order - b.order)
    return candidates[0]?.language ?? 'en'
}
