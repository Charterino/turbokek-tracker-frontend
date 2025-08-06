import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    token: null,
    isAuthenticated: false,
    user: null,

    setToken: (token) => {
        set({ token, isAuthenticated: !!token });
    },
    setUser: (user) => {
        set({ user });
    },
    logout: () => {
        set({ token: null, isAuthenticated: false, user: null });
        localStorage.removeItem('token');
    },
}));