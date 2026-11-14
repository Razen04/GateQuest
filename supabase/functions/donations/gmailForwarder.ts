/**
 * GATEQuest - Canara Bank donation email forwarder
 *
 * Runs every 5 minutes. Uses message-ID tracking (in Script Properties)
 * instead of Gmail labels as the exclusion mechanism, because Canara
 * puts every alert in one giant thread (same subject + sender), and
 * thread-level labels would block future messages in that thread.
 *
 * Labels are still applied for visual reference in Gmail, but are NOT
 * used in the search query.
 *
 * WARNING: this file must contain only ASCII characters. Em-dashes,
 * emoji, box-drawing characters, and smart quotes will cause
 * "Unexpected token ILLEGAL" parse errors in Apps Script.
 */

const CONFIG = {
    SEARCH_QUERY: 'from:canarabank.com newer_than:2h',
    VISUAL_LABEL: 'gatequest-processed',
    PROCESSED_IDS_KEY: 'gatequest_processed_message_ids',
    MAX_PROCESSED_IDS: 100,
    MAX_THREADS: 20,
};

function pollGmail() {
    const currentMinute = new Date().getMinutes();
    if (currentMinute % 2 !== 0) {
        return; // silently skip
    }
    const props = PropertiesService.getScriptProperties();
    const webhookUrl = props.getProperty('WEBHOOK_URL');
    const webhookSecret = props.getProperty('WEBHOOK_SECRET');

    if (!webhookUrl || !webhookSecret) {
        Logger.log(
            '[ERROR] WEBHOOK_URL or WEBHOOK_SECRET not set in Script Properties'
        );
        return;
    }

    // Load the set of already-processed message IDs
    const processedIds = loadProcessedIds(props);
    const processedSet = new Set(processedIds);

    // Search ALL Canara emails in the window - no label filter.
    // Threads can contain many messages; we filter per-message below.
    const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, CONFIG.MAX_THREADS);

    Logger.log('[INFO] Found ' + threads.length + ' thread(s) in window');

    const label = getOrCreateLabel(CONFIG.VISUAL_LABEL);
    const cutoffMs = Date.now() - 2 * 3600 * 1000;

    let processed = 0;
    let skipped = 0;
    let unmatched = 0;
    let errored = 0;

    for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const messages = thread.getMessages();
        let anyProcessed = false;

        for (let j = 0; j < messages.length; j++) {
            const message = messages[j];
            const msgId = message.getId();

            // Already processed this exact message?
            if (processedSet.has(msgId)) {
                skipped++;
                continue;
            }

            // Skip messages older than the 2-hour window even if the
            // thread was found (threads can span days with Canara)
            if (message.getDate().getTime() < cutoffMs) {
                continue;
            }

            const body = message.getPlainBody();
            if (!body || body.length === 0) {
                Logger.log('[WARN] Empty body in message ' + msgId);
                skipped++;
                continue;
            }

            const result = postToWebhook(webhookUrl, webhookSecret, body);

            if (!result) {
                errored++;
                Logger.log(
                    '[ERROR] Message ' +
                        msgId +
                        ': webhook call failed, will retry'
                );
                continue;
            }

            Logger.log('[OK] Message ' + msgId + ': ' + JSON.stringify(result));

            if (shouldMarkProcessed(result)) {
                processedSet.add(msgId);
                anyProcessed = true;
                processed++;
            } else {
                // Unmatched - don't add to set, retry next cycle
                unmatched++;
            }
        }

        // Visual label only - has no effect on search anymore
        if (anyProcessed) {
            thread.addLabel(label);
        }
    }

    // Persist the processed set (trim to last N)
    saveProcessedIds(props, processedSet);

    Logger.log(
        '[DONE] Cycle complete: processed=' +
            processed +
            ', skipped=' +
            skipped +
            ', unmatched=' +
            unmatched +
            ', errored=' +
            errored +
            ', tracked_ids=' +
            processedSet.size
    );
}

