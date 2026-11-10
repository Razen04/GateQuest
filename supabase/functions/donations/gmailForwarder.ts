/**
 * GATEQuest — Canara Bank donation email forwarder
 *
 * Runs every 5 minutes:
 *   1. Searches Gmail for Canara Bank emails from the last 2 hours
 *      that haven't been labeled "gatequest-processed"
 *   2. POSTs each email body to the donation-webhook edge function
 *   3. Applies the processed label on verified/skipped outcomes
 *      (unmatched emails stay unlabeled → will retry next cycle,
 *       handles the "user pays before submitting form" case)
 *
 * Setup:
 *   1. Set Script Properties (Project Settings → Script Properties):
 *        WEBHOOK_URL    = https://<prod-ref>.supabase.co/functions/v1/donation-webhook
 *        WEBHOOK_SECRET = <same value as DONATION_WEBHOOK_SECRET on Supabase>
 *   2. Run setUpTrigger() once → grant permissions → creates 5-min trigger
 *   3. Optional: run testOnce() to manually test before enabling trigger
 */

const CONFIG = {
    SEARCH_QUERY:
        'from:canarabank.com newer_than:2h -label:gatequest-processed',
    PROCESSED_LABEL: 'gatequest-processed',
    MAX_THREADS: 20,
};

/**
 * Main polling function. Called by the time-driven trigger.
 */
function pollGmail() {
    const props = PropertiesService.getScriptProperties();
    const webhookUrl = props.getProperty('WEBHOOK_URL');
    const webhookSecret = props.getProperty('WEBHOOK_SECRET');

    if (!webhookUrl || !webhookSecret) {
        Logger.log(
            '❌ ERROR: WEBHOOK_URL or WEBHOOK_SECRET not set in Script Properties'
        );
        return;
    }

    const label = getOrCreateLabel(CONFIG.PROCESSED_LABEL);
    const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, CONFIG.MAX_THREADS);

    Logger.log(`📬 Found ${threads.length} unprocessed thread(s)`);

    let processed = 0;
    let skipped = 0;
    let unmatched = 0;
    let errored = 0;

    for (const thread of threads) {
        const messages = thread.getMessages();
        let threadProcessed = false;

        for (const message of messages) {
            // Defensive: skip if already labeled (search should exclude)
            if (
                message
                    .getThread()
                    .getLabels()
                    .some((l) => l.getName() === CONFIG.PROCESSED_LABEL)
            ) {
                skipped++;
                threadProcessed = true;
                break;
            }

            const body = message.getPlainBody();
            if (!body || body.length === 0) {
                Logger.log(`⚠️  Empty body in message ${message.getId()}`);
                skipped++;
                continue;
            }

            const result = postToWebhook(webhookUrl, webhookSecret, body);

            if (!result) {
                // Network or HTTP error — don't label, retry next cycle
                errored++;
                Logger.log(
                    `❌ Message ${message.getId()}: webhook call failed, will retry`
                );
                continue;
            }

            Logger.log(
                `✅ Message ${message.getId()}: ${JSON.stringify(result)}`
            );

            if (shouldMarkProcessed(result)) {
                thread.addLabel(label);
                processed++;
                threadProcessed = true;
                break; // one label per thread is sufficient
            } else {
                // Unmatched — leave unlabeled, retry next cycle
                unmatched++;
            }
        }

        if (!threadProcessed) {
            Logger.log(
                `⏸️  Thread ${thread.getId()}: no processable message yet`
            );
        }
    }

    Logger.log(
        `🏁 Cycle complete: processed=${processed}, skipped=${skipped}, ` +
            `unmatched=${unmatched}, errored=${errored}`
    );
}

/**
 * Determines whether to apply the processed label based on the webhook result.
 *
 *   verified / already_verified → label (done, no retry needed)
 *   skipped (debit/promotional) → label (no retry needed)
 *   unmatched                    → don't label (retry for late submissions)
 *   anything else / null         → don't label (retry on error)
 */
function shouldMarkProcessed(result) {
    if (!result || !result.status) return false;
    const status = result.status;
    return (
        status === 'verified' ||
        status === 'already_verified' ||
        status === 'skipped'
    );
}

