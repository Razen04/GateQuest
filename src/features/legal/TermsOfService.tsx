import termsContent from '@/shared/data/legal/terms.md?raw';
import { LegalPage } from './LegalPage';

const LAST_UPDATED = 'November 7, 2026';

export default function TermsOfService() {
    return (
        <LegalPage
            title="Terms of Service"
            lastUpdated={LAST_UPDATED}
            content={termsContent}
        />
    );
}
