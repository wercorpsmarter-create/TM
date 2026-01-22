import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Clock } from 'lucide-react';

export default function TaskList({ tasks, setTasks }) {
    const [newTaskText, setNewTaskText] = useState('');

    const addTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        const newTask = {
            id: Date.now(),
            text: newTaskText,
            status: 'To-Do',
            dueDate: new Date().toISOString().split('T')[0]
        };
        setTasks([...tasks, newTask]);
        setNewTaskText('');
    };

    const toggleStatus = (id) => {
        setTasks(tasks.map(t => {
            if (t.id === id) {
                const statuses = ['To-Do', 'In-Progress', 'Completed'];
                const nextStatus = statuses[(statuses.indexOf(t.status) + 1) % statuses.length];
                return { ...t, status: nextStatus };
            }
            return t;
        }));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    return (
        <div className="card">
            <h3 className="card-title"><CheckCircle size={20} /> Tasks</h3>
            <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a new task..."
                    className="task-input"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                    <Plus size={20} />
                </button>
            </form>
            <div className="task-items">
                {tasks.map(task => (
                    <div key={task.id} className="task-item">
                        <div onClick={() => toggleStatus(task.id)} style={{ cursor: 'pointer' }}>
                            {task.status === 'Completed' ? <CheckCircle className="text-success" size={20} color="var(--success)" /> : <Circle size={20} color="var(--text-muted)" />}
                        </div>
                        <div className="task-info">
                            <div style={{ textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? 'var(--text-muted)' : 'inherit' }}>
                                {task.text}
                            </div>
                            <span className={`task-status status-${task.status.toLowerCase().replace(' ', '-')}`}>
                                {task.status}
                            </span>
                        </div>
                        <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