function loadProcessedIds(props) {
    try {
        const raw = props.getProperty(CONFIG.PROCESSED_IDS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        Logger.log(
            '[WARN] Corrupt processed-IDs property, resetting: ' + e.message
        );
        return [];
    }
}

function saveProcessedIds(props, set) {
    const arr = Array.from(set);
    // Keep only the most recent N - search window is 2h, so 100 is
    // massive overkill (typically 0-2 messages/day)
    const trimmed = arr.slice(-CONFIG.MAX_PROCESSED_IDS);
    props.setProperty(CONFIG.PROCESSED_IDS_KEY, JSON.stringify(trimmed));
}

function shouldMarkProcessed(result) {
    if (!result || !result.status) return false;
    const status = result.status;
    return (
        status === 'verified' ||
        status === 'already_verified' ||
        status === 'skipped'
    );
}

function postToWebhook(url, secret, body) {
    try {
        const response = UrlFetchApp.fetch(url, {
            method: 'post',
            contentType: 'application/json',
            headers: { 'x-cron-secret': secret },
            payload: JSON.stringify({ body: body }),
            muteHttpExceptions: true,
        });

        const code = response.getResponseCode();
        if (code < 200 || code >= 300) {
            Logger.log(
                '[WARN] HTTP ' + code + ': ' + response.getContentText()
            );
            return null;
        }

        return JSON.parse(response.getContentText());
    } catch (err) {
        Logger.log('[ERROR] Fetch error: ' + err.message);
        return null;
    }
}

function getOrCreateLabel(name) {
    let label = GmailApp.getUserLabelByName(name);
    if (!label) {
        label = GmailApp.createLabel(name);
        Logger.log('[INFO] Created label "' + name + '"');
    }
    return label;
}

/**
 * Sets up the 5-minute trigger. Run manually ONCE.
 */
function setUpTrigger() {
    const existing = ScriptApp.getProjectTriggers();
    existing.forEach((t) => ScriptApp.deleteTrigger(t));
    Logger.log('[INFO] Removed ' + existing.length + ' existing trigger(s)');

    // 1-minute trigger, but pollGmail() skips odd minutes
    ScriptApp.newTrigger('pollGmail').timeBased().everyMinutes(1).create();

    Logger.log(
        '[OK] Trigger created: pollGmail every 1 minute, runs on even minutes only'
    );
}

function removeTrigger() {
    const existing = ScriptApp.getProjectTriggers();
    for (let i = 0; i < existing.length; i++) {
        ScriptApp.deleteTrigger(existing[i]);
    }
    Logger.log('[INFO] Removed ' + existing.length + ' trigger(s)');
}

/**
 * Manual test entry point.
 */
function testOnce() {
    Logger.log('[TEST] Running one test cycle...');
    pollGmail();
    Logger.log('[TEST] Test cycle complete');
}

/**
 * Recovery helper for the current incident AND for ad-hoc debugging:
 * temporarily widens the search to reprocess historical emails.
 *
 * Pass daysBack = 2 for a 48-hour lookback (safe - legitimately only
 * affects last 48 hours of Canara emails).
 *
 * Also clears the processed-ID set so historical messages get
 * reprocessed (idempotent - verified donations return already_verified,
 * debits get skipped).
 */
function recoverMissedEmails(daysBack) {
    const props = PropertiesService.getScriptProperties();

    // Clear processed IDs so we reprocess from scratch within the window
    props.deleteProperty(CONFIG.PROCESSED_IDS_KEY);
    Logger.log('[INFO] Cleared processed-ID set');

    // Temporarily swap the search window
    const originalQuery = CONFIG.SEARCH_QUERY;
    CONFIG.SEARCH_QUERY = 'from:canarabank.com newer_than:' + daysBack + 'd';

    Logger.log(
        '[INFO] Running recovery poll over last ' + daysBack + ' day(s)...'
    );
    try {
        pollGmail();
    } finally {
        CONFIG.SEARCH_QUERY = originalQuery;
    }

    Logger.log('[OK] Recovery complete. Processed-ID set has been rebuilt.');
    Logger.log(
        '[INFO] Next scheduled poll will return to normal 2-hour window.'
    );
}

/**
 * Diagnostic: lists all Canara emails in the window with their IDs,
 * dates, and whether they're tracked as processed.
 */
function diagnose() {
    const props = PropertiesService.getScriptProperties();
    const processedSet = new Set(loadProcessedIds(props));

    Logger.log('[INFO] Active user: ' + Session.getActiveUser().getEmail());
    Logger.log('[INFO] Tracked processed IDs: ' + processedSet.size);
    Logger.log('[INFO] Search query: ' + CONFIG.SEARCH_QUERY);

    const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, 20);
    Logger.log('[INFO] Found ' + threads.length + ' thread(s)');

    for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const messages = thread.getMessages();
        Logger.log(
            '--- Thread ' +
                thread.getId() +
                ' : ' +
                messages.length +
                ' message(s) ---'
        );
        for (let j = 0; j < messages.length; j++) {
            const message = messages[j];
            const msgId = message.getId();
            const isProcessed = processedSet.has(msgId);
            const date = message.getDate().toISOString();
            const subject = message.getSubject();
            const bodyPreview = message
                .getPlainBody()
                .substring(0, 80)
                .replace(/\s+/g, ' ');
            Logger.log(
                '   ' +
                    (isProcessed ? '[X]' : '[ ]') +
                    ' ' +
                    msgId +
                    '  ' +
                    date +
                    '  ' +
                    subject
            );
            Logger.log('      "' + bodyPreview + '..."');
        }
    }
}
