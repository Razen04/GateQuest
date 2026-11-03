/// <reference lib="deno.ns" />

import type { BankEmailInput } from '../../../src/features/donations/services/parseBankEmail.ts';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Keep the query as narrow as possible — this is the primary privacy
// control. Only Canara's alert address is read, only the last 15 minutes.
const SENDER_FILTER = 'from:canarabank@canarabank.com';
const LOOKBACK_MINUTES = 15;

interface GmailMessageRef {
    id: string;
}
interface GmailHeader {
    name: string;
    value: string;
}
interface GmailPart {
    mimeType?: string;
    headers?: GmailHeader[];
    body?: { data?: string; size?: number };
    parts?: GmailPart[];
}
interface GmailMessage {
    id: string;
    payload?: GmailPart;
}

async function getAccessToken(): Promise<string> {
    const clientId = Deno.env.get('GMAIL_CLIENT_ID');
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN');
    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(
            'Gmail OAuth not configured (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)'
        );
    }

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });
    if (!res.ok) {
        throw new Error(
            `Gmail token failed: ${res.status} ${await res.text()}`
        );
    }
    const { access_token } = await res.json();
    return access_token;
}

async function listMessageIds(token: string): Promise<string[]> {
    const q = encodeURIComponent(
        `${SENDER_FILTER} newer_than:${LOOKBACK_MINUTES}m`
    );
    const res = await fetch(`${GMAIL_API}/messages?q=${q}&maxResults=25`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Gmail list failed: ${res.status}`);
    const { messages } = (await res.json()) as {
        messages?: GmailMessageRef[];
    };
    return (messages ?? []).map((m) => m.id);
}

function header(headers: GmailHeader[] | undefined, name: string): string {
    if (!headers) return '';
    return (
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
            ?.value ?? ''
    );
}

function base64UrlDecode(data: string): string {
    const padded = data.replace(/-/g, '+').replace(/_/g, '/');
    const pad =
        padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function findPlainText(part: GmailPart | undefined): string {
    if (!part) return '';
    if (part.mimeType === 'text/plain' && part.body?.data) {
        return base64UrlDecode(part.body.data);
    }
    for (const child of part.parts ?? []) {
        const found = findPlainText(child);
        if (found) return found;
    }
    return '';
}

function findHtml(part: GmailPart | undefined): string {
    if (!part) return '';
    if (part.mimeType === 'text/html' && part.body?.data) {
        return base64UrlDecode(part.body.data);
    }
    for (const child of part.parts ?? []) {
        const found = findHtml(child);
        if (found) return found;
    }
    return '';
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function fetchOne(token: string, id: string): Promise<BankEmailInput> {
    const res = await fetch(`${GMAIL_API}/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Gmail fetch ${id} failed: ${res.status}`);
    const msg = (await res.json()) as GmailMessage;

    const from = header(msg.payload?.headers, 'From');
    let body = findPlainText(msg.payload);
    if (!body) body = stripHtml(findHtml(msg.payload));
    return { from, body };
}

export async function fetchRecentBankEmails(): Promise<BankEmailInput[]> {
    const token = await getAccessToken();
    const ids = await listMessageIds(token);

    const emails: BankEmailInput[] = [];
    for (const id of ids) {
        try {
            emails.push(await fetchOne(token, id));
        } catch (err) {
            console.error(`Skipping message ${id}:`, err);
        }
    }
    return emails;
}
