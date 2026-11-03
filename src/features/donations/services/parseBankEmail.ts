export interface BankEmailInput {
    from: string;
    body: string;
}

export interface ParsedTransaction {
    utr: string;
    amount: number;
}

/** Sender allow-list. Add a domain per bank when a new alert source
 *  is onboarded. Matching is exact on the post-`@` domain, so
 *  `canarabank.com.evil.com` never matches `canarabank.com`. */
const ALLOWED_BANK_DOMAINS: readonly string[] = ['canarabank.com'];

function extractEmailAddress(from: string): string {
    const angle = from.match(/<([^>]+)>/);
    return (angle ? angle[1] : from).trim().toLowerCase();
}

export function isAllowedBankSender(from: string): boolean {
    if (!from) return false;
    const email = extractEmailAddress(from);
    const atIndex = email.lastIndexOf('@');
    if (atIndex < 0) return false;
    const domain = email.slice(atIndex + 1);
    return ALLOWED_BANK_DOMAINS.includes(domain);
}

/** Anchored patterns — deliberately no generic "any 12 digits" fallback,
 *  so unrelated 12-digit tokens in a body can never be read as a UTR. */
const UTR_PATTERNS: readonly RegExp[] = [
    /UPI\s*Ref(?:erence)?\s*No\.?\s*:?\s*(\d{12})\b/i,
    /UPI\s*Ref(?:erence)?\s*(?:No\.?|Number|:)\s*(\d{12})/i,
];

/** Ordered — first match wins. Pattern 1 is Canara-specific and anchored
 *  on "An amount of INR X has been CREDITED" so the balance line (which
 *  also contains "INR X") can never win the race. */
const AMOUNT_PATTERNS: readonly RegExp[] = [
    /An amount of\s+(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+has been credited/i,
    /credited\s+with\s+(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+has been credited/i,
];

function extractUtr(body: string): string | null {
    for (const re of UTR_PATTERNS) {
        const match = body.match(re);
        if (match) return match[1];
    }
    return null;
}

function extractAmount(body: string): number | null {
    for (const re of AMOUNT_PATTERNS) {
        const match = body.match(re);
        if (!match) continue;
        const amount = Number(match[1].replace(/,/g, ''));
        if (Number.isFinite(amount) && amount > 0) return amount;
    }
    return null;
}

/** Returns { utr, amount } on success — nothing else, ever. Returns null
 *  if the sender is not allow-listed, or if either field cannot be
 *  extracted. Never throws. */
export function parseBankEmail(
    input: BankEmailInput
): ParsedTransaction | null {
    if (!isAllowedBankSender(input.from)) return null;
    if (!input.body) return null;

    const utr = extractUtr(input.body);
    if (!utr) return null;

    const amount = extractAmount(input.body);
    if (amount === null) return null;

    return { utr, amount };
}
