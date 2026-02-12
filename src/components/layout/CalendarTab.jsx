import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, LogIn, RefreshCcw, ChevronLeft, ChevronRight, LogOut, Video, ExternalLink, Clock, MapPin, AlignLeft, X, Users } from 'lucide-react';

import MiniCalendar from './MiniCalendar';

export default function CalendarTab({ user, setUser, tasks, onSyncClick, onAddTask, onLogin, externalPopupTrigger }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState(() => localStorage.getItem('calendar_view') || 'month'); // 'month', 'week', 'day'

    // Save view to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('calendar_view', view);
    }, [view]);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendarIds, setSelectedCalendarIds] = useState(new Set());
    const [showSidebar, setShowSidebar] = useState(() => {
        const saved = localStorage.getItem('calendar_show_sidebar');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('calendar_show_sidebar', JSON.stringify(showSidebar));
    }, [showSidebar]);

    const [newEventData, setNewEventData] = useState({
        title: '',
        participants: '',
        location: '',
        description: '',
        dateStr: '',
        timeStr: '',
        duration: 30,
        eventType: 'event', // 'event', 'task', 'appointment'
        addMeet: false
    });

    // Drag to create state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null); // { dayIndex: number, startMinutes: number, dateObj: Date }
    const [dragCurrent, setDragCurrent] = useState(null); // { endMinutes: number }

    // Handle external popup trigger (e.g. from Dashboard)
    useEffect(() => {
        if (externalPopupTrigger && externalPopupTrigger.isOpen) {
            const { title, dateStr, timeStr } = externalPopupTrigger;

            // Navigate to the date
            if (dateStr) {
                const parts = dateStr.split('-');
                let newDate;
                if (parts.length === 3) {
                    // Create date at noon to avoid timezone rollover issues
                    newDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                } else {
                    newDate = new Date(dateStr);
                }
                setCurrentDate(newDate);
                setView('week'); // Switch to week view to see the context
            }

            // Prep modal data
            setNewEventData(prev => ({
                ...prev,
                title: title || '',
                dateStr: dateStr || new Date().toISOString().split('T')[0],
                timeStr: timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                participants: '',
                location: '',
                description: '',
                addMeet: false
            }));

            // Position modal in center
            setModalPosition({
                top: Math.max(20, window.innerHeight / 2 - 200),
                left: Math.max(20, window.innerWidth / 2 - 224)
            });

            setShowEventModal(true);
        }
    }, [externalPopupTrigger]);

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

    const handleDragEnd = async (e) => {
        if (!isDragging || !dragStart || !dragCurrent) return;

        // Calculate Position next to cursor logic
        let x = e ? e.clientX : window.innerWidth / 2;
        let y = e ? e.clientY : window.innerHeight / 2;

        const modalWidth = 448;
        const modalHeight = 550;
        const padding = 20;

        // Default: Place to the right of cursor
        let finalX = x + padding;

        // If not enough space on right, place on left
        if (finalX + modalWidth > window.innerWidth - padding) {
            finalX = x - modalWidth - padding;
        }

        // Ensure Y is within bounds
        let finalY = y - (modalHeight / 4); // Center vertically relative to click slightly

        if (finalY + modalHeight > window.innerHeight - padding) {
            finalY = window.innerHeight - modalHeight - padding;
        }
        if (finalY < padding) {
            finalY = padding;
        }

        // Ensure X allows visibility (in case screen is too narrow)
        if (finalX < padding) finalX = padding;

        setModalPosition({ top: finalY, left: finalX });

        const startMinutes = dragStart.startMinutes;
        const endMinutes = Math.max(dragCurrent.endMinutes, startMinutes + 15);

        const h = Math.floor(startMinutes / 60);
        const m = startMinutes % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        const year = dragStart.dateObj.getFullYear();
        const month = String(dragStart.dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dragStart.dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        setNewEventData({
            title: '',
            participants: '',
            dateStr,
            timeStr,
            duration: endMinutes - startMinutes
        });
        setShowEventModal(true);
        setIsDragging(false);
    };

    const handleSaveEvent = async () => {
        if (!newEventData.title) return;

        let description = '';
        if (newEventData.participants) {
            description += `Participants: ${newEventData.participants}\n`;
        }
        if (newEventData.location) {
            description += `Location: ${newEventData.location}\n`;
        }
        if (newEventData.description) {
            description += `\n${newEventData.description}`;
        }

        const attendeesList = newEventData.participants
            ? newEventData.participants.split(/[,;]+/).map(p => p.trim()).filter(p => p)
            : [];

        if (onAddTask) {
            await onAddTask(
                newEventData.dateStr,
                newEventData.title,
                true,
                newEventData.timeStr,
                newEventData.duration,
                description,
                newEventData.location,
                attendeesList,
                newEventData.addMeet
            );
        }

        setShowEventModal(false);
        setDragStart(null);
        setDragCurrent(null);
    };

    const logout = () => {
        setUser(null);
        setEvents([]);
    };

    useEffect(() => {
        if (user && user.access_token) {
            fetchCalendars(user.access_token);
        }
    }, [user]);

    useEffect(() => {
        if (user && user.access_token) {
            fetchEvents(user.access_token);
        }
    }, [user, currentDate, view, selectedCalendarIds]);

    useEffect(() => {
        if (selectedCalendarIds.size > 0) {
            localStorage.setItem('calendar_selected_ids', JSON.stringify(Array.from(selectedCalendarIds)));
        }
    }, [selectedCalendarIds]);

    const fetchCalendars = async (accessToken) => {
        try {
            const response = await fetch(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (response.ok) {
                const data = await response.json();
                const items = data.items || [];
                setCalendars(items);

                // Try to load selection from local storage
                const savedSelection = localStorage.getItem('calendar_selected_ids');
                let initialSelected;

                if (savedSelection) {
                    try {
                        const savedArray = JSON.parse(savedSelection);
                        // Filter saved IDs to only those that exist in the current calendar list
                        const validIds = savedArray.filter(id => items.some(c => c.id === id));
                        if (validIds.length > 0) {
                            initialSelected = new Set(validIds);
                        }
                    } catch (e) {
                        console.error('Error parsing saved calendar selection', e);
                    }
                }

                if (!initialSelected || initialSelected.size === 0) {
                    // Fallback: select based on API 'selected' property or primary
                    initialSelected = new Set(items.filter(c => c.selected).map(c => c.id));
                    if (initialSelected.size === 0 && items.length > 0) {
                        const primary = items.find(c => c.primary);
                        if (primary) initialSelected.add(primary.id);
                    }
                }
                setSelectedCalendarIds(initialSelected);
            }
        } catch (error) {
            console.error('Error fetching calendars:', error);
        }
    };

    const fetchEvents = async (accessToken) => {
        if (selectedCalendarIds.size === 0) {
            setEvents([]);
            return;
        }

        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // Default to +/- 1 month to ensure coverage
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month + 2, 0);

            const startStr = start.toISOString();
            const endStr = end.toISOString();

            const promises = Array.from(selectedCalendarIds).map(async (calendarId) => {
                try {
                    const response = await fetch(
                        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${startStr}&timeMax=${endStr}&singleEvents=true&orderBy=startTime`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (response.status === 401) {
                        setUser(null);
                        return [];
                    }

                    const data = await response.json();
                    return (data.items || []).map(item => ({
                        ...item,
                        calendarId,
                        // If the event doesn't have a color, use the calendar color (we'll need to look this up from the calendars list)
                        calendarColor: calendars.find(c => c.id === calendarId)?.backgroundColor
                    }));
                } catch (e) {
                    console.error(`Error fetching events for calendar ${calendarId}:`, e);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            const allEvents = results.flat();
            setEvents(allEvents);
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
                    <button onClick={() => onLogin()} className="btn-icon" style={{ width: 'auto', padding: '0 1.5rem', display: 'flex', gap: '0.5rem' }}>
                        <LogIn size={18} /> Login
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="btn-icon"
                            style={{
                                width: 'auto',
                                padding: '0 1rem',
                                display: 'flex',
                                gap: '0.5rem',
                                background: showSidebar ? 'rgba(0,0,0,0.05)' : 'white',
                                color: 'var(--text-main)',
                                border: '1px solid rgba(0,0,0,0.1)'
                            }}
                        >
                            <AlignLeft size={18} />
                        </button>
                        <button onClick={onSyncClick} className="btn-icon" style={{ width: 'auto', padding: '0 1rem', display: 'flex', gap: '0.5rem', background: 'white', color: 'var(--text-main)', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <RefreshCcw size={16} /> Sync Plans
                        </button>
                        <button onClick={logout} className="btn-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                {showSidebar && user && (
                    <div style={{ width: '250px', flexShrink: 0 }}>
                        <div className="glass-card" style={{ padding: '1rem', minHeight: '200px' }}>
                            <MiniCalendar
                                currentMainDate={currentDate}
                                onDateSelect={(date) => {
                                    setCurrentDate(date);
                                    // Optional: Switch to day/week view? User said "zooms to it". 
                                    // Navigating to the date in the current view is standard, but 'zoom' implies detail.
                                    // If we are in 'month' view, maybe we stay in month view but just go there?
                                    // Notion Calendar behavior: clicking a date in mini cal just navigates.
                                    // But user used the word "zoom". Let's stick to navigation.
                                }}
                            />
                            <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', margin: '0.5rem 0 1rem 0' }}></div>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>My Calendars</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {calendars.map(cal => (
                                    <label key={cal.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer', padding: '4px', borderRadius: '6px' }} className="calendar-item">
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedCalendarIds.has(cal.id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(selectedCalendarIds);
                                                    if (e.target.checked) {
                                                        newSet.add(cal.id);
                                                    } else {
                                                        newSet.delete(cal.id);
                                                    }
                                                    setSelectedCalendarIds(newSet);
                                                }}
                                                style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
                                            />
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '4px',
                                                border: `2px solid ${cal.backgroundColor}`,
                                                backgroundColor: selectedCalendarIds.has(cal.id) ? cal.backgroundColor : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}>
                                                {selectedCalendarIds.has(cal.id) && (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <span style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {cal.summary}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="glass-card" style={{ padding: '0.5rem', minHeight: '500px', flex: 1 }}>
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
                                            {dayEvents.map(e => {
                                                const cal = calendars.find(c => c.id === e.calendarId);
                                                const color = e.colorId // Event specific color?
                                                    ? null // We'd need a color map for this, ignoring for now or mapping specific IDs
                                                    : (cal?.backgroundColor || '#039be5');

                                                return (
                                                    <div key={e.id} className="event-pill google" title={e.summary}
                                                        style={{
                                                            backgroundColor: color,
                                                            borderColor: 'transparent',
                                                            color: '#fff', // Assuming dark text on light bg or vice versa? Google colors are usually dark enough for white, or we check
                                                            borderLeft: 'none'
                                                        }}
                                                    >
                                                        {e.summary}
                                                    </div>
                                                );
                                            })}
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', width: '100%', gap: '1px' }}>
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

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', width: '100%', gap: '0', zIndex: 1 }}>
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
                                                            left: '4px', right: '4px',
                                                            background: 'rgba(59, 130, 246, 0.25)',
                                                            backdropFilter: 'blur(4px)',
                                                            WebkitBackdropFilter: 'blur(4px)',
                                                            borderRadius: '6px',
                                                            zIndex: 100,
                                                            pointerEvents: 'none',
                                                            border: '1px solid rgba(59, 130, 246, 0.5)',
                                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                                                            color: '#1e3a8a',
                                                            fontSize: '0.75rem',
                                                            padding: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 600,
                                                            transition: 'height 0.1s ease-out'
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
                                                                    textOverflow: 'ellipsis',
                                                                    backgroundColor: item.color,
                                                                    borderColor: item.color ? 'transparent' : undefined,
                                                                    color: item.color ? '#fff' : undefined
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
                                                                flexDirection: 'column',
                                                                backgroundColor: item.color,
                                                                borderColor: item.color ? 'transparent' : undefined,
                                                                color: item.color ? '#fff' : undefined
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
                                                background: 'rgba(59, 130, 246, 0.25)',
                                                backdropFilter: 'blur(4px)',
                                                WebkitBackdropFilter: 'blur(4px)',
                                                borderRadius: '6px',
                                                zIndex: 100,
                                                pointerEvents: 'none',
                                                border: '1px solid rgba(59, 130, 246, 0.5)',
                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                                                color: '#1e3a8a',
                                                fontSize: '0.75rem',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 600,
                                                transition: 'height 0.1s ease-out'
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
                                                                backgroundColor: item.color,
                                                                borderColor: item.color ? 'transparent' : undefined,
                                                                color: item.color ? '#fff' : undefined
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
                                                                    cursor: 'pointer',
                                                                    backgroundColor: item.color,
                                                                    borderColor: item.color ? 'transparent' : undefined,
                                                                    color: item.color ? '#fff' : undefined
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

            {/* Google Calendar Style Modal */}
            {
                showEventModal && createPortal(
                    <>
                        {/* Transparent backdrop to catch outside clicks if desired, or just let it float */}
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'transparent' }}
                            onClick={() => { setShowEventModal(false); setDragStart(null); }}
                        />

                        <div style={{
                            position: 'fixed',
                            top: modalPosition.top,
                            left: modalPosition.left,
                            zIndex: 9999,
                            width: '448px',
                            background: 'rgba(255, 255, 255, 0.85)', // Glassmorphic background
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            animation: 'fadeIn 0.1s ease-out'
                        }}>
                            {/* Header Drag Handle / Close */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ flex: 1 }}></div>
                                <button
                                    onClick={() => { setShowEventModal(false); setDragStart(null); }}
                                    style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', color: '#5f6368', padding: '6px', borderRadius: '50%', display: 'flex', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Title Input */}
                            <div style={{ marginLeft: '40px' }}>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Add title"
                                    value={newEventData.title}
                                    onChange={e => setNewEventData({ ...newEventData, title: e.target.value })}
                                    style={{
                                        width: '100%',
                                        fontSize: '22px',
                                        padding: '8px',
                                        border: 'none',
                                        borderBottom: '2px solid rgba(0,0,0,0.1)',
                                        background: 'transparent',
                                        outline: 'none',
                                        fontFamily: 'Google Sans, Roboto, Arial, sans-serif',
                                        color: '#1f2937'
                                    }}
                                    onFocus={e => e.target.style.borderBottom = '2px solid #1a73e8'}
                                    onBlur={e => e.target.style.borderBottom = '2px solid rgba(0,0,0,0.1)'}
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    {['event', 'task', 'appointment'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setNewEventData({ ...newEventData, eventType: type })}
                                            style={{
                                                background: newEventData.eventType === type ? '#e8f0fe' : 'transparent',
                                                color: newEventData.eventType === type ? '#1a73e8' : '#5f6368',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                textTransform: 'capitalize',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {type === 'appointment' ? 'Appointment schedule' : type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Row */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ width: '24px', display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
                                    <Clock size={20} color="#5f6368" />
                                </div>
                                <div style={{ fontSize: '14px', color: '#3c4043', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontWeight: 500 }}>
                                        {new Date(newEventData.dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        <span style={{ margin: '0 8px', color: '#9ca3af' }}>⋅</span>
                                        {newEventData.timeStr}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#5f6368' }}>Does not repeat</div>
                                </div>
                            </div>

                            {/* Guests Row */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                                    <Users size={20} color="#5f6368" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add guests (email addresses)"
                                    value={newEventData.participants}
                                    onChange={e => setNewEventData({ ...newEventData, participants: e.target.value })}
                                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', color: '#3c4043', fontFamily: 'Roboto, Arial, sans-serif', padding: '8px 0' }}
                                />
                            </div>

                            {/* Meet Row */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                                    <Video size={20} color="#5f6368" />
                                </div>
                                {!newEventData.addMeet ? (
                                    <button
                                        onClick={() => setNewEventData({ ...newEventData, addMeet: true })}
                                        style={{
                                            background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px',
                                            padding: '8px 16px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                        }}>
                                        Add Google Meet video conferencing
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <button
                                            style={{
                                                background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px',
                                                padding: '8px 16px', fontSize: '14px', fontWeight: 500, cursor: 'default',
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                            }}>
                                            <Video size={16} /> Join with Google Meet
                                        </button>
                                        <span style={{ fontSize: '12px', color: '#5f6368', marginLeft: '2px' }}>
                                            Link generated on save
                                            <button
                                                onClick={() => setNewEventData({ ...newEventData, addMeet: false })}
                                                style={{ border: 'none', background: 'none', color: '#5f6368', cursor: 'pointer', marginLeft: '8px' }}>
                                                <X size={12} />
                                            </button>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Location Row */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                                    <MapPin size={20} color="#5f6368" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add location"
                                    value={newEventData.location}
                                    onChange={e => setNewEventData({ ...newEventData, location: e.target.value })}
                                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', color: '#3c4043', fontFamily: 'Roboto, Arial, sans-serif', padding: '8px 0' }}
                                />
                            </div>

                            {/* Description Row */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ width: '24px', display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
                                    <AlignLeft size={20} color="#5f6368" />
                                </div>
                                <textarea
                                    placeholder="Add description"
                                    value={newEventData.description}
                                    onChange={e => setNewEventData({ ...newEventData, description: e.target.value })}
                                    style={{
                                        flex: 1, border: 'none', fontSize: '14px', outline: 'none', color: '#3c4043',
                                        fontFamily: 'Roboto, Arial, sans-serif', resize: 'none', minHeight: '80px',
                                        background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px',
                                        backdropFilter: 'blur(5px)'
                                    }}
                                />
                            </div>

                            {/* User Row */}
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px', paddingLeft: '2px' }}>
                                <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                                    <CalendarIcon size={18} color="#5f6368" />
                                </div>
                                <div style={{ fontSize: '14px', color: '#3c4043', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{user?.name || 'User'}</span>
                                    <span style={{ width: '10px', height: '10px', background: '#039be5', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 0 2px rgba(255,255,255,0.8)' }}></span>
                                    <span style={{ color: '#5f6368', fontSize: '12px', opacity: 0.8 }}>Busy ⋅ Default visibility ⋅ Notify 30 minutes before</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '16px', gap: '8px' }}>
                                <button
                                    onClick={() => alert("More options clicked")}
                                    style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#1a73e8', fontWeight: 500, cursor: 'pointer', padding: '8px 16px', borderRadius: '6px' }}
                                >
                                    More options
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    style={{
                                        background: '#1a73e8', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(26, 115, 232, 0.3)'
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </>,
                    document.body
                )
            }
        </div >
    );
}
