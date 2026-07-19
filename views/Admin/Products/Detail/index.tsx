"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import DefaultLayout from "@/components/layout/DefaultLayout";
import Link from "next/link";
import {
    Package, ShoppingCart, ArrowLeft, Tag, MapPin, Star, Truck,
    Shield, ChevronLeft, ChevronRight, Minus, Plus, Check, Layers,
    Home, ChevronRight as ChevronSep, Phone, Heart, Share2, Zap, Clock,
    ChevronDown as ArrowDown, ChevronUp as ArrowUp, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart";
import { RelatedProducts } from "./RelatedProducts";

// Types matching Supabase schema
interface ProductVariant {
    id: string;
    product_id: string;
    sku: string | null;
    price: number;
    stock: number;
    vat_percent?: number;
    discount_percent?: number;
    image?: string | null;
    attributes: Record<string, string>;
    created_at: string;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    brand: string;
    origin: string;
    thumbnail: string;
    images: string[];
    created_at: string;
    updated_at: string;
    warranty_months?: number;
    custom_tabs?: {
        id: string;
        name: string;
        sections: {
            id: string;
            name: string;
            links: {
                id: string;
                name: string;
                url: string;
            }[];
        }[];
    }[];
}

// --- HELPER: Format VND ---
function formatVND(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

// --- HELPER: Get unique attribute keys from variants ---
import { sortAttributes } from "@/lib/utils/attributes";

function getAttributeGroups(variants: ProductVariant[]) {
    const groups: Record<string, Set<string>> = {};
    variants.forEach(v => {
        Object.entries(v.attributes).forEach(([key, value]) => {
            if (!groups[key]) groups[key] = new Set();
            groups[key].add(value);
        });
    });

    // Sort keys based on semantic priority
    const sortedKeys = Object.keys(groups).sort(sortAttributes);

    // Build ordered object
    return Object.fromEntries(
        sortedKeys.map(key => [key, Array.from(groups[key])])
    );
}

export default function ProductDetailPage({ productSlug, initialProduct, initialVariants }: {
    productSlug: string;
    initialProduct?: any;
    initialVariants?: any[];
}) {
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();

    const [product, setProduct] = useState<Product | null>(initialProduct || null);
    const [variants, setVariants] = useState<ProductVariant[]>(initialVariants || []);
    const [loading, setLoading] = useState(!initialProduct);

    // UI State
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(
        () => initialVariants && initialVariants.length > 0 ? initialVariants[0].attributes : {}
    );
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);
    
    // Tab State
    const [activeTabId, setActiveTabId] = useState<string>("description");
    
    // Description State
    const [isDescExpanded, setIsDescExpanded] = useState(false);
    const [showReadMore, setShowReadMore] = useState(false);
    const descRef = React.useRef<HTMLDivElement>(null);

    // Accordion State
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Fetch data — skip nếu đã có initialProduct từ server
    useEffect(() => {
        if (initialProduct) return; // Đã có data từ server, không cần fetch lại

        async function fetchProduct() {
            setLoading(true);
            const productRes = await supabase.from("products").select("*").eq("slug", productSlug).single();

            if (productRes.error || !productRes.data) {
                toast({ title: "Không tìm thấy sản phẩm", variant: "destructive" });
                setLoading(false);
                return;
            }

            const fetchedProduct = productRes.data;
            const variantRes = await supabase.from("product_variants").select("*").eq("product_id", fetchedProduct.id).order("created_at");

            setProduct(fetchedProduct);
            setVariants(variantRes.data || []);

            if (variantRes.data && variantRes.data.length > 0) {
                setSelectedAttributes(variantRes.data[0].attributes);
            }
            setLoading(false);
        }

        if (productSlug) fetchProduct();
    }, [productSlug]);

    // Check if description needs "Read More" button
    useEffect(() => {
        if (activeTabId === "description" && descRef.current) {
            if (descRef.current.scrollHeight > 500) {
                setShowReadMore(true);
            } else {
                setShowReadMore(false);
            }
        }
    }, [product?.description, activeTabId]);

    // Computed values
    const allImages = useMemo(() => {
        if (!product) return [];
        return [product.thumbnail, ...(product.images || [])].filter(Boolean);
    }, [product]);

    const attributeGroups = useMemo(() => getAttributeGroups(variants), [variants]);

    const selectedVariant = useMemo(() => {
        if (!variants.length || !Object.keys(selectedAttributes).length) return null;
        return variants.find(v =>
            Object.entries(selectedAttributes).every(([k, val]) => v.attributes[k] === val)
        ) || null;
    }, [variants, selectedAttributes]);

    const dp = selectedVariant?.discount_percent || 0;

    const actualPrice = useMemo(() => {
        if (!selectedVariant) return null;
        const basePrice = selectedVariant.price;
        if (dp > 0) return basePrice * (1 - dp / 100);
        return basePrice;
    }, [selectedVariant, dp]);

    const priceRange = useMemo(() => {
        if (!variants.length) return null;
        const prices = variants.map(v => {
            const vdp = v.discount_percent || 0;
            return vdp > 0 ? v.price * (1 - vdp / 100) : v.price;
        });
        const originalPrices = variants.map(v => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const originalMin = Math.min(...originalPrices);
        const originalMax = Math.max(...originalPrices);
        const hasAnyDiscount = variants.some(v => (v.discount_percent || 0) > 0);
        return { min, max, originalMin, originalMax, hasAnyDiscount };
    }, [variants]);

    // ===== FLASH SALE — Must be after selectedVariant/priceRange =====
    const [flashSale, setFlashSale] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        async function checkFlashSale() {
            if (!selectedVariant) {
                setFlashSale(null);
                return;
            }
            const now = new Date().toISOString();
            const { data } = await supabase
                .from("campaign_items")
                .select("sale_price, variant_id, campaigns!inner(name, end_time, is_active, start_time)")
                .eq("variant_id", selectedVariant.id)
                .eq("campaigns.is_active", true)
                .lte("campaigns.start_time", now)
                .gte("campaigns.end_time", now)
                .maybeSingle();

            if (data) {
                const campaignObj = Array.isArray(data.campaigns) ? data.campaigns[0] : data.campaigns;
                setFlashSale({ ...data, campaigns: campaignObj });
                const end = new Date(campaignObj.end_time).getTime();
                setTimeLeft(Math.floor((end - new Date().getTime()) / 1000));
            } else {
                setFlashSale(null);
                setTimeLeft(0);
            }
        }
        checkFlashSale();
    }, [selectedVariant, supabase]);

    useEffect(() => {
        if (!flashSale) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(timer); setFlashSale(null); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [flashSale]);

    const formatTime = (seconds: number) => {
        if (seconds < 0) seconds = 0;
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return { d: d.toString().padStart(2, "0"), h: h.toString().padStart(2, "0"), m: m.toString().padStart(2, "0"), s: s.toString().padStart(2, "0") };
    };

    // Handlers
    const handleSelectAttribute = (key: string, value: string) => {
        const nextAttrs = { ...selectedAttributes, [key]: value };

        // Check if the exact combination exists
        const exactMatch = variants.find(v =>
            Object.entries(nextAttrs).every(([k, vVal]) => v.attributes[k] === vVal)
        );

        if (exactMatch) {
            setSelectedAttributes(nextAttrs);
        } else {
            // If doesn't exist, find the first variant that has the clicked value
            const fallback = variants.find(v => v.attributes[key] === value);
            if (fallback) {
                setSelectedAttributes(fallback.attributes);
            }
        }
        setQuantity(1);
    };

    const handlePrevImage = () => {
        setSelectedImage(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
    };

    const handleNextImage = () => {
        setSelectedImage(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
    };

    // --- LOADING STATE ---
    if (loading) {
        return (
            <DefaultLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 rounded-full border-4 border-electric-orange border-t-transparent animate-spin" />
                        <p className="text-sm text-slate-gray font-medium">Đang tải sản phẩm...</p>
                    </div>
                </div>
            </DefaultLayout>
        );
    }

    // --- NOT FOUND ---
    if (!product) {
        return (
            <DefaultLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Package className="h-16 w-16 text-slate-300" />
                    <h2 className="text-xl font-bold text-industrial-black">Không tìm thấy sản phẩm</h2>
                    <p className="text-slate-gray">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
                    <Button asChild className="bg-electric-orange hover:bg-orange-600 text-white mt-2">
                        <Link href="/products">← Quay lại danh sách</Link>
                    </Button>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            {/* BACKGROUND GRADIENT INJECTION FOR PREMIUM FEEL */}
            <div className="absolute inset-0 z-[-1] pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/10 via-[#12141c] to-[#12141c] dark:from-[#1e293b]/20 dark:via-[#12141c] dark:to-[#12141c]" />

            {/* MAIN CONTENT */}
            <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-10 lg:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* ======= LEFT: IMAGE GALLERY ======= */}
                    <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky top-24 self-start">
                        {/* Main Image */}
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-[#1c212c] border border-gray-200 dark:border-white/5 shadow-sm group">
                            {allImages[selectedImage] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={allImages[selectedImage]}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4 lg:p-6 transition-transform duration-500 group-hover:scale-105"
                                />
                            )}

                            {allImages.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrevImage}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-electric-orange hover:text-white dark:hover:bg-electric-orange dark:text-slate-200 border border-transparent hover:border-orange-500"
                                    >
                                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </button>
                                    <button
                                        onClick={handleNextImage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-electric-orange hover:text-white dark:hover:bg-electric-orange dark:text-slate-200 border border-transparent hover:border-orange-500"
                                    >
                                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Strip */}
                        {allImages.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={cn(
                                            "flex-shrink-0 w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-xl overflow-hidden border-2 transition-all p-1 bg-white dark:bg-[#1c212c]",
                                            selectedImage === idx
                                                ? "border-electric-orange shadow-md shadow-orange-500/20"
                                                : "border-gray-200 dark:border-slate-800 hover:border-electric-orange/50"
                                        )}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Share & Wishlist Row */}
                        <div className="flex items-center gap-6 mt-2 pt-4 border-t border-gray-100 dark:border-white/5 text-sm text-slate-500 dark:text-slate-400">
                            <button
                                onClick={() => setIsWishlisted(w => !w)}
                                className="flex items-center gap-1.5 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
                            >
                                <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400")} />
                                {isWishlisted ? "Đã yêu thích" : "Yêu thích"}
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast({ title: "Đã sao chép link!" });
                                }}
                                className="flex items-center gap-1.5 hover:text-electric-orange dark:hover:text-orange-400 transition-colors font-medium"
                            >
                                <Share2 className="h-4 w-4" />
                                Chia sẻ
                            </button>
                        </div>
                    </div>

                    {/* ======= RIGHT: PRODUCT INFO ======= */}
                    <div className="lg:col-span-7">
                        {/* Brand & Origin */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-electric-orange bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-500/20 shadow-sm">
                                {product.brand}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                <MapPin className="h-3.5 w-3.5" /> {product.origin}
                            </span>
                        </div>

                        {/* Product Name */}
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-industrial-black dark:text-slate-100 leading-tight mb-4 tracking-tight">
                            {product.name}
                        </h1>

                        {/* Rating & SKU row */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-white/5">
                            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-200/50 dark:border-yellow-500/20">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-500" />
                                ))}
                                <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500 ml-1.5">5.0</span>
                            </div>
                            {selectedVariant?.sku && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span className="font-medium">SKU: <span className="font-mono text-industrial-black dark:text-slate-300 uppercase">{selectedVariant.sku}</span></span>
                                </div>
                            )}
                        </div>

                        {/* ====== PRICE SECTION ====== */}
                        <div className="bg-white dark:bg-[#1c212c] border border-gray-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
                            {flashSale ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                        <Badge className="bg-red-500 hover:bg-red-600 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 animate-pulse text-white px-3 py-1 text-sm border-0">
                                            <Zap className="w-4 h-4 mr-1" fill="currentColor" /> {flashSale.campaigns?.name || "Flash Sale"}
                                        </Badge>
                                        <div className="text-sm font-bold text-red-500 flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full border border-red-100 dark:border-red-500/20">
                                            <Clock className="w-4 h-4" /> Còn lại:
                                            <span className="font-mono bg-white dark:bg-[#1c212c] px-1.5 py-0.5 rounded shadow-sm mx-0.5">{formatTime(timeLeft).d}</span>
                                            <span className="text-[10px]">ngày</span>
                                            <span className="font-mono bg-white dark:bg-[#1c212c] px-1.5 py-0.5 rounded shadow-sm mx-0.5">{formatTime(timeLeft).h}</span>
                                            :
                                            <span className="font-mono bg-white dark:bg-[#1c212c] px-1.5 py-0.5 rounded shadow-sm mx-0.5">{formatTime(timeLeft).m}</span>
                                            :
                                            <span className="font-mono bg-white dark:bg-[#1c212c] px-1.5 py-0.5 rounded shadow-sm mx-0.5">{formatTime(timeLeft).s}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-4 mt-2">
                                        <span className="text-4xl font-black text-red-600 dark:text-red-500 tracking-tight">
                                            {formatVND(flashSale.sale_price)}
                                        </span>
                                        {selectedVariant && (
                                            <span className="text-lg text-slate-400 dark:text-slate-1000 line-through font-medium">
                                                {formatVND(selectedVariant.price)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : selectedVariant ? (
                                selectedVariant.vat_percent && selectedVariant.vat_percent > 0 ? (
                                    <div className="flex flex-col gap-3 w-full mb-2">
                                        {/* Giá chưa VAT */}
                                        <div className="border border-slate-200/60 dark:border-blue-900/30 bg-slate-50/50 dark:bg-blue-950/20 rounded-xl p-5">
                                            <p className="text-[11px] font-bold text-[#4285f4] dark:text-blue-400 tracking-wider mb-2 uppercase">Giá chưa bao gồm VAT</p>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-3xl font-black text-red-600 dark:text-red-500 tracking-tight">
                                                    {formatVND(actualPrice ?? selectedVariant.price)}
                                                </span>
                                                {dp > 0 && (
                                                    <Badge className="bg-[#ffc107] hover:bg-[#e0a800] dark:bg-yellow-500/20 dark:text-yellow-500 dark:hover:bg-yellow-500/30 text-[#333] text-[13px] px-2.5 py-0.5 font-bold shadow-sm border-none translate-y-[-2px]">
                                                        -{dp}%
                                                    </Badge>
                                                )}
                                            </div>
                                            {dp > 0 && (
                                                <span className="text-base text-slate-400 dark:text-slate-1000 line-through font-medium mt-1 font-mono flex">
                                                    {formatVND(selectedVariant.price)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Giá đã VAT */}
                                        <div className="border border-blue-200/60 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl p-5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                            <p className="text-[11px] font-bold text-[#4285f4] dark:text-blue-400 tracking-wider mb-2 uppercase">Giá đã bao gồm VAT ({selectedVariant.vat_percent}%)</p>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-3xl font-black text-red-600 dark:text-red-500 tracking-tight">
                                                    {formatVND((actualPrice ?? selectedVariant.price) * (1 + selectedVariant.vat_percent / 100))}
                                                </span>
                                                {dp > 0 && (
                                                    <Badge className="bg-[#ffc107] hover:bg-[#e0a800] dark:bg-yellow-500/20 dark:text-yellow-500 dark:hover:bg-yellow-500/30 text-[#333] text-[13px] px-2.5 py-0.5 font-bold shadow-sm border-none translate-y-[-2px]">
                                                        -{dp}%
                                                    </Badge>
                                                )}
                                            </div>
                                            {dp > 0 && (
                                                <span className="text-base text-slate-400 dark:text-slate-1000 line-through font-medium mt-1 font-mono flex">
                                                    {formatVND(selectedVariant.price * (1 + selectedVariant.vat_percent / 100))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-500 tracking-tight">
                                                {formatVND(actualPrice ?? selectedVariant.price)}
                                            </span>
                                            {dp > 0 && (
                                                <Badge className="bg-[#ffc107] hover:bg-[#e0a800] dark:bg-yellow-500/20 dark:text-yellow-500 dark:hover:bg-yellow-500/30 text-[#333] text-[13px] px-2.5 py-0.5 font-bold shadow-sm border-none translate-y-[-4px]">
                                                    -{dp}%
                                                </Badge>
                                            )}
                                        </div>
                                        {dp > 0 && (
                                            <span className="text-lg text-slate-400 dark:text-slate-1000 line-through font-medium">
                                                {formatVND(selectedVariant.price)}
                                            </span>
                                        )}
                                    </div>
                                )
                            ) : priceRange ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-500 tracking-tight">
                                            {priceRange.min === priceRange.max
                                                ? formatVND(priceRange.min)
                                                : `${formatVND(priceRange.min)} - ${formatVND(priceRange.max)}`
                                            }
                                        </span>
                                        {dp > 0 && (
                                            <Badge className="bg-[#ffc107] hover:bg-[#e0a800] dark:bg-yellow-500/20 dark:text-yellow-500 dark:hover:bg-yellow-500/30 text-[#333] text-[13px] px-2.5 py-0.5 font-bold shadow-sm border-none">
                                                -{dp}%
                                            </Badge>
                                        )}
                                    </div>
                                    {dp > 0 && (
                                        <div className="text-base text-slate-400 dark:text-slate-1000 line-through font-medium mt-0.5">
                                            {priceRange.originalMin === priceRange.originalMax
                                                ? formatVND(priceRange.originalMin)
                                                : `${formatVND(priceRange.originalMin)} - ${formatVND(priceRange.originalMax)}`
                                            }
                                        </div>
                                    )}
                                    {priceRange.hasAnyDiscount && !dp && (
                                        <p className="text-xs text-orange-500 dark:text-orange-400 mt-1 font-medium">Có giảm giá theo phân loại</p>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Chọn phân loại để xem giá chính xác</p>
                                </div>
                            ) : (
                                <span className="text-xl font-bold text-slate-500 dark:text-slate-400">Liên hệ</span>
                            )}
                        </div>

                        {/* ====== VARIANT SELECTOR ====== */}
                        {Object.keys(attributeGroups).length > 0 && (
                            <div className="space-y-6 mb-8">
                                {Object.entries(attributeGroups).map(([attrKey, options]) => (
                                    <div key={attrKey}>
                                        <p className="text-sm font-bold text-industrial-black dark:text-slate-200 mb-3 tracking-wide">
                                            {attrKey}: <span className="text-electric-orange font-black ml-1">{selectedAttributes[attrKey] || "—"}</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {options.map(opt => {
                                                const isActive = selectedAttributes[attrKey] === opt;
                                                const testAttrs = { ...selectedAttributes, [attrKey]: opt };
                                                const isAvailable = variants.some(v =>
                                                    Object.entries(testAttrs).every(([k, val]) => v.attributes[k] === val)
                                                );

                                                return (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleSelectAttribute(attrKey, opt)}
                                                        className={cn(
                                                            "group relative px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-300 min-w-[76px] flex items-center gap-2",
                                                            isActive
                                                                ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-2 ring-orange-100 dark:ring-orange-500/20"
                                                                : isAvailable
                                                                    ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c212c] text-slate-700 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-500/50 hover:text-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-500/10"
                                                                    : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1c212c]/80 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-slate-700"
                                                        )}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-orange-500 rounded-full flex items-center justify-center text-white ring-2 ring-white dark:ring-[#0f1219] shadow-sm">
                                                                <Check className="h-2.5 w-2.5 stroke-[4px]" />
                                                            </div>
                                                        )}
                                                        {(() => {
                                                            if (options.length <= 1) return null;
                                                            const variantWithImage = variants.find(v => v.attributes[attrKey] === opt && v.image);
                                                            return variantWithImage?.image ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={variantWithImage.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0 border border-slate-200 dark:border-white/10" />
                                                            ) : null;
                                                        })()}
                                                        <span className={cn(
                                                            "relative z-10",
                                                            !isAvailable && !isActive && "text-slate-400 dark:text-slate-600 line-through decoration-slate-300/50 dark:decoration-slate-600/50"
                                                        )}>
                                                            {opt}
                                                        </span>
                                                        {!isAvailable && !isActive && (
                                                            <div className="absolute inset-0 bg-slate-50/40 dark:bg-slate-900/40 pointer-events-none rounded-xl" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ====== QUANTITY & STOCK ====== */}
                        <div className="flex items-center gap-6 mb-8 flex-wrap">
                            <div>
                                <p className="text-sm font-bold text-industrial-black dark:text-slate-200 mb-3 tracking-wide">Số lượng</p>
                                <div className="flex items-center bg-white dark:bg-[#1c212c] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="h-11 w-11 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-industrial-black dark:text-slate-300"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            const max = selectedVariant?.stock || 999;
                                            setQuantity(Math.min(Math.max(1, val), max));
                                        }}
                                        className="h-11 w-14 text-center font-bold text-base bg-transparent border-x border-gray-200 dark:border-white/10 outline-none text-industrial-black dark:text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        onClick={() => setQuantity(q => Math.min(selectedVariant?.stock || 999, q + 1))}
                                        className="h-11 w-11 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-industrial-black dark:text-slate-300"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            {selectedVariant && (
                                <p className={cn(
                                    "text-sm font-bold mt-8",
                                    selectedVariant.stock > 10
                                        ? "text-green-600 dark:text-green-500"
                                        : selectedVariant.stock > 0
                                            ? "text-orange-500 dark:text-orange-400"
                                            : "text-red-500 dark:text-red-400"
                                )}>
                                    {selectedVariant.stock > 0 ? `${selectedVariant.stock} sản phẩm có sẵn` : "Hết hàng"}
                                </p>
                            )}
                        </div>

                        {/* ====== ACTION BUTTONS ====== */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <Button
                                size="lg"
                                className="sm:flex-1 h-14 text-[15px] font-bold bg-electric-orange hover:bg-orange-600 text-white rounded-xl shadow-[0_8px_20px_rgba(249,115,22,0.25)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                disabled={!selectedVariant || selectedVariant.stock === 0}
                                onClick={() => {
                                    if (!selectedVariant || !product) return;
                                    addToCart({
                                        productId: product.id,
                                        variantId: selectedVariant.id,
                                        productName: product.name,
                                        thumbnail: product.thumbnail,
                                        attributes: selectedVariant.attributes,
                                        price: flashSale?.sale_price ?? ((actualPrice ?? selectedVariant.price) * (1 + (selectedVariant.vat_percent || 0) / 100)),
                                        quantity: quantity,
                                        stock: selectedVariant.stock
                                    });
                                    toast({ title: "✓ Đã thêm vào giỏ hàng!", description: `${product.name} x${quantity}${flashSale ? " (Giá Siêu Sale)" : ""}` });
                                }}
                            >
                                <ShoppingCart className="mr-2.5 h-5 w-5" /> Thêm vào giỏ hàng
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="sm:flex-1 h-14 text-[15px] font-bold border-2 border-electric-orange text-electric-orange hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                                disabled={!selectedVariant || selectedVariant.stock === 0}
                                onClick={() => {
                                    if (!selectedVariant || !product) return;
                                    addToCart({
                                        productId: product.id,
                                        variantId: selectedVariant.id,
                                        productName: product.name,
                                        thumbnail: product.thumbnail,
                                        attributes: selectedVariant.attributes,
                                        price: flashSale?.sale_price ?? ((actualPrice ?? selectedVariant.price) * (1 + (selectedVariant.vat_percent || 0) / 100)),
                                        quantity: quantity,
                                        stock: selectedVariant.stock
                                    });
                                    router.push("/checkout");
                                }}
                            >
                                <Zap className="mr-2.5 h-5 w-5" /> Mua ngay
                            </Button>
                        </div>

                        {/* ====== TRUST BADGES ====== */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-white/5">
                            {[
                                { icon: Shield, label: "Sản phẩm chính hãng", sub: "100% authentic", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                                { icon: Truck, label: "Giao hàng toàn quốc", sub: "Nhanh & tiết kiệm", color: "text-green-500 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" },
                                { icon: Phone, label: "Hỗ trợ tư vấn", sub: "093.400.14.35", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
                                { icon: Star, label: "Bảo hành đổi trả", sub: "Theo chính sách", color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className={`p-2.5 rounded-full ${item.bg}`}>
                                        <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-[13px] font-bold text-industrial-black dark:text-slate-200 leading-tight">{item.label}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ======= BOTTOM SECTIONS ======= */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Description & Custom Tabs */}
                    <div className="lg:col-span-8">
                        <div className="bg-white dark:bg-[#1c212c] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                            
                            {/* Horizontal Tabs Header */}
                            <div className="flex overflow-x-auto bg-[#F8F9FA] dark:bg-[#1c212c]/80 border-b border-gray-200 dark:border-white/5 custom-scrollbar hide-scrollbar-mobile">
                                <button
                                    onClick={() => setActiveTabId("description")}
                                    className={cn(
                                        "px-6 py-4 font-bold uppercase tracking-widest text-[13px] whitespace-nowrap transition-colors relative border-r border-gray-200 dark:border-white/5",
                                        activeTabId === "description" 
                                            ? "text-electric-orange bg-white dark:bg-[#1c212c]" 
                                            : "text-slate-500 hover:text-industrial-black dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                    )}
                                >
                                    Tổng quan sản phẩm
                                    {activeTabId === "description" && (
                                        <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-electric-orange z-10" />
                                    )}
                                </button>
                                
                                {product.custom_tabs?.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTabId(tab.id)}
                                        className={cn(
                                            "px-6 py-4 font-bold uppercase tracking-widest text-[13px] whitespace-nowrap transition-colors relative border-r border-gray-200 dark:border-white/5",
                                            activeTabId === tab.id 
                                                ? "text-electric-orange bg-white dark:bg-[#1c212c]" 
                                                : "text-slate-500 hover:text-industrial-black dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                        )}
                                    >
                                        {tab.name}
                                        {activeTabId === tab.id && (
                                            <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-electric-orange z-10" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="px-4 py-6 sm:px-6 md:py-8 min-h-[300px]">
                                
                                {/* Tab: Description */}
                                {activeTabId === "description" && (
                                    <div className="relative">
                                        {product.description ? (
                                            <>
                                                <div
                                                    ref={descRef}
                                                    className={cn(
                                                        "prose prose-slate dark:prose-invert max-w-none whitespace-pre-line text-[15px] leading-loose text-slate-700 dark:text-slate-300 transition-all duration-500 overflow-hidden relative text-justify [word-break:break-word] hyphens-none",
                                                        !isDescExpanded && showReadMore ? "max-h-[500px]" : "max-h-none"
                                                    )}
                                                >
                                                    {
                                                        product.description
                                                            .replace(/[\u00AD\u200B\u200C\u200D\u2060\uFEFF]/g, '') // Xoá ký tự ngắt dòng ẩn (phòng chép từ PDF/Word)
                                                            .replace(/\r\n/g, '\n')
                                                            .replace(/\n\n+/g, '____DOUBLE_NEWLINE____')
                                                            .replace(/\n\s*(?=[-+*•]\s|\d+\.\s)/g, '____BULLET_NEWLINE____')
                                                            .replace(/\n/g, ' ')
                                                            .replace(/\s+([.,;:!?])/g, '$1') // Xoá khoảng trắng dư trước dấu câu
                                                            .replace(/____DOUBLE_NEWLINE____/g, '\n\n')
                                                            .replace(/____BULLET_NEWLINE____/g, '\n')
                                                    }
                                                </div>

                                                {showReadMore && (
                                                    <div className={cn(
                                                        "flex justify-center mt-4 pt-10 relative",
                                                        !isDescExpanded && "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#1c212c] dark:via-[#1c212c]/80 dark:to-transparent z-10"
                                                    )}>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setIsDescExpanded(!isDescExpanded)}
                                                            className="border-electric-orange text-electric-orange hover:bg-orange-50 dark:hover:bg-orange-500/10 font-bold px-8 shadow-sm"
                                                        >
                                                            {isDescExpanded ? (
                                                                <>Thu gọn <ArrowUp className="ml-2 h-4 w-4" /></>
                                                            ) : (
                                                                <>Xem thêm <ArrowDown className="ml-2 h-4 w-4" /></>
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">Chưa có mô tả chi tiết cho sản phẩm này.</p>
                                        )}
                                    </div>
                                )}

                                {/* Tab: Custom */}
                                {product.custom_tabs?.map(tab => (
                                    <div key={tab.id} className={cn(activeTabId === tab.id ? "block" : "hidden")}>
                                        {tab.sections && tab.sections.length > 0 ? (
                                            <div className="space-y-4">
                                                {tab.sections.map((section) => {
                                                    const isExpanded = expandedSections[section.id] ?? true; // Default to expanded
                                                    return (
                                                        <div key={section.id} className="border border-gray-200 dark:border-white/10 rounded-[12px] bg-white dark:bg-[#12141c]/50">
                                                            <button
                                                                onClick={() => toggleSection(section.id)}
                                                                className="w-full flex items-center justify-between px-6 py-5 bg-white dark:bg-[#1c212c] hover:bg-slate-50 dark:hover:bg-[#12141c] transition-colors rounded-t-[12px]"
                                                            >
                                                                <span className="font-bold text-[17px] text-industrial-black dark:text-slate-200">{section.name}</span>
                                                                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#f1f3f5] dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                    <ArrowDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")} />
                                                                </div>
                                                            </button>
                                                            
                                                            <div className={cn(
                                                                "overflow-hidden transition-all duration-300",
                                                                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                                            )}>
                                                                <div className="px-6 pb-6 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1c212c]">
                                                                    {section.links && section.links.length > 0 ? (
                                                                        section.links.map(link => (
                                                                            <a
                                                                                key={link.id}
                                                                                href={link.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-[12px] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c212c] hover:border-orange-400 hover:bg-orange-50/50 dark:hover:border-orange-500/50 hover:shadow-sm transition-all group"
                                                                            >
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="h-10 w-10 flex items-center justify-center flex-shrink-0 relative">
                                                                                        <div className="absolute inset-0 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#FFF3EC] dark:group-hover:bg-orange-500/10 transition-colors" />
                                                                                        <Layers className="h-[18px] w-[18px] text-slate-500 dark:text-slate-400 group-hover:text-electric-orange relative z-10 transition-colors" />
                                                                                    </div>
                                                                                    <span className="text-[15px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-electric-orange transition-colors line-clamp-2 leading-snug">
                                                                                        {link.name}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full group-hover:bg-electric-orange group-hover:text-white transition-all whitespace-nowrap">
                                                                                    Mở liên kết <ExternalLink className="h-3.5 w-3.5" />
                                                                                </div>
                                                                            </a>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-sm text-slate-500 dark:text-slate-400 italic col-span-full">Chưa có liên kết nào trong nhóm này.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">Chưa có nội dung cho tab này.</p>
                                        )}
                                    </div>
                                ))}

                            </div>
                        </div>

                        {/* Variants Table */}
                        {variants.length > 0 && (
                            <div className="bg-white dark:bg-[#1c212c] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden mt-8 shadow-sm">
                                <div className="bg-slate-50 dark:bg-[#1c212c]/80 text-industrial-black dark:text-slate-200 px-6 py-4 font-black uppercase tracking-widest text-sm border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
                                    <Layers className="h-4 w-4" /> Tất cả phân loại ({variants.length})
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white dark:bg-[#1c212c] border-b border-gray-200 dark:border-white/5">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Phân loại</th>
                                                <th className="px-6 py-4 text-left font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">SKU</th>
                                                <th className="px-6 py-4 text-right font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Giá bán</th>
                                                <th className="px-6 py-4 text-right font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Tồn kho</th>
                                                <th className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                            {variants.map(v => {
                                                const vdp = v.discount_percent || 0;
                                                return (
                                                    <tr
                                                        key={v.id}
                                                        className={cn(
                                                            "transition-colors cursor-pointer group",
                                                            selectedVariant?.id === v.id
                                                                ? "bg-orange-50/50 dark:bg-orange-500/10"
                                                                : "hover:bg-slate-50 dark:hover:bg-[#2a3040] bg-white dark:bg-[#1c212c]"
                                                        )}
                                                        onClick={() => setSelectedAttributes(v.attributes)}
                                                    >
                                                        <td className="px-6 py-4 font-medium">
                                                            {Object.entries(v.attributes).map(([k, val]) => (
                                                                <span key={k} className="inline-block bg-slate-100 dark:bg-slate-800 text-industrial-black dark:text-slate-300 text-[11px] px-2.5 py-1 rounded-md mr-1.5 mb-1.5 font-semibold tracking-wide border border-transparent dark:border-white/5">
                                                                    {k}: {val}
                                                                </span>
                                                            ))}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{v.sku || "—"}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-black text-red-600 dark:text-red-500">
                                                                    {formatVND(vdp > 0 ? v.price * (1 - vdp / 100) : v.price)}
                                                                </span>
                                                                {vdp > 0 && (
                                                                    <span className="text-[11px] text-slate-400 dark:text-slate-1000 line-through font-mono mt-0.5">
                                                                        {formatVND(v.price)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-industrial-black dark:text-slate-300">{v.stock}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={cn(
                                                                "text-[10px] uppercase font-black px-2.5 py-1 rounded-full tracking-wider shadow-sm",
                                                                v.stock > 10
                                                                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20"
                                                                    : v.stock > 0
                                                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20"
                                                                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                                                            )}>
                                                                {v.stock > 10 ? "Còn hàng" : v.stock > 0 ? "Sắp hết" : "Hết hàng"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                        {/* Contact CTA */}
                        <div className="bg-white dark:bg-[#1c212c] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none transition-all duration-500 group-hover:bg-orange-500/20" />
                            <h3 className="font-black text-industrial-black dark:text-slate-200 mb-3 text-sm uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-electric-orange animate-pulse" />
                                Cần tư vấn?
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Liên hệ hotline để được hỗ trợ nhanh nhất và nhận ưu đãi độc quyền.</p>
                            <a
                                href="tel:0934001435"
                                className="flex items-center gap-4 bg-electric-orange text-white rounded-xl px-4 py-3.5 font-bold hover:bg-orange-600 transition-all duration-300 shadow-[0_8px_20px_rgba(249,115,22,0.2)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.3)] hover:-translate-y-0.5"
                            >
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xl tracking-tight">093.400.14.35</p>
                                    <p className="text-xs font-medium opacity-90 mt-0.5">9:00 - 17:30, Thứ 2 - Thứ 7</p>
                                </div>
                            </a>
                        </div>

                        {/* Product Info */}
                        <div className="bg-white dark:bg-[#1c212c] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-black text-industrial-black dark:text-slate-200 mb-5 text-sm uppercase tracking-widest">Thông số cơ bản</h3>
                            <dl className="space-y-4 text-[13px] md:text-sm">
                                <div className="flex justify-between items-center">
                                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Thương hiệu</dt>
                                    <dd className="font-bold text-industrial-black dark:text-slate-200 text-right">{product.brand}</dd>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-4">
                                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Xuất xứ</dt>
                                    <dd className="font-bold text-industrial-black dark:text-slate-200 text-right">{product.origin}</dd>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-4">
                                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Bộ sưu tập</dt>
                                    <dd className="font-bold text-industrial-black dark:text-slate-200 text-right">{variants.length} phân loại</dd>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-4">
                                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Bảo hành</dt>
                                    <dd className="font-bold text-industrial-black dark:text-slate-200 text-right">{product?.warranty_months} tháng</dd>
                                </div>
                                {selectedVariant?.sku && (
                                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-4">
                                        <dt className="text-slate-500 dark:text-slate-400 font-medium">Mã SKU</dt>
                                        <dd className="font-bold text-industrial-black dark:text-slate-200 font-mono text-right">{selectedVariant.sku}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
                {/* ======= RELATED PRODUCTS ======= */}
                <RelatedProducts
                    currentProductId={product.id}
                    brand={product.brand}
                    origin={product.origin}
                />
            </div>

        </DefaultLayout >
    );
}
