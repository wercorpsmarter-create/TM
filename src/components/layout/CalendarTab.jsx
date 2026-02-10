import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Calendar as CalendarIcon, LogIn, RefreshCcw, ChevronLeft, ChevronRight, LogOut, Video, ExternalLink } from 'lucide-react';

export default function CalendarTab({ user, setUser, tasks, onSyncClick, onAddTask }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // 'month', 'week', 'day'
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedEventId, setExpandedEventId] = useState(null);

    // Drag to create state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null); // { dayIndex: number, startMinutes: number, dateObj: Date }
    const [dragCurrent, setDragCurrent] = useState(null); // { endMinutes: number }

    const snapToQuarter = (minutes) => Math.floor(minutes / 15) * 15;

    const handleDragStart = (e, dayIndex, dateObj) => {
        // Prevent interaction if clicking on existing event
        if (e.target.closest('.event-pill')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minutes = (offsetY / 60) * 60;
        const snapped = snapToQuarter(minutes);

        setIsDragging(true);
        setDragStart({ dayIndex, startMinutes: snapped, dateObj });
        setDragCurrent({ endMinutes: snapped + 15 }); // Start with 15 min duration

        e.preventDefault();
    };

    const handleDragMove = (e) => {
        if (!isDragging || !dragStart) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minutes = (offsetY / 60) * 60;
        const snapped = snapToQuarter(minutes);

        if (snapped > dragStart.startMinutes) {
            setDragCurrent({ endMinutes: snapped });
        }
    };

    const handleDragEnd = async () => {
        if (!isDragging || !dragStart || !dragCurrent) return;

        const startMinutes = dragStart.startMinutes;
        const endMinutes = Math.max(dragCurrent.endMinutes, startMinutes + 15);

        const h = Math.floor(startMinutes / 60);
        const m = startMinutes % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        const year = dragStart.dateObj.getFullYear();
        const month = String(dragStart.dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dragStart.dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const title = window.prompt(`New Event at ${timeStr}`);

        if (title && onAddTask) {
            const duration = endMinutes - startMinutes;
            await onAddTask(dateStr, title, false, timeStr, duration);
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
    };

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
    }, [user, currentDate, view]);

    const fetchEvents = async (accessToken) => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // Default to +/- 1 month to ensure coverage
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month + 2, 0);

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
        const day = curr.getDay();
        const first = curr.getDate() - day;

        const days = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(curr);
            next.setDate(first + i);
            days.push({
                day: next.getDate(),
                month: next.getMonth(),
                year: next.getFullYear(),
                currentMonth: next.getMonth() === currentDate.getMonth(),
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
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', paddingLeft: '60px', marginBottom: '0.5rem', flexShrink: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', width: '100%', gap: '1px' }}>
                                {getDaysInWeek().map((dayObj, i) => {
                                    const isToday = new Date().toDateString() === dayObj.dateObj.toDateString();
                                    const dayName = dayObj.dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                                    return (
                                        <div key={i} style={{ textAlign: 'center', opacity: isToday ? 1 : 0.7 }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{dayName}</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>{dayObj.day}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                            <div
                                style={{ display: 'flex', minHeight: '1440px', position: 'relative', cursor: isDragging ? 'row-resize' : 'default' }}
                                onMouseMove={handleDragMove}
                                onMouseUp={handleDragEnd}
                                onMouseLeave={handleDragEnd}
                            >
                                <div style={{ position: 'absolute', inset: 0, left: '50px', pointerEvents: 'none', zIndex: 0 }}>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} style={{
                                            height: '60px',
                                            borderBottom: i < 23 ? '1px dotted rgba(0,0,0,0.1)' : 'none',
                                            borderTop: i === 0 ? '1px dotted rgba(0,0,0,0.1)' : 'none',
                                            boxSizing: 'border-box'
                                        }} />
                                    ))}
                                </div>

                                <div style={{ width: '50px', flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.05)', marginRight: '0', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.8)' }}>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} style={{ height: '60px', position: 'relative' }}>
                                            <span style={{ position: 'absolute', top: '-6px', right: '8px', fontSize: '0.7rem', color: '#94a3b8' }}>
                                                {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {(() => {
                                    const now = new Date();
                                    const minutes = now.getHours() * 60 + now.getMinutes();
                                    const topOffset = (minutes / 60) * 60;
                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            top: `${topOffset}px`,
                                            left: '50px',
                                            right: 0,
                                            height: '2px',
                                            backgroundColor: 'red',
                                            zIndex: 50,
                                            pointerEvents: 'none'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                left: '-6px',
                                                top: '-4px',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                backgroundColor: 'red'
                                            }} />
                                        </div>
                                    );
                                })()}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', width: '100%', gap: '0', zIndex: 1 }}>
                                    {getDaysInWeek().map((dayObj, i) => {
                                        const { dayEvents, dayTasks } = getItemsForDay(dayObj.day, dayObj.month, dayObj.year);

                                        const items = [
                                            ...dayEvents.map(e => {
                                                const start = new Date(e.start.dateTime || e.start.date);
                                                const end = new Date(e.end.dateTime || e.end.date);
                                                const startMinutes = start.getHours() * 60 + start.getMinutes();
                                                const duration = (end - start) / (1000 * 60);
                                                return { ...e, type: 'google', startMinutes, duration, title: e.summary };
                                            }),
                                            ...dayTasks.map(t => {
                                                let startMinutes = 0;
                                                let duration = 30;
                                                let hasTime = false;

                                                if (t.metadata) {
                                                    if (t.metadata.time) {
                                                        const [h, m] = t.metadata.time.split(':').map(Number);
                                                        startMinutes = h * 60 + m;
                                                        hasTime = true;
                                                    }
                                                    if (t.metadata.duration) {
                                                        duration = parseInt(t.metadata.duration, 10);
                                                    }
                                                }
                                                return { ...t, type: 'task', startMinutes, duration, hasTime, title: t.text };
                                            })
                                        ];

                                        return (
                                            <div key={i}
                                                style={{
                                                    position: 'relative',
                                                    borderRight: '1px solid rgba(0,0,0,0.1)',
                                                    borderLeft: i === 0 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                                                    height: '100%'
                                                }}
                                                onMouseDown={(e) => handleDragStart(e, i, dayObj.dateObj)}
                                            >
                                                {isDragging && dragStart && dragStart.dayIndex === i && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: `${(dragStart.startMinutes / 60) * 60}px`,
                                                        height: `${Math.max((dragCurrent.endMinutes - dragStart.startMinutes) / 60 * 60, 15)}px`,
                                                        left: '2px', right: '2px',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                                                        borderRadius: '4px',
                                                        zIndex: 100,
                                                        pointerEvents: 'none',
                                                        border: '1px solid var(--primary)',
                                                        color: 'white',
                                                        fontSize: '0.7rem',
                                                        padding: '2px 4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 600
                                                    }}>
                                                        {Math.floor(dragStart.startMinutes / 60)}:{String(dragStart.startMinutes % 60).padStart(2, '0')} -
                                                        {Math.floor(dragCurrent.endMinutes / 60)}:{String(dragCurrent.endMinutes % 60).padStart(2, '0')}
                                                    </div>
                                                )}

                                                {items.map((item, idx) => {
                                                    const isAllDay = item.type === 'google' && !item.start.dateTime;

                                                    if (isAllDay || (item.type === 'task' && !item.hasTime)) {
                                                        return (
                                                            <div key={idx} className={`event-pill ${item.type}`} style={{
                                                                position: 'relative',
                                                                marginBottom: '2px',
                                                                fontSize: '0.7rem',
                                                                padding: '2px 4px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {item.title}
                                                            </div>
                                                        );
                                                    }

                                                    const top = (item.startMinutes / 60) * 60;
                                                    const height = (item.duration / 60) * 60;

                                                    return (
                                                        <div key={idx} className={`event-pill ${item.type}`} style={{
                                                            position: 'absolute',
                                                            top: `${top}px`,
                                                            height: `${Math.max(height, 20)}px`,
                                                            left: '2px',
                                                            right: '2px',
                                                            fontSize: '0.75rem',
                                                            padding: '2px 4px',
                                                            overflow: 'hidden',
                                                            zIndex: 10,
                                                            border: '1px solid rgba(0,0,0,0.1)',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                            display: 'flex',
                                                            flexDirection: 'column'
                                                        }}>
                                                            <div style={{ fontWeight: 600, fontSize: '0.7rem' }}>{item.title}</div>
                                                            {height > 30 && (
                                                                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                                                                    {Math.floor(item.startMinutes / 60)}:{String(item.startMinutes % 60).padStart(2, '0')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'day' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                            <div
                                style={{ display: 'flex', minHeight: '1440px', position: 'relative', cursor: isDragging ? 'row-resize' : 'default' }}
                                onMouseMove={handleDragMove}
                                onMouseUp={handleDragEnd}
                                onMouseLeave={handleDragEnd}
                            >
                                <div style={{ position: 'absolute', inset: 0, left: '50px', pointerEvents: 'none', zIndex: 0 }}>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} style={{
                                            height: '60px',
                                            borderBottom: i < 23 ? '1px dotted rgba(0,0,0,0.1)' : 'none',
                                            borderTop: i === 0 ? '1px dotted rgba(0,0,0,0.1)' : 'none',
                                            boxSizing: 'border-box'
                                        }} />
                                    ))}
                                </div>

                                <div style={{ width: '50px', flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.05)', marginRight: '0', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.8)' }}>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} style={{ height: '60px', position: 'relative' }}>
                                            <span style={{ position: 'absolute', top: '-6px', right: '8px', fontSize: '0.7rem', color: '#94a3b8' }}>
                                                {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {(() => {
                                    const now = new Date();
                                    const minutes = now.getHours() * 60 + now.getMinutes();
                                    const topOffset = (minutes / 60) * 60;
                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            top: `${topOffset}px`,
                                            left: '50px',
                                            right: 0,
                                            height: '2px',
                                            backgroundColor: 'red',
                                            zIndex: 50,
                                            pointerEvents: 'none'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                left: '-6px',
                                                top: '-4px',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                backgroundColor: 'red'
                                            }} />
                                        </div>
                                    );
                                })()}

                                <div
                                    style={{ flex: 1, position: 'relative', borderLeft: '1px solid rgba(0,0,0,0.1)', zIndex: 1 }}
                                    onMouseDown={(e) => handleDragStart(e, 0, currentDate)} // dayIndex 0 for day view
                                >
                                    {isDragging && dragStart && (
                                        <div style={{
                                            position: 'absolute',
                                            top: `${(dragStart.startMinutes / 60) * 60}px`,
                                            height: `${Math.max((dragCurrent.endMinutes - dragStart.startMinutes) / 60 * 60, 15)}px`,
                                            left: '10px', right: '10px',
                                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                                            borderRadius: '4px',
                                            zIndex: 100,
                                            pointerEvents: 'none',
                                            border: '1px solid var(--primary)',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            padding: '2px 4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 600
                                        }}>
                                            {Math.floor(dragStart.startMinutes / 60)}:{String(dragStart.startMinutes % 60).padStart(2, '0')} -
                                            {Math.floor(dragCurrent.endMinutes / 60)}:{String(dragCurrent.endMinutes % 60).padStart(2, '0')}
                                        </div>
                                    )}

                                    {(() => {
                                        const { dayEvents, dayTasks } = getItemsForDay(currentDate.getDate(), currentDate.getMonth(), currentDate.getFullYear());

                                        const items = [
                                            ...dayEvents.map(e => {
                                                const start = new Date(e.start.dateTime || e.start.date);
                                                const end = new Date(e.end.dateTime || e.end.date);
                                                const startMinutes = start.getHours() * 60 + start.getMinutes();
                                                const duration = (end - start) / (1000 * 60);
                                                return { ...e, type: 'google', startMinutes, duration, title: e.summary };
                                            }),
                                            ...dayTasks.map(t => {
                                                let startMinutes = 0;
                                                let duration = 30;
                                                let hasTime = false;

                                                if (t.metadata) {
                                                    if (t.metadata.time) {
                                                        const [h, m] = t.metadata.time.split(':').map(Number);
                                                        startMinutes = h * 60 + m;
                                                        hasTime = true;
                                                    }
                                                    if (t.metadata.duration) {
                                                        duration = parseInt(t.metadata.duration, 10);
                                                    }
                                                }
                                                return { ...t, type: 'task', startMinutes, duration, hasTime, title: t.text };
                                            })
                                        ];

                                        const allDayItems = items.filter(item =>
                                            (item.type === 'google' && !item.start.dateTime) ||
                                            (item.type === 'task' && !item.hasTime)
                                        );

                                        const timedItems = items.filter(item =>
                                            !((item.type === 'google' && !item.start.dateTime) ||
                                                (item.type === 'task' && !item.hasTime))
                                        );

                                        return (
                                            <>
                                                <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.01)' }}>
                                                    {allDayItems.map((item, idx) => (
                                                        <div key={`ad-${idx}`} className={`event-pill ${item.type}`} style={{
                                                            position: 'relative',
                                                            marginBottom: '4px',
                                                            padding: '4px 8px',
                                                        }}>
                                                            <span style={{ fontWeight: 600 }}>All Day:</span> {item.title}
                                                        </div>
                                                    ))}
                                                </div>

                                                {timedItems.map((item, idx) => {
                                                    const top = (item.startMinutes / 60) * 60;
                                                    const height = (item.duration / 60) * 60;
                                                    const isExpanded = expandedEventId === (item.id || idx);

                                                    return (
                                                        <div key={idx}
                                                            onClick={() => setExpandedEventId(isExpanded ? null : (item.id || idx))}
                                                            className={`event-pill ${item.type}`}
                                                            style={{
                                                                position: 'absolute',
                                                                top: `${top}px`,
                                                                height: isExpanded ? 'auto' : `${Math.max(height, 40)}px`,
                                                                minHeight: `${Math.max(height, 40)}px`,
                                                                left: '10px',
                                                                right: '10px',
                                                                padding: '8px',
                                                                zIndex: isExpanded ? 50 : 10,
                                                                border: '1px solid rgba(0,0,0,0.1)',
                                                                boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.1)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{item.title}</div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.8, display: 'flex', gap: '0.5rem' }}>
                                                                <span>{Math.floor(item.startMinutes / 60)}:{String(item.startMinutes % 60).padStart(2, '0')}</span>
                                                                {item.type === 'google' && item.hangoutLink && <Video size={12} />}
                                                            </div>
                                                            {isExpanded && item.hangoutLink && (
                                                                <div style={{ marginTop: '0.5rem' }}>
                                                                    <a href={item.hangoutLink} target="_blank" rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        style={{
                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                            color: 'var(--primary)', textDecoration: 'none', fontWeight: 600,
                                                                            background: 'rgba(37, 99, 235, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'
                                                                        }}>
                                                                        <Video size={14} /> Join Meet
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
