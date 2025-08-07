import { create } from 'zustand';

export const useUserStore = create((set) => ({
    user: null,
    guilds: [],
    selectedGuildIndex: 0,
    isLoading: false,

    setUser: (user) => {
        set({ user, selectedGuildIndex: 0, guilds: user?.guilds, isLoading: false });
    },

    selectGuild: (guild) => {
        set({ selectedGuildIndex: guild })
    },

    startLoading: () => {
        set({ isLoading: true })
    }
}));