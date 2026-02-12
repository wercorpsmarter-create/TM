import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function MiniCalendar({ currentMainDate, onDateSelect }) {
    const [displayDate, setDisplayDate] = useState(new Date(currentMainDate));

    // Sync display date when main date changes changes significantly (e.g. externally set)
    // However, we often want to browse the mini calendar independently. 
    // Let's only sync if the main date changes year/month to keep it somewhat in sync, 
    // or just assume independent navigation is preferred until selection.
    // For now: sync initially and on major external jumps, but let local State drive UI.
    // simpler: update displayDate when currentMainDate changes "month".
    useEffect(() => {
        if (currentMainDate) {
            setDisplayDate(prev => {
                if (prev.getMonth() === currentMainDate.getMonth() && prev.getFullYear() === currentMainDate.getFullYear()) {
                    return prev;
                }
                return new Date(currentMainDate);
            });
        }
    }, [currentMainDate]);

    const getDaysForGrid = () => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, month: month - 1, year: year, type: 'prev' });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, month: month, year: year, type: 'current' });
        }

        // Next month days to fill 42 (6 rows * 7)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, month: month + 1, year: year, type: 'next' });
        }
        return days;
    };

    const handlePrevMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
    };

    const isToday = (d, m, y) => {
        const today = new Date();
        return d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    };

    const isSelected = (d, m, y) => {
        return d === currentMainDate.getDate() && m === currentMainDate.getMonth() && y === currentMainDate.getFullYear();
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={handlePrevMonth} className="btn-icon" style={{ width: '24px', height: '24px', padding: 0 }}>
                        <ChevronUp size={16} />
                    </button>
                    <button onClick={handleNextMonth} className="btn-icon" style={{ width: '24px', height: '24px', padding: 0 }}>
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '0.75rem' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} style={{ color: 'var(--text-muted)', fontWeight: 500, padding: '4px 0', fontSize: '0.7rem' }}>{d}</div>
                ))}

                {getDaysForGrid().map((dayObj, idx) => {
                    const date = new Date(dayObj.year, dayObj.month, dayObj.day);
                    const selected = isSelected(dayObj.day, dayObj.month, dayObj.year);
                    const today = isToday(dayObj.day, dayObj.month, dayObj.year);
                    const isCurrentMonth = dayObj.type === 'current';

                    return (
                        <div
                            key={idx}
                            onClick={() => onDateSelect(date)}
                            style={{
                                padding: '6px 0',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                backgroundColor: selected ? 'var(--primary)' : 'transparent',
                                color: selected ? 'white' : today ? 'var(--primary)' : isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)',
                                opacity: isCurrentMonth || selected ? 1 : 0.4,
                                fontWeight: today || selected ? 700 : 400,
                                position: 'relative'
                            }}
                            className="mini-cal-day"
                            onMouseEnter={(e) => {
                                if (!selected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                if (!selected) e.currentTarget.style.backgroundColor = 'transparent';
                                if (selected) e.currentTarget.style.backgroundColor = 'var(--primary)';
                            }}
                        >
                            {dayObj.day}
                            {today && !selected && (
                                <div style={{
                                    position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                                    width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary)'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
