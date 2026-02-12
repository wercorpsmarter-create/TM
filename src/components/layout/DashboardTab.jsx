import React from 'react';
import TopSection from './TopSection';
import WeeklyBreakdown from './WeeklyBreakdown';

export default function DashboardTab({
    tasks,
    upcomingEvents,
    habits,
    setHabits,
    onAddHabit,
    onDeleteHabit,
    goals,
    onAddGoal,
    onDeleteGoal,
    monthlyGoals,
    onAddMonthlyGoal,
    onDeleteMonthlyGoal,
    onSyncClick,
    layout,
    setLayout,
    onAddTask,
    onDeleteTask,
    onToggleTask,
    onMoveTask,
    onTaskDragStart,
    onTaskDragEnd,
    onReorderTasks,
    visibleDays,
    setVisibleDays,
    currentWeekOffset = 0,
    onNextWeek,
    onNextWeek,
    onPrevWeek,
    onOpenCalendarPopup
}) {
    return (
        <div className="dashboard-tab" style={{ paddingBottom: '0' }}>
            <TopSection
                tasks={tasks}
                upcomingEvents={upcomingEvents}
                habits={habits}
                setHabits={setHabits}
                onAddHabit={onAddHabit}
                onDeleteHabit={onDeleteHabit}
                goals={goals}
                onAddGoal={onAddGoal}
                onDeleteGoal={onDeleteGoal}
                monthlyGoals={monthlyGoals}
                onAddMonthlyGoal={onAddMonthlyGoal}
                onDeleteMonthlyGoal={onDeleteMonthlyGoal}
                onSyncClick={onSyncClick}
                layout={layout}
                setLayout={setLayout}
                onDragStart={onTaskDragStart}
                onDragEnd={onTaskDragEnd}
                visibleDays={visibleDays}
                setVisibleDays={setVisibleDays}
            />
            <WeeklyBreakdown
                tasks={tasks}
                onAddTask={onAddTask}
                onDeleteTask={onDeleteTask}
                onToggleTask={onToggleTask}
                onMoveTask={onMoveTask}
                onDragStart={onTaskDragStart}
                onDragEnd={onTaskDragEnd}
                onReorderTasks={onReorderTasks}
                visibleDays={visibleDays}
                currentWeekOffset={currentWeekOffset}
                onNextWeek={onNextWeek}
                onPrevWeek={onPrevWeek}
                onOpenCalendarPopup={onOpenCalendarPopup}
            />
        </div>
    );
}
