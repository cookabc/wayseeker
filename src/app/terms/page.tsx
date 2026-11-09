import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: `Terms of service for ${SITE_NAME}.`,
}

export default function TermsPage() {
    return <LegalPage kind="terms" />
}
