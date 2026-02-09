// API helper functions with Hybrid Supabase + LocalStorage approach
import { supabase } from './supabaseClient';

// Helper to simulate async delay for local mode
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get parsed data (Local Storage)
const getLocalStore = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
};

// Helper to save data (Local Storage)
const setLocalStore = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// MIGRATION HELPER
// Checks if local data exists but hasn't been migrated to Supabase yet
// Only runs if Supabase is connected
const syncLocalDataToSupabase = async (userId) => {
    if (!supabase) return;

    const migrationKey = `prohub-migrated-${userId}`;
    if (localStorage.getItem(migrationKey)) return;

    console.log('[Migration] Starting migration to Supabase...');

    try {
        // 1. Tasks
        const localTasks = getLocalStore('prohub-data-tasks').filter(t => t.userId === userId);
        if (localTasks.length > 0) {
            // Transform for DB if needed, or just dump JSON
            // Assuming DB has 'tasks' table strictly typed, or loose JSON
            // For now, let's assume we map strict fields.
            const { error } = await supabase.from('tasks').upsert(localTasks.map(t => ({
                id: t.id,
                user_id: userId,
                title: t.title,
                date: t.date,
                status: t.status,
                metadata: t.metadata || {},
                created_at: t.createdAt || new Date().toISOString()
            })));
            if (error) console.error('[Migration] Task error:', error);
        }

        // 2. Habits
        const localHabits = getLocalStore('prohub-data-habits').filter(h => h.userId === userId);
        if (localHabits.length > 0) {
            const { error } = await supabase.from('habits').upsert(localHabits.map(h => ({
                id: h.id,
                user_id: userId,
                name: h.name,
                history: h.history,
                created_at: h.createdAt || new Date().toISOString()
            })));
            if (error) console.error('[Migration] Habit error:', error);
        }

        // 3. Goals
        const localGoals = getLocalStore('prohub-data-goals').filter(g => g.userId === userId);
        if (localGoals.length > 0) {
            const { error } = await supabase.from('goals').upsert(localGoals.map(g => ({
                id: g.id,
                user_id: userId,
                text: g.text,
                position: g.position
            })));
            if (error) console.error('[Migration] Goal error:', error);
        }

        // 4. Monthly Goals
        const localMonthlyGoals = getLocalStore('prohub-data-monthly-goals').filter(g => g.userId === userId);
        if (localMonthlyGoals.length > 0) {
            const { error } = await supabase.from('monthly_goals').upsert(localMonthlyGoals.map(g => ({
                id: g.id,
                user_id: userId,
                text: g.text,
                position: g.position
            })));
            if (error) console.error('[Migration] Monthly Goal error:', error);
        }

        // Mark as migrated so we don't overwrite DB next time
        localStorage.setItem(migrationKey, 'true');
        console.log('[Migration] Complete!');

    } catch (e) {
        console.error('[Migration] Failed:', e);
    }
};

