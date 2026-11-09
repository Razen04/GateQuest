import {
    ArrowUpRightIcon,
    CircleNotchIcon,
    MagnifyingGlassIcon,
    UsersThreeIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/shared/components/Avatar';
import { TieredAvatar } from '@/shared/components/TieredAvatar';
import { Input } from '@/shared/components/ui/input';
import { getDonorTier } from '@/shared/types/donor';
import { searchUsers } from '../api/profileApi';

interface SearchUser {
    id: string;
    username: string;
    avatar: string | null;
    banner: string | null;
}

interface ProfileSearchProps {
    onSelectUser: (username: string) => void;
}

export default function ProfileSearch({ onSelectUser }: ProfileSearchProps) {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const term = query.trim();

        if (term.length < 2) {
            setUsers([]);
            setLoading(false);
            setError(false);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            setLoading(true);
            setError(false);

            try {
                const results = await searchUsers(term);

                if (!cancelled) {
                    setUsers(results);
                }
            } catch {
                if (!cancelled) {
                    setUsers([]);
                    setError(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const clearSearch = () => {
        setQuery('');
        setUsers([]);
        setError(false);
    };

    const getInitials = (username: string) =>
        username.slice(0, 2).toUpperCase();

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="border border-border bg-card/80 p-3 shadow-sm backdrop-blur-xl">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center bg-chart-1/10 text-chart-1">
                            <UsersThreeIcon className="h-3.5 w-3.5" />
                        </div>

                        <div>
                            <h3 className="text-xs font-bold tracking-tight text-foreground">
                                Find people
                            </h3>
                            <p className="text-[10px] text-muted-foreground">
                                Discover other users
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Input */}
                <div className="group relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-chart-1" />

                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search username..."
                        className="h-10 rounded-none border-border bg-muted/80 pl-9 pr-9 text-xs shadow-none transition-all placeholder:text-muted-foreground focus-visible:border-chart-1 focus-visible:ring-2 focus-visible:ring-chart-1/10"
                    />

                    {loading ? (
                        <CircleNotchIcon className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-chart-1" />
                    ) : query ? (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label="Clear search"
                        >
                            <XIcon className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>

                {/* Results */}
                {query.trim().length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-xl">
                        {query.trim().length < 2 ? (
                            <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                                Type at least 2 characters
                            </p>
                        ) : loading ? (
                            <div className="space-y-3 p-2">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2"
                                    >
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-3 w-24 rounded-none" />
                                            <Skeleton className="h-2.5 w-16 rounded-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <p className="px-2 py-3 text-center text-[11px] text-destructive">
                                Search failed. Try again.
                            </p>
                        ) : (
                            <Command
                                shouldFilter={false}
                                className="bg-transparent"
                            >
                                <CommandList className="max-h-56 overflow-y-auto">
                                    {users.length === 0 ? (
                                        <CommandEmpty className="py-5 text-[11px] text-muted-foreground">
                                            No users found.
                                        </CommandEmpty>
                                    ) : (
                                        <CommandGroup heading="USERS">
                                            {users.map((user) => (
                                                <CommandItem
                                                    key={user.id}
                                                    value={user.username}
                                                    onSelect={() =>
                                                        onSelectUser(
                                                            user.username
                                                        )
                                                    }
                                                    className="group flex cursor-pointer items-center gap-2 rounded-none px-2 py-2 aria-selected:bg-chart-1/10"
                                                >
                                                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border">
                                                        {user.avatar ? (
                                                            <TieredAvatar
                                                                src={
                                                                    user.avatar
                                                                }
                                                                alt={
                                                                    user.username
                                                                }
                                                                tier={getDonorTier(
                                                                    user.notification_tags
                                                                )}
                                                                animated={false}
                                                                className="h-8 w-8 shrink-0"
                                                                fallback={
                                                                    <span className="flex h-full w-full items-center justify-center bg-chart-1/10 text-[10px] font-bold text-chart-1">
                                                                        {getInitials(
                                                                            user.username
                                                                        )}
                                                                    </span>
                                                                }
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-chart-1/10 text-[10px] font-bold text-chart-1">
                                                                {getInitials(
                                                                    user.username
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold text-foreground">
                                                            @{user.username}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            View profile
                                                        </p>
                                                    </div>

                                                    <ArrowUpRightIcon className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                </CommandList>
                            </Command>
                        )}
                    </div>
                )}

                {/* Footer */}
                {!query && (
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                        <span className="text-[10px] text-muted-foreground">
                            Search by username
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
