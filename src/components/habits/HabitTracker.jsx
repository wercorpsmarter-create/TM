import React from 'react';
import { Activity } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HabitTracker({ habits, setHabits }) {
    const toggleHabit = (habitId, dayIndex) => {
        setHabits(habits.map(h => {
            if (h.id === habitId) {
                const newHistory = [...h.history];
                newHistory[dayIndex] = !newHistory[dayIndex];
                return { ...h, history: newHistory };
            }
            return h;
        }));
    };

    return (
        <div className="card">
            <h3 className="card-title"><Activity size={20} /> Habit Tracker</h3>
            <div className="habit-grid">
                <div className="habit-row" style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <span>Habit</span>
                    <div className="habit-days">
                        {DAYS.map(day => (
                            <div key={day} style={{ width: '1.5rem', textAlign: 'center', fontSize: '0.75rem' }}>{day}</div>
                        ))}
                    </div>
                </div>
                {habits.map(habit => (
                    <div key={habit.id} className="habit-row">
                        <span style={{ fontSize: '0.9rem' }}>{habit.name}</span>
                        <div className="habit-days">
                            {habit.history.map((active, idx) => (
                                <div
                                    key={idx}
                                    className={`day-circle ${active ? 'active' : ''}`}
                                    onClick={() => toggleHabit(habit.id, idx)}
                                >
                                    {active && '✓'}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
