import { BACKEND_URL } from "@/const";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, useMemo, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const fetchGuildReport = async (guildId, accessToken, from, to) => {
    from = from - (from % 86_400_400)
    to = to - (to % 86_400_400)
    let resp = await axios.get(BACKEND_URL + `/api/guild/${guildId}/generatereport?from=${from}&to=${to}`, {
        headers: {
            "GuildToken": accessToken
        }
    })
    let result = await resp.data
    return result
};

const fetchGuildReactions = async (guildId, accessToken) => {
    let resp = await axios.get(BACKEND_URL + `/api/guild/${guildId}/reactions`, {
        headers: {
            "GuildToken": accessToken
        }
    })
    let result = await resp.data
    return result
}

export default function Reports() {
    const { guilds, selectedGuildIndex, isLoading: isLoadingUserInfo } = useUserStore()
    const selectedGuild = guilds[selectedGuildIndex]

    // Data related to the period selection
    const [dateRange, setDateRange] = useState({
        from: new Date(),
        to: new Date()
    });
    const [showCalendar, setShowCalendar] = useState(false);

    // REST requests for /reactions
    const { data: reactionsData, error: reactionsError, isLoading: isLoadingReactions } = useQuery({
        queryKey: ['guildReactions', selectedGuild?.id],
        queryFn: () => fetchGuildReactions(
            selectedGuild.id,
            selectedGuild?.guildAccessToken,
        ),
        enabled: selectedGuild != undefined,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });
    const reactionsMap = reactionsData == undefined ? {} : Object.fromEntries(reactionsData.map(item => [item.id, { name: item.name, url: item.url }]))
    // and /generatereport
    const { data, isLoading: isLoadingReport, isRefetching: isRefetchingReport, refetch } = useQuery({
        queryKey: ['guildReport', selectedGuild?.id],
        queryFn: () => fetchGuildReport(
            selectedGuild?.id,
            selectedGuild?.guildAccessToken,
            dateRange.from.getTime(),
            dateRange.to.getTime() + 86_400_000
        ),
        // never automatically fetched, only `refetch`
        enabled: false,
        // never needs to be refreshed 
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });
    const isLoadingOrRefetchingReport = isLoadingReport || isRefetchingReport

    // Data related to groups editor
    // Input box/search field for group name
    const [groupName, setGroupName] = useState('')
    // Input box/search field for reaction name
    const [reactionId, setReactionId] = useState('')
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [isGroupPopoverOpen, setIsGroupPopoverOpen] = useState(false)
    // Current groups, loaded from localstorage on startup
    const [groups, setGroups] = useState(new Map());
    // List of reactions already used
    const [usedReactions, setUsedReactions] = useState(new Set());
    // List of groups which have an invalid number of points
    // If it's not empty, the generate button is not active
    const [invalidGroups, setInvalidGroups] = useState(new Set());

    // Data related to the final generated response
    const [markdown, setMarkdown] = useState('');
    const [copied, setCopied] = useState(false);

    const [isGeneratingMd, setIsGeneratingMd] = useState(false)

    // Whenever a new guild is selected, load the groups from local storage
    const [loadedFromStorage, setLoadedFromStorage] = useState("")
    useEffect(() => {
        if (!selectedGuild?.id) return;
        setLoadedFromStorage(selectedGuild.id)

        const localStorageKey = `guildReportGroups_${selectedGuild.id}`;
        try {
            const storedGroups = localStorage.getItem(localStorageKey);
            if (storedGroups) {
                const parsed = JSON.parse(storedGroups);
                const loadedGroups = new Map(parsed.map(([key, value]) => [key, { ...value, reactions: new Set(value.reactions) }]));
                setGroups(loadedGroups);

                const reactions = new Set();
                loadedGroups.forEach(group => {
                    group.reactions.forEach(reactionId => reactions.add(reactionId));
                });
                setUsedReactions(reactions);

                const invalid = new Set();
                loadedGroups.forEach((group, groupName) => {
                    if (isNaN(group.points)) {
                        invalid.add(groupName);
                    }
                });
                setInvalidGroups(invalid);
            } else {
                setGroups(new Map());
                setUsedReactions(new Set());
                setInvalidGroups(new Set());
            }
        } catch (error) {
            console.error("Failed to load groups from localStorage", error);
            setGroups(new Map());
            setUsedReactions(new Set());
            setInvalidGroups(new Set());
        }
    }, [selectedGuild?.id]);

    // Whenever groups changes, serialize it to localStorage
    useEffect(() => {
        if (!selectedGuild?.id) return;
        if (loadedFromStorage != selectedGuild.id) return

        const localStorageKey = `guildReportGroups_${selectedGuild.id}`;
        try {
            const serializableGroups = Array.from(groups.entries()).map(([key, value]) => [
                key,
                { ...value, reactions: Array.from(value.reactions) },
            ]);
            localStorage.setItem(localStorageKey, JSON.stringify(serializableGroups));
        } catch (error) {
            console.error("Failed to save groups to localStorage", error);
        }
    }, [groups, selectedGuild?.id, loadedFromStorage]);

    // Whenever guildId changes, reset the markdown
    useEffect(() => {
        if (!selectedGuild?.id) return
        if (loadedFromStorage == selectedGuild.id) return
        setMarkdown('')
    }, [selectedGuild, setMarkdown, loadedFromStorage])

    const handleAddReaction = () => {
        if (!groupName || !reactionId) return
        const reaction = reactionsMap[reactionId]
        if (!reaction) {
            console.error(`Reaction ID ${reactionId} not found`)
            return
        }

        setGroups(prevGroups => {
            const newGroups = new Map(prevGroups)
            const existing = newGroups.get(groupName)
            const newReactions = new Set(existing?.reactions || [])
            newReactions.add(reactionId)
            newGroups.set(groupName, {
                reactions: newReactions,
                points: existing?.points || 0
            })
            return newGroups
        })
        setUsedReactions(prev => new Set(prev).add(reactionId))

        setReactionId('')
    };

    const handleDeleteGroup = (groupName) => {
        setGroups(prevGroups => {
            const newGroups = new Map(prevGroups)
            const group = newGroups.get(groupName)
            if (group) {
                setUsedReactions(prev => {
                    const newUsed = new Set(prev)
                    group.reactions.forEach(id => newUsed.delete(id))
                    return newUsed
                })
            }
            newGroups.delete(groupName)
            return newGroups
        })
    };

    const handleDeleteReaction = (groupName, reactionId) => {
        setGroups(prevGroups => {
            const newGroups = new Map(prevGroups)
            const group = newGroups.get(groupName)
            if (group?.reactions) {
                group.reactions.delete(reactionId)
                if (group.reactions.size === 0) {
                    newGroups.delete(groupName)
                } else {
                    newGroups.set(groupName, group)
                }
            }
            setUsedReactions(prev => {
                const newUsed = new Set(prev)
                newUsed.delete(reactionId)
                return newUsed
            })
            return newGroups
        })
    };

    const generateMarkdown = () => {
        let groupCounts = Array.from(groups.entries()).map(([key, value]) => {
            let totalCount = 0
            // this is fairly slow, maybe build a map later
            value.reactions.forEach(r => {
                const itemInTopReactions = data.topReactions.find(y => y.id == r)
                totalCount += itemInTopReactions != undefined ? itemInTopReactions.count : 0
            })
            return {
                name: key,
                counts: totalCount,
                value: value.points
            }
        })

        // object { groupId: {sortedArray, dictionary} }
        let groupCountsByUser = Object.fromEntries(Array.from(groups.entries()).map(([key, value]) => {
            const groupReactions = Array.from(value.reactions)
            let result = Object.entries(data.userBreakdowns).map(([userId, userReactions]) => {
                const relevantReactions = userReactions.filter(reaction => groupReactions.includes(reaction.id)).map(x => x.count)
                return {
                    count: relevantReactions.reduce((previous, current) => {
                        return previous + current
                    }, 0),
                    userId: userId
                }
            })
            result.sort((a, b) => b.count - a.count)

            const resultMap = Object.fromEntries(result.map(item => [item.userId, item.count]))
            return [key, { sortedArray: result, dictionary: resultMap, points: value.points }]
        }))

        let userPoints = Object.keys(data.userBreakdowns).map(userId => {
            const totalPoints = Object.entries(groupCountsByUser).map(([groupId, { dictionary, points }]) => {
                return dictionary[userId] * points
            }).reduce((a, b) => a + b, 0)

            return { id: userId, totalPoints }
        })
        userPoints.sort((a, b) => {
            const r = b.totalPoints - a.totalPoints
            return r
        })

        return `# Guild Activity Report
**Period:** ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}
**Guild:** ${selectedGuild?.name || "Unknown"}

## Top Reactions
${groupCounts.map((item, index) => `${index + 1}. ${item.name} -> ${item.counts} uses (${item.value} points each)`).join("\n")}

## Total Points Leaderboard
${userPoints.map((item, index) => `${index + 1}. <@${item.id}> -> ${item.totalPoints} points`).join("\n")}

## Total Reactions Leaderboard
${data.topGivers.map((item, index) => `${index + 1}. <@${item.id}> -> ${item.count} reactions given`).join("\n")}

${Object.entries(groupCountsByUser).map(([groupId, { sortedArray }]) => {
            let result = `## ${groupId} Top Receivers\n` + sortedArray.map((item, index) => `${index + 1}. <@${item.userId}> - ${item.count}`).join("\n")

            return result
        }).join("\n\n")}
