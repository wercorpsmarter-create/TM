import React from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
    return (
        <div className="sidebar">
            <div className="logo">
                <LayoutDashboard size={28} />
                <span>ProHub</span>
            </div>

            <nav className="nav-links">
                <div
                    className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </div>
                <div
                    className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calendar')}
                >
                    <CalendarIcon size={20} />
                    <span>Calendar</span>
                </div>
                <div className="nav-item">
                    <Settings size={20} />
                    <span>Settings</span>
                </div>
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <div className="nav-item">
                    <LogOut size={20} />
                    <span>Logout</span>
                </div>
            </div>
        </div>
    );
}
