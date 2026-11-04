import {
    ArrowUpRightIcon,
    CircleNotchIcon,
    MagnifyingGlassIcon,
    UsersThreeIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/shared/components/ui/input';
import { searchUsers } from '../api/profileApi';

interface SearchUser {
    id: string;
    username: string;
    avatar: string | null;
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
            <div className="border border-slate-200/70 bg-white/80 p-3 shadow-sm shadow-slate-200/30 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#11151D]/80 dark:shadow-black/10">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center bg-blue-500/10 text-blue-500">
                            <UsersThreeIcon className="h-3.5 w-3.5" />
                        </div>

                        <div>
                            <h3 className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-100">
                                Find people
                            </h3>
                            <p className="text-[10px] text-slate-400">
                                Discover other users
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Input */}
                <div className="group relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />

                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search username..."
                        className="h-10 rounded-none border-slate-200 bg-slate-50/80 pl-9 pr-9 text-xs shadow-none transition-all placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/10 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-200 dark:placeholder:text-slate-500"
                    />

                    {loading ? (
                        <CircleNotchIcon className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-500" />
                    ) : query ? (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-white"
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
                            <p className="px-2 py-3 text-center text-[11px] text-slate-400">
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
                            <p className="px-2 py-3 text-center text-[11px] text-red-500">
                                Search failed. Try again.
                            </p>
                        ) : (
                            <Command
                                shouldFilter={false}
                                className="bg-transparent"
                            >
                                <CommandList className="max-h-56 overflow-y-auto">
                                    {users.length === 0 ? (
                                        <CommandEmpty className="py-5 text-[11px] text-slate-400">
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
                                                    className="group flex cursor-pointer items-center gap-2 rounded-none px-2 py-2 aria-selected:bg-blue-500/10 dark:aria-selected:bg-blue-500/10"
                                                >
                                                    <Avatar className="h-8 w-8 border border-slate-200 dark:border-white/10">
                                                        <AvatarImage
                                                            src={
                                                                user.avatar ||
                                                                undefined
                                                            }
                                                        />
                                                        <AvatarFallback className="bg-blue-500/10 text-[10px] font-bold text-blue-500">
                                                            {getInitials(
                                                                user.username
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                            @{user.username}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            View profile
                                                        </p>
                                                    </div>

                                                    <ArrowUpRightIcon className="h-3.5 w-3.5 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 dark:text-slate-500" />
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
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-white/[0.06]">
                        <span className="text-[10px] text-slate-400">
                            Search by username
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
