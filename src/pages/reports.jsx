import { BACKEND_URL } from "@/const";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const fetchGuildReport = async (guildId, accessToken, from, to) => {
    let resp = await axios.get(BACKEND_URL + `/api/guild/${guildId}/generatereport?from=${from}&to=${to}`, {
        headers: {
            "GuildToken": accessToken
        }
    })
    let result = await resp.data
    return result
};

export default function Reports() {
    const { guilds, selectedGuildIndex, isLoading } = useUserStore()
    const selectedGuild = guilds[selectedGuildIndex]
    const [dateRange, setDateRange] = useState({
        from: new Date(),
        to: new Date()
    });
    const [showCalendar, setShowCalendar] = useState(false);

    const { data, error, isLoading: isLoadingReport, isRefetching, refetch } = useQuery({
        queryKey: ['guildReport', selectedGuild?.id],
        queryFn: () => fetchGuildReport(
            selectedGuild.id,
            selectedGuild?.guildAccessToken,
            dateRange.from.getTime(),
            dateRange.to.getTime() + 86_400_000
        ),
        enabled: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    const isLoadingOrRefetchingReport = isLoadingReport || isRefetching

    const handleGenerateReport = () => {
        refetch();
    };

    return (
        <Card className="m-6">
            <CardHeader>
                <CardTitle>Guild Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                        <PopoverTrigger asChild>
                            <Button disabled={isLoading} variant="outline" className="flex items-center gap-2">
                                Select date range
                                {dateRange && dateRange.from && dateRange.to && (
                                    <span className="text-xs text-muted-foreground">
                                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                className="rounded-md border"
                            />
                        </PopoverContent>
                    </Popover>
                    <Button
                        onClick={handleGenerateReport}
                        disabled={isLoadingOrRefetchingReport || isLoading}
                        variant={isLoadingOrRefetchingReport || isLoading ? "secondary" : "default"}
                    >
                        {isLoadingOrRefetchingReport ? (
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                Generating report...
                            </div>
                        ) : "Generate Report"}
                    </Button>
                </div>
                {data && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto">
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}