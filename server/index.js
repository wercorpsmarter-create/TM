require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');

// Initialize receiver for Express app (allows custom routes alongside Bolt)
let receiver;
try {
    receiver = new ExpressReceiver({
        signingSecret: process.env.SLACK_SIGNING_SECRET || 'dummy_secret',
    });
} catch (e) {
    console.error("Failed to initialize ExpressReceiver:", e.message);
}

// Initialize Slack App
let app;
try {
    app = new App({
        token: process.env.SLACK_BOT_TOKEN || 'xoxb-dummy',
        receiver
    });
} catch (e) {
    console.error("Failed to initialize Slack App:", e.message);
}

// Middleware to parse JSON for custom routes
// Middleware to parse JSON for custom routes
// If receiver failed to init, we cannot proceed with the app
if (!receiver || !app) {
    console.error("CRITICAL: Slack Receiver or App failed to initialize. Check your .env file.");
    process.exit(1);
}

const expressApp = receiver.app;
expressApp.use(express.json());

// ------------------------------------------------------------------
// HELPERS (Mock Database & Calendar Logic)
// ------------------------------------------------------------------

const chrono = require('chrono-node');

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

// TODO: Replace with actual database call (Supabase/Firebase/Postgres)
// This function needs to find the internal User ID in your database that matches the Slack User ID
async function getAppUserFromSlackId(slackUserId) {
    console.log(`[DB] Looking up app user for Slack ID: ${slackUserId}`);
    // Example: const { data } = await supabase.from('users').select('id').eq('slack_id', slackUserId).single();
    // if (!data) return null;
    // return data.id;
    return 'mock-user-id-123';
}

// Parse text for dates and task title using chrono-node
function extractTaskDetails(text) {
    const results = chrono.parse(text);
    const today = new Date();

    if (!results || results.length === 0) {
        return {
            title: text.trim(),
            date: today, // Default to today if no date found
            isDateInferred: true
        };
    }

    // Use the first date found
    const firstResult = results[0];
    const date = firstResult.start.date();

    // Remove the date text from the title to clean it up
    let title = text.replace(firstResult.text, '').trim();
    // Clean up common prefixes like "plan:", "task:", "remind me to"
    title = title.replace(/^(?:plan|task|add|remind me to):?\s*/i, '');

    // If title is empty after removal (e.g. message was just "Tomorrow"), use original text or generic
    if (!title) title = "New Task";

    return {
        title: title,
        date: date,
        isDateInferred: false
    };
}

// TODO: Create Task in Shared Database (Supabase/Firebase)
async function createTask(userId, taskDetails) {
    console.log(`[DB] Creating task for user ${userId}:`, taskDetails);

    // Example Supabase call:
    // const { data, error } = await supabase
    //   .from('tasks')
    //   .insert([
    //     { 
    //       user_id: userId, 
    //       title: taskDetails.title, 
    //       date: taskDetails.date.toISOString().split('T')[0], // YYYY-MM-DD
    //       status: 'To-Do'
    //     }
    //   ]);

    return { id: `task-${Date.now()}`, ...taskDetails };
}

// TODO: Create Google Calendar Event
// Requires: Stored Access/Refresh Token for the user (Google OAuth)
async function createCalendarEvent(userId, taskDetails) {
    console.log(`[GCal] Creating event for user ${userId}:`, taskDetails.title, "on", taskDetails.date);

    // 1. Get user's Google tokens from DB (e.g. supabase.from('users').select('google_refresh_token')...)
    // 2. Refresh access token if needed
    // 3. Use googleapis library to insert event

    /* 
    const calendar = google.calendar({version: 'v3', auth: oauth2Client});
    await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
            summary: taskDetails.title,
            start: { date: taskDetails.date.toISOString().split('T')[0] }, // All-day event
            end: { date: taskDetails.date.toISOString().split('T')[0] }
        }
    });
    */
}

// ------------------------------------------------------------------
// SLACK EVENT HANDLERS
// ------------------------------------------------------------------

// Handler Logic
async function handleTaskRequest(text, slackUserId, say) {
    // 1. Authenticate / Map User
    const appUserId = await getAppUserFromSlackId(slackUserId);
    if (!appUserId) {
        // Step 3: Map Slack Users to Web App Users
        // Send a link to connect account
        await say(`I don't recognize your account yet! 🔗 <https://your-app-domain.com/settings|Click here to connect your Slack to Task Master>.`);
        return;
    }

    // 2. Parse (NLP Step)
    const details = extractTaskDetails(text);

    // Logic Check: Could add filter here to only proceed if keywords exist, 
    // but users usually expect bot to allow "Buy milk tomorrow" without saying "Plan:"

    // 3. Translate to Task (DB)
    await createTask(appUserId, details);

    // 4. Execute via Google Integration
    await createCalendarEvent(appUserId, details);

    // 5. Provide Feedback (The "Loop")
    const dateStr = details.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    await say(`✅ *Plan detected!* I've added *" ${details.title} "* to your calendar for ${dateStr}.`);
}

// Trigger: @Mention
app.event('app_mention', async ({ event, say }) => {
    try {
        // Remove the mention itself (<@U12345>) to cleanup text for parsing
        const cleanText = event.text.replace(/<@.*?>/g, '').trim();
        console.log(`[Event] app_mention: ${cleanText}`);

        await handleTaskRequest(cleanText, event.user, say);
    } catch (error) {
        console.error(error);
        await say(`⚠️ Sorry, I hit a snag while processing that.`);
    }
});

// Trigger: Direct Message (im:history / message.im)
app.message(async ({ message, say }) => {
    // Filter out message subtypes (like message_changed, message_deleted)
    if (message.subtype && message.subtype !== 'bot_message') return;

    // In a DM, we process *all* text as a potential task
    console.log(`[Event] DM: ${message.text}`);
    await handleTaskRequest(message.text, message.user, say);
});


// ------------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------------

(async () => {
    const port = process.env.PORT || 3000;
    try {
        await app.start(port);
        console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
        console.log(`Make sure to expose this server via ngrok for development: ngrok http ${port}`);
    } catch (error) {
        if (error.data?.error === 'invalid_auth') {
            console.log(`\n⚠️  CRITICAL: Slack Authentication Failed`);
            console.log(`   The SLACK_BOT_TOKEN in your .env file is invalid or a dummy value.`);
            console.log(`   Please replace it with a real token from api.slack.com.`);
            console.log(`   Server failed to start.\n`);
        } else {
            console.error('Failed to start server:', error);
        }
    }
})();
