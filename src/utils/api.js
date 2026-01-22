// API helper functions for database operations
const API_BASE_URL = 'http://localhost:5174/api';

export const api = {
    // User operations
    async getUser(googleId) {
        const response = await fetch(`${API_BASE_URL}/user?googleId=${googleId}`);
        const data = await response.json();
        return data.user;
    },

    async createOrUpdateUser(email, name, googleId, subscriptionStatus) {
        const response = await fetch(`${API_BASE_URL}/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, googleId, subscriptionStatus }),
        });
        const data = await response.json();
        return data.user;
    },

    // Task operations
    async getTasks(userId) {
        const response = await fetch(`${API_BASE_URL}/tasks?userId=${userId}`);
        const data = await response.json();
        return data.tasks || [];
    },

    async createTask(userId, title, date, status = 'Pending') {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, title, date, status }),
        });
        const data = await response.json();
        return data.task;
    },

    async updateTask(id, updates) {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
        });
        const data = await response.json();
        return data.task;
    },

    async deleteTask(id) {
        const response = await fetch(`${API_BASE_URL}/tasks?id=${id}`, {
            method: 'DELETE',
        });
        return response.json();
    },

    // Habit operations
    async getHabits(userId) {
        const response = await fetch(`${API_BASE_URL}/habits?userId=${userId}`);
        const data = await response.json();
        return data.habits || [];
    },

    async createHabit(userId, name) {
        const response = await fetch(`${API_BASE_URL}/habits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name }),
        });
        const data = await response.json();
        return data.habit;
    },

    async updateHabit(id, history) {
        const response = await fetch(`${API_BASE_URL}/habits`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, history }),
        });
        const data = await response.json();
        return data.habit;
    },

    async deleteHabit(id) {
        const response = await fetch(`${API_BASE_URL}/habits?id=${id}`, {
            method: 'DELETE',
        });
        return response.json();
    },

    // Goal operations
    async getGoals(userId) {
        const response = await fetch(`${API_BASE_URL}/goals?userId=${userId}`);
        const data = await response.json();
        return (data.goals || []).map(g => g.text);
    },

    async createGoal(userId, text, position) {
        const response = await fetch(`${API_BASE_URL}/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, text, position }),
        });
        const data = await response.json();
        return data.goal;
    },

    async deleteGoal(id) {
        const response = await fetch(`${API_BASE_URL}/goals?id=${id}`, {
            method: 'DELETE',
        });
        return response.json();
    },

    // Layout operations
    async getLayout(userId) {
        const response = await fetch(`${API_BASE_URL}/layout?userId=${userId}`);
        const data = await response.json();
        return data.layout || ['goals', 'activity', 'habits', 'efficiency'];
    },

    async saveLayout(userId, layout) {
        const response = await fetch(`${API_BASE_URL}/layout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, layout }),
        });
        const data = await response.json();
        return data.layout;
    },
};

export default api;
