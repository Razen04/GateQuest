import { assertEquals, assertObjectMatch } from 'jsr:@std/assert';
import { describe, it } from 'jsr:@std/testing/bdd';
import { parseEmail } from '../../_shared/parseEmail.ts';
import {
    DEBIT_EMAIL,
    HTML_WRAPPED,
    LARGE_AMOUNT_WITH_COMMAS,
    MISSING_UTR,
    MULTILINE_BROKEN,
    NOT_CANARA,
    PROMOTIONAL,
    REAL_SAMPLE_FULL_UTR,
    REAL_SAMPLE_MASKED,
    WHITESPACE_VARIATIONS,
} from '../_shared/fixtures.ts';

describe('parseEmail — Canara Bank credit alerts', () => {
    describe('successful credit extraction', () => {
        it('parses the user-supplied real sample', () => {
            const result = parseEmail(REAL_SAMPLE_MASKED);
            assertEquals(result, {
                status: 'credit',
                utr: 'XXXXXXXX7979',
                amount: 140,
            });
        });

        it('extracts a full 12-digit UTR', () => {
            const result = parseEmail(REAL_SAMPLE_FULL_UTR);
            assertEquals(result, {
                status: 'credit',
                utr: '421234567890',
                amount: 169,
            });
        });

        it('handles Indian comma grouping in amounts', () => {
            const result = parseEmail(LARGE_AMOUNT_WITH_COMMAS);
            assertEquals(result, {
                status: 'credit',
                utr: '421234567890',
                amount: 140000,
            });
        });

        it('parses HTML-wrapped bodies', () => {
            const result = parseEmail(HTML_WRAPPED);
            assertEquals(result, {
                status: 'credit',
                utr: '421234567890',
                amount: 140,
            });
        });

        it('normalizes whitespace variations', () => {
            const result = parseEmail(WHITESPACE_VARIATIONS);
            assertEquals(result, {
                status: 'credit',
                utr: '421234567890',
                amount: 140,
            });
        });

        it('handles line breaks inside the transaction line', () => {
            const result = parseEmail(MULTILINE_BROKEN);
            assertEquals(result, {
                status: 'credit',
                utr: '421234567890',
                amount: 140,
            });
        });
    });

    describe('debit filtering', () => {
        it('returns debit status for DEBITED emails', () => {
            const result = parseEmail(DEBIT_EMAIL);
            assertEquals(result, { status: 'debit' });
        });
    });

    describe('unparseable handling', () => {
        it('flags credit emails missing UTR as transaction-looking', () => {
            const result = parseEmail(MISSING_UTR);
            assertObjectMatch(result, {
                status: 'unparseable',
                looksLikeTransaction: true,
            });
        });

        it('flags promotional Canara emails as non-transaction', () => {
            const result = parseEmail(PROMOTIONAL);
            assertObjectMatch(result, {
                status: 'unparseable',
                looksLikeTransaction: false,
            });
        });

        it('flags non-Canara emails', () => {
            const result = parseEmail(NOT_CANARA);
            assertObjectMatch(result, {
                status: 'unparseable',
                looksLikeTransaction: false,
            });
        });

        it('handles empty input', () => {
            const result = parseEmail('');
            assertObjectMatch(result, {
                status: 'unparseable',
                looksLikeTransaction: false,
            });
        });

        it('handles whitespace-only input', () => {
            const result = parseEmail('   \n\n\t  ');
            assertObjectMatch(result, {
                status: 'unparseable',
                looksLikeTransaction: false,
            });
        });
    });

    describe('edge cases', () => {
        it('does not false-positive on the word "credit" in boilerplate', () => {
            // The sample email contains "If you are not expecting this credit"
            // in the footer. A naive `includes('credit')` would match that.
            // Our parser only matches the specific "has been CREDITED" phrase.
            const result = parseEmail(REAL_SAMPLE_MASKED);
            assertEquals(result.status, 'credit');
        });

        it('rejects UTRs shorter than 10 characters', () => {
            const shortUtrEmail = REAL_SAMPLE_FULL_UTR.replace(
                '421234567890',
                '4212'
            );
            const result = parseEmail(shortUtrEmail);
            assertEquals(result.status, 'unparseable');
        });

        it('rejects UTRs longer than 20 characters', () => {
            const longUtrEmail = REAL_SAMPLE_FULL_UTR.replace(
                '421234567890',
                '42123456789012345678901'
            );
            const result = parseEmail(longUtrEmail);
            assertEquals(result.status, 'unparseable');
        });

        it('rejects zero or negative amounts', () => {
            const zeroAmountEmail = REAL_SAMPLE_FULL_UTR.replace(
                'INR 169.00',
                'INR 0.00'
            );
            const result = parseEmail(zeroAmountEmail);
            assertEquals(result.status, 'unparseable');
        });
    });
});
