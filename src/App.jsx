import { Suspense, useEffect, useState } from "react";
import { useRoutes } from "react-router";
import routes from '~react-pages'
import { useAuthStore } from "./stores/authStore";
import { useQuery } from "@tanstack/react-query";

const fetchUserProfile = async (token) => {
    return {
        "id": "1235",
        "username": "Sqidrod",
        "guilds": [
            { "name": "barb", "id": "234234234" },
            { "name": "barb2", "id": "234234234123123" }
        ]
    }
};

export default function App() {
    const { token, setToken, setUser, isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
        }
    }, [setToken]);

    const { isLoading, isError, data, error } = useQuery({
        queryKey: ['userProfile', token],
        queryFn: () => fetchUserProfile(token),
        enabled: !!token,
        onSuccess: (userData) => {
            setUser(userData);
        },
        onError: (err) => {
            console.error('Failed to fetch user profile:', err);
            useAuthStore.getState().logout();
        },
        staleTime: Infinity,
    });

    return (
        useRoutes(routes)
    )
}