"use strict";

import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getCalendarEvents() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        throw new Error("Not authenticated");
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    try {
        let allEvents: any[] = [];
        let pageToken: string | undefined = undefined;

        do {
            const response = await calendar.events.list({
                calendarId: "primary",
                timeMin: new Date().toISOString(),
                singleEvents: true,
                orderBy: "startTime",
                pageToken: pageToken,
            });

            const events = response.data.items || [];
            allEvents = [...allEvents, ...events];
            pageToken = response.data.nextPageToken as string | undefined;
        } while (pageToken);

        return allEvents.map((event) => ({
            id: event.id,
            title: event.summary || "No Title",
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
        }));
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw new Error("Failed to fetch calendar events");
    }
}
