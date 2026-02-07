# How to Connect Slack (User Token Method)

The application now supports a "Bring Your Own Token" model, which is simpler for individual users than setting up a full OAuth server flow.

## 1. Create a Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps).
2. Click **Create New App** -> **From scratch**.
3. Name it "Task Master Personal" and select your workspace.

## 2. Add Permissions (Scopes)
1. In the sidebar, click **OAuth & Permissions**.
2. Scroll to **User Token Scopes**.
3. Add the following scopes:
   - `channels:read` (View public channels)
   - `groups:read` (View private channels)
   - `chat:write` (Send messages)
   - `channels:history` (View messages in public channels)
   - `groups:history` (View messages in private channels)
   - `im:read` (View DMs) - *Optional*
   - `im:history` (View DM history) - *Optional*

## 3. Install & Get Token
1. Scroll up to **OAuth Tokens for Your Workspace**.
2. Click **Install to Workspace**.
3. Allow the permissions.
4. Copy the **User OAuth Token**. It should start with `xoxp-...`.

## 4. Connect in App
1. Open the Task Master app.
2. Go to the **Slack** tab.
3. Paste your token into the input field.
4. Click **Connect Account**.

Your token is saved locally in your browser, so you don't need to enter it every time.
