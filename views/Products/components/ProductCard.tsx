"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, Eye } from "lucide-react";

function formatVND(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export interface ProductCardData {
    id: string;
    slug: string;
    name: string;
    brand: string;
    origin: string;
    thumbnail: string;
    category_name?: string | null;
    min_price: number;
    max_price: number;
    total_stock: number;
    variant_count: number;
    discount_percent?: number | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
    const isOutOfStock = product.total_stock === 0;
    const hasMultiplePrices = product.min_price !== product.max_price;
    const dp = product.discount_percent || 0;

    // min_price / max_price are already discounted from upstream
    const minPrice = product.min_price;
    const maxPrice = product.max_price;

    return (
        <article
            className="group relative bg-white dark:bg-slate-900 rounded-xl sm:rounded-[16px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-300 overflow-hidden flex flex-col h-full"
            itemScope
            itemType="https://schema.org/Product"
        >
            <meta itemProp="productID" content={product.id} />

            <Link
                href={`/${product.slug}`}
                className="absolute inset-0 z-10"
                aria-label={`Xem chi tiết sản phẩm ${product.name}`}
                itemProp="url"
            >
                <span className="sr-only">Chi tiết {product.name}</span>
            </Link>

            {/* Image Container */}
            <div className="relative aspect-square w-full bg-transparent p-3 sm:p-4 pb-0 sm:pb-0 overflow-visible flex items-center justify-center isolate border-none">
                {product.thumbnail ? (
                    <div className="relative w-full h-[180px] sm:h-[220px] rounded-[8px] overflow-hidden bg-transparent">
                        <Image
                            itemProp="image"
                            src={product.thumbnail}
                            alt={product.name}
                            fill
                            className="object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500 will-change-transform z-0"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 z-10 flex items-end justify-center pb-2 sm:pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 dark:group-hover:bg-black/20 transition-colors duration-300" />
                            <span className="relative z-20 bg-white/95 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[12px] sm:text-[13px] font-semibold px-4 py-1.5 sm:py-2 rounded-full shadow-md flex items-center gap-1.5 sm:gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm border-none">
                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-300" />
                                Xem chi tiết
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-[180px] sm:h-[220px] rounded-[8px] flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/50">
                        <Package className="h-10 w-10 sm:h-14 sm:w-14 stroke-1" />
                    </div>
                )}

                {/* Status Badges - Top left */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-col gap-1.5 items-start pointer-events-none">
                    {dp > 0 && !isOutOfStock && (
                        <span className="bg-[#ff424e] text-white text-[11px] sm:text-[12px] font-bold px-2 py-0.5 rounded shadow-sm leading-none">
                            -{dp}%
                        </span>
                    )}
                </div>

                {/* Meta Badges - Top right */}
                {product.category_name && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 pointer-events-none">
                        <span className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded shadow-sm truncate max-w-[100px] block leading-none" itemProp="category">
                            {product.category_name}
                        </span>
                    </div>
                )}


            </div>

            {/* Content Area */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white dark:bg-slate-900 relative z-20 pt-2 sm:pt-3">
                <header className="mb-2">
                    {/* Brand */}
                    <div className="mb-1.5" itemProp="brand" itemScope itemType="https://schema.org/Brand">
                        <span className="text-[12px] sm:text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate block" itemProp="name">
                            {product.brand || "KHÁC"}
                        </span>
                    </div>

                    {/* Title */}
                    <h3
                        className="text-[14px] sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-[1.4] line-clamp-2 h-[40px] sm:h-[42px] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors"
                        title={product.name}
                        itemProp="name"
                    >
                        {product.name}
                    </h3>
                </header>

                {/* Metadata Row: Variant Count & Stock Status */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Package className="w-4 h-4 stroke-[1.5]" />
                        <span className="text-[12px] sm:text-[13px] font-medium">{product.variant_count} phiên bản</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {!isOutOfStock ? (
                            product.total_stock <= 5 ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    <span className="text-[12px] sm:text-[13px] font-bold text-orange-500">Sắp hết</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[12px] sm:text-[13px] font-bold text-emerald-500">Sẵn hàng</span>
                                </>
                            )
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                <span className="text-[12px] sm:text-[13px] font-bold text-slate-400">Hết hàng</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Filler */}
                <div className="flex-1"></div>

                {/* Pricing Block */}
                <footer
                    className="mt-2 bg-[#f8f9fa] dark:bg-slate-800/40 rounded-[8px] p-2.5 sm:p-3 border-none flex items-center"
                    itemProp="offers"
                    itemScope
                    itemType="https://schema.org/AggregateOffer"
                >
                    <meta itemProp="lowPrice" content={minPrice.toString()} />
                    <meta itemProp="highPrice" content={maxPrice.toString()} />
                    <meta itemProp="priceCurrency" content="VND" />
                    <meta itemProp="offerCount" content={product.variant_count.toString()} />

                    {isOutOfStock ? (
                        <div className="text-[14px] sm:text-[15px] font-bold text-slate-500 dark:text-slate-400">
                            Đang cập nhật
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-1.5 flex-wrap w-full">
                            <span className="text-[15px] sm:text-[16px] font-bold text-red-600 dark:text-red-500 tracking-tight leading-none whitespace-nowrap">
                                {formatVND(minPrice)}
                            </span>
                            {hasMultiplePrices && (
                                <>
                                    <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500 mx-0.5">~</span>
                                    <span className="text-[13px] sm:text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-none whitespace-nowrap">
                                        {formatVND(maxPrice)}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </footer>
            </div>
        </article>
    );
}
