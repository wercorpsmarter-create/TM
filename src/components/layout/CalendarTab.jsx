import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Calendar as CalendarIcon, LogIn, RefreshCcw, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

export default function CalendarTab({ user, setUser, tasks, onSyncClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            setUser(tokenResponse);
        },
        scope: 'https://www.googleapis.com/auth/calendar',
    });

    const logout = () => {
        setUser(null);
        setEvents([]);
    };

    useEffect(() => {
        if (user && user.access_token) {
            fetchEvents(user.access_token);
        }
    }, [user, currentDate]);

    const fetchEvents = async (accessToken) => {
        setLoading(true);
        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfMonth}&timeMax=${endOfMonth}&singleEvents=true&orderBy=startTime`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response.status === 401) {
                setUser(null);
                return;
            }

            const data = await response.json();
            setEvents(data.items || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const prevMonthDays = new Date(year, month, 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, month: month - 1, year: year, currentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, month: month, year: year, currentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, month: month + 1, year: year, currentMonth: false });
        }
        return days;
    };

    const getItemsForDay = (d, m, y) => {
        const dateObj = new Date(y, m, d);
        const dayToDateString = dateObj.toDateString();
        const yearStr = dateObj.getFullYear();
        const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dayStr = String(dateObj.getDate()).padStart(2, '0');
        const isoDateStr = `${yearStr}-${monthStr}-${dayStr}`;

        const dayEvents = events.filter(e => {
            const start = new Date(e.start.dateTime || e.start.date).toDateString();
            return start === dayToDateString;
        });

        const dayTasks = tasks.filter(t => t.date === isoDateStr);
        return { dayEvents, dayTasks };
    };

    const days = getDaysInMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', margin: 0 }}>
                        <CalendarIcon size={24} /> {monthName} {currentDate.getFullYear()}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {!user ? (
                    <button onClick={() => login()} className="btn-icon" style={{ width: 'auto', padding: '0 1.5rem', display: 'flex', gap: '0.5rem' }}>
                        <LogIn size={18} /> Login
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={onSyncClick} className="btn-icon" style={{ width: 'auto', padding: '0 1rem', display: 'flex', gap: '0.5rem', background: 'white', color: 'var(--text-main)', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <RefreshCcw size={16} /> Sync Plans
                        </button>
                        <button onClick={logout} className="btn-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div className="glass-card" style={{ padding: '0.5rem' }}>
                <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="calendar-header-cell">{d}</div>
                    ))}
                    {days.map((dayObj, i) => {
                        const { dayEvents, dayTasks } = getItemsForDay(dayObj.day, dayObj.month, dayObj.year);
                        const isToday = new Date().toDateString() === new Date(dayObj.year, dayObj.month, dayObj.day).toDateString();

                        return (
                            <div key={i} className={`calendar-day ${!dayObj.currentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}>
                                <div className="day-number">{dayObj.day}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                    {dayEvents.map(e => (
                                        <div key={e.id} className="event-pill google" title={e.summary}>
                                            {e.summary}
                                        </div>
                                    ))}
                                    {dayTasks.map(t => (
                                        <div key={t.id} className="event-pill hub" title={t.text}>
                                            • {t.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
