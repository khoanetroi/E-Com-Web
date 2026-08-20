"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Folders,
  Layers,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  Ticket,
  X,
  Zap,
} from "lucide-react";

export interface DefectCategoryStat {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  ticketCount: number;
  productCount: number;
  severities: {
    high: number;
    medium: number;
    low: number;
    unspecified: number;
  };
  resolvedCount: number;
  unresolvedCount: number;
  topDefectProducts: Array<{
    productName: string;
    ticketCount: number;
  }>;
}

export interface DefectProductStat {
  rank: number;
  productName: string;
  productId?: string | null;
  productSlug?: string | null;
  thumbnail?: string | null;
  brand?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  ticketCount: number;
  severities: {
    high: number;
    medium: number;
    low: number;
    unspecified: number;
  };
  statuses: {
    new: number;
    received: number;
    analyzing: number;
    processing: number;
    resolved: number;
    closed: number;
  };
  resolvedCount: number;
  unresolvedCount: number;
  recentTickets: Array<{
    id: string;
    customer_phone: string;
    customer_name?: string | null;
    issue_description: string;
    ai_severity?: "low" | "medium" | "high" | null;
    ai_diagnosis?: string | null;
    status: string;
    created_at: string;
  }>;
}

interface DefectRateAnalyticsProps {
  onSelectProductForTickets?: (productName: string) => void;
  onClose?: () => void;
}

