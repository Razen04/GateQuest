export type ValidationError = string | null;

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

const FULL_NAME_MAX = 50;
const ABOUT_MAX = 100;
const COLLEGE_MAX = 100;
const URL_MAX = 200;

const TARGET_YEAR_SPAN = 5;

export const validateUsername = (value: string): ValidationError => {
    const trimmed = value.trim();
    if (!trimmed) return 'Username is required.';
    if (trimmed.length < USERNAME_MIN)
        return `Must be at least ${USERNAME_MIN} characters.`;
    if (trimmed.length > USERNAME_MAX)
        return `Must be at most ${USERNAME_MAX} characters.`;
    if (!USERNAME_PATTERN.test(trimmed))
        return 'Only letters, numbers, and underscores.';
    return null;
};

export const validateFullName = (value: string): ValidationError => {
    const trimmed = value.trim();
    if (!trimmed) return 'Full name is required.';
    if (trimmed.length > FULL_NAME_MAX)
        return `Must be at most ${FULL_NAME_MAX} characters.`;
    return null;
};

export const validateAbout = (value: string): ValidationError => {
    const trimmed = value.trim();
    if (!trimmed) return 'About is required.';
    if (trimmed.length > ABOUT_MAX)
        return `Must be at most ${ABOUT_MAX} characters.`;
    return null;
};

export const validateCollege = (value: string): ValidationError => {
    if (value.trim().length > COLLEGE_MAX)
        return `Must be at most ${COLLEGE_MAX} characters.`;
    return null;
};

// Only prepends https:// when no protocol is present. Inputs that already
// carry a protocol (https:, http:, javascript:, etc.) are left intact so
// validateSocialUrl can reject disallowed schemes rather than mangling them
// into something the URL parser silently accepts.
export const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

export const validateSocialUrl = (raw: string): ValidationError => {
    if (!raw.trim()) return null;
    if (raw.length > URL_MAX) return `Must be at most ${URL_MAX} characters.`;

    const normalized = normalizeUrl(raw);

    let url: URL;
    try {
        url = new URL(normalized);
    } catch {
        return 'Enter a valid URL.';
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return 'Only http and https links are allowed.';
    }

    // Hostname must contain a dot and no whitespace. Catches bare words
    // ("foo" → https://foo) and space-containing strings that URL() might
    // accept as a single encoded host.
    if (!url.hostname.includes('.') || /\s/.test(url.hostname)) {
        return 'Enter a valid URL.';
    }

    return null;
};

export const validateSocials = (
    socials: Record<string, string>
): ValidationError => {
    for (const [platform, url] of Object.entries(socials)) {
        const error = validateSocialUrl(url);
        if (error) return `${platform}: ${error}`;
    }
    return null;
};

export const validateBranch = (branchId: string): ValidationError => {
    if (!branchId) return 'Select a branch.';
    return null;
};

export const validateExams = (exams: string[]): ValidationError => {
    if (!exams || exams.length === 0) return 'Select at least one exam.';
    return null;
};

export const validateTargetYear = (
    year: number | null | undefined
): ValidationError => {
    if (year == null) return 'Target year is required.';
    const current = new Date().getFullYear();
    if (year <= current) return 'Target year must be in the future.';
    if (year > current + TARGET_YEAR_SPAN)
        return `Target year must be within ${TARGET_YEAR_SPAN} years.`;
    return null;
};

export const validateXLOptionals = (subjects: string[]): ValidationError => {
    if (subjects?.length !== 2) return 'Select exactly two optional subjects.';
    return null;
};
