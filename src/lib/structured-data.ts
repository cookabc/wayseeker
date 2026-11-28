import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './site.ts'

/**
 * JSON-LD identity graph for the homepage: WebSite + Organization so agents can
 * resolve the brand name to the canonical domain programmatically.
 */
export function buildHomeJsonLd(): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                name: SITE_NAME,
                url: SITE_URL,
                description: SITE_DESCRIPTION,
                inLanguage: ['en', 'zh'],
                publisher: { '@id': `${SITE_URL}/#organization` },
            },
            {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: SITE_NAME,
                url: SITE_URL,
                description: SITE_DESCRIPTION,
                email: CONTACT_EMAIL,
                logo: {
                    '@type': 'ImageObject',
                    url: `${SITE_URL}/icon.svg`,
                },
            },
        ],
    }
}