export default function DefectRateAnalytics({
  onSelectProductForTickets,
  onClose,
}: DefectRateAnalyticsProps) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<DefectCategoryStat[]>([]);
  const [ranking, setRanking] = useState<DefectProductStat[]>([]);
  const [summary, setSummary] = useState<{
    totalTickets: number;
    unresolvedTickets: number;
    resolvedTickets: number;
    highSeverityTickets: number;
  }>({
    totalTickets: 0,
    unresolvedTickets: 0,
    resolvedTickets: 0,
    highSeverityTickets: 0,
  });

  // Controls
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewTab, setViewTab] = useState<"column_chart" | "table">("column_chart");
  const [hoveredProductIndex, setHoveredProductIndex] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DefectProductStat | null>(null);

  const calculateAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch tickets, categories, products, and mappings
      const [ticketsRes, categoriesRes, productsRes, mappingRes] = await Promise.all([
        supabase.from("warranty_tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, slug, parent_id"),
        supabase.from("products").select("id, name, thumbnail, brand, slug, category_id"),
        supabase.from("product_categories_mapping").select("product_id, category_id, categories(id, name, slug)"),
      ]);

      let allTickets = ticketsRes.data || [];
      const allCategories = categoriesRes.data || [];
      const allProducts = productsRes.data || [];
      const allMappings = mappingRes.data || [];

      // Filter tickets by selected time range
      if (timeRange !== "all") {
        const now = Date.now();
        allTickets = allTickets.filter((ticket) => {
          if (!ticket.created_at) return true;
          const ticketTime = new Date(ticket.created_at).getTime();
          const diffDays = (now - ticketTime) / (1000 * 60 * 60 * 24);
          if (timeRange === "7days") return diffDays <= 7;
          if (timeRange === "30days") return diffDays <= 30;
          return true;
        });
      }

      // Map Categories lookup
      const categoryById: Record<string, { id: string; name: string; slug: string }> = {};
      allCategories.forEach((c) => {
        categoryById[c.id] = c;
      });

      // Product category direct mapping
      const productCategoryMap: Record<string, { id: string; name: string; slug: string }> = {};
      (allMappings as Array<{
        product_id: string;
        category_id: string;
        categories?: { id: string; name: string; slug: string } | Array<{ id: string; name: string; slug: string }> | null;
      }>).forEach((m) => {
        const cat = Array.isArray(m.categories) ? m.categories[0] : m.categories;
        if (cat && cat.name) {
          const isLikenew = cat.name.toLowerCase().includes("likenew") || cat.name.toLowerCase().includes("qua sử dụng");
          if (!productCategoryMap[m.product_id] || (!isLikenew && productCategoryMap[m.product_id].name.toLowerCase().includes("likenew"))) {
            productCategoryMap[m.product_id] = cat;
          }
        } else if (m.category_id && categoryById[m.category_id]) {
          if (!productCategoryMap[m.product_id]) {
            productCategoryMap[m.product_id] = categoryById[m.category_id];
          }
        }
      });

      // Canonical Category Inferrer to ensure subcategories like "Đồng Hồ Kim", "Đồng Hồ Điện Tử", "Phụ kiện vạn năng" map to "Đồng Hồ Đo Vạn Năng"
      const getCanonicalCategory = (
        rawCatName?: string | null,
        productName?: string | null
      ): { id: string; name: string; slug: string } => {
        const text = `${rawCatName || ""} ${productName || ""}`.toLowerCase();

        // 1. Đồng Hồ Đo Vạn Năng (Kim, Điện tử, Cầu chì & phụ kiện đồng hồ vạn năng)
        if (
          text.includes("vạn năng") ||
          text.includes("đồng hồ kim") ||
          text.includes("đồng hồ điện tử") ||
          text.includes("sh-83tr") ||
          text.includes("cd800") ||
          text.includes("multimeter") ||
          text.includes("vom") ||
          text.includes("cầu chì fluke")
        ) {
          const found = allCategories.find((c) => c.name.toLowerCase().includes("vạn năng"));
          return (
            found || {
              id: "cat-van-nang",
              name: "Đồng Hồ Đo Vạn Năng",
              slug: "dong-ho-do-van-nang",
            }
          );
        }

        // 2. Ampe Kìm
        if (
          text.includes("ampe") ||
          text.includes("clamp") ||
          text.includes("dcm") ||
          text.includes("dòng rò") ||
          text.includes("dòng ac") ||
          text.includes("dòng dc")
        ) {
          const found = allCategories.find((c) => c.name.toLowerCase().includes("ampe"));
          return (
            found || {
              id: "cat-ampe-kim",
              name: "Ampe Kìm",
              slug: "ampe-kim",
            }
          );
        }

        // 3. Thiết bị đo nhiệt độ
        if (
          text.includes("nhiệt") ||
          text.includes("thermal") ||
          text.includes("nhiệt kế") ||
          text.includes("tfa")
        ) {
          const exactFound = allCategories.find((c) => c.name.toLowerCase() === "thiết bị đo nhiệt độ");
          return (
            exactFound || {
              id: "cat-nhiet-do",
              name: "Thiết bị đo nhiệt độ",
              slug: "thiet-bi-do-nhiet-do",
            }
          );
        }

        // 4. Máy hiện sóng
        if (text.includes("hiện sóng") || text.includes("oscilloscope")) {
          const found = allCategories.find((c) => c.name.toLowerCase().includes("hiện sóng"));
          return (
            found || {
              id: "cat-oscillo",
              name: "Máy hiện sóng",
              slug: "may-hien-song",
            }
          );
        }

        // 5. Đo điện trở cách điện
        if (text.includes("cách điện") || text.includes("megohm")) {
          const found = allCategories.find((c) => c.name.toLowerCase().includes("cách điện"));
          return (
            found || {
              id: "cat-insulation",
              name: "Đo điện trở cách điện",
              slug: "do-dien-tro-cach-dien",
            }
          );
        }

        // 6. Thiết bị đo chuyên dụng khác (Laser, Nội soi Bosch, dụng cụ chuyên sâu)
        const specFound = allCategories.find(
          (c) =>
            c.name.toLowerCase().includes("chuyên dụng") ||
            c.name.toLowerCase().includes("khác")
        );
        return (
          specFound || {
            id: "cat-chuyen-dung",
            name: "Thiết bị đo chuyên dụng",
            slug: "thiet-bi-chuyen-dung",
          }
        );
      };

      // Helper to find matching catalog product by name, substring or model token
      const findMatchingCatalogProduct = (ticketProductName: string) => {
        const raw = (ticketProductName || "").trim().toLowerCase();
        if (!raw) return null;

        // Exact match
        const exact = allProducts.find((p) => p.name.toLowerCase() === raw);
        if (exact) return exact;

        // Full inclusion match
        const included = allProducts.find(
          (p) => p.name.toLowerCase().includes(raw) || raw.includes(p.name.toLowerCase())
        );
        if (included) return included;

        // Token match
        const stopWords = new Set(["đồng", "hồ", "vạn", "năng", "máy", "thiết", "bị", "kim", "đo", "dụng", "cụ", "chính", "hãng", "cao", "cấp"]);
        const tokens = raw
          .replace(/[–—\-_,()]/g, " ")
          .split(/\s+/)
          .filter((t) => t.length >= 3 && !stopWords.has(t));

        for (const token of tokens) {
          const candidates = allProducts.filter((p) => p.name.toLowerCase().includes(token));
          if (candidates.length === 1) return candidates[0];
          if (candidates.length > 1) {
            const brandMatch = candidates.find((c) => c.brand && raw.includes(c.brand.toLowerCase()));
            if (brandMatch) return brandMatch;
            return candidates[0];
          }
        }
        return null;
      };

      // Map product metadata from catalog
      const productMetaById: Record<
        string,
        {
          id?: string;
          name: string;
          thumbnail?: string | null;
          brand?: string | null;
          slug?: string | null;
          category?: { id: string; name: string; slug: string };
        }
      > = {};

      allProducts.forEach((p) => {
        if (p.name) {
          let mappedCat = p.id ? productCategoryMap[p.id] : undefined;
          if (!mappedCat && p.category_id && categoryById[p.category_id]) {
            mappedCat = categoryById[p.category_id];
          }
          const canonCat = getCanonicalCategory(mappedCat?.name, p.name);
          productMetaById[p.id] = {
            ...p,
            category: canonCat,
          };
        }
      });

      // Group tickets by unified product
      type RawTicket = {
        id: string;
        product_name?: string | null;
        customer_phone: string;
        customer_name?: string | null;
        issue_description: string;
        ai_severity?: "low" | "medium" | "high" | null;
        ai_diagnosis?: string | null;
        status: string;
        created_at: string;
      };

      const ticketGroupMap: Record<
        string,
        {
          displayName: string;
          productId?: string | null;
          tickets: RawTicket[];
          severities: { high: number; medium: number; low: number; unspecified: number };
          statuses: { new: number; received: number; analyzing: number; processing: number; resolved: number; closed: number };
        }
      > = {};

      let totalHighSeverity = 0;
      let totalResolved = 0;
      let totalUnresolved = 0;

      allTickets.forEach((ticket) => {
        const rawName = (ticket.product_name || "Sản phẩm khác").trim();
        const matchedProduct = findMatchingCatalogProduct(rawName);

        // Group key is product ID if found in catalog, or normalized text
        const groupKey = matchedProduct ? matchedProduct.id : rawName.toLowerCase();
        const displayName = matchedProduct ? matchedProduct.name : rawName;

        if (!ticketGroupMap[groupKey]) {
          ticketGroupMap[groupKey] = {
            displayName,
            productId: matchedProduct?.id || null,
            tickets: [],
            severities: { high: 0, medium: 0, low: 0, unspecified: 0 },
            statuses: { new: 0, received: 0, analyzing: 0, processing: 0, resolved: 0, closed: 0 },
          };
        }

        const group = ticketGroupMap[groupKey];
        group.tickets.push(ticket);

        const sev = ticket.ai_severity as "low" | "medium" | "high" | null;
        if (sev === "high") {
          group.severities.high += 1;
          totalHighSeverity += 1;
        } else if (sev === "medium") {
          group.severities.medium += 1;
        } else if (sev === "low") {
          group.severities.low += 1;
        } else {
          group.severities.unspecified += 1;
        }

        const st = ticket.status as string;
        if (st === "resolved" || st === "closed") {
          group.statuses.resolved += 1;
          totalResolved += 1;
        } else {
          group.statuses.new += 1;
          totalUnresolved += 1;
        }
      });

      // Build product list
      const productStatsList: DefectProductStat[] = [];
      const categoryGroupMap: Record<
        string,
        {
          categoryId: string;
          categoryName: string;
          categorySlug: string;
          ticketCount: number;
          productCount: number;
          severities: { high: number; medium: number; low: number; unspecified: number };
          resolvedCount: number;
          unresolvedCount: number;
          products: DefectProductStat[];
        }
      > = {};

      Object.keys(ticketGroupMap).forEach((groupKey) => {
        const ticketGroup = ticketGroupMap[groupKey];
        const tickets = ticketGroup.tickets;
        const ticketCount = tickets.length;
        if (ticketCount === 0) return;

        const meta = ticketGroup.productId ? productMetaById[ticketGroup.productId] : undefined;
        const displayName = meta?.name || ticketGroup.displayName;
        const category = meta?.category || getCanonicalCategory("", displayName);

        const resolvedCount = ticketGroup.statuses.resolved + ticketGroup.statuses.closed;
        const unresolvedCount = ticketCount - resolvedCount;

        const recentTickets = tickets.slice(0, 5).map((t) => ({
          id: t.id,
          customer_phone: t.customer_phone,
          customer_name: t.customer_name,
          issue_description: t.issue_description,
          ai_severity: t.ai_severity,
          ai_diagnosis: t.ai_diagnosis,
          status: t.status,
          created_at: t.created_at,
        }));

        const productStat: DefectProductStat = {
          rank: 0,
          productName: displayName,
          productId: meta?.id || null,
          productSlug: meta?.slug || null,
          thumbnail: meta?.thumbnail || null,
          brand: meta?.brand || null,
          categoryId: category?.id || null,
          categoryName: category?.name || null,
          categorySlug: category?.slug || null,
          ticketCount,
          severities: ticketGroup.severities,
          statuses: ticketGroup.statuses,
          resolvedCount,
          unresolvedCount,
          recentTickets,
        };

        productStatsList.push(productStat);

        // Category aggregation
        const catKey = category.slug || category.id || "other";
        if (!categoryGroupMap[catKey]) {
          categoryGroupMap[catKey] = {
            categoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug,
            ticketCount: 0,
            productCount: 0,
            severities: { high: 0, medium: 0, low: 0, unspecified: 0 },
            resolvedCount: 0,
            unresolvedCount: 0,
            products: [],
          };
        }

        const catGroup = categoryGroupMap[catKey];
        catGroup.ticketCount += ticketCount;
        catGroup.productCount += 1;
        catGroup.severities.high += productStat.severities.high;
        catGroup.severities.medium += productStat.severities.medium;
        catGroup.severities.low += productStat.severities.low;
        catGroup.resolvedCount += resolvedCount;
        catGroup.unresolvedCount += unresolvedCount;
        catGroup.products.push(productStat);
      });

      // Build categories list sorted by ticketCount
      const categoryStatsList: DefectCategoryStat[] = Object.values(categoryGroupMap).map((cat) => {
        const sortedProducts = [...cat.products].sort((a, b) => b.ticketCount - a.ticketCount);
        const topDefectProducts = sortedProducts.slice(0, 3).map((p) => ({
          productName: p.productName,
          ticketCount: p.ticketCount,
        }));

        return {
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          categorySlug: cat.categorySlug,
          ticketCount: cat.ticketCount,
          productCount: cat.productCount,
          severities: cat.severities,
          resolvedCount: cat.resolvedCount,
          unresolvedCount: cat.unresolvedCount,
          topDefectProducts,
        };
      });

      categoryStatsList.sort((a, b) => b.ticketCount - a.ticketCount);

      // Sort products by ticketCount descending
      productStatsList.sort((a, b) => b.ticketCount - a.ticketCount);
      productStatsList.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      setCategories(categoryStatsList);
      setRanking(productStatsList);
      setSummary({
        totalTickets: allTickets.length,
        unresolvedTickets: totalUnresolved,
        resolvedTickets: totalResolved,
        highSeverityTickets: totalHighSeverity,
      });
    } catch (err) {
      console.error("Defect analytics error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, timeRange]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  // Filter products by selected category and search query
  const filteredProducts = useMemo(() => {
    let list = ranking;
    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter(
        (p) =>
          p.categorySlug === selectedCategory ||
          p.categoryId === selectedCategory ||
          p.categoryName?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [ranking, selectedCategory, searchQuery]);

  // Products to display in column chart (top 8)
  const chartProducts = useMemo(() => {
    return filteredProducts.slice(0, 8);
  }, [filteredProducts]);

  const maxTicketCount = useMemo(() => {
    if (chartProducts.length === 0) return 5;
    const maxVal = Math.max(...chartProducts.map((p) => p.ticketCount), 0);
    return maxVal > 0 ? Math.ceil(maxVal * 1.15) : 5;
  }, [chartProducts]);

  const getRankMedal = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 font-extrabold flex items-center justify-center shadow text-[11px] border border-yellow-200">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-800 font-extrabold flex items-center justify-center shadow text-[11px] border border-slate-300">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-extrabold flex items-center justify-center shadow text-[11px] border border-amber-600">
          🥉
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] border border-slate-200 dark:border-slate-700">
        #{rank}
      </div>
    );
  };

  const getTimeLabel = () => {
    if (timeRange === "7days") return "7 ngày qua";
    if (timeRange === "30days") return "30 ngày qua";
    return "Toàn bộ thời gian";
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-semibold mb-1.5">
            <Flame size={13} className="text-rose-500" />
            Thống kê lỗi theo Danh mục
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Top sản phẩm có nhiều Ticket lỗi nhất
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Thống kê số lượng ticket bảo hành và chẩn đoán AI ({getTimeLabel()})
          </p>
        </div>

        {/* Controls: Time Filter, View Switcher, Refresh & Close */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Time Filter Buttons */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/60 dark:border-white/5 text-xs font-medium">
            {(
              [
                { key: "7days", label: "7 ngày" },
                { key: "30days", label: "30 ngày" },
                { key: "all", label: "Tất cả" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeRange(t.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === t.key
                    ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-semibold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/60 dark:border-white/5 text-xs font-medium">
            <button
              onClick={() => setViewTab("column_chart")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewTab === "column_chart"
                  ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-semibold shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <BarChart3 size={13} />
              Biểu đồ
            </button>
            <button
              onClick={() => setViewTab("table")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewTab === "table"
                  ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-semibold shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Award size={13} />
              Bảng xếp hạng
            </button>
          </div>

          <button
            onClick={calculateAnalytics}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all ml-1"
              title="Đóng bảng chi tiết"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* QUICK KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Tổng ticket lỗi</span>
            <Ticket size={14} className="text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            {loading ? "..." : `${summary.totalTickets} ticket`}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {getTimeLabel()}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Chưa xử lý</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            {loading ? "..." : `${summary.unresolvedTickets} ticket`}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
            ✓ Đã xử lý {summary.resolvedTickets} ticket
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Danh mục nhiều lỗi nhất</span>
            <Layers size={14} className="text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
            {loading ? "..." : categories[0]?.categoryName || "Chưa có"}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
            {categories[0] ? `${categories[0].ticketCount} ticket lỗi` : "—"}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Top #1 Sản phẩm lỗi</span>
            <Zap size={14} className="text-rose-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
            {loading ? "..." : ranking[0]?.productName || "Chưa có"}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
            {ranking[0] ? `${ranking[0].ticketCount} ticket lỗi` : "—"}
          </p>
        </div>
      </div>

      {/* CATEGORY FILTER CHIPS */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Folders size={13} className="text-rose-500" />
            Lọc theo danh mục:
          </span>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              Xem tất cả danh mục <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === "all"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-white/5"
            }`}
          >
            <span>Tất cả danh mục</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              }`}
            >
              {summary.totalTickets}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.categorySlug || selectedCategory === cat.categoryId;

            return (
              <button
                key={cat.categorySlug || cat.categoryId}
                onClick={() => setSelectedCategory(isSelected ? "all" : cat.categorySlug || cat.categoryId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5 hover:border-rose-500/40 hover:bg-slate-50"
                }`}
              >
                <span>{cat.categoryName}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300"
                  }`}
                >
                  {cat.ticketCount} ticket
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên sản phẩm, danh mục, hãng..."
          className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* MAIN VIEW CONTENT */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 size={22} className="animate-spin text-rose-500" />
          <p className="text-xs font-medium">Đang tải số liệu ticket lỗi...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-1.5">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500 opacity-60" />
          <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
            {searchQuery ? "Không tìm thấy sản phẩm lỗi phù hợp với từ khóa." : `Chưa có ticket lỗi nào trong khoảng thời gian (${getTimeLabel()}).`}
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: VERTICAL COLUMN CHART FOR DEFECT TICKETS */}
          {viewTab === "column_chart" && (
            <div className="space-y-4">
              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs sm:text-sm">
                    <BarChart3 size={15} className="text-rose-500" />
                    Biểu đồ Top sản phẩm lỗi {selectedCategory !== "all" ? `(Danh mục: ${categories.find(c => c.categorySlug === selectedCategory || c.categoryId === selectedCategory)?.categoryName || selectedCategory})` : ""}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Thời gian: <span className="text-slate-700 dark:text-slate-200 font-semibold">{getTimeLabel()}</span> • Nhấp vào cột để xem chi tiết lịch sử lỗi.
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} className="text-rose-500" />
                  <span>Tổng {filteredProducts.reduce((sum, p) => sum + p.ticketCount, 0)} ticket</span>
                </div>
              </div>

              {/* COLUMN CHART CONTAINER */}
              <div className="relative bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-white/5 p-4 sm:p-6">
                {/* Background Grid Lines */}
                <div className="absolute inset-x-6 top-6 bottom-24 flex flex-col justify-between pointer-events-none opacity-30">
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                </div>

                {/* Columns */}
                <div className="relative h-64 flex items-end justify-between gap-2 sm:gap-4 z-10 pt-8 pb-1">
                  {chartProducts.map((product, idx) => {
                    const heightPercent = Math.min(100, Math.max(15, (product.ticketCount / maxTicketCount) * 100));

                    let columnGradient = "from-rose-500 to-red-600";
                    let badgeColor = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/20";
                    if (product.severities.high > 0) {
                      columnGradient = "from-red-500 to-rose-600";
                      badgeColor = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/20";
                    } else if (product.severities.medium > 0) {
                      columnGradient = "from-amber-400 to-amber-600";
                      badgeColor = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20";
                    }

                    const isHovered = hoveredProductIndex === idx;

                    return (
                      <div
                        key={product.productName}
                        onMouseEnter={() => setHoveredProductIndex(idx)}
                        onMouseLeave={() => setHoveredProductIndex(null)}
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                      >
                        {/* Value Badge on Top */}
                        <div
                          className={`mb-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${badgeColor} ${
                            isHovered ? "scale-110 shadow-sm" : ""
                          }`}
                        >
                          {product.ticketCount} ticket
                        </div>

                        {/* The Vertical Bar */}
                        <div className="w-full max-w-[48px] bg-slate-200/50 dark:bg-slate-800/80 rounded-t-xl overflow-hidden flex flex-col justify-end relative h-full">
                          <div
                            className={`w-full rounded-t-xl bg-gradient-to-t ${columnGradient} transition-all duration-500 ${
                              isHovered ? "brightness-110 shadow-lg shadow-rose-500/20" : ""
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        {/* Hover Tooltip Card */}
                        {isHovered && (
                          <div className="absolute bottom-full mb-3 z-30 w-56 p-3 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-white/10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 pointer-events-none text-left">
                            <div className="flex items-center gap-1.5 mb-1">
                              {getRankMedal(product.rank)}
                              <p className="font-bold text-xs truncate">{product.productName}</p>
                            </div>
                            <div className="text-[10px] text-slate-300 space-y-0.5 border-t border-white/10 pt-1.5 mt-1">
                              {product.categoryName && (
                                <p className="text-rose-400 font-semibold">📁 {product.categoryName}</p>
                              )}
                              <p>• Tổng số vé lỗi: <b className="text-white">{product.ticketCount} ticket</b></p>
                              <p>• Chưa xử lý: <b className="text-amber-400">{product.unresolvedCount} ticket</b></p>
                              <p>• Đã xử lý: <b className="text-emerald-400">{product.resolvedCount} ticket</b></p>
                              <div className="flex items-center gap-1 pt-1">
                                {product.severities.high > 0 && <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/30 text-red-300">🔴 {product.severities.high} nghiêm trọng</span>}
                                {product.severities.medium > 0 && <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300">🟡 {product.severities.medium} TB</span>}
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-400 italic mt-1.5">👉 Nhấp vào cột để xem chi tiết</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Product Labels */}
                <div className="flex justify-between gap-2 sm:gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                  {chartProducts.map((product, idx) => {
                    const isHovered = hoveredProductIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedProduct(product)}
                        onMouseEnter={() => setHoveredProductIndex(idx)}
                        onMouseLeave={() => setHoveredProductIndex(null)}
                        className={`flex-1 flex flex-col items-center text-center cursor-pointer transition-all ${
                          isHovered ? "text-rose-600 dark:text-rose-400 scale-105" : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden mb-1">
                          {product.thumbnail ? (
                            <Image
                              src={product.thumbnail}
                              alt={product.productName}
                              width={28}
                              height={28}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Package size={12} className="text-slate-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold flex items-center gap-0.5 mb-0.5">
                          #{product.rank}
                        </span>
                        <span className="text-[10px] font-medium leading-tight line-clamp-2 max-w-[80px]" title={product.productName}>
                          {product.productName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Products List below column chart */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Danh sách sản phẩm có nhiều ticket lỗi ({getTimeLabel()}):
                  </span>
                  <span>{filteredProducts.length} sản phẩm</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredProducts.slice(0, 6).map((product) => (
                    <div
                      key={product.productName}
                      onClick={() => setSelectedProduct(product)}
                      className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/80 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getRankMedal(product.rank)}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate hover:text-rose-600 transition-colors">
                            {product.productName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            {product.categoryName && (
                              <span className="text-rose-600 dark:text-rose-400 font-medium">
                                📁 {product.categoryName}
                              </span>
                            )}
                            <span>• {product.brand || "Chính hãng"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                          {product.ticketCount} ticket
                        </span>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADERBOARD RANKING TABLE */}
          {viewTab === "table" && (
            <div className="rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 uppercase font-bold text-[10px] text-slate-400">
                      <th className="p-2.5 text-center w-12">Hạng</th>
                      <th className="p-2.5">Sản phẩm & Danh mục</th>
                      <th className="p-2.5 text-center">Tổng Ticket lỗi</th>
                      <th className="p-2.5 text-center">Chưa xử lý</th>
                      <th className="p-2.5 text-center">Đã xử lý</th>
                      <th className="p-2.5 text-center">Mức độ AI</th>
                      <th className="p-2.5 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.productName}
                        onClick={() => setSelectedProduct(product)}
                        className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="p-2.5 text-center">
                          <div className="flex justify-center">{getRankMedal(product.rank)}</div>
                        </td>

                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                              {product.thumbnail ? (
                                <Image
                                  src={product.thumbnail}
                                  alt={product.productName}
                                  width={32}
                                  height={32}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <Package size={14} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-rose-600 transition-colors">
                                {product.productName}
                              </p>
                              <div className="text-[10px] text-slate-400 truncate">
                                {product.categoryName && <span>📁 {product.categoryName} </span>}
                                {product.brand && <span>• {product.brand}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-2.5 text-center font-bold text-slate-800 dark:text-slate-200">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-[11px] font-bold">
                            {product.ticketCount} ticket
                          </span>
                        </td>

                        <td className="p-2.5 text-center text-amber-600 dark:text-amber-400 font-semibold">
                          {product.unresolvedCount}
                        </td>

                        <td className="p-2.5 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                          {product.resolvedCount}
                        </td>

                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {product.severities.high > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                                🔴 {product.severities.high}
                              </span>
                            )}
                            {product.severities.medium > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                🟡 {product.severities.medium}
                              </span>
                            )}
                            {product.severities.low > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                🟢 {product.severities.low}
                              </span>
                            )}
                            {product.severities.high === 0 &&
                              product.severities.medium === 0 &&
                              product.severities.low === 0 && <span className="text-slate-400">—</span>}
                          </div>
                        </td>

                        <td className="p-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-50 transition-all"
                          >
                            Xem lỗi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e2330] rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-start gap-2.5">
                {getRankMedal(selectedProduct.rank)}
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    {selectedProduct.productName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {selectedProduct.categoryName && (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        📁 {selectedProduct.categoryName}
                      </span>
                    )}
                    <span>• Tổng cộng {selectedProduct.ticketCount} ticket báo lỗi</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                  <p className="text-[10px] uppercase font-bold text-rose-600">Lỗi nghiêm trọng (AI)</p>
                  <p className="text-base font-bold text-rose-700 mt-0.5">{selectedProduct.severities.high}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                  <p className="text-[10px] uppercase font-bold text-amber-600">Chưa xử lý</p>
                  <p className="text-base font-bold text-amber-700 mt-0.5">{selectedProduct.unresolvedCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Đã giải quyết</p>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">{selectedProduct.resolvedCount}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-2 flex items-center gap-1.5">
                  <Ticket size={13} className="text-rose-500" />
                  Danh sách ticket báo lỗi ({selectedProduct.recentTickets.length}):
                </h4>

                <div className="space-y-2">
                  {selectedProduct.recentTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {t.customer_phone} {t.customer_name ? `• ${t.customer_name}` : ""}
                          </span>
                          {t.created_at && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(t.created_at).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 self-start sm:self-auto">
                          {t.status}
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300">{t.issue_description}</p>

                      {t.ai_diagnosis && (
                        <div className="p-2 rounded bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 text-[11px]">
                          <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1 mb-0.5">
                            <Sparkles size={11} /> Chẩn đoán AI Gemini:
                          </span>
                          <p className="text-slate-600 dark:text-slate-300">{t.ai_diagnosis}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Đóng
              </button>

              {onSelectProductForTickets ? (
                <button
                  onClick={() => {
                    const pName = selectedProduct.productName;
                    setSelectedProduct(null);
                    onSelectProductForTickets(pName);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                >
                  Xử lý ticket ({selectedProduct.productName})
                </button>
              ) : (
                <Link
                  href={`/admin/warranty-tickets?search=${encodeURIComponent(selectedProduct.productName)}`}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                >
                  Mở trang Ticket <ExternalLink size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
