import { useGuildStatsStore } from "@/stores/guildStatsStore"
import { useUserStore } from "@/stores/userStore"
import { useQuery } from "@tanstack/react-query"
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const fetchGuildStats = async (guildId, accessToken) => {
    let resp = await axios.get(`http://localhost:8000/api/guild/${guildId}/stats`, {
        headers: {
            "GuildToken": accessToken
        }
    })
    let result = await resp.data
    return result
};

export default function Index() {
    const { guilds, selectedGuildIndex, isLoading } = useUserStore()
    const { stats, addStats } = useGuildStatsStore()
    const selectedGuild = guilds[selectedGuildIndex]

    const { data, error, isLoading: isLoadingStats } = useQuery({
        queryKey: ['guildStats', selectedGuild?.id],
        queryFn: () => fetchGuildStats(selectedGuild.id, selectedGuild?.guildAccessToken),
        enabled: selectedGuild != undefined,
    });

    const isLoadingEither = isLoading || isLoadingStats

    return (
        <div className="h-screen w-full">
            {isLoadingEither ? null : error ? (
                <div className="text-red-500">Error loading statistics: {error.message}</div>
            ) : selectedGuild && data ? (
                <div className="h-full flex p-4 flex-col flex-1 overflow-hidden">
                    <h1 className="text-2xl font-bold mb-4 px-4">{selectedGuild.name}: {data.TotalReactions} reactions in the last 24 hours</h1>

                    {/* Top Reactions */}
                    <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-y-auto w-full px-4">
                        {/* Top Reactions */}
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Top Reactions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 h-full overflow-y-auto">
                                {data.TopReactions.map((reaction, index) => (
                                    <div key={reaction.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="rounded-none">
                                                <AvatarImage src={reaction.url} alt={reaction.name} />
                                                <AvatarFallback>{reaction.name}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{reaction.name}</div>
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
                                {data.TopReceivers.map((user, index) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name || 'Unknown User'}</span>
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
                                {data.TopGivers.map((user, index) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name || 'Unknown User'}</span>
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