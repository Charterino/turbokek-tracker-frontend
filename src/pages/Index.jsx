import { useUserStore } from "@/stores/userStore"
import { useQuery } from "@tanstack/react-query"
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BACKEND_URL } from "@/const";

const fetchGuildStats = async (guildId, accessToken) => {
    let resp = await axios.get(BACKEND_URL + `/api/guild/${guildId}/stats`, {
        headers: {
            "GuildToken": accessToken
        }
    })
    let result = await resp.data
    return result
};

export default function Index() {
    const { guilds, selectedGuildIndex, isLoading } = useUserStore()
    const selectedGuild = guilds[selectedGuildIndex]

    const { data, error, isLoading: isLoadingStats } = useQuery({
        queryKey: ['guildStats', selectedGuild?.id],
        queryFn: () => fetchGuildStats(selectedGuild.id, selectedGuild?.guildAccessToken),
        enabled: selectedGuild != undefined,
    });

    const isLoadingEither = isLoading || isLoadingStats

    return (
        <div className="h-screen w-full">
            {isLoadingEither ? (
                <div className="h-full flex p-4 flex-col flex-1 overflow-hidden">
                    <div className="mb-4 px-4">
                        <Skeleton className="h-8 w-[400px]" />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-y-auto w-full px-4">
                        {/* Top Reactions Skeleton */}
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Top Reactions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 h-full overflow-y-auto">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Skeleton className="h-10 w-10 rounded-none" />
                                            <Skeleton className="h-4 w-[100px]" />
                                        </div>
                                        <Skeleton className="h-6 w-[60px]" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Top Receivers Skeleton */}
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Top Receivers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 h-full overflow-y-auto">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <Skeleton className="h-4 w-[100px]" />
                                        </div>
                                        <Skeleton className="h-6 w-[60px]" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Top Givers Skeleton */}
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Top Givers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 h-full overflow-y-auto">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <Skeleton className="h-4 w-[100px]" />
                                        </div>
                                        <Skeleton className="h-6 w-[60px]" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : error ? (
                <div className="text-red-500">Error loading statistics: {error.message}</div>
            ) : selectedGuild && data ? (
                <div className="h-full flex p-4 flex-col flex-1 overflow-hidden">
                    <h1 className="text-2xl font-bold mb-4 px-4">{selectedGuild.name}: {data.totalReactions} reactions in the last 24 hours</h1>

                    {/* Top Reactions */}
                    <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-y-auto w-full px-4">
                        {/* Top Reactions */}
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Top Reactions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 h-full overflow-y-auto">
                                {data.topReactions.map((reaction) => (
                                    <div key={reaction.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="rounded-none">
                                                <AvatarImage src={data.reactionUrls[reaction.id]} alt={data.reactionNames[reaction.id]} />
                                                <AvatarFallback>{data.reactionNames[reaction.id]}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{data.reactionNames[reaction.id]}</div>
                                        </div>
                                        <Badge variant="outline">{reaction.count} uses</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Top Receivers */}
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Top Receivers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 h-full overflow-y-auto">
                                {data.topReceivers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar>
                                                <AvatarImage src={data.userAvatars[user.id]} alt={data.userNames[user.id]} />
                                                <AvatarFallback>{data.userNames[user.id]}</AvatarFallback>
                                            </Avatar>
                                            <span>{data.userNames[user.id]}</span>
                                        </div>
                                        <Badge variant="outline">{user.count} received</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Top Givers */}
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Top Givers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 h-full overflow-y-auto">
                                {data.topGivers.map((user, index) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar>
                                                <AvatarImage src={data.userAvatars[user.id]} alt={data.userNames[user.id]} />
                                                <AvatarFallback>{data.userNames[user.id]}</AvatarFallback>
                                            </Avatar>
                                            <span>{data.userNames[user.id]}</span>
                                        </div>
                                        <Badge variant="outline">{user.count} given</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : null}
        </div>
    )
}