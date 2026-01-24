// API helper functions using LocalStorage (No backend required)

// Helper to simulate async delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get parsed data
const getStore = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
};

// Helper to save data
const setStore = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
    // User operations
    async getUser(googleId) {
        await delay(300);
        const users = getStore('prohub-data-users');
        return users.find(u => u.googleId === googleId || u.id === googleId);
    },

    async createOrUpdateUser(email, name, googleId, subscriptionStatus) {
        await delay(300);
        let users = getStore('prohub-data-users');
        const existingIndex = users.findIndex(u => u.googleId === googleId || u.email === email);

        let user;
        if (existingIndex >= 0) {
            // Update existing
            users[existingIndex] = {
                ...users[existingIndex],
                name,
                googleId,
                subscription_status: subscriptionStatus
            };
            user = users[existingIndex];
        } else {
            // Create new
            user = {
                id: googleId, // Use googleId as userId for simplicity in local mode
                googleId,
                email,
                name,
                subscription_status: subscriptionStatus,
                createdAt: new Date().toISOString()
            };
            users.push(user);
        }

        setStore('prohub-data-users', users);
        return user;
    },

    // Task operations
    async getTasks(userId) {
        await delay(200);
        const tasks = getStore('prohub-data-tasks');
        return tasks.filter(t => t.userId === userId);
    },

    async createTask(userId, title, date, status = 'Pending') {
        await delay(200);
        const tasks = getStore('prohub-data-tasks');
        const newTask = {
            id: Date.now().toString(),
            userId,
            title,
            date,
            status,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        setStore('prohub-data-tasks', tasks);
        // Return object format expected by App.jsx
        return { task: newTask, ...newTask };
    },

    async updateTask(id, updates) {
        await delay(200);
        let tasks = getStore('prohub-data-tasks');
        const idx = tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            tasks[idx] = { ...tasks[idx], ...updates };
            setStore('prohub-data-tasks', tasks);
            return { task: tasks[idx], ...tasks[idx] };
        }
        throw new Error('Task not found');
    },

    async deleteTask(id) {
        await delay(200);
        let tasks = getStore('prohub-data-tasks');
        const filtered = tasks.filter(t => t.id !== id);
        setStore('prohub-data-tasks', filtered);
        return { success: true };
    },

    // Habit operations
    async getHabits(userId) {
        await delay(200);
        const habits = getStore('prohub-data-habits');
        return habits.filter(h => h.userId === userId);
    },

    async createHabit(userId, name) {
        await delay(200);
        const habits = getStore('prohub-data-habits');
        const newHabit = {
            id: Date.now().toString(),
            userId,
            name,
            history: Array(7).fill(false),
            createdAt: new Date().toISOString()
        };
        habits.push(newHabit);
        setStore('prohub-data-habits', habits);
        return newHabit;
    },

    async updateHabit(id, history) {
        await delay(200);
        let habits = getStore('prohub-data-habits');
        const idx = habits.findIndex(h => h.id === id);
        if (idx !== -1) {
            habits[idx] = { ...habits[idx], history };
            setStore('prohub-data-habits', habits);
            return habits[idx];
        }
        throw new Error('Habit not found');
    },

    async deleteHabit(id) {
        await delay(200);
        let habits = getStore('prohub-data-habits');
        const filtered = habits.filter(h => h.id !== id);
        setStore('prohub-data-habits', filtered);
        return { success: true };
    },

    // Goal operations
    async getGoals(userId) {
        await delay(200);
        const goals = getStore('prohub-data-goals');
        const userGoals = goals.filter(g => g.userId === userId);
        return userGoals;
    },

    async createGoal(userId, text, position) {
        await delay(200);
        const goals = getStore('prohub-data-goals');
        const newGoal = {
            id: Date.now().toString(),
            userId,
            text,
            position
        };
        goals.push(newGoal);
        setStore('prohub-data-goals', goals);
        return newGoal;
    },

    async deleteGoal(id) {
        await delay(200);
        let goals = getStore('prohub-data-goals');
        // Filter out by ID if possible, otherwise we might need a better system if IDs aren't available
        // Assuming ID is passed correctly (which it isn't currently from App.jsx, but let's fix the backend first)
        const filtered = goals.filter(g => g.id !== id);
        setStore('prohub-data-goals', filtered);
        return { success: true };
    },

    // Layout operations
    async getLayout(userId) {
        await delay(200);
        const layouts = getStore('prohub-data-layouts');
        const layout = layouts.find(l => l.userId === userId);
        return layout ? layout.layout : ['clock', 'goals', 'activity', 'habits', 'efficiency'];
    },

    async saveLayout(userId, layout) {
        await delay(200);
        let layouts = getStore('prohub-data-layouts');
        const idx = layouts.findIndex(l => l.userId === userId);
        if (idx !== -1) {
            layouts[idx] = { userId, layout };
        } else {
            layouts.push({ userId, layout });
        }
        setStore('prohub-data-layouts', layouts);
        return { layout };
    },
};

export default api;
