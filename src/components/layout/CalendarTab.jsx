import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Calendar as CalendarIcon, LogIn, RefreshCcw, ChevronLeft, ChevronRight, LogOut, Video, ExternalLink } from 'lucide-react';

export default function CalendarTab({ user, setUser, tasks, onSyncClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // 'month', 'week', 'day'
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedEventId, setExpandedEventId] = useState(null);

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
            // Fetch based on view? 
            // For simplicity, always fetch the CURRENT MONTH surrounding the currentDate
            // to ensure we have data. If week spans two months, might miss some?
            // Let's broaden existing fetch or keep it simple.
            // If we are in week view, currentDate is still a specific day.
            // We'll trust the month fetch for now or we could optimize later.
            fetchEvents(user.access_token);
        }
    }, [user, currentDate, view]);

    const fetchEvents = async (accessToken) => {
        setLoading(true);
        try {
            // Determine range based on view? 
            // Actually, fetching a larger range (like +/- 1 month) is safer but let's stick to current month logic
            // primarily, or adapt if view is week/day across boundaries.

            let start, end;

            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // Default to monthly fetch logic to cover most cases
            start = new Date(year, month, 1);
            end = new Date(year, month + 1, 0, 23, 59, 59);

            // If in week view and it crosses month, expand slightly?
            // Let's just fetch previous, current, next month to be safe? 
            // Or just stick to current month logic for now as 'currentDate' shifts.

            const startStr = start.toISOString();
            const endStr = end.toISOString();

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startStr}&timeMax=${endStr}&singleEvents=true&orderBy=startTime`,
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

    const getDaysInWeek = () => {
        const curr = new Date(currentDate);
        const day = curr.getDay(); // 0 (Sun) to 6 (Sat)
        // Adjust to make week start on Sunday? standard is Sunday=0

        const first = curr.getDate() - day;

        const days = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(curr);
            next.setDate(first + i);
            days.push({
                day: next.getDate(),
                month: next.getMonth(),
                year: next.getFullYear(),
                currentMonth: next.getMonth() === currentDate.getMonth(), // strictly speaking
                dateObj: next
            });
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

    const handleNext = () => {
        if (view === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else if (view === 'week') {
            const nextWeek = new Date(currentDate);
            nextWeek.setDate(currentDate.getDate() + 7);
            setCurrentDate(nextWeek);
        } else {
            const nextDay = new Date(currentDate);
            nextDay.setDate(currentDate.getDate() + 1);
            setCurrentDate(nextDay);
        }
    };

    const handlePrev = () => {
        if (view === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else if (view === 'week') {
            const prevWeek = new Date(currentDate);
            prevWeek.setDate(currentDate.getDate() - 7);
            setCurrentDate(prevWeek);
        } else {
            const prevDay = new Date(currentDate);
            prevDay.setDate(currentDate.getDate() - 1);
            setCurrentDate(prevDay);
        }
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const weekRange = view === 'week'
        ? `${getDaysInWeek()[0].dateObj.getDate()} - ${getDaysInWeek()[6].dateObj.getDate()}`
        : '';

    return (
        <div style={{ padding: '1rem 1rem 6rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', margin: 0, minWidth: '200px' }}>
                        <CalendarIcon size={24} />
                        {view === 'month' && `${monthName} ${currentDate.getFullYear()}`}
                        {view === 'week' && `${monthName} ${weekRange}`}
                        {view === 'day' && currentDate.toDateString()}
                    </h2>

                    <div className="view-switcher" style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                        {['month', 'week', 'day'].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                style={{
                                    background: view === v ? 'white' : 'transparent',
                                    color: view === v ? 'var(--primary)' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handlePrev} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={handleNext} className="btn-icon" style={{ width: '32px', height: '32px' }}>
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

            <div className="glass-card" style={{ padding: '0.5rem', minHeight: '500px' }}>
                {view === 'month' && (
                    <div className="calendar-grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="calendar-header-cell">{d}</div>
                        ))}
                        {getDaysInMonth().map((dayObj, i) => {
                            const { dayEvents, dayTasks } = getItemsForDay(dayObj.day, dayObj.month, dayObj.year);
                            const isToday = new Date().toDateString() === new Date(dayObj.year, dayObj.month, dayObj.day).toDateString();

                            return (
                                <div
                                    key={i}
                                    className={`calendar-day ${!dayObj.currentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                                    onClick={() => {
                                        setCurrentDate(new Date(dayObj.year, dayObj.month, dayObj.day));
                                        setView('day');
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
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
                )}

                {view === 'week' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: '100%', gap: '1px' }}>
                        {getDaysInWeek().map((dayObj, i) => {
                            const { dayEvents, dayTasks } = getItemsForDay(dayObj.day, dayObj.month, dayObj.year);
                            const isToday = new Date().toDateString() === dayObj.dateObj.toDateString();
                            const dayName = dayObj.dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', borderRight: i < 6 ? '1px solid rgba(255,255,255,0.1)' : 'none', padding: '0.5rem' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '1rem', opacity: isToday ? 1 : 0.7 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{dayName}</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>{dayObj.day}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                                        {dayEvents.map(e => (
                                            <div key={e.id} className="event-pill google" style={{ whiteSpace: 'normal', padding: '4px 8px', position: 'relative' }}>
                                                {e.summary}
                                                <div style={{ fontSize: '0.6rem', opacity: 0.7, marginBottom: e.hangoutLink ? '2px' : '0' }}>
                                                    {new Date(e.start.dateTime || e.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {e.hangoutLink && (
                                                    <a
                                                        href={e.hangoutLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Join Meet"
                                                        onClick={(ev) => ev.stopPropagation()}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            background: 'rgba(37, 99, 235, 0.15)',
                                                            color: 'var(--primary)',
                                                            textDecoration: 'none',
                                                            borderRadius: '4px',
                                                            padding: '2px 6px',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 600,
                                                            marginTop: '2px'
                                                        }}
                                                    >
                                                        <Video size={10} /> Join
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                        {dayTasks.map(t => (
                                            <div key={t.id} className="event-pill hub" style={{ whiteSpace: 'normal', padding: '4px 8px' }}>
                                                • {t.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {view === 'day' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {(() => {
                            const { dayEvents, dayTasks } = getItemsForDay(currentDate.getDate(), currentDate.getMonth(), currentDate.getFullYear());

                            // Sort all items by time if possible, roughly
                            const allItems = [
                                ...dayEvents.map(e => ({ ...e, type: 'google', time: new Date(e.start.dateTime || e.start.date) })),
                                ...dayTasks.map(t => ({ ...t, type: 'task', time: new Date() })) // Tasks often have no time, assume all day or top
                            ].sort((a, b) => a.time - b.time);

                            return (
                                <div style={{ padding: '0 2rem', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {allItems.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No events scheduled for today.</div>}

                                        {allItems.map((item, idx) => (
                                            <div key={idx}
                                                onClick={() => setExpandedEventId(expandedEventId === (item.id || idx) ? null : (item.id || idx))}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem',
                                                    padding: '1rem',
                                                    background: item.type === 'google' ? 'rgba(255,255,255,0.5)' : 'rgba(96, 165, 250, 0.1)',
                                                    borderRadius: '12px',
                                                    borderLeft: `4px solid ${item.type === 'google' ? '#94a3b8' : 'var(--primary)'}`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <div style={{ fontWeight: 700, minWidth: '80px', fontSize: '0.9rem' }}>
                                                        {item.type === 'google'
                                                            ? item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : 'All Day'
                                                        }
                                                    </div>
                                                    <div style={{ fontWeight: 500, flex: 1 }}>
                                                        {item.summary || item.text}
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                {expandedEventId === (item.id || idx) && item.type === 'google' && (
                                                    <div style={{
                                                        marginTop: '0.5rem',
                                                        paddingTop: '0.5rem',
                                                        borderTop: '1px solid rgba(0,0,0,0.05)',
                                                        display: 'flex',
                                                        gap: '1rem',
                                                        fontSize: '0.85rem'
                                                    }} onClick={(e) => e.stopPropagation()}>
                                                        {item.hangoutLink && (
                                                            <a href={item.hangoutLink} target="_blank" rel="noopener noreferrer" style={{
                                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                                color: 'var(--primary)', textDecoration: 'none', fontWeight: 600,
                                                                background: 'rgba(37, 99, 235, 0.1)', padding: '4px 8px', borderRadius: '6px'
                                                            }}>
                                                                <Video size={14} /> Join Meet
                                                            </a>
                                                        )}
                                                        {item.htmlLink && (
                                                            <a href={item.htmlLink} target="_blank" rel="noopener noreferrer" style={{
                                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                                color: 'var(--text-muted)', textDecoration: 'none',
                                                                padding: '4px 8px'
                                                            }}>
                                                                <ExternalLink size={14} /> View Event
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div >
    );
}
