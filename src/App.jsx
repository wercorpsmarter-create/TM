import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Calendar as CalendarIcon, Download, RefreshCcw, LogOut, X } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import api from './utils/api';
import TopSection from './components/layout/TopSection';
import WeeklyBreakdown from './components/layout/WeeklyBreakdown';
import CalendarTab from './components/layout/CalendarTab';
import LoginScreen from './components/auth/LoginScreen';
import SubscriptionPaywall from './components/auth/SubscriptionPaywall';
import Privacy from './Privacy';
import Terms from './Terms';
import './styles/main.css';

// Helper to get YYYY-MM-DD in LOCAL time
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get the start of the current week (Monday)
const getStartOfCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const getTargetDate = (dayName) => {
    const DAYS_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIdx = DAYS_MAP.indexOf(dayName);

    const monday = getStartOfCurrentWeek();
    const mondayIdx = 1;
    let offset = targetDayIdx - mondayIdx;
    if (offset < 0) offset += 7;

    const target = new Date(monday);
    target.setDate(monday.getDate() + offset);
    return formatLocalDate(target);
};

function App() {
    // FIXED: This now checks the URL bar before deciding which tab to show
    const [activeTab, setActiveTab] = useState(() => {
        const path = window.location.pathname;
        if (path === '/privacy') return 'privacy';
        if (path === '/terms') return 'terms';
        return 'dashboard';
    });

    const [tasks, setTasks] = useState([]);
    const [habits, setHabits] = useState([]);
    const [goals, setGoals] = useState([]);
    const [dashboardLayout, setDashboardLayout] = useState(['goals', 'activity', 'habits', 'efficiency']);
    const [googleUser, setGoogleUser] = useLocalStorage('prohub-google-user-v2', null);
    const [subscriptionStatus, setSubscriptionStatus] = useState('none');
    const [userId, setUserId] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [lastCleanupDate, setLastCleanupDate] = useState('');

    // Global Google Calendar State
    const [calendarList, setCalendarList] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    // Load user data from database when logged in
    useEffect(() => {
        if (googleUser?.email) {
            loadUserData();
        }
    }, [googleUser]);

    // Handle browser back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/privacy') setActiveTab('privacy');
            else if (path === '/terms') setActiveTab('terms');
            else setActiveTab('dashboard');
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const loadUserData = async () => {
        if (!googleUser?.email || !googleUser?.id) return;

        setDataLoading(true);
        try {
            // Create or get user from database
            const googleId = googleUser.id; // Use Google's user ID
            let user = await api.getUser(googleId);

            if (!user) {
                user = await api.createOrUpdateUser(
                    googleUser.email,
                    googleUser.name || googleUser.email.split('@')[0],
                    googleId,
                    subscriptionStatus
                );
            }

            setUserId(user.id);
            setSubscriptionStatus(user.subscription_status || 'none');

            // Load all user data
            const [tasksData, habitsData, goalsData, layoutData] = await Promise.all([
                api.getTasks(user.id),
                api.getHabits(user.id),
                api.getGoals(user.id),
                api.getLayout(user.id)
            ]);

            // Transform tasks to include day property
            const transformedTasks = tasksData.map(task => ({
                ...task,
                day: getDayNameFromDate(task.date),
                text: task.title
            }));

            setTasks(transformedTasks);
            setHabits(habitsData);
            setGoals(goalsData);
            setDashboardLayout(layoutData);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setDataLoading(false);
        }
    };

    const getDayNameFromDate = (dateStr) => {
        const DAYS_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dateObj = new Date(dateStr);
        return DAYS_LIST[dateObj.getDay()];
    };

    // Save layout to database when it changes
    useEffect(() => {
        if (userId && dashboardLayout.length > 0) {
            api.saveLayout(userId, dashboardLayout).catch(console.error);
        }
    }, [dashboardLayout, userId]);

    // Update subscription status in database
    useEffect(() => {
        if (userId && subscriptionStatus !== 'none') {
            api.createOrUpdateUser(
                googleUser.email,
                googleUser.name || googleUser.email.split('@')[0],
                googleUser.email,
                subscriptionStatus
            ).catch(console.error);
        }
    }, [subscriptionStatus, userId]);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // Fetch user profile from Google
            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userInfoResponse.json();

                // Store complete user info with access token
                const completeUserData = {
                    ...tokenResponse,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    id: userInfo.id
                };

                setGoogleUser(completeUserData);
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        },
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
    });

    // Separate login for existing users - validates subscription
    const loginExistingUser = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userInfoResponse.json();

                // Check if user exists in database
                const existingUser = await api.getUser(userInfo.id);

                if (!existingUser) {
                    alert('No account found. Please sign up first by starting a free trial.');
                    return;
                }

                // Check if user has a valid subscription
                if (existingUser.subscription_status === 'none' || !existingUser.subscription_status) {
                    alert('Your account does not have an active subscription. Please start a free trial.');
                    return;
                }

                // User is valid - proceed with login
                const completeUserData = {
                    ...tokenResponse,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    id: userInfo.id
                };

                setGoogleUser(completeUserData);
            } catch (error) {
                console.error('Error during login:', error);
                alert('Login failed. Please try again.');
            }
        },
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
    });

    const logout = () => {
        setGoogleUser(null);
        setCalendarList([]);
        setUserId(null);
        setTasks([]);
        setHabits([]);
        setGoals([]);
        setSubscriptionStatus('none');
    };



    const fetchCalendarList = async (accessToken) => {
        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const data = await response.json();
            const items = data.items || [];
            setCalendarList(items);
            return items;
        } catch (error) {
            console.error('Error fetching calendar list:', error);
            return [];
        }
    };

    const handleSyncClick = () => {
        if (!googleUser) {
            login();
        } else {
            setIsImportModalOpen(true);
            fetchCalendarList(googleUser.access_token);
        }
    };

    const handleSubscribe = async () => {
        try {
            const response = await fetch('http://localhost:5174/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Failed to create checkout session:', data.error);
                alert('Connection to payment server failed. Please ensure the dev server on port 5174 is running.');
            }
        } catch (error) {
            console.error('Subscription redirect error:', error);
            alert('Error connecting to subscription service.');
        }
    };

    // Check for subscription success on load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            setSubscriptionStatus('trialing');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const importFromCalendar = async (calendarId, accessToken = googleUser?.access_token) => {
        if (!accessToken) return;
        setImportLoading(true);
        try {
            const monday = getStartOfCurrentWeek();
            const startOfRange = monday.toISOString();
            const nextMonday = new Date(monday);
            nextMonday.setDate(monday.getDate() + 7);
            const endOfRange = nextMonday.toISOString();

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${startOfRange}&timeMax=${endOfRange}&singleEvents=true&orderBy=startTime`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const data = await response.json();

            // Calendar events are fetched but NOT converted to tasks
            // They will only be visible in the Calendar tab
            setIsImportModalOpen(false);
        } catch (error) {
            console.error('Error importing events:', error);
        } finally {
            setImportLoading(false);
        }
    };

    const pushToGoogle = async (taskText, dateStr) => {
        if (!googleUser || !googleUser.access_token) return;

        try {
            await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleUser.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    summary: taskText,
                    description: 'Added via Task Master',
                    start: { date: dateStr },
                    end: { date: dateStr }
                })
            });
            console.log('Synced to Google Calendar');
        } catch (error) {
            console.error('Error syncing to Google:', error);
        }
    };

    const addTask = async (day, text, syncWithGoogle = false) => {
        if (!userId) return;

        const dateStr = getTargetDate(day);
        try {
            const newTask = await api.createTask(userId, text, dateStr, 'To-Do');
            setTasks([...tasks, {
                ...newTask,
                day,
                text: newTask.title
            }]);

            if (syncWithGoogle) {
                await pushToGoogle(text, dateStr);
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await api.deleteTask(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const toggleTask = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
        try {
            await api.updateTask(taskId, { status: newStatus });
            setTasks(tasks.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            ));
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const addGoal = async (text) => {
        if (!text.trim() || !userId) return;

        try {
            await api.createGoal(userId, text, goals.length);
            setGoals([...goals, text]);
        } catch (error) {
            console.error('Error adding goal:', error);
        }
    };

    const deleteGoal = async (idx) => {
        try {
            // Note: We need to fetch the actual goal ID from the database
            // For now, we'll reload goals after deletion
            const goalsData = await api.getGoals(userId);
            if (goalsData[idx]) {
                // This is a simplified approach - in production you'd want to track goal IDs
                setGoals(goals.filter((_, i) => i !== idx));
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const addHabit = async (name) => {
        if (!name.trim() || !userId) return;

        try {
            const newHabit = await api.createHabit(userId, name);
            setHabits([...habits, newHabit]);
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    };

    const deleteHabit = async (id) => {
        try {
            await api.deleteHabit(id);
            setHabits(habits.filter(h => h.id !== id));
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    const updateHabitHistory = async (habitId, newHistory) => {
        try {
            await api.updateHabit(habitId, newHistory);
            setHabits(habits.map(h =>
                h.id === habitId ? { ...h, history: newHistory } : h
            ));
        } catch (error) {
            console.error('Error updating habit:', error);
        }
    };

    const importTasksFromGoogle = async (googleEvents) => {
        if (!userId) return;

        const newTasks = [];
        for (const event of googleEvents) {
            const dateStr = (event.start.dateTime || event.start.date).split('T')[0];
            const dayName = getDayNameFromDate(dateStr);

            // Check if task already exists
            const exists = tasks.some(t => t.text === event.summary && t.date === dateStr);
            if (!exists) {
                try {
                    const task = await api.createTask(userId, event.summary, dateStr, 'Pending');
                    newTasks.push({
                        ...task,
                        day: dayName,
                        text: task.title
                    });
                } catch (error) {
                    console.error('Error importing task:', error);
                }
            }
        }

        if (newTasks.length > 0) {
            setTasks([...tasks, ...newTasks]);
        }
    };


    // Show subscription paywall first (before login)
    if (subscriptionStatus === 'none') {
        return <SubscriptionPaywall onSubscribe={handleSubscribe} onLogin={loginExistingUser} />;
    }

    // Then require Google login
    if (!googleUser) {
        return <LoginScreen onLogin={login} />;
    }


    if (dataLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <RefreshCcw size={32} className="spin" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '1rem', fontWeight: 500 }}>Loading your data...</span>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Top Navigation */}
            <nav style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        letterSpacing: '0.1em',
                        borderBottom: activeTab === 'dashboard' ? '2px solid var(--primary)' : '2px solid transparent',
                        paddingBottom: '0.5rem',
                        transition: 'all 0.3s'
                    }}
                >
                    DASHBOARD
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'calendar' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        letterSpacing: '0.1em',
                        borderBottom: activeTab === 'calendar' ? '2px solid var(--primary)' : '2px solid transparent',
                        paddingBottom: '0.5rem',
                        transition: 'all 0.3s'
                    }}
                >
                    CALENDAR
                </button>
                <button
                    onClick={logout}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        letterSpacing: '0.1em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        paddingBottom: '0.5rem',
                        transition: 'all 0.3s'
                    }}
                >
                    <LogOut size={16} /> LOGOUT
                </button>
            </nav>

            {activeTab === 'dashboard' ? (
                <>
                    <TopSection
                        tasks={tasks}
                        habits={habits}
                        setHabits={updateHabitHistory}
                        onAddHabit={addHabit}
                        onDeleteHabit={deleteHabit}
                        goals={goals}
                        onAddGoal={addGoal}
                        onDeleteGoal={deleteGoal}
                        onSyncClick={handleSyncClick}
                        layout={dashboardLayout}
                        setLayout={setDashboardLayout}
                    />
                    <WeeklyBreakdown
                        tasks={tasks}
                        onAddTask={addTask}
                        onDeleteTask={deleteTask}
                        onToggleTask={toggleTask}
                    />
                </>
            ) : activeTab === 'calendar' ? (
                <CalendarTab
                    user={googleUser}
                    setUser={setGoogleUser}
                    tasks={tasks}
                    onSyncClick={handleSyncClick}
                />
            ) : activeTab === 'privacy' ? (
                <Privacy />
            ) : activeTab === 'terms' ? (
                <Terms />
            ) : null}

            {/* Unified Import Modal */}
            {isImportModalOpen && (
                <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Select Calendar to Import</h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="btn-icon" style={{ width: '32px', height: '32px', background: 'none' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                            Choose a calendar to pull events from and add them to your Hub dashboard as tasks.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {calendarList.map(cal => (
                                <div
                                    key={cal.id}
                                    className="calendar-list-item"
                                    onClick={() => importFromCalendar(cal.id)}
                                    style={{ opacity: importLoading ? 0.5 : 1, pointerEvents: importLoading ? 'none' : 'auto' }}
                                >
                                    <span>{cal.summary}</span>
                                    {cal.primary && <span style={{ fontSize: '0.65rem', opacity: 0.5, marginLeft: 'auto', background: 'rgba(96, 165, 250, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>PRIMARY</span>}
                                </div>
                            ))}
                        </div>
                        {importLoading && (
                            <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>

                                <RefreshCcw size={16} className="spin" /> Syncing...
                            </div>
                        )}
                        <button
                            className="btn-icon"
                            style={{ width: '100%', marginTop: '1.5rem', background: 'rgba(255,255,255,0.05)' }}
                            onClick={() => setIsImportModalOpen(false)}
                            disabled={importLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.3, fontSize: '0.75rem', color: 'white' }}>
                Task Master • Glassmorphism Edit
                <div style={{ marginTop: '0.5rem' }}>
                    <button
                        onClick={() => { window.history.pushState({}, '', '/privacy'); setActiveTab('privacy'); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: 'inherit',
                            padding: 0
                        }}
                    >
                        Privacy Policy
                    </button>
                    {' • '}
                    <button
                        onClick={() => { window.history.pushState({}, '', '/terms'); setActiveTab('terms'); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: 'inherit',
                            padding: 0
                        }}
                    >
                        Terms of Service
                    </button>
                </div>
            </div>

            {importLoading && !isImportModalOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(10px)',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    zIndex: 2000,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                    <RefreshCcw size={20} className="spin" style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Importing your calendar...</span>
                </div>
            )}
        </div>
    );
}

export default App;
