# How to Connect Your Actual Slack Workspace

To enable the real Slack integration, you need to create a **Slack App** and configure your project with the credentials.

## Step 1: Create a Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps).
2. Click **Create New App**.
3. Choose **From scratch**.
4. Name it "Task Master" (or similar) and select your workspace.

## Step 2: Configure Permissions
1. In the sidebar, go to **OAuth & Permissions**.
2. Scroll down to **Scopes** -> **User Token Scopes**.
3. Add the following scopes:
   - `channels:read` (View channels)
   - `groups:read` (View private channels)
   - `im:read` (View DMs)
   - `mpim:read` (View group DMs)
   - `chat:write` (Send messages)
   - `users:read` (View user profiles)

## Step 3: Configure Redirect URLs
1. In the sidebar, go to **OAuth & Permissions**.
2. Scroll up to **Redirect URLs**.
3. Click **Add New Redirect URL**.
4. Add: `http://localhost:5173/`
5. Click **Save URLs**.

## Step 4: Get Credentials
1. In the sidebar, go to **Basic Information**.
2. Scroll to **App Credentials**.
3. Copy the **Client ID** and **Client Secret**.

## Step 5: Configure Project
1. Create a file named `.env` in the root of your project (if it doesn't exist).
2. Add the following lines:

```env
SLACK_CLIENT_ID=your_client_id_here
VITE_SLACK_CLIENT_ID=your_client_id_here
SLACK_CLIENT_SECRET=your_client_secret_here
```

3. Restart your development server:
```bash
npm run dev
```

## Step 6: Connect
1. Open the App in your browser.
2. Go to the **Slack** tab.
3. Click **Connect Workspace**.
4. Authorize the app.
