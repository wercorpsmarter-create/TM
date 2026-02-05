import React from 'react';
import { X } from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DaySelector({ isOpen, onClose, visibleDays, setVisibleDays }) {
    if (!isOpen) return null;

    const toggleDay = (day) => {
        if (visibleDays.includes(day)) {
            // Don't allow removing the last day
            if (visibleDays.length === 1) return;
            setVisibleDays(visibleDays.filter(d => d !== day));
        } else {
            setVisibleDays([...visibleDays, day]);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-card" style={{
                maxWidth: '500px',
                width: '90%',
                padding: '2rem',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    className="btn-icon"
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem'
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                    Customize Visible Days
                </h2>

                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Select which days you want to see on your dashboard
                </p>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}>
                    {ALL_DAYS.map(day => {
                        const isSelected = visibleDays.includes(day);
                        const isLastSelected = visibleDays.length === 1 && isSelected;

                        return (
                            <div
                                key={day}
                                onClick={() => toggleDay(day)}
                                style={{
                                    padding: '1rem 1.5rem',
                                    background: isSelected ? 'rgba(51, 65, 85, 0.15)' : 'rgba(255, 255, 255, 0.3)',
                                    border: isSelected
                                        ? '2px solid var(--primary)'
                                        : '2px solid rgba(255, 255, 255, 0.4)',
                                    borderRadius: '12px',
                                    cursor: isLastSelected ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s ease',
                                    opacity: isLastSelected ? 0.5 : 1
                                }}
                            >
                                <span style={{
                                    fontWeight: isSelected ? 600 : 400,
                                    color: isSelected ? 'var(--text-main)' : 'var(--text-muted)'
                                }}>
                                    {day}
                                </span>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: isSelected ? '2px solid var(--primary)' : '2px solid var(--text-muted)',
                                    background: isSelected ? 'var(--primary)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}>
                                    {isSelected && '✓'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{
                        marginTop: '1.5rem',
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Done
                </button>
            </div>
        </div>
    );
}
