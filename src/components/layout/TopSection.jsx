import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { RefreshCcw, Settings2, Check, Plus, Trash2, Pencil, CheckCircle2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SortableWidget = ({ id, children, isCustomizing }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className={`glass-card widget-item ${isCustomizing ? 'customizing' : ''}`}>
            {isCustomizing && (
                <div className="widget-controls" {...attributes} {...listeners} style={{ cursor: 'grab' }}>
                    <div className="drag-handle-btn">
                        <GripVertical size={16} />
                    </div>
                </div>
            )}
            {children}
        </div>
    );
};

const LiveClock = () => {
    const [date, setDate] = useState(new Date());

    // Update time every second
    React.useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150px',
            textAlign: 'center',
            padding: '1rem'
        }}>
            <div style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                marginBottom: '0.5rem',
                color: 'var(--text-main)',
                letterSpacing: '-0.02em'
            }}>
                {date.toLocaleTimeString()}
            </div>
            <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
    );
};

export default function TopSection({
    tasks,
    habits,
    setHabits,
    onSyncClick,
    layout,
    setLayout,
    goals,
    onAddGoal,
    onDeleteGoal,
    onAddHabit,
    onDeleteHabit
}) {
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [isEditingHabits, setIsEditingHabits] = useState(false);
    const [newGoalText, setNewGoalText] = useState('');
    const [newHabitText, setNewHabitText] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Weekly Overview (Activity Score)
    const chartData = DAYS_SHORT.map((day, idx) => {
        const fullDayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx];
        const DAYS_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetIdx = DAYS_MAP.indexOf(fullDayName);
        const d = new Date();
        const currentDay = d.getDay();
        const diffFromMonday = (currentDay === 0 ? 6 : currentDay - 1);
        const monday = new Date(d);
        monday.setDate(d.getDate() - diffFromMonday);

        const targetIdxRelative = targetIdx === 0 ? 6 : targetIdx - 1;
        const columnDate = new Date(monday);
        columnDate.setDate(monday.getDate() + targetIdxRelative);

        const year = columnDate.getFullYear();
        const month = String(columnDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(columnDate.getDate()).padStart(2, '0');
        const columnDateStr = `${year}-${month}-${dayStr}`;

        const dayTasks = tasks.filter(t => t.date === columnDateStr);
        const dayCompleted = dayTasks.filter(t => t.status === 'Completed').length;
        const score = dayTasks.length > 0 ? (dayCompleted / dayTasks.length) * 100 : 0;
        return { name: day, progress: isNaN(score) ? 0 : score };
    });

    // Overall Progress (Donut)
    const completedCount = tasks.filter(t => t.status === 'Completed').length;
    const totalCount = tasks.length || 1;
    const progressData = [
        { name: 'Done', value: completedCount },
        { name: 'Pending', value: Math.max(0, totalCount - completedCount) }
    ];

    const handleHabitToggle = (habitId, dayIdx) => {
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
            const newHistory = [...habit.history];
            newHistory[dayIdx] = !newHistory[dayIdx];
            setHabits(habitId, newHistory);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = layout.indexOf(active.id);
            const newIndex = layout.indexOf(over.id);
            setLayout(arrayMove(layout, oldIndex, newIndex));
        }
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        onAddGoal(newGoalText);
        setNewGoalText('');
    };

    const handleAddHabit = (e) => {
        e.preventDefault();
        onAddHabit(newHabitText);
        setNewHabitText('');
    };


    const renderWidget = (type) => {
        switch (type) {
            case 'goals':
                return (
                    <SortableWidget id="goals" key="goals" isCustomizing={isCustomizing}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div className="card-title" style={{ margin: 0 }}>Weekly Goals</div>
                        </div>

                        {isEditingGoals && (
                            <form onSubmit={handleAddGoal} className="task-input-container" style={{ marginBottom: '1.5rem' }}>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Add a goal..."
                                    value={newGoalText}
                                    onChange={(e) => setNewGoalText(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="btn-icon">
                                    <Plus size={18} />
                                </button>
                            </form>
                        )}

                        <ul className="goals-list" style={{ marginBottom: isEditingGoals ? '3rem' : '1.5rem' }}>
                            {goals.map((g, i) => (
                                <li key={i} className="goal-item-row">
                                    <span className="goal-num">{i + 1}</span>
                                    <span style={{ flex: 1 }}>{g}</span>
                                    {isEditingGoals && (
                                        <button onClick={() => onDeleteGoal(i)} className="btn-delete-small">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {!isCustomizing && (
                            <button
                                className="widget-edit-trigger"
                                onClick={() => setIsEditingGoals(!isEditingGoals)}
                            >
                                {isEditingGoals ? <CheckCircle2 size={18} color="#22c55e" /> : <Pencil size={14} />}
                            </button>
                        )}
                    </SortableWidget>
                );
            case 'activity':
                return (
                    <SortableWidget id="activity" key="activity" isCustomizing={isCustomizing}>
                        <div className="card-title">Activity Score</div>
                        <div style={{ height: '150px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                        itemStyle={{ color: '#0f172a' }}
                                    />
                                    <Bar dataKey="progress" fill="#475569" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </SortableWidget>
                );
            case 'habits':
                return (
                    <SortableWidget id="habits" key="habits" isCustomizing={isCustomizing}>
                        <div className="card-title">Habits</div>

                        {isEditingHabits && (
                            <form onSubmit={handleAddHabit} className="task-input-container" style={{ marginBottom: '1.5rem' }}>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Track new habit..."
                                    value={newHabitText}
                                    onChange={(e) => setNewHabitText(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="btn-icon">
                                    <Plus size={18} />
                                </button>
                            </form>
                        )}

                        <div className="habit-tracker-container" style={{ marginBottom: isEditingHabits ? '3rem' : '0' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>HABIT</th>
                                        {DAYS_SHORT.map(d => <th key={d}>{d[0]}</th>)}
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {habits.map(habit => (
                                        <tr key={habit.id}>
                                            <td style={{ fontWeight: 600 }}>{habit.name}</td>
                                            {habit.history.map((done, idx) => (
                                                <td key={idx}>
                                                    <input
                                                        type="checkbox"
                                                        checked={done}
                                                        onChange={() => handleHabitToggle(habit.id, idx)}
                                                    />
                                                </td>
                                            ))}
                                            <td>
                                                {isEditingHabits && (
                                                    <button onClick={() => onDeleteHabit(habit.id)} className="btn-delete-small">
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!isCustomizing && (
                            <button
                                className="widget-edit-trigger"
                                onClick={() => setIsEditingHabits(!isEditingHabits)}
                            >
                                {isEditingHabits ? <CheckCircle2 size={18} color="#22c55e" /> : <Pencil size={14} />}
                            </button>
                        )}
                    </SortableWidget>
                );
            case 'efficiency':
                return (
                    <SortableWidget id="efficiency" key="efficiency" isCustomizing={isCustomizing}>
                        <div className="card-title">Efficiency</div>
                        <div style={{ height: '150px', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={progressData}
                                        innerRadius={45}
                                        outerRadius={60}
                                        paddingAngle={0}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={450}
                                        stroke="none"
                                        isAnimationActive={true}
                                        animationDuration={400}
                                        animationEasing="ease-in-out"
                                    >
                                        <Cell fill="#475569" />
                                        <Cell fill="rgba(0, 0, 0, 0.05)" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="efficiency-pct">
                                {isNaN(Math.round((completedCount / totalCount) * 100)) ? 0 : Math.round((completedCount / totalCount) * 100)}%
                            </div>
                        </div>
                    </SortableWidget>
                );
            case 'clock':
                return (
                    <SortableWidget id="clock" key="clock" isCustomizing={isCustomizing}>
                        <div className="card-title">Local Time</div>
                        <LiveClock />
                    </SortableWidget>
                );
            default:
                return null;
        }
    };

    return (
        <div className="top-section-container">
            <div className="top-section-header">
                <button
                    onClick={() => setIsCustomizing(!isCustomizing)}
                    className={`customize-toggle ${isCustomizing ? 'active' : ''}`}
                >
                    {isCustomizing ? (
                        <><Check size={16} /> Done</>
                    ) : (
                        <><Settings2 size={16} /> Customize Dashboard</>
                    )}
                </button>
            </div>

            {isCustomizing && (
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                }}>
                    {[
                        { id: 'goals', label: 'Weekly Goals' },
                        { id: 'activity', label: 'Activity Score' },
                        { id: 'habits', label: 'Habits' },
                        { id: 'efficiency', label: 'Efficiency' },
                        { id: 'clock', label: 'Time & Date' }
                    ].map(w => (
                        <button
                            key={w.id}
                            onClick={() => {
                                if (layout.includes(w.id)) {
                                    setLayout(layout.filter(l => l !== w.id));
                                } else {
                                    setLayout([...layout, w.id]);
                                }
                            }}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '12px',
                                border: `1px solid ${layout.includes(w.id) ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                                background: layout.includes(w.id) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: layout.includes(w.id) ? 'white' : 'var(--text-muted)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {w.label}
                        </button>
                    ))}
                </div>
            )}

            <div className={`top-section ${isCustomizing ? 'customizing-overlap' : ''}`}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={layout} strategy={rectSortingStrategy}>
                        {layout.map((type) => renderWidget(type))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
