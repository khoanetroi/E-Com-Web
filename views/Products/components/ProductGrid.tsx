"use client";

import { ProductCard, ProductCardData } from "./ProductCard";
import { Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProductGridProps {
    products: ProductCardData[];
    loading: boolean;
    totalCount: number;
}

export function ProductGrid({ products, loading, totalCount }: ProductGridProps) {
    if (loading) {
        return (
            <div>
                <div className="mb-4">
                    <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Package className="h-9 w-9 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-white mb-1.5">
                    Không tìm thấy sản phẩm
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
                    Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
                </p>
                <Button asChild variant="outline" size="sm">
                    <Link href="/products">Xem tất cả sản phẩm</Link>
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-200">{products.length}</span>
                    {" "}/ <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span> sản phẩm
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}

function ProductCardSkeleton() {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 overflow-hidden">
            <div className="aspect-square bg-slate-100 dark:bg-slate-900 animate-pulse" />
            <div className="p-3.5 space-y-2.5">
                <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
            </div>
        </div>
    );
}
