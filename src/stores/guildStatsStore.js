import { create } from 'zustand';

export const useGuildStatsStore = create((set) => ({
    stats: {},
    addStats: (guildId, stats) => {
        set(state => {
            state.stats[guildId] = stats
        });
    },
    reset: () => {
        set({ stats: {} })
    },
}));