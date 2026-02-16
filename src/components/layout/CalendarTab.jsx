import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, LogIn, RefreshCcw, ChevronLeft, ChevronRight, LogOut, Video, ExternalLink, Clock, MapPin, AlignLeft, X, Users, Plus, Trash2, CheckCircle, Circle, Columns } from 'lucide-react';

import MiniCalendar from './MiniCalendar';

export default function CalendarTab({ user, setUser, tasks, onSyncClick, onAddTask, onLogin, externalPopupTrigger, isActive, onDeleteTask, onToggleTask, onUpdateTask }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper for event layout
    const layoutEvents = React.useCallback((items) => {
        if (!items || !Array.isArray(items)) return { allDay: [], timed: [] };

        const timed = items.filter(item => {
            if (!item) return false;
            return !((item.type === 'google' && !item.start?.dateTime) || (item.type === 'task' && !item.hasTime));
        });
        const allDay = items.filter(item => {
            if (!item) return false;
            return ((item.type === 'google' && !item.start?.dateTime) || (item.type === 'task' && !item.hasTime));
        });

        if (timed.length === 0) return { allDay, timed: [] };

        // Sort by start time, then duration
        timed.sort((a, b) => (a.startMinutes || 0) - (b.startMinutes || 0) || (b.duration || 0) - (a.duration || 0));

        const groups = [];
        let currentGroup = [];
        let groupEnd = -1;

        timed.forEach(event => {
            const start = event.startMinutes || 0;
            const duration = event.duration || 30;
            const end = start + duration;

            if (currentGroup.length === 0) {
                currentGroup.push(event);
                groupEnd = end;
            } else {
                if (start < groupEnd) {
                    currentGroup.push(event);
                    groupEnd = Math.max(groupEnd, end);
                } else {
                    groups.push(currentGroup);
                    currentGroup = [event];
                    groupEnd = end;
                }
            }
        });
        if (currentGroup.length > 0) groups.push(currentGroup);

        const processedTimed = [];
        groups.forEach(group => {
            const columns = [];
            group.forEach(event => {
                const start = event.startMinutes || 0;
                const duration = event.duration || 30;

                let placed = false;
                for (let i = 0; i < columns.length; i++) {
                    if (columns[i] <= start) {
                        event.colIndex = i;
                        columns[i] = start + duration;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    event.colIndex = columns.length;
                    columns.push(start + duration);
                }
            });

            const numCols = Math.max(1, columns.length);
            group.forEach(event => {
                event.layoutLeft = ((event.colIndex || 0) / numCols) * 100;
                event.layoutWidth = (1 / numCols) * 100;
                processedTimed.push(event);
            });
        });

        return { allDay, timed: processedTimed };
    }, []);

    const handleEventClick = (e, item, dateObj) => {
        e.stopPropagation();
        setExpandedEventId(expandedEventId === item.id ? null : item.id);

        // Add as task
        if (item.type === 'google') { // Only valid for google events to be "imported" as tasks? Or duplicate generic ones? let's do all.
            const customColor = item.isPrimary ? item.extendedProperties?.private?.customColor : undefined;
            const color = customColor || item.color || item.calendarColor || '#3b82f6';
            const title = item.title || item.summary;

            // Format date YYYY-MM-DD
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            // Check if already exists to avoid spamming? User said "clicks... a subtitle is created".
            // Let's check simply by title+date
            const exists = tasks.some(t => t.text === title && t.date === dateStr);
            if (!exists) {
                onAddTask(dateStr, title, false, null, 30, '', '', [], false, { color });
            }
        }
    };

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
    const [showSplitView, setShowSplitView] = useState(view === 'day' || view === 'week');

    // Auto-open split view when switching to Day or Week view, close otherwise
    useEffect(() => {
        if (view === 'day' || view === 'week') {
            setShowSplitView(true);
        } else {
            setShowSplitView(false);
        }
    }, [view]);

    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskColor, setNewTaskColor] = useState('#3b82f6');
    const [showTaskColorPicker, setShowTaskColorPicker] = useState(false);
    const [showSidebar, setShowSidebar] = useState(() => {
        const saved = localStorage.getItem('calendar_show_sidebar');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [memberInput, setMemberInput] = useState('');

    useEffect(() => {
        localStorage.setItem('calendar_show_sidebar', JSON.stringify(showSidebar));
    }, [showSidebar]);

    const [newEventData, setNewEventData] = useState({
        title: '',
        participants: [], // Array for member chips
        location: '',
        description: '',
        dateStr: '',
        timeStr: '',
        duration: 30,
        eventType: 'event', // 'event', 'task', 'appointment'
        addMeet: false,
        allDay: false,
        color: '#3b82f6',
        calendarId: 'primary' // Default to primary calendar
    });

    const scrollContainerRef = React.useRef(null);

    // Scroll to 9 AM when switching to week or day view, or when tab becomes active
    useEffect(() => {
        if ((view === 'week' || view === 'day')) {
            // Use multiple timeouts to catch different rendering phases
            const scroll = () => {
                if (scrollContainerRef.current) {
                    // 9 AM = 9 * 60px/hr = 540px
                    scrollContainerRef.current.scrollTop = 540;
                }
            };

            // Immediate attempt
            scroll();

            // Delayed attempts to handle layout/animation frames
            const t1 = setTimeout(scroll, 50);
            const t2 = setTimeout(scroll, 200);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [view, isActive]);

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
                // setView('week'); // Removed: Don't switch view, stay context agnostic or let user decide
            }

            // Prep modal data
            setNewEventData(prev => ({
                ...prev,
                title: title || '',
                dateStr: dateStr || new Date().toISOString().split('T')[0],
                timeStr: timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                participants: [],
                location: '',
                description: '',
                addMeet: false,
                allDay: false,
                calendarId: 'primary'
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
            participants: [],
            location: '',
            description: '',
            dateStr,
            timeStr,
            duration: endMinutes - startMinutes,
            eventType: 'event',
            addMeet: false,
            allDay: false,
            color: '#3b82f6', // Default color for new events
            calendarId: 'primary'
        });
        setShowEventModal(true);
        setIsDragging(false);
    };

    const handleSaveEvent = async () => {
        if (!newEventData.title) return;

        const attendeesList = Array.isArray(newEventData.participants)
            ? newEventData.participants
            : (newEventData.participants
                ? newEventData.participants.split(/[,;]+/).map(p => p.trim()).filter(p => p)
                : []);

        let description = '';
        if (attendeesList && attendeesList.length > 0) {
            description += `Participants: ${attendeesList.join(', ')}\n`;
        }
        if (newEventData.location) {
            description += `Location: ${newEventData.location}\n`;
        }
        if (newEventData.description) {
            description += `\n${newEventData.description}`;
        }

        // Construct start and end Date objects for the event
        const [year, month, day] = newEventData.dateStr.split('-').map(Number);
        const [hour, minute] = newEventData.timeStr.split(':').map(Number);
        const startDateTime = new Date(year, month - 1, day, hour, minute);
        const endDateTime = new Date(startDateTime.getTime() + newEventData.duration * 60 * 1000);

        const event = {
            summary: newEventData.title,
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: endDateTime.toISOString() },
            colorId: (() => {
                // Simple mapping based on the hex codes we used
                switch (newEventData.color) {
                    case '#3b82f6': return '1';
                    case '#ef4444': return '11';
                    case '#22c55e': return '10';
                    case '#eab308': return '5';
                    case '#a855f7': return '3';
                    case '#ec4899': return '4';
                    case '#64748b': return '8';
                    default: return undefined;
                }
            })(),
            extendedProperties: {
                private: {
                    customColor: newEventData.color
                }
            }
        };

        if (onAddTask) {
            await onAddTask(
                newEventData.dateStr,
                newEventData.title,
                true,
                newEventData.allDay ? null : newEventData.timeStr,
                newEventData.duration, // duration
                description,
                newEventData.location,
                attendeesList,
                newEventData.addMeet,
                { color: newEventData.color }, // Pass metadata object with color
                newEventData.calendarId || 'primary' // Pass the selected calendar ID
            );
        }

        setShowEventModal(false);
        setDragStart(null);
        setDragCurrent(null);
        setMemberInput('');
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
    }, [user, currentDate, view, selectedCalendarIds, calendars]);

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
                    const cal = calendars.find(c => c.id === calendarId);
                    return (data.items || []).map(item => ({
                        ...item,
                        calendarId,
                        // If the event doesn't have a color, use the calendar color (we'll need to look this up from the calendars list)
                        calendarColor: cal?.backgroundColor,
                        isPrimary: cal?.primary || false
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

        const dayTasks = tasks.filter(t => {
            if (t.date !== isoDateStr) return false;

            // Deduplication: Check if this task exists as a Google Event
            const isDuplicate = dayEvents.some(e => {
                // Match title
                if ((e.summary || '').trim() !== (t.text || '').trim()) return false;

                // Match time
                if (t.metadata?.time) {
                    if (!e.start.dateTime) return false; // Event is all-day, task is timed -> Not same
                    const eventDate = new Date(e.start.dateTime);
                    const [h, m] = t.metadata.time.split(':').map(Number);
                    return eventDate.getHours() === h && eventDate.getMinutes() === m;
                } else {
                    // Task is effectively all-day (no time)
                    if (e.start.dateTime) return false; // Event is timed, task is all-day -> Not same
                    return true; // Both all-day and title matches
                }
            });

            return !isDuplicate;
        });
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
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '1rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
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

            <div style={{ display: 'flex', gap: '1rem', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {showSidebar && user && (
                    <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div className="glass-card static" style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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

                <div className="glass-card static" style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                    {view === 'month' && (
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                            <div className="calendar-grid">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="calendar-header-cell">{d}</div>
                                ))}
                                {getDaysInMonth().map((dayObj, i) => {
                                    const { dayEvents, dayTasks } = getItemsForDay(dayObj.day, dayObj.month, dayObj.year);
                                    const isToday = new Date().toDateString() === new Date(dayObj.year, dayObj.month, dayObj.day).toDateString();

                                    // Merge and sort items
                                    const allItems = [
                                        ...dayEvents.map(e => ({ ...e, type: 'google' })),
                                        ...dayTasks.map(t => ({ ...t, type: 'task', title: t.text }))
                                    ].sort((a, b) => {
                                        // Simple sort by time if available, otherwise prioritize all-day events?
                                        // Or just keep grouped. I'll stick to a simple merge.
                                        // Actually, let's sort by start time if possible.
                                        const getMinutes = (item) => {
                                            if (item.type === 'google' && item.start.dateTime) {
                                                const d = new Date(item.start.dateTime);
                                                return d.getHours() * 60 + d.getMinutes();
                                            }
                                            if (item.type === 'task' && item.metadata?.time) {
                                                const [h, m] = item.metadata.time.split(':').map(Number);
                                                return h * 60 + m;
                                            }
                                            return -1; // All day / no time
                                        };
                                        return getMinutes(a) - getMinutes(b);
                                    });

                                    const MAX_VISIBLE = 3;
                                    const visibleItems = allItems.slice(0, MAX_VISIBLE);
                                    const overflowCount = allItems.length - MAX_VISIBLE;

                                    return (
                                        <div
                                            key={i}
                                            className={`calendar-day ${!dayObj.currentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                                            onClick={() => {
                                                setCurrentDate(new Date(dayObj.year, dayObj.month, dayObj.day));
                                                setView('day');
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                color: dayObj.currentMonth ? '#000' : '#9ca3af',
                                                minHeight: '150px', // Increased static height
                                                height: '150px',    // Increased static height
                                                overflow: 'hidden',  // Hide overflow
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: '4px'      // Add padding
                                            }}
                                        >
                                            <div className="day-number" style={{ color: 'inherit', marginBottom: '2px', fontWeight: 600 }}>{dayObj.day}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                                {visibleItems.map((item, idx) => {
                                                    const customColor = item.isPrimary ? item.extendedProperties?.private?.customColor : undefined;
                                                    const color = customColor || item.metadata?.color || item.color || (item.calendarId ? (calendars.find(c => c.id === item.calendarId)?.backgroundColor || '#3b82f6') : undefined);

                                                    const style = color ? {
                                                        backgroundColor: `${color}4d`, // 30% opacity
                                                        backdropFilter: 'blur(4px)',
                                                        borderLeft: `3px solid ${color}`,
                                                        color: '#000', // Text color - Changed to black
                                                        // Glassmorphic border
                                                        borderTop: `1px solid ${color}40`,
                                                        borderRight: `1px solid ${color}40`,
                                                        borderBottom: `1px solid ${color}40`,
                                                    } : {
                                                        // Default gray style if no color (though mostly should have color)
                                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                                        color: 'var(--text-main)',
                                                        borderLeft: '3px solid rgba(0,0,0,0.2)'
                                                    };

                                                    return (
                                                        <div key={`${item.id}-${idx}`} className="event-pill" title={item.summary || item.title}
                                                            style={{
                                                                ...style,
                                                                padding: '2px 4px',
                                                                fontSize: '0.75rem',
                                                                borderRadius: '4px',
                                                                marginBottom: '1px',
                                                                overflow: 'hidden',
                                                                whiteSpace: 'nowrap',
                                                                textOverflow: 'ellipsis',
                                                                display: 'block'
                                                            }}
                                                        >
                                                            {item.summary || item.title}
                                                        </div>
                                                    );
                                                })}
                                                {overflowCount > 0 && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '2px', fontWeight: 600 }}>
                                                        +{overflowCount} more...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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

                            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                                <div
                                    style={{ display: 'flex', minHeight: '1440px', position: 'relative', cursor: isDragging ? 'row-resize' : 'default', marginTop: '10px' }}
                                    onMouseMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                >
                                    <div style={{ position: 'absolute', inset: 0, left: '70px', pointerEvents: 'none', zIndex: 0 }}>
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <div key={i} style={{
                                                height: '60px',
                                                borderBottom: i < 23 ? '1px dotted rgba(0,0,0,0.06)' : 'none',
                                                borderTop: i === 0 ? '1px dotted rgba(0,0,0,0.06)' : 'none',
                                                boxSizing: 'border-box'
                                            }} />
                                        ))}
                                    </div>

                                    <div style={{
                                        width: '60px',
                                        flexShrink: 0,
                                        marginRight: '10px',
                                        zIndex: 1,
                                        position: 'relative',
                                        marginTop: '10px' // Compensate for the pill extending up
                                    }}>

                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <div key={i} style={{ height: '60px', position: 'relative' }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '-6px',
                                                    left: 0,
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-muted)'
                                                }}>
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
                                                left: '70px',
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
                                                    let color = undefined;

                                                    if (t.metadata) {
                                                        if (t.metadata.time) {
                                                            const [h, m] = t.metadata.time.split(':').map(Number);
                                                            startMinutes = h * 60 + m;
                                                            hasTime = true;
                                                        }
                                                        if (t.metadata.duration) {
                                                            duration = parseInt(t.metadata.duration, 10);
                                                        }
                                                        if (t.metadata.color) {
                                                            color = t.metadata.color;
                                                        }
                                                    }
                                                    return { ...t, type: 'task', startMinutes, duration, hasTime, title: t.text, color };
                                                })
                                            ];

                                            const { allDay, timed } = layoutEvents(items);

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

                                                    {allDay.map((item, idx) => {
                                                        const customColor = item.isPrimary ? item.extendedProperties?.private?.customColor : undefined;
                                                        const color = customColor || item.color || item.calendarColor || '#3b82f6';
                                                        return (
                                                            <div key={`ad-${idx}`} className={`event-pill ${item.type}`} style={{
                                                                position: 'relative',
                                                                marginBottom: '2px',
                                                                fontSize: '0.7rem',
                                                                padding: '2px 4px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                backgroundColor: color ? `${color}4d` : undefined,
                                                                backdropFilter: color ? 'blur(4px)' : undefined,
                                                                border: color ? `1px solid ${color}66` : undefined,
                                                                borderLeft: color ? `3px solid ${color}` : undefined,
                                                                color: color ? '#000' : undefined,
                                                                borderRadius: '4px'
                                                            }}>
                                                                {item.title}
                                                            </div>
                                                        );
                                                    })}

                                                    {timed.map((item, idx) => {
                                                        const top = (item.startMinutes / 60) * 60;
                                                        const height = (item.duration / 60) * 60;
                                                        const customColor = item.isPrimary ? item.extendedProperties?.private?.customColor : undefined;
                                                        const color = customColor || item.color || item.calendarColor || '#3b82f6';

                                                        return (
                                                            <div key={`t-${idx}`} className={`event-pill ${item.type}`} style={{
                                                                position: 'absolute',
                                                                top: `${top}px`,
                                                                height: `${Math.max(height, 20)}px`,
                                                                left: `${item.layoutLeft}%`,
                                                                width: `calc(${item.layoutWidth}% - 2px)`,
                                                                fontSize: '0.75rem',
                                                                padding: '2px 4px',
                                                                overflow: 'hidden',
                                                                zIndex: 10,
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                backgroundColor: color ? `${color}4d` : undefined,
                                                                backdropFilter: color ? 'blur(4px)' : undefined,
                                                                border: color ? `1px solid ${color}66` : '1px solid rgba(0,0,0,0.1)',
                                                                borderLeft: color ? `3px solid ${color}` : undefined,
                                                                color: color ? '#000' : undefined,
                                                                borderRadius: '4px'
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
                            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                                <div
                                    style={{ display: 'flex', minHeight: '1440px', position: 'relative', cursor: isDragging ? 'row-resize' : 'default', marginTop: '10px' }}
                                    onMouseMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                >
                                    <div style={{ position: 'absolute', inset: 0, left: '70px', pointerEvents: 'none', zIndex: 0 }}>
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <div key={i} style={{
                                                height: '60px',
                                                borderBottom: i < 23 ? '1px dotted rgba(0,0,0,0.06)' : 'none',
                                                borderTop: i === 0 ? '1px dotted rgba(0,0,0,0.06)' : 'none',
                                                boxSizing: 'border-box'
                                            }} />
                                        ))}
                                    </div>

                                    <div style={{
                                        width: '60px',
                                        flexShrink: 0,
                                        marginRight: '10px',
                                        zIndex: 1,
                                        position: 'relative',
                                        marginTop: '10px'
                                    }}>

                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <div key={i} style={{ height: '60px', position: 'relative' }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '-6px',
                                                    left: 0,
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-muted)'
                                                }}>
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
                                                left: '70px',
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

                                                    let color = undefined;

                                                    if (t.metadata) {
                                                        if (t.metadata.time) {
                                                            const [h, m] = t.metadata.time.split(':').map(Number);
                                                            startMinutes = h * 60 + m;
                                                            hasTime = true;
                                                        }
                                                        if (t.metadata.duration) {
                                                            duration = parseInt(t.metadata.duration, 10);
                                                        }
                                                        if (t.metadata.color) {
                                                            color = t.metadata.color;
                                                        }
                                                    }
                                                    return { ...t, type: 'task', startMinutes, duration, hasTime, title: t.text, color };
                                                })
                                            ];

                                            const { allDay, timed: timedItems } = layoutEvents(items);

                                            return (
                                                <>
                                                    <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.01)' }}>
                                                        {allDay.map((item, idx) => {
                                                            const customColor = item.isPrimary ? item.extendedProperties?.private?.customColor : undefined;
                                                            const color = customColor || item.color || item.calendarColor || '#3b82f6';
                                                            return (
                                                                <div key={`ad-${idx}`} className={`event-pill ${item.type}`} style={{
                                                                    position: 'relative',
                                                                    marginBottom: '4px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: color ? `${color}4d` : undefined, // 30% opacity
                                                                    backdropFilter: color ? 'blur(4px)' : undefined,
                                                                    border: color ? `1px solid ${color}66` : undefined,
                                                                    borderLeft: color ? `3px solid ${color}` : undefined,
                                                                    color: color ? '#000' : undefined,
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.85rem'
                                                                }}>
                                                                    <span style={{ fontWeight: 600 }}>All Day:</span> {item.title}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {timedItems.map((item, idx) => {
                                                        const top = (item.startMinutes / 60) * 60;
                                                        const height = (item.duration / 60) * 60;
                                                        const isExpanded = expandedEventId === (item.id || idx);
                                                        const customColor = item.isPrimary ? item.extendedProperties?.private?.customColor : undefined;
                                                        const color = customColor || item.color || item.calendarColor || '#3b82f6';

                                                        return (
                                                            <div key={idx}
                                                                className={`event-pill ${item.type}`}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: `${top}px`,
                                                                    height: isExpanded ? 'auto' : `${Math.max(height, 40)}px`,
                                                                    minHeight: `${Math.max(height, 40)}px`,
                                                                    left: `${item.layoutLeft}%`,
                                                                    width: `calc(${item.layoutWidth}% - 4px)`,
                                                                    padding: '8px',
                                                                    zIndex: isExpanded ? 50 : 10,
                                                                    boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.1)',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    cursor: 'pointer',
                                                                    backgroundColor: color ? `${color}4d` : undefined, // 30% opacity
                                                                    backdropFilter: color ? 'blur(4px)' : undefined,
                                                                    border: color ? `1px solid ${color}66` : '1px solid rgba(0,0,0,0.1)',
                                                                    borderLeft: color ? `4px solid ${color}` : undefined,
                                                                    color: color ? '#000' : undefined,
                                                                    borderRadius: '6px'
                                                                }}
                                                                onClick={(e) => handleEventClick(e, item, currentDate)}
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
                                    </div >
                                    {/* Task List Sidebar Logic for Day View - Click handling */}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showSplitView && (
                    <div className="glass-card static" style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '0 0 0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', paddingLeft: '0.5rem', paddingTop: '0.25rem' }}>Task List</h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
                                {currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}>
                            {tasks.filter(t => {
                                const year = currentDate.getFullYear();
                                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                const day = String(currentDate.getDate()).padStart(2, '0');
                                const isoDate = `${year}-${month}-${day}`;
                                return t.date === isoDate;
                            }).map(task => {
                                const taskColor = task.metadata?.color;
                                return (
                                    <div key={task.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.4rem 0.75rem',
                                        background: taskColor ? `${taskColor}1a` : 'white', // lighter background (10% opacity) for list items or 4d (30%). Let's use 1a (10%) for readability or 4d if matching plan. Plan is 4d. Let's try 33 (20%)
                                        // Actually, let's match the plan style: 30% opacity bg, solid left border
                                        backgroundColor: taskColor ? `${taskColor}4d` : 'white',
                                        borderRadius: '8px',
                                        marginBottom: '0.5rem',
                                        border: taskColor ? `1px solid ${taskColor}66` : '1px solid rgba(0,0,0,0.05)',
                                        borderLeft: taskColor ? `4px solid ${taskColor}` : undefined,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                    }}>
                                        <button
                                            onClick={() => onToggleTask && onToggleTask(task.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                                        >
                                            {task.completed ? <CheckCircle size={18} color="var(--primary)" fill="var(--primary)" fillOpacity={0.2} /> : <Circle size={18} color="var(--text-muted)" />}
                                        </button>
                                        <span style={{
                                            flex: 1,
                                            fontSize: '0.9rem',
                                            color: task.completed ? 'var(--text-muted)' : 'var(--text-main)',
                                            textDecoration: task.completed ? 'line-through' : 'none'
                                        }}>
                                            {task.text}
                                        </span>
                                        <button
                                            onClick={() => onDeleteTask && onDeleteTask(task.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.4, transition: 'opacity 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 0.4}
                                        >
                                            <Trash2 size={14} color="#ef4444" />
                                        </button>
                                    </div>
                                );
                            })}
                            {tasks.filter(t => {
                                const year = currentDate.getFullYear();
                                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                const day = String(currentDate.getDate()).padStart(2, '0');
                                const isoDate = `${year}-${month}-${day}`;
                                return t.date === isoDate;
                            }).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        No tasks for this day.
                                    </div>
                                )}
                        </div>
                        <div style={{ padding: '0.25rem 0', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!newTaskText.trim()) return;
                                    const year = currentDate.getFullYear();
                                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(currentDate.getDate()).padStart(2, '0');
                                    const isoDate = `${year}-${month}-${day}`;
                                    onAddTask(isoDate, newTaskText, false, null, 30, '', '', [], false, { color: newTaskColor });
                                    setNewTaskText('');
                                    setNewTaskColor('#3b82f6'); // Reset to default
                                    setShowTaskColorPicker(false);
                                }}
                                style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <button
                                        type="button" // Placeholder to remove the old button logic block so I can replace the whole container structure cleanly
                                        style={{ display: 'none' }}
                                    ></button>

                                    {showTaskColorPicker && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: 0,
                                            marginBottom: '0.5rem',
                                            background: 'white',
                                            padding: '0.5rem',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            zIndex: 20,
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}>
                                            {['#3b82f6', '#ef4444', '#64748b', '#ffffff', '#06b6d4', '#10b981'].map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => { setNewTaskColor(c); setShowTaskColorPicker(false); }}
                                                    style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: c,
                                                        border: c === '#ffffff' ? '1px solid #e2e8f0' : 'none',
                                                        cursor: 'pointer',
                                                        outline: newTaskColor === c ? '2px solid var(--text-main)' : 'none',
                                                        outlineOffset: '2px'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        background: 'white',
                                        gap: '0.5rem'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowTaskColorPicker(!showTaskColorPicker)}
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: newTaskColor,
                                                border: newTaskColor === '#ffffff' ? '1px solid #e2e8f0' : 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                flexShrink: 0
                                            }}
                                        />
                                        <input
                                            value={newTaskText}
                                            onChange={e => setNewTaskText(e.target.value)}
                                            placeholder="Add a task..."
                                            style={{
                                                flex: 1,
                                                border: 'none',
                                                outline: 'none',
                                                fontSize: '0.9rem',
                                                background: 'transparent',
                                                padding: 0
                                            }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        width: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Plus size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Google Calendar Style Modal */}
            {
                showEventModal && createPortal(
                    <>
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}
                            onClick={() => { setShowEventModal(false); setDragStart(null); setMemberInput(''); }}
                        />

                        <div style={{
                            position: 'fixed',
                            top: dragStart ? modalPosition.top : '50%',
                            left: dragStart ? modalPosition.left : '50%',
                            transform: dragStart ? 'none' : 'translate(-50%, -50%)',
                            zIndex: 9999,
                            width: '480px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.6) inset, 0 0 0 1px rgba(0,0,0,0.05)',
                            padding: '0',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            animation: 'popupScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            color: '#1e293b'
                        }}>
                            {/* Notion-style Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#37352f' }}>Page</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(55, 53, 47, 0.45)', padding: '4px', display: 'flex' }}
                                    >
                                        <div style={{ width: '16px', height: '16px', border: '1.5px solid currentColor', borderRadius: '2px' }} />
                                    </button>
                                    <button
                                        onClick={() => { setShowEventModal(false); setDragStart(null); setMemberInput(''); }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(55, 53, 47, 0.45)', padding: '4px', display: 'flex' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '0 48px 24px 48px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
                                {/* Title */}
                                <div style={{ marginTop: '32px' }}>

                                    {/* Title Input */}
                                    <div>
                                        <input
                                            autoFocus
                                            placeholder="Title"
                                            value={newEventData.title}
                                            onChange={e => setNewEventData({ ...newEventData, title: e.target.value })}
                                            style={{
                                                fontSize: '36px',
                                                fontWeight: 700,
                                                border: 'none',
                                                outline: 'none',
                                                width: '100%',
                                                color: '#37352f',
                                                padding: 0,
                                                background: 'transparent',
                                                lineHeight: 1.2,
                                                marginBottom: '24px'
                                            }}
                                        />
                                    </div>

                                    {/* Properties Grid */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {/* Date Property */}
                                        <div style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
                                            <div style={{ width: '140px', display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(55, 53, 47, 0.65)', fontSize: '14px' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                <span>日付</span>
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#37352f', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <input
                                                    type="date"
                                                    value={newEventData.dateStr}
                                                    onChange={e => setNewEventData({ ...newEventData, dateStr: e.target.value })}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        fontSize: '14px',
                                                        color: '#37352f',
                                                        outline: 'none',
                                                        cursor: 'pointer',
                                                        padding: '2px 4px',
                                                        borderRadius: '4px'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(55, 53, 47, 0.06)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                />
                                                {!newEventData.allDay && (
                                                    <input
                                                        type="time"
                                                        value={newEventData.timeStr || ''}
                                                        onChange={e => setNewEventData({ ...newEventData, timeStr: e.target.value })}
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            fontSize: '14px',
                                                            color: 'rgba(55,53,47,0.65)',
                                                            outline: 'none',
                                                            cursor: 'pointer',
                                                            padding: '2px 4px',
                                                            borderRadius: '4px'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(55, 53, 47, 0.06)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* All-day Property */}
                                        <div style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
                                            <div style={{ width: '140px', display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(55, 53, 47, 0.65)', fontSize: '14px' }}>
                                                <Clock size={16} />
                                                <span>All-day</span>
                                            </div>
                                            <div
                                                onClick={() => setNewEventData({ ...newEventData, allDay: !newEventData.allDay })}
                                                style={{
                                                    width: '32px', height: '18px',
                                                    background: newEventData.allDay ? '#2eaadc' : 'rgba(55, 53, 47, 0.16)',
                                                    borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                                                }}
                                            >
                                                <div style={{
                                                    width: '14px', height: '14px', background: 'white', borderRadius: '50%',
                                                    position: 'absolute', top: '2px',
                                                    left: newEventData.allDay ? '16px' : '2px',
                                                    transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                                }} />
                                            </div>
                                        </div>

                                        {/* Calendar Property */}
                                        <div style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
                                            <div style={{ width: '140px', display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(55, 53, 47, 0.65)', fontSize: '14px' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="7" height="7"></rect>
                                                    <rect x="14" y="3" width="7" height="7"></rect>
                                                    <rect x="14" y="14" width="7" height="7"></rect>
                                                    <rect x="3" y="14" width="7" height="7"></rect>
                                                </svg>
                                                <span>Calendar</span>
                                            </div>
                                            <select
                                                value={newEventData.calendarId || 'primary'}
                                                onChange={e => setNewEventData({ ...newEventData, calendarId: e.target.value })}
                                                style={{
                                                    fontSize: '14px',
                                                    color: '#37352f',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                    padding: '2px 4px',
                                                    borderRadius: '4px',
                                                    appearance: 'none',
                                                    WebkitAppearance: 'none'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(55, 53, 47, 0.06)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                {calendars.length > 0 ? (
                                                    calendars.map(cal => (
                                                        <option key={cal.id} value={cal.id}>
                                                            {cal.summary || cal.id}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="primary">Primary Calendar</option>
                                                )}
                                            </select>
                                        </div>

                                        {/* Members Property */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: '32px', paddingTop: '4px' }}>
                                            <div style={{ width: '140px', display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(55, 53, 47, 0.65)', fontSize: '14px', height: '32px' }}>
                                                <Users size={16} />
                                                <span>参加者</span>
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                                {Array.isArray(newEventData.participants) && newEventData.participants.map((email, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            background: 'rgba(55, 53, 47, 0.08)',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '13px',
                                                            color: '#37352f',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {email}
                                                        <button
                                                            onClick={() => {
                                                                const newParticipants = newEventData.participants.filter((_, i) => i !== idx);
                                                                setNewEventData({ ...newEventData, participants: newParticipants });
                                                            }}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '0',
                                                                display: 'flex',
                                                                color: 'rgba(55, 53, 47, 0.45)'
                                                            }}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <input
                                                    placeholder={newEventData.participants?.length > 0 ? "" : "Add members..."}
                                                    value={memberInput}
                                                    onChange={e => setMemberInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && memberInput.trim()) {
                                                            e.preventDefault();
                                                            const newMembers = [...(newEventData.participants || []), memberInput.trim()];
                                                            setNewEventData({ ...newEventData, participants: newMembers });
                                                            setMemberInput('');
                                                        }
                                                    }}
                                                    style={{
                                                        fontSize: '14px',
                                                        color: '#37352f',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        outline: 'none',
                                                        flex: 1,
                                                        minWidth: '100px',
                                                        padding: '4px 0'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Tags Property */}
                                        <div style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
                                            <div style={{ width: '140px', display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(55, 53, 47, 0.65)', fontSize: '14px' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                                </svg>
                                                <span>タグ</span>
                                            </div>
                                            <div style={{ fontSize: '14px', color: 'rgba(55, 53, 47, 0.45)' }}>Empty</div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ height: '1px', background: 'rgba(55, 53, 47, 0.09)', margin: '16px 0' }} />

                                    {/* Add Google Meet Button */}
                                    <button
                                        onClick={() => setNewEventData({ ...newEventData, addMeet: !newEventData.addMeet })}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            background: newEventData.addMeet ? 'rgba(37, 99, 235, 0.1)' : 'white',
                                            border: `1px solid ${newEventData.addMeet ? '#2563eb' : 'rgba(55, 53, 47, 0.16)'}`,
                                            color: newEventData.addMeet ? '#2563eb' : '#37352f',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.1s'
                                        }}
                                        onMouseEnter={e => {
                                            if (!newEventData.addMeet) e.currentTarget.style.background = 'rgba(55, 53, 47, 0.04)';
                                        }}
                                        onMouseLeave={e => {
                                            if (!newEventData.addMeet) e.currentTarget.style.background = 'white';
                                        }}
                                    >
                                        <Video size={16} />
                                        {newEventData.addMeet ? 'Google Meet details added' : 'Add Google Meet video conferencing'}
                                    </button>

                                    {/* Save Button */}
                                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={handleSaveEvent}
                                            style={{
                                                background: '#37352f',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '6px 12px',
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                    , document.body)
            }
        </div>
    );
}
