import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import LoginButton from "@/components/dashboard/LoginButton"
import CalendarEvents from "@/components/dashboard/CalendarEvents"
import { getCalendarEvents } from "@/app/actions/calendar"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <LoginButton />
  }

  try {
    const events = await getCalendarEvents()
    return <CalendarEvents events={events} />
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error loading events</h1>
          <p className="text-slate-400 mb-6">There was a problem fetching your Google Calendar data.</p>
          <LoginButton />
        </div>
      </div>
    )
  }
}
