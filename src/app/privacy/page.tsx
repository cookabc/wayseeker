import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: `Privacy policy for ${SITE_NAME}.`,
}

export default function PrivacyPage() {
    return <LegalPage kind="privacy" />
}
