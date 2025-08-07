import { create } from 'zustand';

export const useUserStore = create((set) => ({
    user: null,
    guilds: [],
    selectedGuildIndex: 0,
    isLoading: false,

    setUser: (user) => {
        set(state => {
            const oldSelectedGuildId = state.guilds[state.selectedGuildIndex]?.id
            let newId = user?.guilds?.findIndex(item => item.id == oldSelectedGuildId)
            if (newId == -1) {
                newId = 0
            }
            return { user, selectedGuildIndex: newId, guilds: user?.guilds, isLoading: false }
        });
    },

    selectGuild: (guild) => {
        set({ selectedGuildIndex: guild })
    },

    startLoading: () => {
        set({ isLoading: true })
    }
}));