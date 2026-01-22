import React from 'react';
import TaskList from '../tasks/TaskList';
import HabitTracker from '../habits/HabitTracker';
import TaskAnalytics from '../analytics/TaskAnalytics';

export default function Dashboard({ tasks, setTasks, habits, setHabits }) {
    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Dashboard Overview</h2>
            <div className="dashboard-grid">
                <div className="main-col">
                    <TaskList tasks={tasks} setTasks={setTasks} />
                </div>
                <div className="side-col">
                    <TaskAnalytics tasks={tasks} />
                    <HabitTracker habits={habits} setHabits={setHabits} />
                </div>
            </div>
        </div>
    );
}