`;
    };

    const copyMarkdown = () => {
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerateReport = () => {
        setIsGeneratingMd(true)
        refetch()
    };

    if (isGeneratingMd && !isLoadingReport && !isRefetchingReport) {
        setMarkdown(generateMarkdown())
        setIsGeneratingMd(false)
    }

    return (
        <Card className="m-6">
            <CardHeader>
                <CardTitle>Guild Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {(reactionsData == undefined || reactionsMap == undefined || loadedFromStorage != selectedGuild?.id) ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 grid-cols-3">
                                <Skeleton className="h-10 w-2/5" />
                                <Skeleton className="h-10 w-2/5" />
                                <Skeleton className="h-10 w-1/5" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-48" />
                        <div className="space-y-2">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                        <div className="mt-6 pt-4 border-t">
                            <div className="flex items-center space-x-4 grid-cols-2">
                                <Skeleton className="h-10 w-4/5" />
                                <Skeleton className="h-10 w-1/5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 grid-cols-3">
                                <Popover open={isGroupPopoverOpen} onOpenChange={setIsGroupPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="flex-2/5">
                                            {groupName || "Select group..."}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search groups..."
                                                value={groupName}
                                                onValueChange={(search) => setGroupName(search)}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No groups found</CommandEmpty>
                                                <CommandGroup>
                                                    {Array.from(groups.keys()).filter((name) => name.includes(groupName)).map((name) => (
                                                        <CommandItem
                                                            key={name}
                                                            onSelect={() => {
                                                                setGroupName(name)
                                                                setIsGroupPopoverOpen(false)
                                                            }}
                                                        >
                                                            {name}
                                                        </CommandItem>
                                                    ))}
                                                    {groupName && !groups.has(groupName) && (
                                                        <CommandItem
                                                            key={groupName}
                                                            onSelect={() => {
                                                                setGroupName(groupName)
                                                                setIsGroupPopoverOpen(false)
                                                            }}
                                                        >
                                                            Create "{groupName}"
                                                        </CommandItem>
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={isPopoverOpen} className="flex-2/5">
                                            {reactionId ? reactionsMap[reactionId]?.name : "Select reaction..."}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search reactions..."
                                            />
                                            <CommandList>
                                                <CommandEmpty>No reactions found</CommandEmpty>
                                                <CommandGroup>
                                                    {reactionsData && reactionsData
                                                        .filter(item => !usedReactions.has(item.id))
                                                        .map(item => {
                                                            return (
                                                                <CommandItem
                                                                    onSelect={() => {
                                                                        setReactionId(item.id)
                                                                        setIsPopoverOpen(false)
                                                                    }}
                                                                    className="flex items-center gap-2"
                                                                    key={item.id}
                                                                >
                                                                    <Avatar className="h-5 w-5 rounded-none">
                                                                        <AvatarImage src={item.url} />
                                                                        <AvatarFallback>{item.name}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{item.name} ({item.id})</span>
                                                                </CommandItem>
                                                            )
                                                        })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Button onClick={handleAddReaction} className="flex-1/5">
                                    Add Reaction
                                </Button>
                            </div>
                        </div>

                        <h3 className="text-sm font-medium">{groups.length} Reaction Group{groups.length != 1 ? "s" : ""}</h3>
                        <div className="space-y-2">
                            <div className="space-y-2">
                                {Array.from(groups.entries()).map(([groupName, group]) => (
                                    <div key={groupName} className="p-4 border rounded-lg relative bg-card">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-sm">{groupName}</h4>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-muted-foreground">Points:</span>
                                                    <Input
                                                        defaultValue={group.points}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            const newValue = parseInt(value);
                                                            if (!isNaN(newValue)) {
                                                                setGroups(prev => {
                                                                    const newGroups = new Map(prev)
                                                                    const existing = newGroups.get(groupName)
                                                                    if (existing) {
                                                                        newGroups.set(groupName, {
                                                                            ...existing,
                                                                            points: newValue
                                                                        })
                                                                    }
                                                                    return newGroups
                                                                });
                                                                setInvalidGroups(prev => {
                                                                    const newSet = new Set(prev);
                                                                    newSet.delete(groupName);
                                                                    return newSet;
                                                                });
                                                            } else {
                                                                setInvalidGroups(prev => new Set(prev).add(groupName));
                                                            }
                                                        }}
                                                        className={`w-20 h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right ${invalidGroups.has(groupName) ? '!border-red-500 !border-2 focus:!border-red-500' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleDeleteGroup(groupName)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                                            >
                                                Delete Group
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from(group.reactions).map(reactionId => (
                                                <div key={reactionId} className="relative group">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                                                        <Avatar className="h-5 w-5 rounded-none">
                                                            <AvatarImage src={reactionsMap[reactionId].url} className="object-contain" />
                                                            <AvatarFallback className="text-[0.6rem]">{reactionsMap[reactionId].name}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium">{reactionsMap[reactionId].name}</span>
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteReaction(groupName, reactionId);
                                                            }}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-4 w-4 text-destructive hover:text-destructive-foreground hover:bg-destructive/10 p-0 flex items-center justify-center"
                                                        >
                                                            <span className="text-xs leading-none -mt-px">×</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <div className="flex items-center space-x-4 grid-cols-2">
                                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                                    <PopoverTrigger asChild className="flex-4/5">
                                        <Button disabled={isLoadingOrRefetchingReport} variant="outline" className="flex items-center gap-2">
                                            Select date range
                                            {dateRange && dateRange.from && dateRange.to && (
                                                <span className="text-xs text-muted-foreground">
                                                    {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                        <Calendar
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            className="rounded-md w-full"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    onClick={handleGenerateReport}
                                    disabled={isLoadingOrRefetchingReport}
                                    variant={isLoadingOrRefetchingReport ? "secondary" : "default"}
                                    className="flex-1/5"
                                >
                                    {isLoadingOrRefetchingReport ? (
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4 rounded-full" />
                                            Generating report...
                                        </div>
                                    ) : "Generate Report"}
                                </Button>
                            </div>

                            {markdown && (
                                <div className="mt-4 relative">
                                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto text-sm">
                                        {markdown}
                                    </pre>
                                    <button
                                        onClick={copyMarkdown}
                                        className={`absolute top-2 right-2 p-1.5 rounded-md transition-colors ${copied
                                            ? 'text-green-500 bg-green-500/10'
                                            : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        aria-label={copied ? "Copied" : "Copy to clipboard"}
                                    >
                                        {copied ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}