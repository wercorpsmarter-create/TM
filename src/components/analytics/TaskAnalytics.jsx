import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart2 } from 'lucide-react';

export default function TaskAnalytics({ tasks }) {
    const data = [
        { name: 'To-Do', value: tasks.filter(t => t.status === 'To-Do').length },
        { name: 'In-Progress', value: tasks.filter(t => t.status === 'In-Progress').length },
        { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length },
    ];

    const COLORS = ['#ef4444', '#f59e0b', '#475569'];

    return (
        <div className="card">
            <h3 className="card-title"><BarChart2 size={20} /> Analytics</h3>
            <div style={{ height: '240px', width: '100%' }}>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}
