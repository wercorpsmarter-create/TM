# Slack Task Master Integration Plan

## Overview
You want to enable a system where forwarding a message or mentioning a "@Task Master" bot in Slack automatically creates a task in your app and a Google Calendar event.

## ⚠️ Critical Architectural Change Required
Currently, your application runs entirely in the browser using **LocalStorage**. 
**A Slack Bot (which runs on a server) cannot access the LocalStorage in your browser.**

To make this work, we must:
1.  **Introduce a Central Database**: Move from LocalStorage to a cloud database (like **Supabase** or **Firebase**) so both the Web App and the Slack Bot can read/write the same data.
2.  **Create a Backend Server**: A small server (or serverless function) to receive messages from Slack, process them, and save them to the database.

---

## Step 1: Set up a Database (Supabase Recommended)
Since you are using React, **Supabase** is a great choice as it provides a Postgres database and authentication out of the box.

1.  Create a Supabase project at [supabase.com](https://supabase.com).
2.  Create a `tasks` table with fields: `id`, `user_id`, `title`, `date`, `status`, `google_calendar_id`.
3.  We will update `src/utils/api.js` to read/write from Supabase instead of LocalStorage.

## Step 2: The Slack Bot (Backend)
I will provide the code for a simple **Node.js/Express server** that:
1.  Listens for Slack Events (mentions, messages).
2.  Uses an OpenAI/Gemini API (optional but recommended) or simple logic to "extract" the plan from the message.
3.  Inserts the task into the Supabase database.
4.  Uses the Google Calendar API (stored refreshtokens) to create the calendar event.

## Step 3: Deployment
To make the Slack Bot work live, this server code needs to be deployed to a public URL (e.g., **Vercel**, **Render**, or **Railway**). Slack needs a public URL to send events to.

---

## Action Plan
I have removed the old Slack tab. Now, would you like me to:
1.  **Draft the Supabase Migration**: Update `api.js` to be ready for Supabase?
2.  **Write the Slack Bot Server Code**: Create a `server/` folder with the code needed to handle Slack messages?

(I will assume "Yes" to writing the server code as a starting point so you can see how it works).
