import privacyContent from '@/shared/data/legal/privacy.md?raw';
import { LegalPage } from './LegalPage';

const LAST_UPDATED = 'November 7, 2026';

export default function PrivacyPolicy() {
    return (
        <LegalPage
            title="Privacy Policy"
            lastUpdated={LAST_UPDATED}
            content={privacyContent}
        />
    );
}
