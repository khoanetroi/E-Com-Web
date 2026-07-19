"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Zap, User, LogOut, UserCircle, ChevronDown, ShoppingCart, Loader2, Shield } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { AuthModal } from "@/components/auth/AuthModal";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { CartPopover } from "./CartPopover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useRef } from "react";

// --- Custom Hook for outside click ---
function useOnClickOutside(ref: any, handler: any) {
    useEffect(() => {
        const listener = (event: any) => {
            if (!ref.current || ref.current.contains(event.target)) return;
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}

// --- Custom Hook for debouncing ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export const MainHeader = () => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authDefaultView, setAuthDefaultView] = useState<"login" | "register">("login");

    // --- Live Search State ---
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 400); // 400ms delay
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(searchContainerRef, () => setDropdownOpen(false));

    // Fetch live search results
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedSearchQuery.trim()) {
                setSearchResults([]);
                setDropdownOpen(false);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            const { data, error } = await supabase
                .from("products")
                .select("id, name, thumbnail, slug")
                .ilike("name", `%${debouncedSearchQuery.trim()}%`)
                .limit(5);

            if (!error && data) {
                setSearchResults(data);
                setDropdownOpen(true);
            }
            setIsSearching(false);
        };

        fetchResults();
    }, [debouncedSearchQuery, supabase]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setDropdownOpen(false);
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleResultClick = (productSlug: string) => {
        setDropdownOpen(false);
        router.push(`/${productSlug}`);
    };

    const openAuthModal = (view: "login" | "register") => {
        setAuthDefaultView(view);
        setAuthModalOpen(true);
    };

    useEffect(() => {
        const fetchUserRole = async (userId: string) => {
            const { data } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .maybeSingle();
            setUserRole(data?.role || null);
        };

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) fetchUserRole(user.id);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const newUser = session?.user ?? null;
            setUser(newUser);
            if (newUser) {
                fetchUserRole(newUser.id);
            } else {
                setUserRole(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUserRole(null);
        router.push("/");
        router.refresh();
    };

    return (
        <div className="w-full bg-white dark:bg-industrial-black py-2.5 md:py-4 border-b border-slate-200 dark:border-white/5 relative z-20 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl px-3 sm:px-4 flex flex-wrap items-center justify-between gap-y-3 md:gap-y-4">

                {/* Logo */}
                <Link href="/" className="flex items-center group order-1">
                    <img
                        src="/img/logo-telectric.png"
                        alt="TLECTRIC Logo"
                        className="h-10 sm:h-16 md:h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                </Link>

                {/* Search Bar with Dropdown */}
                <div className="w-full md:flex-1 md:w-auto md:max-w-2xl px-0 md:px-4 order-3 md:order-2">
                    <div ref={searchContainerRef} className="relative w-full group">
                        <form onSubmit={handleSearch} className="relative flex items-center w-full">
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={() => {
                                    if (searchQuery.trim() && searchResults.length > 0) {
                                        setDropdownOpen(true);
                                    }
                                }}
                                placeholder="Tìm kiếm sản phẩm, danh mục..."
                                className="w-full pl-5 pr-12 py-4 md:py-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#1e2330] text-slate-900 dark:text-white focus-visible:ring-1 focus-visible:ring-electric-orange focus-visible:border-electric-orange transition-all placeholder:text-slate-500 dark:placeholder:text-slate-500 text-sm"
                            />
                            <button type="submit" className="absolute right-4 text-slate-500 hover:text-electric-orange transition-colors flex items-center justify-center">
                                {isSearching ? (
                                    <Loader2 size={18} className="animate-spin text-electric-orange" />
                                ) : (
                                    <Search size={18} />
                                )}
                            </button>
                        </form>

                        {/* Live Search Dropdown */}
                        {dropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                                {searchResults.length > 0 ? (
                                    <div>
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Sản phẩm đề xuất
                                            </span>
                                        </div>
                                        <ul className="max-h-80 overflow-y-auto">
                                            {searchResults.map((product) => (
                                                <li key={product.id}>
                                                    <button
                                                        onClick={() => handleResultClick(product.slug)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2a3040] transition-colors text-left group/item"
                                                    >
                                                        {product.thumbnail ? (
                                                            <div className="w-10 h-10 rounded bg-slate-100 flex-shrink-0 relative overflow-hidden">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={product.thumbnail}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                                <Zap className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover/item:text-electric-orange transition-colors truncate">
                                                            {product.name}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-industrial-black/50">
                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                                                }}
                                                className="w-full text-center py-2 text-sm font-medium text-electric-orange hover:text-orange-600 transition-colors"
                                            >
                                                Xem tất cả kết quả cho &quot;{searchQuery}&quot;
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-500">
                                        Không tìm thấy sản phẩm nào phù hợp.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions: Cart & Login */}
                <div className="flex items-center gap-2 md:gap-3 order-2 md:order-3">
                    <CartPopover />

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 bg-slate-100 dark:bg-[#1e2330] hover:bg-slate-200 dark:hover:bg-[#2a3040] text-slate-700 dark:text-slate-200 p-1.5 md:px-4 md:py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-xs md:text-sm font-medium outline-none">
                                    <div className="bg-electric-orange rounded-full p-1 md:p-1.5">
                                        <User size={14} className="md:size-[16px] text-white" />
                                    </div>
                                    <span className="hidden md:inline max-w-[150px] truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                                    <ChevronDown size={14} className="hidden md:block text-slate-500 dark:text-slate-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" align="end">
                                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                                {(userRole === "admin" || userRole === "moderator") && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin" className="focus:bg-electric-orange/10 focus:text-electric-orange cursor-pointer w-full flex items-center font-bold text-electric-orange">
                                            <Shield className="mr-2 h-4 w-4" />
                                            <span>Trang quản trị</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => router.push("/account/profile")} className="focus:bg-slate-100 dark:focus:bg-[#2a3040] focus:text-slate-900 dark:focus:text-white cursor-pointer w-full flex items-center">
                                    <UserCircle className="mr-2 h-4 w-4" />
                                    <span>Hồ sơ</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                                <DropdownMenuItem onClick={handleLogout} className="focus:bg-slate-100 dark:focus:bg-[#2a3040] focus:text-red-500 dark:focus:text-red-400 text-red-500 dark:text-red-400 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 bg-slate-100 dark:bg-[#1e2330] hover:bg-slate-200 dark:hover:bg-[#2a3040] text-slate-700 dark:text-slate-200 p-1.5 md:px-4 md:py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-[11px] md:text-sm font-medium outline-none">
                                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-1 md:p-1.5">
                                        <User size={14} className="md:size-[16px] text-slate-500 dark:text-slate-300" />
                                    </div>
                                    <span className="hidden md:inline">Đăng nhập</span>
                                    <ChevronDown size={14} className="hidden md:block text-slate-500 dark:text-slate-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" align="end">
                                <DropdownMenuLabel>Khách</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                                <DropdownMenuItem onClick={() => openAuthModal("login")} className="focus:bg-slate-100 dark:focus:bg-[#2a3040] focus:text-slate-900 dark:focus:text-white cursor-pointer">
                                    <div className="flex items-center gap-2 w-full">
                                        <LogOut className="mr-2 h-4 w-4 rotate-180" /> {/* Simulate Login Icon */}
                                        <span>Đăng nhập</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openAuthModal("register")} className="focus:bg-slate-100 dark:focus:bg-[#2a3040] focus:text-slate-900 dark:focus:text-white cursor-pointer">
                                    <div className="flex items-center gap-2 w-full">
                                        <UserCircle className="mr-2 h-4 w-4" />
                                        <span>Đăng ký</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <AuthModal
                open={authModalOpen}
                onOpenChange={setAuthModalOpen}
                defaultView={authDefaultView}
            />
        </div>

    );
};
