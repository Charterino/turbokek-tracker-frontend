import { create } from 'zustand';

export const useTokenStore = create((set) => ({
    token: null,
    isAuthenticated: false,

    setToken: (token) => {
        set({ token, isAuthenticated: !!token });
    },
    logout: () => {
        set({ token: null, isAuthenticated: false })
        localStorage.removeItem('token');
    },
}));