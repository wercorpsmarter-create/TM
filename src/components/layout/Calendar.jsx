import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar({ tasks }) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Fill empty slots for previous month
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        days.push(null);
    }
    // Fill days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const getTasksForDay = (day) => {
        if (!day) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return tasks.filter(t => t.dueDate === dateStr);
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarIcon size={24} /> {today.toLocaleString('default', { month: 'long' })} {year}
                </h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="nav-item" style={{ border: '1px solid var(--border)' }}><ChevronLeft size={20} /></button>
                    <button className="nav-item" style={{ border: '1px solid var(--border)' }}><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="calendar-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="calendar-header">{d}</div>
                ))}
                {days.map((day, idx) => (
                    <div key={idx} className={`calendar-day ${day === today.getDate() ? 'current-day' : ''}`}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{day}</span>
                        <div style={{ marginTop: '0.5rem' }}>
                            {getTasksForDay(day).map(task => (
                                <div key={task.id} style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'var(--primary)', color: 'white', borderRadius: '4px', marginBottom: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                    {task.text}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
