"use client"

import { LogOut, Calendar as CalendarIcon, Clock } from "lucide-react"
import { signOut } from "next-auth/react"
import { format } from "date-fns"

interface Event {
    id: string
    title: string
    start: string
    end: string
}

export default function CalendarEvents({ events }: { events: Event[] }) {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Upcoming Events
                        </h1>
                        <p className="text-slate-500 mt-2">Your synchronized Google Calendar schedule</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 bg-slate-900 border border-white/10 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </header>

                {events.length === 0 ? (
                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-20 text-center">
                        <CalendarIcon className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                        <h2 className="text-xl font-semibold text-slate-400">No upcoming events found</h2>
                        <p className="text-slate-600 mt-2">Try adding some events to your Google Calendar!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="group bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-blue-500/30 p-6 rounded-3xl transition-all hover:-translate-y-1 shadow-xl"
                            >
                                <h3 className="text-lg font-bold mb-4 line-clamp-2">{event.title}</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                                        <CalendarIcon className="w-4 h-4 text-blue-400" />
                                        {format(new Date(event.start), "EEEE, MMMM do")}
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        {format(new Date(event.start), "p")} - {format(new Date(event.end), "p")}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
