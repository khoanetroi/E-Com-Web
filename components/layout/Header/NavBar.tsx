"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Home, Package, Zap, LifeBuoy, Percent, Sun, Moon, Megaphone, ShieldCheck, Menu, X, Ticket } from "lucide-react";
import { useTheme } from "next-themes";


export const NavBar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close menu when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return (
        <div ref={menuRef} className="w-full bg-white dark:bg-industrial-black border-b border-slate-200 dark:border-white/5 relative z-10 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl px-3 sm:px-4 flex items-center justify-between h-10 md:h-12">

                {/* Mobile Menu Toggle Button */}
                <button
                    className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-electric-orange dark:hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {/* Main Navigation - Desktop (h-full) & Mobile (Dropdown) */}
                <nav className={`
                    absolute top-full left-0 right-0 bg-white dark:bg-industrial-black border-b border-slate-200 dark:border-white/5 shadow-lg md:shadow-none
                    md:relative md:top-auto md:border-none md:bg-transparent md:block flex-1 mr-4
                    ${isMobileMenuOpen ? 'block' : 'hidden'}
                `}>
                    <ul className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 md:h-full p-4 md:p-0 min-w-max md:pr-4 md:border-r md:border-transparent">
                        <NavItem href="/" icon={<Home size={16} />} label="Trang Chủ" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem href="/products" icon={<Package size={16} />} label="Sản Phẩm" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem href="/brands" icon={<Zap size={16} />} label="Thương Hiệu" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem href="/warranty-check" icon={<ShieldCheck size={16} />} label="Tra cứu BH" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem href="/contact" icon={<LifeBuoy size={16} />} label="Liên Hệ" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem href="/account/tickets" icon={<Ticket size={16} />} label="Báo lỗi SP" onClick={() => setIsMobileMenuOpen(false)} />
                    </ul>
                </nav>

                {/* Right Side: Theme Switcher */}
                <div className="flex items-center">
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
};

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="flex items-center gap-2 bg-slate-100 dark:bg-[#1e2330] hover:bg-slate-200 dark:hover:bg-[#2a3040] border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white transition-colors opacity-50 cursor-not-allowed">
                <span className="w-4 h-4" />
            </button>
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2 bg-slate-100 dark:bg-[#1e2330] hover:bg-slate-200 dark:hover:bg-[#2a3040] border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white transition-colors"
        >
            {theme === "dark" ? (
                <>
                    <Moon size={14} className="text-yellow-400" />
                    <span>Tối</span>
                </>
            ) : (
                <>
                    <Sun size={14} className="text-electric-orange" />
                    <span>Sáng</span>
                </>
            )}
        </button>
    )
}


const NavItem = ({ href, icon, label, active, onClick }: { href: string, icon?: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => {
    return (
        <li className="md:h-full flex items-center">
            <Link
                href={href}
                onClick={onClick}
                className={`w-full md:w-auto flex items-center gap-2 text-sm font-semibold transition-colors py-3 md:py-0 md:h-full border-l-2 md:border-l-0 md:border-b-2 pl-3 md:pl-0 ${active ? 'text-electric-orange border-electric-orange bg-slate-50 md:bg-transparent dark:bg-[#2a3040] md:dark:bg-transparent' : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-electric-orange dark:hover:text-white hover:border-electric-orange md:hover:border-electric-orange hover:bg-slate-50 md:hover:bg-transparent dark:hover:bg-[#2a3040] md:dark:hover:bg-transparent'}`}
            >
                {icon}
                <span>{label}</span>
            </Link>
        </li>
    )
}