/**
 * POSTs the email body to the webhook endpoint.
 * Returns parsed JSON response, or null on any error.
 */
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
            Logger.log(`⚠️  HTTP ${code}: ${response.getContentText()}`);
            return null;
        }

        return JSON.parse(response.getContentText());
    } catch (err) {
        Logger.log(`❌ Fetch error: ${err.message}`);
        return null;
    }
}

/**
 * Returns the label, creating it if it doesn't exist.
 */
function getOrCreateLabel(name) {
    let label = GmailApp.getUserLabelByName(name);
    if (!label) {
        label = GmailApp.createLabel(name);
        Logger.log(`🏷️  Created label "${name}"`);
    }
    return label;
}

/**
 * Sets up the 5-minute trigger. Run manually ONCE.
 * Removes any existing triggers first to avoid duplicates.
 */
function setUpTrigger() {
    // Delete existing triggers to prevent duplicates
    const existing = ScriptApp.getProjectTriggers();
    existing.forEach((t) => ScriptApp.deleteTrigger(t));
    Logger.log(`🧹 Removed ${existing.length} existing trigger(s)`);

    // Create a 5-minute interval trigger
    ScriptApp.newTrigger('pollGmail').timeBased().everyMinutes(5).create();

    Logger.log('✅ Trigger created: pollGmail every 5 minutes');
    Logger.log('👉 To disable: run removeTrigger() or use the Apps Script UI');
}

/**
 * Removes all triggers. Use to pause the automation without deleting code.
 */
function removeTrigger() {
    const existing = ScriptApp.getProjectTriggers();
    existing.forEach((t) => ScriptApp.deleteTrigger(t));
    Logger.log(`🗑️  Removed ${existing.length} trigger(s)`);
}

/**
 * Manual test entry point. Runs one cycle without setting up a trigger.
 * Use this to validate Gmail access + webhook connectivity before enabling.
 */
function testOnce() {
    Logger.log('🧪 Running one test cycle...');
    pollGmail();
    Logger.log('🧪 Test cycle complete');
}

/**
 * Diagnostic: lists Canara emails from the last 7 days without posting.
 * Use this first to verify the search query matches real emails.
 */
function diagnose() {
    // Which account is this script running as?
    const activeEmail = Session.getActiveUser().getEmail();
    const effectiveEmail = Session.getEffectiveUser().getEmail();
    Logger.log(`👤 Active user:    ${activeEmail}`);
    Logger.log(`👤 Effective user: ${effectiveEmail}`);

    // Test 1: Search all mail (including Spam/Trash) for "Canara"
    const threads1 = GmailApp.search('Canara newer_than:60d', 0, 10);
    Logger.log(
        `🔍 Test 1 — "Canara newer_than:60d" (excl. spam/trash): ${threads1.length}`
    );

    // Test 2: Search everything including Spam/Trash
    const threads2 = GmailApp.search(
        'in:anywhere Canara newer_than:60d',
        0,
        10
    );
    Logger.log(
        `🔍 Test 2 — "in:anywhere Canara" (incl. spam/trash): ${threads2.length}`
    );

    // Test 3: Search Spam specifically
    const threads3 = GmailApp.search('in:spam Canara newer_than:60d', 0, 10);
    Logger.log(`🔍 Test 3 — "in:spam Canara": ${threads3.length}`);

    // Test 4: Search for the exact phrase from the body
    const threads4 = GmailApp.search(
        '"Thanking you for banking with Canara Bank" newer_than:60d',
        0,
        10
    );
    Logger.log(`🔍 Test 4 — body phrase: ${threads4.length}`);

    // Log a few results if any found
    const anyThreads = [threads1, threads2, threads3, threads4].find(
        (arr) => arr.length > 0
    );
    if (anyThreads) {
        Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        Logger.log('📋 Sample matches:');
        for (const thread of anyThreads.slice(0, 3)) {
            const messages = thread.getMessages();
            for (const message of messages) {
                Logger.log(`   Date:    ${message.getDate().toISOString()}`);
                Logger.log(`   From:    ${message.getFrom()}`);
                Logger.log(`   Subject: ${message.getSubject()}`);
                Logger.log(
                    `   Labels:  ${message
                        .getThread()
                        .getLabels()
                        .map((l) => l.getName())
                        .join(', ')}`
                );
                Logger.log('   ───');
            }
        }
    } else {
        Logger.log('❌ No results from ANY search variation — see notes below');
    }
}