export const api = {
    // User operations
    async getUser(googleId) {
        // SUPABASE MODE
        if (supabase) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('google_id', googleId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('[Supabase] GetUser Error:', error);
            }

            if (data) {
                // If found in Supabase, ensure we run migration just in case old local data exists
                syncLocalDataToSupabase(data.id); // fire and forget
                return { ...data, id: data.id, googleId: data.google_id }; // Normalize keys
            }
            return null; // Prompt creation
        }

        // LOCAL MODE
        await delay(300);
        const users = getLocalStore('prohub-data-users');
        return users.find(u => u.googleId === googleId || u.id === googleId);
    },

    async createOrUpdateUser(email, name, googleId, subscriptionStatus) {
        // SUPABASE MODE
        if (supabase) {
            // 1. Check if exists to get ID
            let { data: existing } = await supabase
                .from('users')
                .select('*')
                .eq('google_id', googleId)
                .single();

            const userData = {
                email,
                name,
                google_id: googleId,
                subscription_status: subscriptionStatus,
                // updated_at: new Date() // handled by trigger usually
            };

            const { data, error } = await supabase
                .from('users')
                .upsert(existing ? { ...existing, ...userData } : userData)
                .select()
                .single();

            if (error) {
                console.error('[Supabase] CreateUser Error:', error);
                throw error;
            }

            return { ...data, id: data.id, googleId: data.google_id };
        }

        // LOCAL MODE
        await delay(300);
        let users = getLocalStore('prohub-data-users');
        const existingIndex = users.findIndex(u => u.googleId === googleId || u.email === email);

        let user;
        if (existingIndex >= 0) {
            users[existingIndex] = { ...users[existingIndex], name, googleId, subscription_status: subscriptionStatus };
            user = users[existingIndex];
        } else {
            user = {
                id: googleId,
                googleId,
                email,
                name,
                subscription_status: subscriptionStatus,
                createdAt: new Date().toISOString()
            };
            users.push(user);
        }
        setLocalStore('prohub-data-users', users);
        return user;
    },

    // Task operations
    async getTasks(userId) {
        if (supabase) {
            const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId);
            if (error) {
                console.error('[Supabase] GetTasks Error:', error);
                return [];
            }
            return data.map(t => ({ ...t, userId: t.user_id, createdAt: t.created_at }));
        }

        await delay(200);
        const tasks = getLocalStore('prohub-data-tasks');
        return tasks.filter(t => t.userId === userId);
    },

    async createTask(userId, title, date, status = 'Pending', metadata = {}) {
        const tempId = Date.now().toString();
        const newTask = {
            id: tempId, // Supabase will assign real UUID if we omitted it, but we can pass UUID if we gen it. 
            // For simplicity, let Supabase gen ID or use string.
            // Let's use string for compatibility if schema allows, or let DB handle it.
            // If DB uses UUID, this numeric string might fail. 
            // Better to let DB generate ID unless we specifically need it now.
            user_id: userId,
            title,
            date,
            status,
            metadata,
            created_at: new Date().toISOString()
        };

        if (supabase) {
            // We omit 'id' to let Postgres generate it (assuming uuid default)
            // OR if table uses text id, we can pass it.
            // Safest: Let DB gen it, return result.
            const { id, ...payload } = newTask; // strip temp id
            const { data, error } = await supabase.from('tasks').insert([payload]).select().single();
            if (error) {
                console.error('[Supabase] CreateTask Error:', error);
                throw error;
            }
            return { ...data, userId: data.user_id, text: data.title }; // Normalize for UI
        }

        await delay(200);
        const tasks = getLocalStore('prohub-data-tasks');
        const localTask = { ...newTask, userId, id: tempId };
        tasks.push(localTask);
        setLocalStore('prohub-data-tasks', tasks);
        return { task: localTask, ...localTask };
    },

    async updateTask(id, updates) {
        if (supabase) {
            // Map common fields
            const dbUpdates = {};
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.title) dbUpdates.title = updates.title;
            if (updates.date) dbUpdates.date = updates.date;
            if (updates.metadata) dbUpdates.metadata = updates.metadata;

            const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).select().single();
            if (error) throw error;
            return { ...data, userId: data.user_id, text: data.title };
        }

        await delay(200);
        let tasks = getLocalStore('prohub-data-tasks');
        const idx = tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            tasks[idx] = { ...tasks[idx], ...updates };
            setLocalStore('prohub-data-tasks', tasks);
            return { task: tasks[idx], ...tasks[idx] };
        }
        throw new Error('Task not found');
    },

    async deleteTask(id) {
        if (supabase) {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        }

        await delay(200);
        let tasks = getLocalStore('prohub-data-tasks');
        const filtered = tasks.filter(t => t.id !== id);
        setLocalStore('prohub-data-tasks', filtered);
        return { success: true };
    },

    async reorderTasks(tasks) {
        // Reordering implies updating positions or just optimistic local state?
        // App.jsx calls this but doesn't pass positions explicitly, just the array.
        // If we want to persist order, we need a 'position' field.
        // For now, Supabase doesn't support array reorder magic without a position column.
        if (supabase) {
            // If we had a position column, we'd update all.
            // For now, do nothing (tasks sort by date usually).
            return { success: true };
        }

        await delay(200);
        setLocalStore('prohub-data-tasks', tasks);
        return { success: true };
    },

    // Habit operations
    async getHabits(userId) {
        if (supabase) {
            const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId);
            if (error) return [];
            return data.map(h => ({ ...h, userId: h.user_id, createdAt: h.created_at }));
        }

        await delay(200);
        const habits = getLocalStore('prohub-data-habits');
        return habits.filter(h => h.userId === userId);
    },

    async createHabit(userId, name) {
        if (supabase) {
            const { data, error } = await supabase.from('habits').insert([{
                user_id: userId,
                name,
                history: Array(7).fill(false),
            }]).select().single();
            if (error) throw error;
            return { ...data, userId: data.user_id };
        }

        await delay(200);
        const habits = getLocalStore('prohub-data-habits');
        const newHabit = {
            id: Date.now().toString(),
            userId,
            name,
            history: Array(7).fill(false),
            createdAt: new Date().toISOString()
        };
        habits.push(newHabit);
        setLocalStore('prohub-data-habits', habits);
        return newHabit;
    },

    async updateHabit(id, history) {
        if (supabase) {
            const { data, error } = await supabase.from('habits').update({ history }).eq('id', id).select().single();
            if (error) throw error;
            return { ...data, userId: data.user_id };
        }

        await delay(200);
        let habits = getLocalStore('prohub-data-habits');
        const idx = habits.findIndex(h => h.id === id);
        if (idx !== -1) {
            habits[idx] = { ...habits[idx], history };
            setLocalStore('prohub-data-habits', habits);
            return habits[idx];
        }
        throw new Error('Habit not found');
    },

    async deleteHabit(id) {
        if (supabase) {
            const { error } = await supabase.from('habits').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        }
        await delay(200);
        let habits = getLocalStore('prohub-data-habits');
        const filtered = habits.filter(h => h.id !== id);
        setLocalStore('prohub-data-habits', filtered);
        return { success: true };
    },

    // Goal operations
    async getGoals(userId) {
        if (supabase) {
            const { data } = await supabase.from('goals').select('*').eq('user_id', userId);
            return (data || []).map(g => ({ ...g, userId: g.user_id }));
        }
        await delay(200);
        const goals = getLocalStore('prohub-data-goals');
        return goals.filter(g => g.userId === userId);
    },

    async createGoal(userId, text, position) {
        if (supabase) {
            const { data, error } = await supabase.from('goals').insert([{
                user_id: userId,
                text,
                position
            }]).select().single();
            if (error) throw error;
            return { ...data, userId: data.user_id };
        }
        await delay(200);
        const goals = getLocalStore('prohub-data-goals');
        const newGoal = { id: Date.now().toString(), userId, text, position };
        goals.push(newGoal);
        setLocalStore('prohub-data-goals', goals);
        return newGoal;
    },

    async deleteGoal(id) {
        if (supabase) {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        }
        await delay(200);
        let goals = getLocalStore('prohub-data-goals');
        const filtered = goals.filter(g => g.id !== id);
        setLocalStore('prohub-data-goals', filtered);
        return { success: true };
    },

    // Monthly Goal operations
    async getMonthlyGoals(userId) {
        if (supabase) {
            const { data } = await supabase.from('monthly_goals').select('*').eq('user_id', userId);
            return (data || []).map(g => ({ ...g, userId: g.user_id }));
        }
        await delay(200);
        const goals = getLocalStore('prohub-data-monthly-goals');
        return goals.filter(g => g.userId === userId);
    },

    async createMonthlyGoal(userId, text, position) {
        if (supabase) {
            const { data, error } = await supabase.from('monthly_goals').insert([{
                user_id: userId,
                text,
                position
            }]).select().single();
            if (error) throw error;
            return { ...data, userId: data.user_id };
        }
        await delay(200);
        const goals = getLocalStore('prohub-data-monthly-goals');
        const newGoal = { id: Date.now().toString(), userId, text, position };
        goals.push(newGoal);
        setLocalStore('prohub-data-monthly-goals', goals);
        return newGoal;
    },

    async deleteMonthlyGoal(id) {
        if (supabase) {
            const { error } = await supabase.from('monthly_goals').delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        }
        await delay(200);
        let goals = getLocalStore('prohub-data-monthly-goals');
        const filtered = goals.filter(g => g.id !== id);
        setLocalStore('prohub-data-monthly-goals', filtered);
        return { success: true };
    },

    // Layout operations
    async getLayout(userId) {
        if (supabase) {
            const { data } = await supabase.from('users').select('layout').eq('id', userId).single();
            if (data && data.layout) return data.layout;
            return ['goals', 'activity'];
        }
        await delay(200);
        const layouts = getLocalStore('prohub-data-layouts');
        if (!Array.isArray(layouts)) return ['goals', 'activity'];
        const layout = layouts.find(l => l && l.userId === userId);
        return layout && Array.isArray(layout.layout) ? layout.layout : ['goals', 'activity'];
    },

    async saveLayout(userId, layout) {
        if (supabase) {
            const { data, error } = await supabase.from('users').update({ layout }).eq('id', userId);
            if (error) console.error(error);
            return { layout };
        }
        await delay(200);
        let layouts = getLocalStore('prohub-data-layouts');
        if (!Array.isArray(layouts)) layouts = [];
        const idx = layouts.findIndex(l => l && l.userId === userId);
        if (idx !== -1) {
            layouts[idx] = { userId, layout };
        } else {
            layouts.push({ userId, layout });
        }
        setLocalStore('prohub-data-layouts', layouts);
        return { layout };
    },
};

export default api;
