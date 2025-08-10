import { Suspense, useEffect, useState } from "react";
import { useRoutes, useSearchParams } from "react-router";
import routes from '~react-pages'
import Sidebar from "./components/Sidebar";
import { useUserStore } from "./stores/userStore";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useTokenStore } from "./stores/tokenStore";
import { BACKEND_URL } from "./const";

const fetchUserProfile = async (token) => {
    let resp = await axios.get(BACKEND_URL + "/api/user/info", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    let result = await resp.data
    return result
};

export default function App() {
    const { token, isAuthenticated, setToken, logout } = useTokenStore()
    const { setUser, startLoading } = useUserStore()
    const [searchParams, setSearchParams] = useSearchParams()

    // on first load load the token from local storage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            startLoading()
        }
    }, [setToken, startLoading]);

    const { data, error } = useQuery({
        queryKey: ['userProfile', token],
        queryFn: () => fetchUserProfile(token),
        enabled: isAuthenticated,
    });

    useEffect(() => {
        if (data != null) {
            setUser(data)
        }
        if (error != null) {
            setUser(null)
            logout()
        }
    }, [data, setUser, error, logout])

    let code = searchParams.get("code")
    if (code != null) {
        setToken(code)
        localStorage.setItem('token', token);
        setSearchParams({})
    }

    const r = useRoutes(routes)

    return (
        <div className="flex h-screen w-screen">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                {
                    isAuthenticated ?
                        r
                        :
                        <div>
                            Sign in with Discord to view this page
                        </div>
                }
            </div>
        </div >
    )
}