import { describe, expect, it } from 'vitest';
import {
    isAllowedBankSender,
    parseBankEmail,
} from '../../services/parseBankEmail.ts';

const CANARA_FROM = 'canarabank@canarabank.com';
const CANARA_FROM_NAMED = 'Canara Bank <canarabank@canarabank.com>';

const canaraBody = (utr: string, amount: string) =>
    `Dear Customer,\n\n` +
    `Thanking you for banking with Canara Bank.\n\n` +
    `An amount of INR ${amount} has been CREDITED on 18/10/26 to your ` +
    `account  XXXX0201 from FIRSTNAME LASTNAME with UPI Ref No.:${utr}. ` +
    `Total Available Balance INR XX.53.If you are not expecting this credit ` +
    `or suspect any fraudulent activity, please contact: 18001030\n\n` +
    `This is an auto generated mail`;

const msg = (from: string, body: string) => ({ from, body });

describe('isAllowedBankSender', () => {
    it('accepts a bare Canara address', () => {
        expect(isAllowedBankSender(CANARA_FROM)).toBe(true);
    });

    it('accepts a named Canara address', () => {
        expect(isAllowedBankSender(CANARA_FROM_NAMED)).toBe(true);
    });

    it('is case-insensitive', () => {
        expect(isAllowedBankSender('CanaraBank@CanaraBank.com')).toBe(true);
    });

    it('rejects unrelated senders', () => {
        expect(isAllowedBankSender('noreply@github.com')).toBe(false);
        expect(isAllowedBankSender('alerts@someotherbank.com')).toBe(false);
    });

    it('rejects look-alike domains', () => {
        // Subdomain spoof attempt — must fail closed
        expect(isAllowedBankSender('canarabank@canarabank.com.evil.com')).toBe(
            false
        );
    });
});

describe('parseBankEmail', () => {
    describe('Canara format', () => {
        it('extracts UTR and amount from a well-formed email', () => {
            const parsed = parseBankEmail(
                msg(CANARA_FROM, canaraBody('123456789012', '50.00'))
            );
            expect(parsed).toEqual({ utr: '123456789012', amount: 50 });
        });

        it('handles a named-from header', () => {
            const parsed = parseBankEmail(
                msg(CANARA_FROM_NAMED, canaraBody('987654321098', '500.00'))
            );
            expect(parsed).toEqual({ utr: '987654321098', amount: 500 });
        });

        it('parses amounts with thousands separators', () => {
            const parsed = parseBankEmail(
                msg(CANARA_FROM, canaraBody('111111111111', '1,000.00'))
            );
            expect(parsed?.amount).toBe(1000);
        });

        it('parses integer amounts without decimals', () => {
            const parsed = parseBankEmail(
                msg(CANARA_FROM, canaraBody('222222222222', '500'))
            );
            expect(parsed?.amount).toBe(500);
        });

        it('does not confuse the amount with the balance line', () => {
            // Two INR figures present — credited amount must win.
            const body = canaraBody('333333333333', '50.00').replace(
                'INR XX.53',
                'INR 5,000.53'
            );
            const parsed = parseBankEmail(msg(CANARA_FROM, body));
            expect(parsed?.amount).toBe(50);
        });
    });

    describe('returns null for unparseable input (never partial)', () => {
        it('returns null when UTR is missing', () => {
            const body = canaraBody('', '50.00').replace(
                /UPI Ref No\.:\s*\./,
                ''
            );
            expect(parseBankEmail(msg(CANARA_FROM, body))).toBeNull();
        });

        it('returns null when amount is missing', () => {
            const body = `An amount has been CREDITED with UPI Ref No.:123456789012.`;
            expect(parseBankEmail(msg(CANARA_FROM, body))).toBeNull();
        });

        it('returns null when UTR is not a 12-digit token', () => {
            const body = canaraBody('ABC123', '50.00');
            expect(parseBankEmail(msg(CANARA_FROM, body))).toBeNull();
        });

        it('returns null when sender is not on the allow-list', () => {
            const body = canaraBody('123456789012', '50.00');
            expect(parseBankEmail(msg('noreply@github.com', body))).toBeNull();
        });

        it('returns null for an empty body', () => {
            expect(parseBankEmail(msg(CANARA_FROM, ''))).toBeNull();
        });

        it('does not throw on wildly malformed input', () => {
            expect(() =>
                parseBankEmail(msg(CANARA_FROM, '\u0000random bytes\u0001'))
            ).not.toThrow();
            expect(
                parseBankEmail(msg(CANARA_FROM, '\u0000random bytes\u0001'))
            ).toBeNull();
        });
    });

    describe('privacy contract', () => {
        it('returns only utr and amount — no body, subject, from, or balance', () => {
            const parsed = parseBankEmail(
                msg(CANARA_FROM, canaraBody('444444444444', '50.00'))
            );
            expect(parsed).not.toBeNull();
            expect(Object.keys(parsed!).sort()).toEqual(['amount', 'utr']);
        });
    });
});
