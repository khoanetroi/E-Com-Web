"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Clock } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    getCart,
    removeFromCart,
    updateCartItemQuantity,
    getCartTotal,
    getCartItemCount,
    setCartItemGrace,
    formatVND,
    CartItem
} from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";

const GRACE_MS = 5 * 60 * 1000; // 5 minutes

/** Format remaining seconds as mm:ss */
function fmtCountdown(ms: number) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export function CartPopover() {
    const supabase = createClient();
    const [items, setItems] = useState<CartItem[]>([]);
    const [count, setCount] = useState(0);
    const [total, setTotal] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    // countdown tick — forces re-render every second
    const [, setTick] = useState(0);
    const tickRef = useRef<NodeJS.Timeout | null>(null);

    const syncFromStorage = () => {
        const c = getCart();
        setItems(c);
        setCount(getCartItemCount(c));
        setTotal(getCartTotal(c));
    };

    useEffect(() => {
        syncFromStorage();
        const handler = () => syncFromStorage();
        window.addEventListener("cart-updated", handler);
        return () => window.removeEventListener("cart-updated", handler);
    }, []);

    // Countdown ticker — runs while cart is open and there are grace items
    useEffect(() => {
        const hasGrace = items.some(i => i.saleGraceExpiresAt);
        if (isOpen && hasGrace) {
            tickRef.current = setInterval(() => {
                setTick(t => t + 1);
                // Auto-remove any items whose grace has expired
                const now = Date.now();
                const cart = getCart();
                const expired = cart.filter(
                    i => i.saleGraceExpiresAt && new Date(i.saleGraceExpiresAt).getTime() <= now
                );
                if (expired.length > 0) {
                    let updated = cart;
                    expired.forEach(i => { updated = removeFromCart(i.variantId); });
                    // syncFromStorage triggers via cart-updated event from removeFromCart
                }
            }, 1000);
        } else {
            if (tickRef.current) clearInterval(tickRef.current);
        }
        return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }, [isOpen, items]);

    // ── When cart opens: detect expired flash sale items & give grace period ──
    useEffect(() => {
        if (!isOpen) return;

        const checkExpiredSaleItems = async () => {
            const raw = getCart();
            const variantIds = raw.map(i => i.variantId).filter(Boolean);
            if (variantIds.length === 0) return;

            setIsChecking(true);

            // 1. Get real prices from product_variants
            const { data: variantData } = await supabase
                .from("product_variants")
                .select("id, price")
                .in("id", variantIds);

            const variantPriceMap: Record<string, number> = {};
            (variantData || []).forEach((v: any) => { variantPriceMap[v.id] = v.price; });

            // 2. Find items whose cart price < real price (may be stale sale price)
            const suspects = raw
                .filter(item => {
                    // Skip items already in grace period
                    if (item.saleGraceExpiresAt) return false;
                    const real = variantPriceMap[item.variantId ?? ""];
                    return real !== undefined && item.price < real;
                })
                .map(i => i.variantId!);

            if (suspects.length === 0) {
                setIsChecking(false);
                syncFromStorage();
                return;
            }

            // 3. Check which still have an active campaign
            const now = new Date().toISOString();
            const { data: stillActive } = await supabase
                .from("campaign_items")
                .select("variant_id, campaigns!inner(is_active, start_time, end_time)")
                .in("variant_id", suspects)
                .eq("campaigns.is_active", true)
                .lte("campaigns.start_time", now)
                .gte("campaigns.end_time", now);

            const activeSet = new Set((stillActive || []).map((s: any) => s.variant_id));

            // 4. Items whose sale just ended → give them a 5-minute grace period
            suspects.forEach(vid => {
                if (!activeSet.has(vid)) {
                    setCartItemGrace(vid, GRACE_MS);
                }
            });

            syncFromStorage();
            setIsChecking(false);
        };

        checkExpiredSaleItems();
    }, [isOpen]);
    // ──────────────────────────────────────────────────────────────────────────

    const handleQuantity = (variantId: string, delta: number) => {
        const item = items.find(i => i.variantId === variantId);
        if (!item) return;
        updateCartItemQuantity(variantId, item.quantity + delta);
    };

    const handleRemove = (variantId: string) => {
        removeFromCart(variantId);
    };

    const gracefulItems = items.filter(i => i.saleGraceExpiresAt);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className="relative p-2.5 bg-slate-100 dark:bg-[#1e2330] hover:bg-slate-200 dark:hover:bg-[#2a3040] text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-all hover:text-electric-orange group outline-none"
                    aria-label="Open cart"
                >
                    <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                    {count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-electric-orange text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-industrial-black animate-in zoom-in duration-300">
                            {count > 99 ? "99+" : count}
                        </span>
                    )}
                    {/* Grace period pulse on cart icon */}
                    {gracefulItems.length > 0 && (
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-industrial-black animate-pulse" />
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-80 sm:w-96 p-0 bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden" align="end">
                <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                        <ShoppingBag className="h-4 w-4" /> Giỏ hàng
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {count} sản phẩm
                    </span>
                </div>

                <ScrollArea className="h-[400px]">
                    {isChecking ? (
                        <div className="flex items-center justify-center h-24 text-sm text-slate-400 gap-2">
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-electric-orange rounded-full animate-spin" />
                            Đang kiểm tra giỏ hàng...
                        </div>
                    ) : items.length > 0 ? (
                        <div className="p-4 space-y-4">
                            {items.map((item) => {
                                const graceMs = item.saleGraceExpiresAt
                                    ? new Date(item.saleGraceExpiresAt).getTime() - Date.now()
                                    : null;
                                const isGrace = graceMs !== null && graceMs > 0;
                                const isGraceExpired = graceMs !== null && graceMs <= 0;

                                return (
                                    <div key={item.variantId} className={`flex gap-4 group rounded-xl transition-all ${isGrace ? "ring-2 ring-amber-400 ring-offset-1 bg-amber-50/30 dark:bg-amber-900/10 p-2 -mx-2" : ""}`}>
                                        <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt={item.productName} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                    <ShoppingBag className="h-8 w-8 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight mb-1 group-hover:text-electric-orange transition-colors">
                                                    {item.productName}
                                                </h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(item.attributes).map(([k, v]) => (
                                                        <span key={k} className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                            {k}: {v}
                                                        </span>
                                                    ))}
                                                </div>
                                                {/* Grace period countdown */}
                                                {isGrace && (
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        <Clock className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                                            Sale hết hạn! Thanh toán trong{" "}
                                                            <span className="font-mono text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-1 rounded">
                                                                {fmtCountdown(graceMs!)}
                                                            </span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-md p-1 scale-90 -translate-x-2">
                                                    <button
                                                        onClick={() => handleQuantity(item.variantId, -1)}
                                                        className="w-5 h-5 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded transition shadow-sm disabled:opacity-30"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-2.5 w-2.5" />
                                                    </button>
                                                    <span className="text-[11px] font-bold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleQuantity(item.variantId, 1)}
                                                        className="w-5 h-5 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded transition shadow-sm disabled:opacity-30"
                                                        disabled={item.quantity >= item.stock}
                                                    >
                                                        <Plus className="h-2.5 w-2.5" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-rose-600 dark:text-rose-500">
                                                        {formatVND(item.price * item.quantity)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemove(item.variantId)}
                                                        className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-0.5 transition-colors mt-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" /> Gỡ bỏ
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <ShoppingBag className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white mb-1">Giỏ hàng trống</p>
                            <p className="text-xs">Tiếp tục khám phá sản phẩm của chúng tôi nhé!</p>
                        </div>
                    )}
                </ScrollArea>

                {items.length > 0 && (
                    <div className="p-4 border-t dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                        {gracefulItems.length > 0 && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center font-medium">
                                ⏱ Có {gracefulItems.length} sản phẩm đang trong thời gian gia hạn — hãy thanh toán nhanh!
                            </p>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Tạm tính:</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">{formatVND(total)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button asChild variant="outline" size="sm" className="w-full border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 font-bold" onClick={() => setIsOpen(false)}>
                                <Link href="/checkout">Giỏ hàng</Link>
                            </Button>
                            <Button asChild size="sm" className="w-full bg-electric-orange hover:bg-orange-600 font-bold shadow-lg shadow-orange-500/20" onClick={() => setIsOpen(false)}>
                                <Link href="/checkout" className="flex items-center gap-1.5">
                                    Thanh toán <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
