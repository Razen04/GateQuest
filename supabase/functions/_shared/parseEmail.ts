/**
 * Parses a raw Bank credit/debit alert email body.
 *
 * Handles the format:
 *
 *   Dear Customer,
 *
 *   Thanking you for banking with Name Bank.
 *
 *   An amount of INR 140.00 has been CREDITED on 05/07/26 to your account
 *   XXXX0201 from NAME with UPI Ref No.:XXXXXXXX7979. Total Available
 *   Balance INR XX,XXX.50.If you are not expecting this credit or suspect
 *   any fraudulent activity, please contact: 18001030
 *
 *   This is an auto generated mail
 *
 * Returns a discriminated union so the caller can act on the outcome
 * without exceptions. Debits are a valid parse result — the caller
 * decides whether to act on them.
 */

export type ParseResult =
    | { status: 'credit'; utr: string; amount: number }
    | { status: 'debit' }
    | {
          status: 'unparseable';
          reason: string;
          /**
           * True if the email contains the transaction line ("An amount of
           * INR ... has been ..."), even though parsing failed after that.
           * Useful for distinguishing "this is a bank transaction email
           * that failed to parse" (alert-worthy) from "this is a promotional
           * email from bank" (silently ignore).
           */
          looksLikeTransaction: boolean;
      };

/**
 * Amount regex: matches "An amount of INR 140.00 has been CREDITED"
 * Handles optional Indian comma grouping (1,40,000.00) and US grouping.
 * Direction is captured alongside so we can filter debits immediately.
 */
const TRANSACTION_LINE_RE =
    /An\s+amount\s+of\s+INR\s+([\d,]+\.\d{2})\s+has\s+been\s+(CREDITED|DEBITED)/i;

/**
 * UPI ref regex: matches "UPI Ref No.:XXXXXXXX7979" or "UPI Ref No: XXXX..."
 * Allows optional period after "No", optional whitespace around the colon.
 * Captures alphanumeric (real UTRs are 12 digits, but banks sometimes
 * include letters — accept 8-20 chars, validate length after).
 */
const UPI_REF_RE =
    /UPI\s+Ref\s+No\.?\s*:\s*([A-Za-z0-9]{8,20})(?![A-Za-z0-9])/i;

/**
 * Detects if this is a Bank email at all (defensive).
 * The search query filters by sender, but forward rules or
 * threads could accidentally include other senders.
 */
const CANARA_MARKER_RE = /Canara\s+Bank/i;

function normalizeBody(raw: string): string {
    return (
        raw
            // Strip any HTML tags if the body arrived as HTML
            // (getPlainBody() shouldn't produce HTML, but the raw
            //  getBody() or forwarded content might).
            .replace(/<[^>]+>/g, ' ')
            // Decode a handful of common HTML entities
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            // Collapse ALL whitespace (including newlines) to single spaces.
            // This makes the regexes robust against line breaks inserted
            // by the mail client at arbitrary points.
            .replace(/\s+/g, ' ')
            .trim()
    );
}

export function parseEmail(rawBody: string): ParseResult {
    const body = normalizeBody(rawBody);

    if (!body) {
        return {
            status: 'unparseable',
            reason: 'Empty email body',
            looksLikeTransaction: false,
        };
    }

    // Defensive: if this isn't a Canara email at all, don't even try
    if (!CANARA_MARKER_RE.test(body)) {
        return {
            status: 'unparseable',
            reason: 'Not a Canara Bank email',
            looksLikeTransaction: false,
        };
    }

    const txnMatch = body.match(TRANSACTION_LINE_RE);

    if (!txnMatch) {
        // Email is from Canara but doesn't contain a transaction line.
        // Likely promotional (marketing, newsletter, service notice).
        return {
            status: 'unparseable',
            reason: 'Transaction line not found',
            looksLikeTransaction: false,
        };
    }

    const amountStr = txnMatch[1];
    const direction = txnMatch[2].toUpperCase();

    // Debits are a valid parse result — callers can skip them silently
    if (direction === 'DEBITED') {
        return { status: 'debit' };
    }

    // From here on, direction is CREDITED — we need a UTR
    const utrMatch = body.match(UPI_REF_RE);

    if (!utrMatch) {
        return {
            status: 'unparseable',
            reason: 'UPI reference number not found in credit email',
            looksLikeTransaction: true,
        };
    }

    const utr = utrMatch[1];

    // Sanity check the UTR length
    if (utr.length < 10 || utr.length > 20) {
        return {
            status: 'unparseable',
            reason: `UPI reference has unexpected length (${utr.length})`,
            looksLikeTransaction: true,
        };
    }

    // Parse amount (strip commas — Indian grouping uses them)
    const amount = Number.parseFloat(amountStr.replace(/,/g, ''));

    if (!Number.isFinite(amount) || amount <= 0) {
        return {
            status: 'unparseable',
            reason: `Invalid amount: "${amountStr}"`,
            looksLikeTransaction: true,
        };
    }

    return { status: 'credit', utr, amount };
}
