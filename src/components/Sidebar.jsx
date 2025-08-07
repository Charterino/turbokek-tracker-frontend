import { useUserStore } from '../stores/userStore'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Avatar, AvatarImage } from './ui/avatar'
import { useTokenStore } from '@/stores/tokenStore'
import { Skeleton } from './ui/skeleton'
import DiscordLogin from './DiscordLogin'

export default function Sidebar() {
    const logout = useTokenStore(store => store.logout)
    const isAuthenticated = useTokenStore(store => store.isAuthenticated)
    const { user, guilds, selectedGuildIndex, selectGuild, isLoading } = useUserStore()

    return (
        <div className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Guild Selector */}
            {isAuthenticated && (
                <div className="p-4">
                    {
                        isLoading ? (
                            <Select onValueChange={() => { }} value={0} >
                                <SelectTrigger className="w-full">
                                    <Skeleton className="h-6 w-full" />
                                </SelectTrigger>
                            </Select>
                        ) : guilds.length > 0 ? (
                            <Select onValueChange={(newGuild) => selectGuild(newGuild)} value={selectedGuildIndex}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a guild" />
                                </SelectTrigger>
                                <SelectContent>
                                    {guilds.map((guild, index) => (
                                        <SelectItem key={index} value={index}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={guild.icon} alt="Guild icon" />
                                                </Avatar>
                                                {guild.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="w-full p-3 text-center text-sm text-gray-500 bg-gray-100 rounded-md border border-gray-200">
                                No guilds available
                            </div>
                        )
                    }
                </div>
            )}

            {/* Divider */}
            {isAuthenticated && (<div className="border-t border-gray-200 mx-4"></div>)}

            {/* Navigation Links */}
            {isAuthenticated && (
                <nav className="flex-1 p-4 space-y-2">
                    {isLoading ? (
                        <>
                            <div className="block px-3 py-2">
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <div className="block px-3 py-2">
                                <Skeleton className="h-5 w-20" />
                            </div>
                            <div className="block px-3 py-2">
                                <Skeleton className="h-5 w-16" />
                            </div>
                        </>
                    ) : (
                        <>
                            <a href="#" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                                Dashboard
                            </a>
                            <a href="#" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                                Settings
                            </a>
                            <a href="#" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                                Help
                            </a>
                        </>
                    )}
                </nav>
            )}

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200">
                {isAuthenticated ? (
                    <div className="flex items-center gap-3">
                        <Avatar>
                            {isLoading ? (
                                <Skeleton className="h-10 w-10 rounded-full" />
                            ) : (
                                <AvatarImage src={user?.avatar} alt="User avatar" />
                            )}
                        </Avatar>
                        <div className="flex-1">
                            {isLoading ? (
                                <Skeleton className="h-4 w-[100px]" />
                            ) : (
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            )}
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-9 w-[72px] rounded-md" />
                        ) : (
                            <Button
                                onClick={logout}
                                variant="ghost"
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Sign out
                            </Button>
                        )}
                    </div>
                ) : (
                    <DiscordLogin />
                )}
            </div>
        </div>
    )
}