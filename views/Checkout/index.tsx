"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    getCart, clearCart, removeFromCart, updateCartItemQuantity,
    setCartItemGrace, getCartTotal, CartItem, formatVND
} from "@/lib/cart";
import {
    ChevronLeft, Trash2, Loader2, ShieldCheck, Truck,
    CreditCard, Banknote, Package, Minus, Plus, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Vietnam Provinces API types
interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward { code: number; name: string; }


export default function CheckoutPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();

    // Cart
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Customer form
    const [form, setForm] = useState({
        email: "",
        name: "",
        phone: "",
        address: "",
        notes: ""
    });

    // Province / District / Ward
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [provinceName, setProvinceName] = useState("");
    const [districtName, setDistrictName] = useState("");
    const [wardName, setWardName] = useState("");

    // Payment
    const [paymentMethod, setPaymentMethod] = useState("cod");



    // Order state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState("");

    // Validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load cart & handle flash sale grace periods
    useEffect(() => {
        const loadAndCleanCart = async () => {
            const raw = getCart();
            const nowMs = Date.now();
            const now = new Date(nowMs).toISOString();

            // ── Step A: Remove items whose grace period has already expired ──
            const graceExpired = raw.filter(
                i => i.saleGraceExpiresAt && new Date(i.saleGraceExpiresAt).getTime() <= nowMs
            );
            let workingCart = raw;
            if (graceExpired.length > 0) {
                graceExpired.forEach(i => { workingCart = removeFromCart(i.variantId); });
                const names = graceExpired.map(i => `• ${i.productName}`).join("\n");
                toast({
                    title: "⏱ Thời gian gia hạn đã hết",
                    description: `Các sản phẩm sau đã bị xóa (hết 5 phút gia hạn):\n${names}`,
                    variant: "destructive",
                });
            }

            // ── Step B: Skip items that are still within an active grace period ──
            const variantIds = workingCart
                .filter(i => !i.saleGraceExpiresAt) // already-graced items are fine
                .map(i => i.variantId)
                .filter(Boolean);

            if (variantIds.length === 0) {
                setCartItems(workingCart);
                setIsLoaded(true);
                return;
            }

            // ── Step C: Fetch real prices for non-graced suspects ──
            const { data: variantData } = await supabase
                .from("product_variants")
                .select("id, price, vat_percent, discount_percent")
                .in("id", variantIds);

            const variantPriceMap: Record<string, number> = {};
            (variantData || []).forEach((v: any) => {
                const basePrice = v.price;
                const vat = v.vat_percent || 0;
                const discountVal = v.discount_percent || 0;

                // formula: (price - discount%) + VAT%
                const discountedPrice = basePrice * (1 - discountVal / 100);
                const finalAllowedPrice = discountedPrice * (1 + vat / 100);

                variantPriceMap[v.id] = finalAllowedPrice;
            });

            const suspectVariantIds = workingCart
                .filter(item => {
                    if (item.saleGraceExpiresAt) return false; // already in grace
                    const realAllowedPrice = variantPriceMap[item.variantId ?? ""];
                    // If the item in cart is magically cheaper than the discounted+VAT price, 
                    // then it must have been a flash sale price (or tampered).
                    // Use a tiny buffer (.01) to prevent floating-point mismatches
                    return realAllowedPrice !== undefined && item.price < (realAllowedPrice - 0.01);
                })
                .map(item => item.variantId!);

            if (suspectVariantIds.length === 0) {
                setCartItems(workingCart);
                setIsLoaded(true);
                return;
            }

            // ── Step D: Check which suspects still have an active campaign ──
            const { data: activeSaleItems } = await supabase
                .from("campaign_items")
                .select("variant_id, campaigns!inner(is_active, start_time, end_time)")
                .in("variant_id", suspectVariantIds)
                .eq("campaigns.is_active", true)
                .lte("campaigns.start_time", now)
                .gte("campaigns.end_time", now);

            const stillActiveSet = new Set(
                (activeSaleItems || []).map((si: any) => si.variant_id)
            );

            // ── Step E: For items whose sale ended → stamp grace (don't remove yet) ──
            suspectVariantIds.forEach(vid => {
                if (!stillActiveSet.has(vid)) {
                    workingCart = setCartItemGrace(vid) ?? workingCart;
                }
            });

            setCartItems(getCart()); // re-read after grace stamps
            setIsLoaded(true);
        };

        loadAndCleanCart();
    }, []);


    // Fetch provinces
    useEffect(() => {
        fetch("https://provinces.open-api.vn/api/p/")
            .then(res => res.json())
            .then(data => setProvinces(data))
            .catch(() => { });
    }, []);

    // Fetch districts when province selected
    useEffect(() => {
        if (!selectedProvince) { setDistricts([]); return; }
        fetch(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`)
            .then(res => res.json())
            .then(data => {
                setDistricts(data.districts || []);
                setProvinceName(data.name || "");
            })
            .catch(() => { });
        setSelectedDistrict("");
        setSelectedWard("");
        setWards([]);
    }, [selectedProvince]);

    // Fetch wards when district selected
    useEffect(() => {
        if (!selectedDistrict) { setWards([]); return; }
        fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`)
            .then(res => res.json())
            .then(data => {
                setWards(data.wards || []);
                setDistrictName(data.name || "");
            })
            .catch(() => { });
        setSelectedWard("");
    }, [selectedDistrict]);

    // Ward name
    const handleWardChange = (wardCode: string) => {
        setSelectedWard(wardCode);
        const w = wards.find(w => w.code.toString() === wardCode);
        setWardName(w?.name || "");
    };

    // Total
    const subtotal = getCartTotal(cartItems);
    const total = subtotal; // can add discount logic later

    // --- Cart actions ---
    const handleQuantity = (variantId: string, delta: number) => {
        const item = cartItems.find(c => c.variantId === variantId);
        if (!item) return;
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock));
        const updated = updateCartItemQuantity(variantId, newQty);
        setCartItems([...updated]);
    };

    const handleRemove = (variantId: string) => {
        const updated = removeFromCart(variantId);
        setCartItems([...updated]);
    };

    // --- Validate ---
    const validate = useCallback(() => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
        if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
        else if (!/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g, "")))
            e.phone = "Số điện thoại không hợp lệ";
        if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ";
        if (!form.email.trim()) e.email = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ";
        if (!selectedProvince) e.province = "Bạn chưa chọn tỉnh thành";
        if (!selectedDistrict) e.district = "Bạn chưa chọn quận huyện";
        if (!selectedWard) e.ward = "Bạn chưa chọn phường xã";
        if (cartItems.length === 0) e.cart = "Giỏ hàng trống";
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [form, selectedProvince, selectedDistrict, selectedWard, cartItems]);

    // --- Submit order ---
    const handleSubmit = async () => {
        if (!validate()) return;
        setIsSubmitting(true);

        try {
            const fullAddress = `${form.address}, ${wardName}, ${districtName}, ${provinceName}`;

            // ── Safety-net: remove items whose grace window has now expired ──
            const now = Date.now();
            const graceExpired = cartItems.filter(
                i => i.saleGraceExpiresAt && new Date(i.saleGraceExpiresAt).getTime() <= now
            );
            if (graceExpired.length > 0) {
                let updatedCart = cartItems;
                graceExpired.forEach(i => { updatedCart = removeFromCart(i.variantId); });
                setCartItems(updatedCart);
                setIsSubmitting(false);
                toast({
                    title: "⏱ Thời gian gia hạn đã hết",
                    description: `Thời gian 5 phút đã hết, các sản phẩm sale sau đã bị xóa:\n${graceExpired.map(i => `• ${i.productName}`).join("\n")}\n\nVui lòng xem lại giỏ hàng.`,
                    variant: "destructive",
                });
                return;
            }
            // ── END safety-net ───────────────────────────────────────────────

            const items = cartItems.map(item => ({
                product_id: item.productId,
                variant_id: item.variantId,
                quantity: item.quantity,
                price: item.price
            }));

            // Get current user ID if logged in
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase.rpc("create_order_v2", {
                p_customer_name: form.name,
                p_customer_phone: form.phone.replace(/\s/g, ""),
                p_shipping_address: fullAddress,
                p_items: items,
                p_user_id: user?.id || null
            });

            if (error) throw error;

            const newOrderId = (data as string) || "";

            // Cập nhật customer_email + notes riêng để tránh lỗi nếu RPC chưa hỗ trợ các tham số này
            if (newOrderId) {
                const updateData: Record<string, string> = {};
                if (form.email) updateData.customer_email = form.email;
                if (form.notes.trim()) updateData.notes = form.notes.trim();
                if (Object.keys(updateData).length > 0) {
                    await supabase
                        .from("orders")
                        .update(updateData)
                        .eq("id", newOrderId);
                }
            }

            setOrderId(newOrderId);

            // --- Send COD confirmation email via Edge Function ---
            if (paymentMethod === 'cod') {
                try {
                    await supabase.functions.invoke('order-confirmation-email', {
                        body: { orderId: newOrderId }
                    });
                } catch (emailError) {
                    console.error("Failed to send order emails:", emailError);
                }
            }

            clearCart();
            setCartItems([]);

            if (paymentMethod === "qr") {
                router.push(`/payment/success?orderId=${newOrderId}&method=qr`);
            } else {
                router.push(`/payment/success?orderId=${newOrderId}&method=cod`);
            }
        } catch (err: any) {
            toast({
                title: "Lỗi đặt hàng",
                description: err.message || "Vui lòng thử lại",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Loading ---
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    // --- Empty cart ---
    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#12141c] flex items-center justify-center p-4">
                <div className="text-center bg-white dark:bg-[#1c212c] p-10 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm max-w-sm w-full mx-auto">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="h-10 w-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Giỏ hàng trống</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 rounded-xl shadow-[0_8px_20px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 transition-all">
                        <Link href="/products">Khám phá sản phẩm</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#12141c] text-slate-900 dark:text-slate-200">
            {/* Header */}
            <header className="bg-white dark:bg-[#1c212c] border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center">
                        <img
                            src="/img/logo-telectric.png"
                            alt="TLECTRIC Logo"
                            className="h-24 w-auto object-contain"
                        />
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        <span className="hidden sm:inline">Thanh toán an toàn & bảo mật</span>
                        <span className="sm:hidden">Bảo mật</span>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
                {/* Back */}
                <Link
                    href="/products"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors mb-8"
                >
                    <ChevronLeft className="h-4 w-4" /> Quay lại mua sắm
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* ========= LEFT: FORM ========= */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* --- Customer Info --- */}
                        <div className="bg-white dark:bg-[#1c212c] rounded-2xl border border-gray-200 dark:border-white/10 p-6 md:p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 text-sm">1</span>
                                Thông tin nhận hàng
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Name */}
                                <div className="md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="Nguyễn Văn A"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className={cn("mt-2 h-12 bg-gray-50 dark:bg-[#1c212c] border-gray-200 dark:border-white/10 focus:border-orange-500 dark:focus:border-orange-500 rounded-xl", errors.name && "border-red-400 dark:border-red-500/50")}
                                    />
                                    {errors.name && <p className="text-xs font-medium text-red-500 mt-1.5">{errors.name}</p>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex mt-2">
                                        <div className="flex items-center gap-1.5 px-4 bg-gray-100 dark:bg-[#12141c] border border-gray-200 dark:border-white/10 border-r-0 rounded-l-xl text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            +84
                                        </div>
                                        <Input
                                            placeholder="0912 345 678"
                                            value={form.phone}
                                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                            className={cn("h-12 rounded-l-none bg-gray-50 dark:bg-[#1c212c] border-gray-200 dark:border-white/10 focus:border-orange-500 dark:focus:border-orange-500 rounded-r-xl", errors.phone && "border-red-400 dark:border-red-500/50")}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-xs font-medium text-red-500 mt-1.5">{errors.phone}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="email@example.com"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className={cn("mt-2 h-12 bg-gray-50 dark:bg-[#1c212c] border-gray-200 dark:border-white/10 focus:border-orange-500 dark:focus:border-orange-500 rounded-xl", errors.email && "border-red-400 dark:border-red-500/50")}
                                    />
                                    {errors.email && <p className="text-xs font-medium text-red-500 mt-1.5">{errors.email}</p>}
                                </div>

                                <div className="md:col-span-2 border-t border-gray-100 dark:border-white/5 my-2"></div>

                                {/* Address */}
                                <div className="md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        Địa chỉ chi tiết <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="Số nhà, tên đường, tòa nhà..."
                                        value={form.address}
                                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                        className={cn("mt-2 h-12 bg-gray-50 dark:bg-[#1c212c] border-gray-200 dark:border-white/10 focus:border-orange-500 dark:focus:border-orange-500 rounded-xl", errors.address && "border-red-400 dark:border-red-500/50")}
                                    />
                                    {errors.address && <p className="text-xs font-medium text-red-500 mt-1.5">{errors.address}</p>}
                                </div>

                                {/* Province / District / Ward */}
                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tỉnh thành</Label>
                                        <select
                                            value={selectedProvince}
                                            onChange={e => setSelectedProvince(e.target.value)}
                                            className={cn(
                                                "w-full mt-2 h-12 px-4 rounded-xl border bg-gray-50 dark:bg-[#1c212c] text-slate-900 dark:text-slate-200 border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all",
                                                errors.province && "border-red-400 dark:border-red-500/50"
                                            )}
                                        >
                                            <option value="">Tỉnh / Thành phố</option>
                                            {provinces.map(p => (
                                                <option key={p.code} value={p.code}>{p.name}</option>
                                            ))}
                                        </select>
                                        {errors.province && <p className="text-xs font-medium text-red-500 mt-1.5">{errors.province}</p>}
                                    </div>
                                    <div>
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Quận / Huyện</Label>
                                        <select
                                            value={selectedDistrict}
                                            onChange={e => setSelectedDistrict(e.target.value)}
                                            disabled={!selectedProvince}
                                            className={cn(
                                                "w-full mt-2 h-12 px-4 rounded-xl border bg-gray-50 dark:bg-[#1c212c] text-slate-900 dark:text-slate-200 border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                                errors.district && "border-red-400 dark:border-red-500/50"
                                            )}
                                        >
                                            <option value="">Quận / Huyện</option>
                                            {districts.map(d => (
                                                <option key={d.code} value={d.code}>{d.name}</option>
                                            ))}
                                        </select>
                                        {errors.district && <p className="text-xs font-medium text-red-500 mt-1.5">{errors.district}</p>}
                                    </div>
                                    <div>
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phường xã</Label>
                                        <select
                                            value={selectedWard}
                                            onChange={e => handleWardChange(e.target.value)}
                                            disabled={!selectedDistrict}
                                            className={cn(
                                                "w-full mt-2 h-12 px-4 rounded-xl border bg-gray-50 dark:bg-[#1c212c] text-slate-900 dark:text-slate-200 border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                                errors.ward && "border-red-400 dark:border-red-500/50"
                                            )}
                                        >
                                            <option value="">Phường / Xã</option>
                                            {wards.map(w => (
                                                <option key={w.code} value={w.code}>{w.name}</option>
                                            ))}
                                        </select>
                                        {errors.ward && <p className="text-xs font-medium text-red-500 mt-1.5">{errors.ward}</p>}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="md:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ghi chú thêm</Label>
                                    <textarea
                                        placeholder="Ví dụ: Giao hàng giờ hành chính..."
                                        value={form.notes}
                                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full mt-2 px-4 py-3 rounded-xl border bg-gray-50 dark:bg-[#1c212c] text-slate-900 dark:text-slate-200 border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- Payment Method --- */}
                        <div className="bg-white dark:bg-[#1c212c] rounded-2xl border border-gray-200 dark:border-white/10 p-6 md:p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500 text-sm">2</span>
                                Phương thức thanh toán
                            </h2>

                            <div className="space-y-4">
                                {/* COD */}
                                <label
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 relative",
                                        paymentMethod === "cod"
                                            ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 shadow-sm"
                                            : "border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/50 bg-white dark:bg-[#1c212c]"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors",
                                        paymentMethod === "cod" ? "border-orange-500 bg-orange-500" : "border-gray-300 dark:border-slate-600"
                                    )}>
                                        {paymentMethod === "cod" && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="cod"
                                        checked={paymentMethod === "cod"}
                                        onChange={() => setPaymentMethod("cod")}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500 flex-shrink-0">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-[15px] text-slate-900 dark:text-slate-200">Thanh toán khi nhận hàng (COD)</p>
                                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Kiểm tra hàng trước khi thanh toán</p>
                                    </div>
                                </label>

                                {/* QR Transfer */}
                                <label
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 relative",
                                        paymentMethod === "qr"
                                            ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 shadow-sm"
                                            : "border-gray-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/50 bg-white dark:bg-[#1c212c]"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors",
                                        paymentMethod === "qr" ? "border-orange-500 bg-orange-500" : "border-gray-300 dark:border-slate-600"
                                    )}>
                                        {paymentMethod === "qr" && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="qr"
                                        checked={paymentMethod === "qr"}
                                        onChange={() => setPaymentMethod("qr")}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 flex-shrink-0">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-[15px] text-slate-900 dark:text-slate-200">Chuyển khoản / Quét mã QR</p>
                                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Quét mã QR ngân hàng — xác nhận nhanh</p>
                                    </div>
                                    {/* QR badge */}
                                    <span className="flex-shrink-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide hidden sm:inline">QR PAY</span>
                                </label>
                            </div>

                            {/* Trust note */}
                            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20 rounded-xl flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-orange-800 dark:text-orange-300/90 leading-relaxed">
                                    Mọi thông tin thanh toán của bạn luôn được bảo mật tuyệt đối. TLECTRIC cam kết hoàn tiền 100% nếu sản phẩm không đúng mô tả.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ========= RIGHT: ORDER SUMMARY ========= */}
                    <div className="lg:col-span-5">
                        <div className="bg-white dark:bg-[#1c212c] rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg sticky top-24 overflow-hidden">
                            {/* Summary Header */}
                            <div className="px-6 py-5 bg-slate-50 dark:bg-[#1c212c] border-b border-gray-200 dark:border-white/10">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Package className="h-5 w-5 text-orange-500" />
                                    Tóm tắt đơn hàng ({cartItems.length})
                                </h2>
                            </div>

                            <div className="p-6">
                                {/* Items */}
                                <div className="space-y-5 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {cartItems.map((item) => (
                                        <div key={item.variantId} className="flex items-start gap-4 pb-5 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0">
                                            <div className="flex-shrink-0">
                                                <div className="w-16 h-16 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#12141c] overflow-hidden flex items-center justify-center p-1">
                                                    {item.thumbnail ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={item.thumbnail}
                                                            alt={item.productName}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-slate-300" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-900 dark:text-slate-200 line-clamp-2 leading-snug mb-1.5">{item.productName}</p>
                                                <div className="flex gap-1.5 flex-wrap mb-2">
                                                    {Object.entries(item.attributes).map(([k, v]) => (
                                                        <span key={k} className="text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                                                            {k}: {v}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-black text-[15px] text-red-600 dark:text-red-500">{formatVND(item.price)}</span>

                                                    {/* Qt controls */}
                                                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-white/10 rounded-lg p-0.5">
                                                        <button
                                                            onClick={() => handleQuantity(item.variantId, -1)}
                                                            className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="text-xs font-bold w-6 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleQuantity(item.variantId, 1)}
                                                            className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.variantId)}
                                                className="mt-1 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Xóa sản phẩm"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>



                                {/* Cost Breakdown */}
                                <div className="space-y-3 mb-6 p-4 bg-gray-50 dark:bg-[#1c212c] rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between text-[15px] font-medium text-slate-600 dark:text-slate-400">
                                        <span>Tạm tính</span>
                                        <span className="text-slate-900 dark:text-slate-200">{formatVND(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-[15px] font-medium text-slate-600 dark:text-slate-400">
                                        <span>Phí vận chuyển</span>
                                        <span className="text-slate-900 dark:text-slate-200 font-bold">Liên hệ xác nhận</span>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="flex justify-between items-end mb-8 px-2">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tổng cộng</span>
                                        <span className="text-[11px] text-slate-400">(Đã bao gồm VAT nếu có)</span>
                                    </div>
                                    <span className="text-3xl font-black text-red-600 dark:text-red-500">{formatVND(total)}</span>
                                </div>

                                {/* Submit Actions */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg h-14 rounded-xl shadow-[0_8px_20px_rgba(249,115,22,0.25)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...</>
                                    ) : (
                                        "ĐẶT HÀNG NGAY"
                                    )}
                                </Button>
                                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Thông tin của bạn được mã hóa an toàn
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
