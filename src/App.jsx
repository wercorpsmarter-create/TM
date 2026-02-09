import React, { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Calendar as CalendarIcon, Download, RefreshCcw, LogOut, X } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import api from './utils/api';
import DashboardTab from './components/layout/DashboardTab';
import CalendarTab from './components/layout/CalendarTab';
import EmailTab from './components/layout/EmailTab';

import LoginScreen from './components/auth/LoginScreen';
import SubscriptionPaywall from './components/auth/SubscriptionPaywall';
import Privacy from './Privacy';
import Terms from './Terms';
import Tokusho from './Tokusho';
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
    const containerRef = useRef(null);
    const isSwipingRef = useRef(false);
    const [activeTab, setActiveTab] = useState(() => {
        const path = window.location.pathname;
        if (path === '/privacy') return 'privacy';
        if (path === '/terms') return 'terms';
        if (path === '/tokusho') return 'tokusho';
        return 'dashboard';
    });

    const [tasks, setTasks] = useState([]);
    const [habits, setHabits] = useState([]);
    const [goals, setGoals] = useState([]);
    const [monthlyGoals, setMonthlyGoals] = useState([]);
    const [dashboardLayout, setDashboardLayout] = useState(['goals', 'activity']);
    const [visibleDays, setVisibleDays] = useLocalStorage('prohub-visible-days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    const [googleUser, setGoogleUser] = useLocalStorage('prohub-google-user-v2', null);
    const [subscriptionStatus, setSubscriptionStatus] = useState(() => {
        // If query params exist, we enter "checking" state to verify them
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('session_id') || urlParams.get('success') === 'true') {
            return 'checking';
        }

        // SIGNUP INTENT: Check if they just paid
        try {
            const intent = localStorage.getItem('prohub-signup-intent');
            if (intent === 'trialing') return 'trialing';
        } catch (e) {
            console.error('Error checking intent:', e);
        }

        // Check local storage primarily
        try {
            const storedUser = localStorage.getItem('prohub-google-user-v2');
            if (storedUser && storedUser !== 'null') return 'restoring';
        } catch (e) {
            console.error('Error checking local storage:', e);
        }

        return 'none';
    });

    // Verify Payment Session on Mount
    useEffect(() => {
        const verifyPayment = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');

            if (sessionId) {
                try {
                    const res = await fetch('/api/verify_payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: sessionId })
                    });
                    const data = await res.json();
                    if (data.verified) {
                        setSubscriptionStatus('trialing');
                        // PERSIST INTENT: Save that they just paid, so if OAuth redirects/reloads, we remember.
                        localStorage.setItem('prohub-signup-intent', 'trialing');
                    } else {
                        console.error('Payment verification failed:', data);
                        setSubscriptionStatus('none');
                    }

                    // Always clean up URL to prevent reload loops
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (err) {
                    console.error('Verification error:', err);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    setSubscriptionStatus('none');
                }
            } else {
                setSubscriptionStatus('none');
            }
        };

        if (subscriptionStatus === 'checking') {
            verifyPayment();
        }
    }, [subscriptionStatus]);
    const [userId, setUserId] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [lastCleanupDate, setLastCleanupDate] = useState('');

    // Global Google Calendar State
    const [calendarList, setCalendarList] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [isTaskInteractionLocked, setIsTaskInteractionLocked] = useState(false);

    const dragControls = useDragControls();
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    // Fetch upcoming events for dashboard widget
    useEffect(() => {
        if (googleUser?.access_token) {
            fetchUpcomingEvents(googleUser.access_token);
        }
    }, [googleUser]);

    const fetchUpcomingEvents = async (accessToken) => {
        try {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const timeMin = start.toISOString();
            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=50&singleEvents=true&orderBy=startTime`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setUpcomingEvents(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
        }
    };

    // Load user data from database when logged in
    useEffect(() => {
        if (googleUser?.email) {
            loadUserData();
        }
    }, [googleUser, subscriptionStatus]);

    // Handle browser back/forward navigation
    // Handle browser back/forward navigation and initial load state
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            const params = new URLSearchParams(window.location.search);


            if (path === '/privacy') setActiveTab('privacy');
            else if (path === '/terms') setActiveTab('terms');
            else if (path === '/tokusho') setActiveTab('tokusho');
            else setActiveTab('dashboard');
        };

        handlePopState(); // Check on mount too

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Handle trackpad/mouse wheel horizontal swipe
    useEffect(() => {
        const handleWheel = (e) => {
            // Check if it's a horizontal scroll
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
                e.preventDefault(); // Prevent browser back/forward navigation

                if (isSwipingRef.current) return;

                if (activeTab === 'dashboard' && e.deltaX > 0) {
                    setActiveTab('calendar');
                    isSwipingRef.current = true;
                    setTimeout(() => isSwipingRef.current = false, 500);
                } else if (activeTab === 'calendar' && e.deltaX < 0) {
                    setActiveTab('dashboard');
                    isSwipingRef.current = true;
                    setTimeout(() => isSwipingRef.current = false, 500);
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [activeTab]);

    const loadUserData = async () => {
        if (!googleUser?.email || !googleUser.id) return;

        setDataLoading(true);
        try {
            // Create or get user from database
            const googleId = googleUser.id; // Use Google's user ID
            let user = await api.getUser(googleId);

            // CHECK SIGNUP INTENT: Did they just pay?
            const storedIntent = localStorage.getItem('prohub-signup-intent');
            // We consider them "just subscribed" if React state says so OR local storage says so
            const isJustSubscribed = subscriptionStatus === 'trialing' || storedIntent === 'trialing';

            if (!user) {
                user = await api.createOrUpdateUser(
                    googleUser.email,
                    googleUser.name || googleUser.email.split('@')[0],
                    googleId,
                    'trialing' // Auto-grant trial access since paywall is removed
                );
            } else if (isJustSubscribed && (user.subscription_status === 'none' || !user.subscription_status)) {
                // Upgrade the existing user to trialing
                user = await api.createOrUpdateUser(
                    user.email,
                    user.name || googleUser.name,
                    googleId,
                    'trialing'
                );
            }

            // CONSUME INTENT: Once used, clear it so we don't upgrade them forever accidentally
            if (storedIntent) {
                localStorage.removeItem('prohub-signup-intent');
            }

            setUserId(user.id);
            // Only set from user if we didn't just forced it to trialing
            setSubscriptionStatus(user.subscription_status || 'none');

            // Load all user data
            const [tasksData, habitsData, goalsData, monthlyGoalsData, layoutData] = await Promise.all([
                api.getTasks(user.id),
                api.getHabits(user.id),
                api.getGoals(user.id),
                api.getMonthlyGoals(user.id),
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
            setMonthlyGoals(monthlyGoalsData);
            setDashboardLayout(layoutData);
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
        if (userId && subscriptionStatus !== 'none' && googleUser?.id) {
            api.createOrUpdateUser(
                googleUser.email,
                googleUser.name || googleUser.email.split('@')[0],
                googleUser.id,
                subscriptionStatus
            ).catch(console.error);
        }
    }, [subscriptionStatus, userId, googleUser?.id, googleUser?.email, googleUser?.name]);

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

                // Check if user exists in database (optional sync)
                const existingUser = await api.getUser(userInfo.id);

                if (existingUser && existingUser.subscription_status) {
                    setSubscriptionStatus(existingUser.subscription_status);
                }

                // Allow login regardless of existing account status
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
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
        select_account: true,
        prompt: 'consent',  // Force showing all permissions again
    });

    const logout = async () => {
        // Persist layout (and any pending writes) before clearing session.
        // Never clear prohub-data-* localStorage — tasks, habits, goals, layouts stay per user.
        if (userId && dashboardLayout.length > 0) {
            try {
                await api.saveLayout(userId, dashboardLayout);
            } catch (e) {
                console.error('Error saving layout on logout:', e);
            }
        }
        setGoogleUser(null);
        setCalendarList([]);
        setUserId(null);
        setTasks([]);
        setHabits([]);
        setGoals([]);
        setMonthlyGoals([]);
        setSubscriptionStatus('none');
        localStorage.removeItem('prohub-signup-intent');
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

    const handleSubscribe = () => {
        // TODO: Replace this with your actual Stripe Payment Link
        // Important: In your Stripe Dashboard, set the "Success URL" to: 
        // https://your-domain.vercel.app/?success=true
        const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/test_5kQ6oH9QedmedHpgtEcQU00';

        if (STRIPE_CHECKOUT_URL === 'INSERT_YOUR_STRIPE_LINK_HERE') {
            alert("Please configure your Stripe Payment Link in App.jsx (Line ~286)");
            console.log("Mocking success for testing...");
            // Fallback for testing until link is added
            const url = new URL(window.location.href);
            url.searchParams.set('success', 'true');
            window.location.href = url.toString();
            return;
        }

        window.location.href = STRIPE_CHECKOUT_URL;
    };

    // URL parameter handled in initial state to prevent race conditions

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



            if (data.items && data.items.length > 0) {
                await importTasksFromGoogle(data.items);
            }

            setIsImportModalOpen(false);
        } catch (error) {
            console.error('Error importing events:', error);
        } finally {
            setImportLoading(false);
        }
    };

    const pushToGoogle = async (taskText, dateStr, time = null) => {
        if (!googleUser || !googleUser.access_token) return;

        let eventBody;
        if (time) {
            // Create ISO string for start and end (1 hour duration)
            const startDateTime = new Date(`${dateStr}T${time}:00`);
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // +1 hour

            eventBody = {
                summary: taskText,
                description: 'Added via Task Master',
                start: { dateTime: startDateTime.toISOString() },
                end: { dateTime: endDateTime.toISOString() }
            };
        } else {
            // All-day event
            eventBody = {
                summary: taskText,
                description: 'Added via Task Master',
                start: { date: dateStr },
                end: { date: dateStr }
            };
        }

        try {
            await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleUser.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventBody)
            });
            console.log('Synced to Google Calendar');
        } catch (error) {
            console.error('Error syncing to Google:', error);
        }
    };

    const addTask = async (day, text, syncWithGoogle = false, time = null) => {
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
                await pushToGoogle(text, dateStr, time);
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

    const updateGoogleEvent = async (taskId, newDateStr) => {
        if (!googleUser?.access_token || !taskId) return;
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.metadata?.googleId) return;

        try {
            const eventId = task.metadata.googleId;
            let eventPatch = {};

            if (task.metadata.startTime) {
                // Preserve time for timed events
                const originalDate = new Date(task.metadata.startTime);
                const hours = originalDate.getHours();
                const minutes = originalDate.getMinutes();

                // Construct new date with original time
                const [y, m, d] = newDateStr.split('-').map(Number);
                const newDateTime = new Date(y, m - 1, d, hours, minutes);

                // Assume 1 hour duration if we can't calculate perfectly, 
                // or just update start and let GCal handle end? 
                // GCal usually validates end > start. We must update end too.
                const newEnd = new Date(newDateTime.getTime() + 60 * 60 * 1000);

                eventPatch = {
                    start: { dateTime: newDateTime.toISOString() },
                    end: { dateTime: newEnd.toISOString() }
                };
            } else {
                // All-day event
                const startDate = new Date(newDateStr);
                const nextDate = new Date(startDate);
                nextDate.setDate(startDate.getDate() + 1);
                const nextDateStr = nextDate.toISOString().split('T')[0];

                eventPatch = {
                    start: { date: newDateStr },
                    end: { date: nextDateStr }
                };
            }

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${googleUser.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventPatch)
            });

            if (response.ok) {
                fetchUpcomingEvents(googleUser.access_token);
            }
        } catch (error) {
            console.error("Failed to update Google Calendar event", error);
        }
    };

    const moveTask = async (taskId, newDayName) => {
        if (!userId) return;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const dateStr = getTargetDate(newDayName);
        try {
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === taskId ? { ...t, day: newDayName, date: dateStr } : t
            );
            setTasks(updatedTasks);

            await api.updateTask(taskId, { date: dateStr });

            // Sync with Google Calendar if linked
            if (task.metadata?.googleId) {
                await updateGoogleEvent(taskId, dateStr);
            }
        } catch (error) {
            console.error('Error moving task:', error);
            // Revert on failure
            setTasks(tasks);
        }
    };

    const reorderTasks = async (newTasks) => {
        if (!userId) return;
        try {
            // Optimistic update
            setTasks(newTasks);
            await api.reorderTasks(newTasks);
        } catch (error) {
            console.error('Error reordering tasks:', error);
        }
    };

    const addGoal = async (text) => {
        if (!text.trim() || !userId) return;

        try {
            const newGoal = await api.createGoal(userId, text, goals.length);
            setGoals([...goals, newGoal]);
        } catch (error) {
            console.error('Error adding goal:', error);
        }
    };

    const deleteGoal = async (idx) => {
        if (!userId) return;
        const goal = goals[idx];
        if (!goal) return;
        const goalId = typeof goal === 'object' && goal.id != null ? goal.id : null;
        try {
            if (goalId) await api.deleteGoal(goalId);
            setGoals(goals.filter((_, i) => i !== idx));
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const addMonthlyGoal = async (text) => {
        if (!text.trim() || !userId) return;
        try {
            const newGoal = await api.createMonthlyGoal(userId, text, monthlyGoals.length);
            setMonthlyGoals([...monthlyGoals, newGoal]);
        } catch (error) {
            console.error('Error adding monthly goal:', error);
        }
    };

    const deleteMonthlyGoal = async (idx) => {
        if (!userId) return;
        const goal = monthlyGoals[idx];
        if (!goal) return;
        const goalId = typeof goal === 'object' && goal.id != null ? goal.id : null;
        try {
            if (goalId) await api.deleteMonthlyGoal(goalId);
            setMonthlyGoals(monthlyGoals.filter((_, i) => i !== idx));
        } catch (error) {
            console.error('Error deleting monthly goal:', error);
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

        let updatedTasksList = [...tasks];
        let hasChanges = false;

        for (const event of googleEvents) {
            const dateStr = (event.start.dateTime || event.start.date).split('T')[0];
            const dayName = getDayNameFromDate(dateStr);
            const summary = event.summary || 'No Title';

            const metadata = {
                googleId: event.id,
                meetLink: event.hangoutLink,
                eventLink: event.htmlLink,
                startTime: event.start.dateTime // Store original time to preserve it on move
            };

            // Check if task already exists
            const existingTaskIndex = updatedTasksList.findIndex(t => t.text === summary && t.date === dateStr);

            if (existingTaskIndex !== -1) {
                // Update existing if missing metadata (specifically meetLink)
                const existingTask = updatedTasksList[existingTaskIndex];
                // Check if we need to update metadata (missing meetLink or googleId)
                const missingMetadata = !existingTask.metadata ||
                    !existingTask.metadata.meetLink && metadata.meetLink ||
                    !existingTask.metadata.googleId;

                if (missingMetadata) {
                    try {
                        // Merge existing metadata with new fields
                        const newMetadata = { ...(existingTask.metadata || {}), ...metadata };
                        const updated = await api.updateTask(existingTask.id, { metadata: newMetadata });
                        // Merge update
                        updatedTasksList[existingTaskIndex] = { ...existingTask, metadata: updated.metadata };
                        hasChanges = true;
                    } catch (e) {
                        console.error('Error updating task metadata:', e);
                    }
                }
            } else {
                try {
                    const task = await api.createTask(userId, summary, dateStr, 'Pending', metadata);
                    updatedTasksList.push({
                        ...task,
                        day: dayName,
                        text: task.title
                    });
                    hasChanges = true;
                } catch (error) {
                    console.error('Error importing task:', error);
                }
            }
        }

        if (hasChanges) {
            setTasks(updatedTasksList);
        }
    };


    // Public Routes (No Login/Subscription Required)
    if (activeTab === 'privacy') return <Privacy />;
    if (activeTab === 'terms') return <Terms />;
    if (activeTab === 'tokusho') return <Tokusho />;

    // 1. Require Google Login FIRST (Auth)
    if (!googleUser) {
        return <LoginScreen onLogin={loginExistingUser} isPostPayment={false} />;
    }

    // 2. (REMOVED) Subscription Payment Screen
    // Direct access to Dashboard logic follows...


    if (dataLoading || subscriptionStatus === 'checking' || subscriptionStatus === 'restoring') {
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
                    onClick={() => setActiveTab('emails')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'emails' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        letterSpacing: '0.1em',
                        borderBottom: activeTab === 'emails' ? '2px solid var(--primary)' : '2px solid transparent',
                        paddingBottom: '0.5rem',
                        transition: 'all 0.3s'
                    }}
                >
                    EMAILS
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

            <div ref={containerRef} style={{ overflowX: 'hidden', width: 'auto', margin: '0 -5rem', position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 0, width: '6rem', zIndex: 10,
                    pointerEvents: 'none',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    maskImage: 'linear-gradient(to right, black, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, black, transparent)'
                }} />
                <div style={{
                    position: 'absolute', top: 0, bottom: 0, right: 0, width: '6rem', zIndex: 10,
                    pointerEvents: 'none',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    maskImage: 'linear-gradient(to left, black, transparent)',
                    WebkitMaskImage: 'linear-gradient(to left, black, transparent)'
                }} />
                <motion.div
                    className="tab-track"
                    style={{ display: 'flex', width: '300%', touchAction: 'pan-y' }}
                    animate={{
                        x: activeTab === 'calendar' ? '-33.333%' :
                            activeTab === 'emails' ? '-66.666%' : '0%'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag="x"
                    dragListener={false}
                    dragControls={dragControls}
                    dragConstraints={containerRef}
                    dragElastic={0.2}
                    onPointerDown={(e) => {
                        const isDraggableItem = e.target.closest('.compact-task') ||
                            e.target.closest('.widget-item') ||
                            e.target.closest('.time-picker-popup') ||
                            e.target.closest('.widget-controls') ||
                            e.target.closest('.btn-icon') ||
                            e.target.closest('.customize-toggle') ||
                            e.target.tagName === 'BUTTON' ||
                            e.target.tagName === 'INPUT';

                        if (!isDraggableItem) {
                            dragControls.start(e);
                        }
                    }}
                    onDragEnd={(e, { offset }) => {
                        const swipe = offset.x;
                        if (activeTab === 'dashboard' && swipe < -50) {
                            setActiveTab('calendar');
                        } else if (activeTab === 'calendar' && swipe > 50) {
                            setActiveTab('dashboard');
                        } else if (activeTab === 'calendar' && swipe < -50) {
                            setActiveTab('emails');
                        } else if (activeTab === 'emails' && swipe > 50) {
                            setActiveTab('calendar');
                        }
                    }}
                >
                    <div style={{ width: '33.333%', flexShrink: 0, padding: '0 5rem' }}>
                        <DashboardTab
                            tasks={tasks}
                            upcomingEvents={upcomingEvents}
                            habits={habits}
                            setHabits={updateHabitHistory}
                            onAddHabit={addHabit}
                            onDeleteHabit={deleteHabit}
                            goals={goals}
                            onAddGoal={addGoal}
                            onDeleteGoal={deleteGoal}
                            monthlyGoals={monthlyGoals}
                            onAddMonthlyGoal={addMonthlyGoal}
                            onDeleteMonthlyGoal={deleteMonthlyGoal}
                            onSyncClick={handleSyncClick}
                            layout={dashboardLayout}
                            setLayout={setDashboardLayout}
                            onAddTask={addTask}
                            onDeleteTask={deleteTask}
                            onToggleTask={toggleTask}
                            onMoveTask={moveTask}
                            onReorderTasks={reorderTasks}
                            onTaskDragStart={() => setIsTaskInteractionLocked(true)}
                            onTaskDragEnd={() => {
                                // Add delay before re-enabling swipe to prevent accidental triggers
                                setTimeout(() => setIsTaskInteractionLocked(false), 500);
                            }}
                            visibleDays={visibleDays}
                            setVisibleDays={setVisibleDays}
                        />
                    </div>
                    <div style={{ width: '33.333%', flexShrink: 0, padding: '0 5rem' }}>
                        <CalendarTab
                            user={googleUser}
                            setUser={setGoogleUser}
                            tasks={tasks}
                            onSyncClick={handleSyncClick}
                        />
                    </div>
                    <div style={{ width: '33.333%', flexShrink: 0, padding: '0 5rem' }}>
                        <EmailTab
                            user={googleUser}
                            onRefresh={() => {
                                // Optional: trigger any refresh logic
                            }}
                            onAddTask={addTask}
                            tasks={tasks}
                            upcomingEvents={upcomingEvents}
                        />
                    </div>

                </motion.div>
            </div>

            {/* Unified Import Modal */}
            {
                isImportModalOpen && (
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
                )
            }

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
                    {' • '}
                    <button
                        onClick={() => { window.history.pushState({}, '', '/tokusho'); setActiveTab('tokusho'); }}
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
                        特定商取引法に基づく表記
                    </button>
                </div>
            </div>

            {
                importLoading && !isImportModalOpen && (
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
                )
            }
        </div >
    );
}

export default App;
