import React, { useState, useMemo, useRef, useEffect } from 'react';


import { Plus, Trash2, CheckCircle, Circle, Calendar as CalendarIcon, Pencil, CheckCircle2, Video, ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// CSS keyframes for task entry animation
const taskAnimationStyles = `
@keyframes taskSlideIn {
    0% {
        opacity: 0;
        transform: translateY(-8px) scale(0.97);
        max-height: 0;
    }
    40% {
        max-height: 80px;
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        max-height: 80px;
    }
}
.task-enter-animation {
    animation: taskSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

const TimePicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); // 5-minute intervals

    const [selectedHour, setSelectedHour] = useState(value ? value.split(':')[0] : '12');
    const [selectedMinute, setSelectedMinute] = useState(value ? value.split(':')[1] : '00');

    React.useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setSelectedHour(h);
            setSelectedMinute(m);
        }
    }, [value]);

    const handleTimeChange = (h, m) => {
        setSelectedHour(h);
        setSelectedMinute(m);
        onChange(`${h}:${m}`);
    };

    return (
        <div style={{ position: 'absolute', right: '35px', top: '50%', transform: 'translateY(-50%)' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    color: '#334155',
                    cursor: 'pointer',
                    minWidth: '45px',
                    textAlign: 'center',
                    fontWeight: 500
                }}
            >
                {value || '--:--'}
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="time-picker-popup glass-card" style={{
                        position: 'absolute',
                        top: 'calc(100% + 5px)',
                        right: 0,
                        zIndex: 100,
                        display: 'flex',
                        height: '150px',
                        width: '120px',
                        padding: '0',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                        {/* Hours Column */}
                        <div style={{ flex: 1, overflowY: 'scroll', borderRight: '1px solid rgba(0,0,0,0.05)' }} className="hide-scrollbar">
                            {hours.map(h => (
                                <div
                                    key={h}
                                    onClick={() => handleTimeChange(h, selectedMinute)}
                                    style={{
                                        padding: '6px 0',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: selectedHour === h ? 'var(--primary)' : 'transparent',
                                        color: selectedHour === h ? 'white' : 'var(--text-main)',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {h}
                                </div>
                            ))}
                        </div>
                        {/* Minutes Column */}
                        <div style={{ flex: 1, overflowY: 'scroll' }} className="hide-scrollbar">
                            {minutes.map(m => (
                                <div
                                    key={m}
                                    onClick={() => handleTimeChange(selectedHour, m)}
                                    style={{
                                        padding: '6px 0',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: selectedMinute === m ? 'var(--primary)' : 'transparent',
                                        color: selectedMinute === m ? 'white' : 'var(--text-main)',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const SortableTask = ({ task, onToggleTask, onDeleteTask, onUpdateTask, isEditing, onInteractionStart, onInteractionEnd }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { task }
    });

    const [showMenu, setShowMenu] = useState(false);
    const [isNew, setIsNew] = useState(true);
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            const timer = setTimeout(() => setIsNew(false), 400);
            return () => clearTimeout(timer);
        }
    }, []);

    const color = task.metadata?.color;

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0 : undefined,
        zIndex: isDragging ? 999 : 'auto',
        touchAction: 'none',
        ...(color ? {
            backgroundColor: `${color}15`,
            backdropFilter: 'blur(4px)',
            borderColor: `${color}40`,
            borderLeft: `3px solid ${color}`,
            color: '#000'
        } : {})
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`compact-task ${task.status === 'Completed' ? 'completed' : ''} ${isNew && !isDragging ? 'task-enter-animation' : ''}`}
            onPointerDown={(e) => {
                e.stopPropagation();
                if (e.nativeEvent) {
                    e.nativeEvent.stopImmediatePropagation();
                }

                if (onInteractionStart) onInteractionStart();
                if (listeners && listeners.onPointerDown) {
                    listeners.onPointerDown(e);
                }
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
            }}
            onPointerUp={(e) => {
                if (onInteractionEnd) onInteractionEnd();
            }}
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => setShowMenu(false)}
            onClick={(e) => {
                if (isDragging) return;
                onToggleTask(task.id);
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ marginTop: '3px' }}>
                    {task.status === 'Completed' ?
                        <CheckCircle size={18} color="#475569" fill="rgba(71, 85, 105, 0.1)" /> :
                        <Circle size={18} color={task.metadata?.color || "rgba(0, 0, 0, 0.2)"} />
                    }
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '0.4rem', marginRight: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem' }}>{task.text}</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {(task.metadata?.meetLink || task.metadata?.hangoutLink) && (
                                <a
                                    href={task.metadata.meetLink || task.metadata.hangoutLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Join Google Meet"
                                    className="meet-link-btn"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'rgba(37, 99, 235, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        color: 'var(--primary)',
                                        textDecoration: 'none'
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <Video size={12} style={{ marginRight: '4px' }} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Join</span>
                                </a>
                            )}


                        </div>
                    </div>
                </div>
            </div>

            {isEditing && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className="btn-delete"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

const DayColumn = ({ dayName, tasks, onAddTask, onDeleteTask, onToggleTask, onUpdateTask, onInteractionStart, onInteractionEnd, offset = 0, onOpenCalendarPopup }) => {
    const { setNodeRef } = useDroppable({
        id: dayName,
    });

    const [inputValue, setInputValue] = useState('');
    const [syncToGoogle, setSyncToGoogle] = useState(false);
    const [taskTime, setTaskTime] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isCalendarMode, setIsCalendarMode] = useState(false);



    // Use the same Monday-start logic as App.jsx
    const getColumnDate = () => {
        const DAYS_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetIdx = DAYS_LIST.indexOf(dayName);
        const d = new Date();
        const currentDay = d.getDay();
        const diffFromMonday = (currentDay === 0 ? 6 : currentDay - 1);
        const monday = new Date(d);
        monday.setDate(d.getDate() - diffFromMonday + (offset * 7)); // Add Offset

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
    const progressData = useMemo(() => [
        { name: 'Done', value: completed },
        { name: 'Pending', value: Math.max(0, total - completed) }
    ], [completed, total]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        if (isCalendarMode) {
            if (onOpenCalendarPopup) {
                onOpenCalendarPopup({
                    title: inputValue,
                    dateStr: formatLocalDate(columnDate),
                    // timeStr: taskTime // Optional: if we want to pass time too
                });
            }
        } else {
            onAddTask(columnDateStr, inputValue, syncToGoogle, taskTime || null);
        }

        setInputValue('');
        setSyncToGoogle(false);
        setTaskTime('');
        setIsCalendarMode(false);
    };

    const toggleSync = () => {
        if (syncToGoogle) {
            setSyncToGoogle(false);
            setTaskTime('');
        } else {
            setSyncToGoogle(true);
            // Default to current hour or user picks
        }
    };

    return (
        <div className="day-column">
            <div className="day-title">{dayName} <span style={{ opacity: 0.5, fontSize: '0.7em', display: 'block' }}>{displayDate}</span></div>
            <div className="glass-card" style={{ padding: '1rem', minHeight: '400px', display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

                {/* Daily Progress Donut */}
                <div className="donut-container" style={{ height: '100px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(() => {
                        const pct = total > 0 ? (completed / total) : 0;
                        const radius = 30;
                        const strokeW = 12;
                        const circumference = 2 * Math.PI * radius;
                        const dashOffset = circumference * (1 - pct);
                        return (
                            <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={strokeW} />
                                <circle cx="40" cy="40" r={radius} fill="none" stroke="#475569" strokeWidth={strokeW} strokeLinecap="butt" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="donut-progress" />
                            </svg>
                        );
                    })()}
                </div>

                {/* Add Task Input */}
                {isEditing && (
                    <form onSubmit={handleSubmit} className="task-input-container">
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder={isCalendarMode ? "Add event to calendar..." : "Add task..."}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                style={{ width: '100%', paddingRight: '2.5rem' }}
                                autoFocus
                            />



                            <button
                                type="button"
                                onClick={() => setIsCalendarMode(!isCalendarMode)}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: isCalendarMode ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="Add to Calendar"
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
                <SortableContext
                    items={dayTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="compact-task-list" style={{ marginTop: isEditing ? '0' : '1rem', minHeight: '100px' }} ref={setNodeRef}>
                        {dayTasks.map(task => (
                            <SortableTask
                                key={task.id}
                                task={task}
                                onToggleTask={onToggleTask}
                                onDeleteTask={onDeleteTask}
                                onUpdateTask={onUpdateTask}
                                isEditing={isEditing}
                                onInteractionStart={onInteractionStart}
                                onInteractionEnd={onInteractionEnd}
                            />
                        ))}
                        {dayTasks.length === 0 && !isEditing && (
                            <div style={{ textAlign: 'center', opacity: 0.2, fontSize: '0.75rem', marginTop: '2rem' }}>
                                No tasks
                            </div>
                        )}
                    </div>
                </SortableContext>

                <button
                    className="widget-edit-trigger"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? <CheckCircle2 size={18} color="#22c55e" /> : <Pencil size={14} />}
                </button>
            </div>
        </div >
    );
};

export default function WeeklyBreakdown({
    tasks,
    onAddTask,
    onDeleteTask,
    onToggleTask,
    onUpdateTask,
    onMoveTask,
    onDragStart,
    onDragEnd,
    onReorderTasks,

    visibleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    currentWeekOffset = 0,
    onNextWeek,
    onPrevWeek,
    onOpenCalendarPopup,
    isCustomizing,
    setVisibleDays
}) {
    const [activeTask, setActiveTask] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event) => {
        setActiveTask(event.active.data.current?.task);
        if (onDragStart) onDragStart();
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id && over.id) {
            // Check if same day (reorder) or different day (move)
            const activeTaskData = tasks.find(t => t.id === active.id);
            const overTaskData = tasks.find(t => t.id === over.id); // If dropped on another task
            const overDayName = overTaskData ? overTaskData.day : over.id; // Either task's day or day column ID

            if (activeTaskData) {
                if (activeTaskData.day !== overDayName) {
                    // Different day: Move
                    onMoveTask(active.id, overDayName);
                } else if (active.id !== over.id) {
                    // Same day: Reorder
                    // We need to reorder the *entire* tasks list to reflect this change?
                    // Strategy: Extract tasks for this day. Reorder them. Merge back into full list.
                    const dayTasks = tasks.filter(t => t.day === activeTaskData.day);
                    const oldIndex = dayTasks.findIndex(t => t.id === active.id);
                    const newIndex = dayTasks.findIndex(t => t.id === over.id);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        const reorderedDayTasks = arrayMove(dayTasks, oldIndex, newIndex);
                        // Reconstruct full list (keeping other days' tasks intact)
                        const otherTasks = tasks.filter(t => t.day !== activeTaskData.day);
                        // We concat. Note: This might change the global order of 'days' blocks in the array, but
                        // since we filter by day for rendering, it shouldn't matter visually, as long as 
                        // the user's reordering within the day is preserved.
                        const newFullList = [...otherTasks, ...reorderedDayTasks];
                        onReorderTasks(newFullList);
                    }
                }
            }
        }
        setActiveTask(null);
        if (onDragEnd) onDragEnd();
    };

    return (
        <>
            <style>{taskAnimationStyles}</style>
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                collisionDetection={closestCenter}
                autoScroll={false}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0 1rem' }}>
                    <button onClick={onPrevWeek} className="btn-icon" style={{ background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(4px)', color: '#64748b', height: '20px', padding: '0 1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={14} />
                    </button>
                    <button onClick={onNextWeek} className="btn-icon" style={{ background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(4px)', color: '#64748b', height: '20px', padding: '0 1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={14} />
                    </button>

                    {isCustomizing && (
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            marginLeft: '1rem'
                        }}>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                const isVisible = visibleDays.includes(day);
                                const canToggle = !(isVisible && visibleDays.length === 1);
                                return (
                                    <button
                                        key={day}
                                        onClick={() => {
                                            if (!canToggle || !setVisibleDays) return;
                                            if (isVisible) {
                                                setVisibleDays(visibleDays.filter(d => d !== day));
                                            } else {
                                                setVisibleDays([...visibleDays, day]);
                                            }
                                        }}
                                        style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '8px',
                                            border: `1px solid ${isVisible ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                                            background: isVisible ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: isVisible ? 'white' : 'var(--text-muted)',
                                            fontSize: '0.7rem',
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
                    )}
                </div>

                <div className="weekly-breakdown">
                    {DAYS.filter(day => visibleDays.includes(day)).map((day, index) => (
                        <DayColumn
                            key={`${day}-${currentWeekOffset}`}
                            dayName={day}
                            tasks={tasks}
                            onAddTask={onAddTask}
                            onDeleteTask={onDeleteTask}
                            onToggleTask={onToggleTask}
                            onUpdateTask={onUpdateTask}
                            onInteractionStart={onDragStart}
                            onInteractionEnd={onDragEnd}
                            offset={currentWeekOffset}
                            onOpenCalendarPopup={onOpenCalendarPopup}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeTask ? (
                        <div className={`compact-task ${activeTask.status === 'Completed' ? 'completed' : ''}`} style={{ opacity: 0.9, transform: 'scale(1.05)', transition: 'none', cursor: 'grabbing' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {activeTask.status === 'Completed' ?
                                    <CheckCircle size={18} color="#475569" fill="rgba(71, 85, 105, 0.1)" /> :
                                    <Circle size={18} color="rgba(0, 0, 0, 0.2)" />
                                }
                            </div>
                            <span style={{ fontSize: '0.85rem' }}>{activeTask.text}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </>
    );
}
