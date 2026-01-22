import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, CheckCircle, Circle, Calendar as CalendarIcon, Pencil, CheckCircle2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DayColumn = ({ dayName, tasks, onAddTask, onDeleteTask, onToggleTask }) => {
    const [inputValue, setInputValue] = useState('');
    const [syncToGoogle, setSyncToGoogle] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Use the same Monday-start logic as App.jsx
    const getColumnDate = () => {
        const DAYS_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetIdx = DAYS_LIST.indexOf(dayName);
        const d = new Date();
        const currentDay = d.getDay();
        const diffFromMonday = (currentDay === 0 ? 6 : currentDay - 1);
        const monday = new Date(d);
        monday.setDate(d.getDate() - diffFromMonday);

        const targetIdxRelative = targetIdx === 0 ? 6 : targetIdx - 1;
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + targetIdxRelative);
        return targetDate;
    };

    const columnDate = getColumnDate();

    // Use local formatting to avoid UTC shifting
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const columnDateStr = formatLocalDate(columnDate);
    const displayDate = columnDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const dayTasks = tasks.filter(t => t.date === columnDateStr);

    const completed = dayTasks.filter(t => t.status === 'Completed').length;
    const total = dayTasks.length || 1;
    const progressData = [
        { name: 'Done', value: completed },
        { name: 'Pending', value: Math.max(0, total - completed) }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        onAddTask(dayName, inputValue, syncToGoogle);
        setInputValue('');
        setSyncToGoogle(false);
    };

    return (
        <div className="day-column">
            <div className="day-title">{dayName} <span style={{ opacity: 0.5, fontSize: '0.7em', display: 'block' }}>{displayDate}</span></div>
            <div className="glass-card" style={{ padding: '1rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>

                {/* Daily Progress Donut */}
                <div className="donut-container" style={{ height: '100px', marginBottom: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={progressData}
                                innerRadius={25}
                                outerRadius={35}
                                paddingAngle={0}
                                dataKey="value"
                                startAngle={90}
                                endAngle={450}
                                stroke="none"
                                animationDuration={400}
                                animationEasing="ease-out"
                                isAnimationActive={true}
                            >
                                <Cell fill="#475569" />
                                <Cell fill="rgba(0, 0, 0, 0.05)" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Add Task Input */}
                {isEditing && (
                    <form onSubmit={handleSubmit} className="task-input-container">
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Add task..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                style={{ width: '100%', paddingRight: '2.5rem' }}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setSyncToGoogle(!syncToGoogle)}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: syncToGoogle ? '#475569' : 'rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="Sync to Google Calendar"
                            >
                                <CalendarIcon size={16} />
                            </button>
                        </div>
                        <button type="submit" className="btn-icon">
                            <Plus size={18} />
                        </button>
                    </form>
                )}

                {/* Task List */}
                <div className="compact-task-list" style={{ marginTop: isEditing ? '0' : '1rem' }}>
                    {dayTasks.map(task => (
                        <div key={task.id} className={`compact-task ${task.status === 'Completed' ? 'completed' : ''}`}>
                            <div onClick={() => onToggleTask(task.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                {task.status === 'Completed' ?
                                    <CheckCircle size={18} color="#475569" fill="rgba(71, 85, 105, 0.1)" /> :
                                    <Circle size={18} color="rgba(0, 0, 0, 0.2)" />
                                }
                            </div>
                            <span style={{ fontSize: '0.85rem' }}>{task.text}</span>
                            {isEditing && (
                                <button onClick={() => onDeleteTask(task.id)} className="btn-delete">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                    {dayTasks.length === 0 && !isEditing && (
                        <div style={{ textAlign: 'center', opacity: 0.2, fontSize: '0.75rem', marginTop: '2rem' }}>
                            No tasks
                        </div>
                    )}
                </div>

                <button
                    className="widget-edit-trigger"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? <CheckCircle2 size={18} color="#22c55e" /> : <Pencil size={14} />}
                </button>
            </div>
        </div>
    );
};

export default function WeeklyBreakdown({ tasks, onAddTask, onDeleteTask, onToggleTask }) {
    return (
        <div className="weekly-breakdown">
            {DAYS.map(day => (
                <DayColumn
                    key={day}
                    dayName={day}
                    tasks={tasks}
                    onAddTask={onAddTask}
                    onDeleteTask={onDeleteTask}
                    onToggleTask={onToggleTask}
                />
            ))}
        </div>
    );
}
