import React, { useState, useMemo, useEffect } from 'react';

import { RefreshCcw, Settings2, Check, Plus, Trash2, Pencil, CheckCircle2, GripVertical, Video, Trophy, User, Flag, Briefcase } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const animateLayoutChanges = (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true });

const SortableWidget = ({ id, children, isCustomizing, onInteractionStart, onInteractionEnd, isDragOverlay }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        animateLayoutChanges
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 0 : 1,
        position: 'relative',
        touchAction: 'none',
        willChange: isDragging ? 'transform' : 'auto',
    };

    // Style for the floating overlay copy
    const overlayStyle = isDragOverlay ? {
        position: 'relative',
        transform: 'scale(1.03)',
        boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(96, 165, 250, 0.3)',
        zIndex: 999,
        cursor: 'grabbing',
        opacity: 0.95,
    } : {};

    const handlers = isCustomizing ? {
        ...attributes,
        ...listeners,
        onPointerDown: (e) => {
            e.stopPropagation();
            if (onInteractionStart) onInteractionStart();
            if (listeners && listeners.onPointerDown) listeners.onPointerDown(e);
        },
        onPointerUp: (e) => {
            if (onInteractionEnd) onInteractionEnd();
            if (listeners && listeners.onPointerUp) listeners.onPointerUp(e);
        }
    } : {};

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...overlayStyle, cursor: isCustomizing ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            className={`glass-card widget-item ${isCustomizing ? 'customizing' : ''}`}
            {...handlers}
        >
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
    monthlyGoals,
    onAddMonthlyGoal,
    onDeleteMonthlyGoal,
    onAddHabit,
    onDeleteHabit,
    onDragStart,
    onDragEnd,
    upcomingEvents,
    visibleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    setVisibleDays,
    accentColor = '#3b82f6',
    setAccentColor
}) {
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [poppingBubble, setPoppingBubble] = useState(null);
    const [activeDragId, setActiveDragId] = useState(null);
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [isEditingMonthlyGoals, setIsEditingMonthlyGoals] = useState(false);
    const [isEditingHabits, setIsEditingHabits] = useState(false);
    const [newGoalText, setNewGoalText] = useState('');
    const [newMonthlyGoalText, setNewMonthlyGoalText] = useState('');
    const [newHabitText, setNewHabitText] = useState('');
    const [newGoalImportance, setNewGoalImportance] = useState(1);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );


    // Weekly Overview (Activity Score) - memoized to prevent re-animation
    const chartData = useMemo(() => DAYS_SHORT.map((day, idx) => {
        const fullDayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx];

        // Skip if day is not visible
        if (!visibleDays.includes(fullDayName)) {
            return null;
        }

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
        const hasTasks = dayTasks.length > 0;
        const score = hasTasks ? (dayCompleted / dayTasks.length) * 100 : 0;
        const full = hasTasks ? 100 : 0;
        return { name: day, progress: score, full: full };
    }).filter(Boolean), [tasks, visibleDays]);

    // Overall Progress (Donut) - memoized
    const completedCount = useMemo(() => tasks.filter(t => t.status === 'Completed').length, [tasks]);
    const totalCount = tasks.length || 1;
    const progressData = useMemo(() => [
        { name: 'Done', value: completedCount },
        { name: 'Pending', value: Math.max(0, totalCount - completedCount) }
    ], [completedCount, totalCount]);

    const handleHabitToggle = (habitId, dayIdx) => {
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
            const newHistory = [...habit.history];
            newHistory[dayIdx] = !newHistory[dayIdx];
            setHabits(habitId, newHistory);
        }
    };

    const handleDragStart = (event) => {
        setActiveDragId(event.active.id);
        if (onDragStart) onDragStart();
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = layout.indexOf(active.id);
            const newIndex = layout.indexOf(over.id);
            setLayout(arrayMove(layout, oldIndex, newIndex));
        }

        setActiveDragId(null);
        if (onDragEnd) onDragEnd();
    };

    const handleDragCancel = () => {
        setActiveDragId(null);
        if (onDragEnd) onDragEnd();
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        // Correctly sum importance including legacy strings (1pt each)
        const currentSum = goals.reduce((sum, g) => {
            const imp = (g && typeof g === 'object') ? (g.importance || 0) : (typeof g === 'string' ? 1 : 0);
            return sum + imp;
        }, 0);

        if (!newGoalText.trim()) {
            alert("Please enter a priority description.");
            return;
        }

        if (goals.length >= 5) {
            alert("Your Priority Ecosystem is full. Please remove an item before adding a new one.");
            return;
        }

        if (currentSum + newGoalImportance > 10) {
            alert(`Cannot add goal. Total importance (${currentSum + newGoalImportance}) would exceed the limit of 10.`);
            return;
        }

        onAddGoal(newGoalText.trim(), newGoalImportance);
        setNewGoalText('');
        setNewGoalImportance(1);
        setIsEditingGoals(false); // Close editor after adding
    };

    const handleAddMonthlyGoal = (e) => {
        e.preventDefault();
        onAddMonthlyGoal(newMonthlyGoalText);
        setNewMonthlyGoalText('');
    };

    const handleAddHabit = (e) => {
        e.preventDefault();
        onAddHabit(newHabitText);
        setNewHabitText('');
    };


    const renderWidget = (type) => {
        switch (type) {
            case 'goals': {
                const totalImportance = (goals || []).reduce((sum, g) => {
                    const imp = (g && typeof g === 'object') ? (g.importance || 0) : (typeof g === 'string' ? 1 : 0);
                    return sum + imp;
                }, 0);

                // Filter and normalize active goals
                const ecosystemNodes = (goals || []).filter(g => g).map((g, i) => {
                    const goalData = typeof g === 'object' ? g : { text: g, importance: 1 };
                    return {
                        id: goalData.id || `goal-${i}`,
                        text: (goalData.text || (typeof g === 'string' ? g : (goalData.title || ''))),
                        importance: goalData.importance || 1,
                        index: i
                    };
                });

                const bubbleColor = { bg: 'rgba(100, 116, 139, 0.25)', border: 'rgba(100, 116, 139, 0.4)', tint: '#94a3b8', shadow: 'rgba(100, 116, 139, 0.15)' };

                return (
                    <SortableWidget
                        id="goals"
                        key="goals"
                        isCustomizing={isCustomizing}
                        onInteractionStart={onDragStart}
                        onInteractionEnd={onDragEnd}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                            <div className="card-title" style={{ margin: 0 }}>Weekly Goals</div>
                        </div>

                        {isEditingGoals && (
                            <div style={{ marginBottom: '1rem', zIndex: 20, position: 'relative' }}>
                                <form onSubmit={handleAddGoal} className="task-input-container" style={{ marginBottom: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        placeholder="Add to your ecosystem..."
                                        value={newGoalText}
                                        onChange={(e) => setNewGoalText(e.target.value)}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn-icon">
                                        <Plus size={18} />
                                    </button>
                                </form>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>重要度</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1, 2, 3, 4, 5].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setNewGoalImportance(val)}
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    border: '1px solid',
                                                    borderColor: newGoalImportance === val ? '#3b82f6' : '#cbd5e1',
                                                    background: newGoalImportance === val ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.1)',
                                                    color: newGoalImportance === val ? 'white' : '#94a3b8',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{
                            position: 'relative',
                            height: '180px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'visible',
                        }}>
                            {ecosystemNodes.length === 0 && !isEditingGoals && (
                                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                    Tap pencil to add priorities
                                </div>
                            )}
                            {(() => {
                                // Pre-compute circle-packed positions so bubbles cluster at center without overlapping
                                const gap = 2;
                                const sorted = ecosystemNodes
                                    .map((g, origIdx) => ({
                                        ...g,
                                        origIdx,
                                        size: 35 + ((g.importance || 1) * 22),
                                    }))
                                    .sort((a, b) => b.size - a.size); // biggest first

                                const placed = []; // { x, y, radius }
                                const positionMap = {}; // origIdx -> { x, y }

                                sorted.forEach((g, i) => {
                                    const r = g.size / 2;
                                    if (i === 0) {
                                        placed.push({ x: 0, y: 0, r });
                                        positionMap[g.origIdx] = { x: 0, y: 0 };
                                        return;
                                    }
                                    // Try angles around center, find first non-overlapping spot
                                    const baseAngle = (i - 1) * (360 / Math.max(sorted.length - 1, 1));
                                    let bestX = 0, bestY = 0, found = false;
                                    for (let dist = placed[0].r + r + gap; dist < 300 && !found; dist += 3) {
                                        for (let a = baseAngle; a < baseAngle + 360 && !found; a += 15) {
                                            const rad = (a * Math.PI) / 180;
                                            const cx = Math.cos(rad) * dist;
                                            const cy = Math.sin(rad) * dist;
                                            let ok = true;
                                            for (const p of placed) {
                                                const dx = cx - p.x;
                                                const dy = cy - p.y;
                                                if (Math.sqrt(dx * dx + dy * dy) < p.r + r + gap) {
                                                    ok = false;
                                                    break;
                                                }
                                            }
                                            if (ok) {
                                                bestX = cx;
                                                bestY = cy;
                                                found = true;
                                            }
                                        }
                                    }
                                    placed.push({ x: bestX, y: bestY, r });
                                    positionMap[g.origIdx] = { x: bestX, y: bestY };
                                });

                                return ecosystemNodes.map((g, i) => {
                                    const color = bubbleColor;
                                    const importance = g.importance || 1;
                                    const size = 35 + (importance * 22);
                                    const pos = positionMap[i] || { x: 0, y: 0 };

                                    return (
                                        <div key={g.id || i}
                                            onClick={() => {
                                                if (poppingBubble !== null) return;
                                                setPoppingBubble(i);
                                                setTimeout(() => {
                                                    onDeleteGoal(i);
                                                    setPoppingBubble(null);
                                                }, 500);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                width: `${size}px`,
                                                height: `${size}px`,
                                                background: color.bg,
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: `1px solid ${color.border}`,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                padding: '10px',
                                                zIndex: 10 + importance,
                                                boxShadow: `0 ${4 + importance}px ${12 + importance * 4}px -${4 + importance}px ${color.shadow}`,
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                marginLeft: `${Math.round(pos.x)}px`,
                                                marginTop: `${Math.round(pos.y)}px`,
                                                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                cursor: 'pointer',
                                                ...(poppingBubble === i ? {
                                                    animation: 'bubble-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                                                    transition: 'none'
                                                } : {}),
                                                ...(isEditingGoals && poppingBubble !== i ? {
                                                    border: `2px dashed ${color.border}`,
                                                } : {})
                                            }}>
                                            <div style={{
                                                fontSize: size < 60 ? '0.3rem' : '0.45rem',
                                                fontWeight: 800,
                                                color: color.tint,
                                                textTransform: 'uppercase',
                                                marginBottom: '2px',
                                                opacity: 0.8
                                            }}>
                                                T{importance}
                                            </div>
                                            <div style={{
                                                fontSize: size < 60 ? '0.45rem' : '0.6rem',
                                                fontWeight: 700,
                                                textAlign: 'center',
                                                lineHeight: 1.1,
                                                color: 'white',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: size < 80 ? 2 : 3,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {g.text}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

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
            }
            case 'monthly_goals':
                return (
                    <SortableWidget
                        id="monthly_goals"
                        key="monthly_goals"
                        isCustomizing={isCustomizing}
                        onInteractionStart={onDragStart}
                        onInteractionEnd={onDragEnd}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div className="card-title" style={{ margin: 0 }}>Monthly Goals</div>
                        </div>

                        {isEditingMonthlyGoals && (
                            <form onSubmit={handleAddMonthlyGoal} className="task-input-container" style={{ marginBottom: '1.5rem' }}>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Add a goal..."
                                    value={newMonthlyGoalText}
                                    onChange={(e) => setNewMonthlyGoalText(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="btn-icon">
                                    <Plus size={18} />
                                </button>
                            </form>
                        )}

                        <ul className="goals-list" style={{ marginBottom: isEditingMonthlyGoals ? '3rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {monthlyGoals.map((g, i) => (
                                <li key={typeof g === 'object' && g?.id != null ? g.id : i} className="goal-item-row" style={{
                                    background: 'rgba(255, 255, 255, 0.4)',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    marginBottom: 0
                                }}>
                                    <span className="goal-num">{i + 1}</span>
                                    <span style={{ flex: 1 }}>{typeof g === 'string' ? g : (g?.text ?? '')}</span>
                                    {isEditingMonthlyGoals && (
                                        <button onClick={() => onDeleteMonthlyGoal(i)} className="btn-delete-small">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {!isCustomizing && (
                            <button
                                className="widget-edit-trigger"
                                onClick={() => setIsEditingMonthlyGoals(!isEditingMonthlyGoals)}
                            >
                                {isEditingMonthlyGoals ? <CheckCircle2 size={18} color="#22c55e" /> : <Pencil size={14} />}
                            </button>
                        )}
                    </SortableWidget>
                );
            case 'activity':
                return (
                    <SortableWidget
                        id="activity"
                        key="activity"
                        isCustomizing={isCustomizing}
                        onInteractionStart={onDragStart}
                        onInteractionEnd={onDragEnd}
                    >
                        <div className="card-title">Activity Score</div>
                        <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '6px', padding: '10px 0' }}>
                            {chartData.map((d, i) => (
                                <div key={d.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                    <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                                        {/* Background bar */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: '15%',
                                            width: '70%',
                                            height: d.full > 0 ? '100%' : '0%',
                                            background: 'rgba(71, 85, 105, 0.08)',
                                            borderRadius: '6px 6px 0 0',
                                        }} />
                                        {/* Progress bar */}
                                        <div className="bar-progress" style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: '15%',
                                            width: '70%',
                                            height: `${d.progress}%`,
                                            background: '#475569',
                                            borderRadius: '6px 6px 0 0',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.6rem', color: 'rgba(71, 85, 105, 0.6)', marginTop: '4px', fontWeight: 500 }}>{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </SortableWidget>
                );
            case 'habits':
                return (
                    <SortableWidget
                        id="habits"
                        key="habits"
                        isCustomizing={isCustomizing}
                        onInteractionStart={onDragStart}
                        onInteractionEnd={onDragEnd}
                    >
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
                                            {(Array.isArray(habit.history) ? habit.history : Array(7).fill(false)).map((done, idx) => (
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
            case 'Weekly Overview':
                return (
                    <SortableWidget
                        id="Weekly Overview"
                        key="Weekly Overview"
                        isCustomizing={isCustomizing}
                        onInteractionStart={onDragStart}
                        onInteractionEnd={onDragEnd}
                    >
                        <div className="card-title">Weekly Overview</div>
                        <div style={{ height: '150px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(() => {
                                const pct = isNaN(completedCount / totalCount) ? 0 : (completedCount / totalCount);
                                const radius = 50;
                                const stroke = 20;
                                const circumference = 2 * Math.PI * radius;
                                const offset = circumference * (1 - pct);
                                return (
                                    <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                                        {/* Background ring */}
                                        <circle
                                            cx="70" cy="70" r={radius}
                                            fill="none"
                                            stroke="rgba(0, 0, 0, 0.05)"
                                            strokeWidth={stroke}
                                        />
                                        {/* Progress ring */}
                                        <circle
                                            cx="70" cy="70" r={radius}
                                            fill="none"
                                            stroke="#475569"
                                            strokeWidth={stroke}
                                            strokeLinecap="butt"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={offset}
                                            className="donut-progress"
                                        />
                                    </svg>
                                );
                            })()}
                            <div className="weekly-overview-pct" style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                zIndex: 5,
                                color: 'var(--text-main)',
                                pointerEvents: 'none'
                            }}>
                                {isNaN(Math.round((completedCount / totalCount) * 100)) ? 0 : Math.round((completedCount / totalCount) * 100)}%
                            </div>
                        </div>
                    </SortableWidget>
                );
            case 'clock':
                return (
                    <SortableWidget
                        id="clock"
                        key="clock"
                        isCustomizing={isCustomizing}
                        onInteractionStart={onDragStart}
                        onInteractionEnd={onDragEnd}
                    >
                        <div className="card-title">Local Time</div>
                        <LiveClock />
                    </SortableWidget>
                );
            case 'upcoming_meetings':
                return (
                    <SortableWidget
                        id="upcoming_meetings"
                        key="upcoming_meetings"
                        isCustomizing={isCustomizing}
                        onInteractionStart={onDragStart}
                        onInteractionEnd={onDragEnd}
                    >
                        <div className="card-title">
                            <Video size={20} /> Upcoming Meetings
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {(!upcomingEvents || upcomingEvents.length === 0) && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No upcoming meetings found.</div>
                            )}
                            {upcomingEvents && upcomingEvents
                                .filter(event => event.hangoutLink)
                                .slice(0, 3)
                                .map(event => (
                                    <div key={event.id} style={{
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.3)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', var: '--text-main', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {event.summary || '(No Title)'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {event.start?.dateTime
                                                    ? new Date(event.start.dateTime).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
                                                    : 'All Day'
                                                }
                                            </div>
                                        </div>
                                        <a
                                            href={event.hangoutLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Join Meeting"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                background: 'rgba(37, 99, 235, 0.1)',
                                                color: 'var(--primary)',
                                                borderRadius: '50%',
                                                textDecoration: 'none',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s'
                                            }}
                                            onPointerDown={(e) => e.stopPropagation()}
                                        >
                                            <Video size={16} />
                                        </a>
                                    </div>
                                ))}
                        </div>
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
                        { id: 'monthly_goals', label: 'Monthly Goals' },
                        { id: 'activity', label: 'Activity Score' },
                        { id: 'habits', label: 'Habits' },
                        { id: 'Weekly Overview', label: 'Weekly Overview' },
                        { id: 'clock', label: 'Digital Clock' },
                        { id: 'upcoming_meetings', label: 'Upcoming Meetings' }
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

            {isCustomizing && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                        color: 'var(--text-main)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>Visible Days</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                            const isVisible = visibleDays.includes(day);
                            const canToggle = !(isVisible && visibleDays.length === 1);
                            return (
                                <button
                                    key={day}
                                    onClick={() => {
                                        if (!canToggle) return;
                                        if (isVisible) {
                                            setVisibleDays(visibleDays.filter(d => d !== day));
                                        } else {
                                            setVisibleDays([...visibleDays, day]);
                                        }
                                    }}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '12px',
                                        border: `1px solid ${isVisible ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                                        background: isVisible ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: isVisible ? 'white' : 'var(--text-muted)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: canToggle ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: canToggle ? 1 : 0.5
                                    }}
                                >
                                    {day.substring(0, 3)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Color Picker */}
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                        color: 'var(--text-main)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginTop: '1rem'
                    }}>Theme Color</div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {[
                            '#3b82f6', // Blue
                            '#ef4444', // Red
                            '#64748b', // Slate
                            '#ffffff', // System White
                        ].map(color => (
                            <button
                                key={color}
                                onClick={() => setAccentColor && setAccentColor(color)}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    border: accentColor === color ? '2px solid white' : '2px solid transparent',
                                    boxShadow: accentColor === color ? `0 0 0 2px ${color}` : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                aria-label={`Select color ${color}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className={`top-section ${isCustomizing ? 'customizing-overlap' : ''}`}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext items={layout} strategy={rectSortingStrategy}>
                        {layout.map((type) => renderWidget(type))}
                    </SortableContext>
                    <DragOverlay
                        dropAnimation={{
                            duration: 300,
                            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                        }}
                    >
                        {activeDragId ? (
                            <div
                                className="glass-card widget-item"
                                style={{
                                    transform: 'scale(1.03)',
                                    boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(96, 165, 250, 0.3)',
                                    cursor: 'grabbing',
                                    opacity: 0.95,
                                }}
                            >
                                {renderWidget(activeDragId)}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}
