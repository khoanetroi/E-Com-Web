"use client";

import React, { useEffect, useMemo, useState, useRef, ChangeEvent } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Save, X, Plus, Package, Image as ImageIcon, Layers, UploadCloud, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InputField } from "@/components/forms/InputField";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import * as z from "zod";
import imageCompression from "browser-image-compression";
import { sortAttributes } from "@/lib/utils/attributes";
import { generateSlug } from "@/lib/utils/slugify";
import { ORIGIN_LIST } from "@/lib/constants/origins";
import { BRAND_LIST, BrandItem, getBrandLogo } from "@/lib/constants/brands";

const productSchema = z.object({
    name: z.string().min(5, "Tên sản phẩm ít nhất 5 ký tự").max(255),
    description: z.string().max(5000).optional(),
    brand: z.string().min(1, "Vui lòng nhập thương hiệu"),
    origin: z.string().min(1, "Vui lòng nhập xuất xứ"),
    warranty_months: z.coerce.number().min(0, "Không được âm").default(12),
    category_ids: z.array(z.string()).default([]),
    thumbnail: z.string().min(1, "Ảnh bìa là bắt buộc"),
    images: z.array(z.string()).default([]),
    attrGroups: z.array(z.object({
        name: z.string().min(1, "Tên nhóm không được để trống"),
        values: z.array(z.string()).min(1, "Cần ít nhất 1 giá trị")
    })).default([]),
    variants: z.array(z.object({
        attributes: z.record(z.string(), z.string()),
        price: z.coerce.number().min(0, "Giá không được âm"),
        stock: z.coerce.number().min(0, "Kho không được âm"),
        vat_percent: z.coerce.number().min(0, "VAT không được âm").max(100, "VAT tối đa 100").default(0),
        discount_percent: z.coerce.number().min(0, "Không được âm").max(100, "Tối đa 100%").default(0),
        sku: z.string().optional(),
        image: z.string().optional()
    })).default([]),
    custom_tabs: z.array(z.object({
        id: z.string(),
        name: z.string().min(1, "Vui lòng nhập tên tab"),
        sections: z.array(z.object({
            id: z.string(),
            name: z.string().min(1, "Vui lòng nhập tên nhóm"),
            links: z.array(z.object({
                id: z.string(),
                name: z.string().min(1, "Vui lòng nhập tên link"),
                url: z.string().min(1, "Vui lòng nhập URL")
            })).default([])
        })).default([])
    })).default([])
}) as any;

type ProductFormValues = z.infer<typeof productSchema>;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_GALLERY_FILES = 9;

const sanitizeFileName = (str: string) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9.-]/g, '')
        .toLowerCase();
};

interface CategoryOption {
    id: string;
    name: string;
    parent_id: string | null;
}

export default function ProductForm({ initialData }: { initialData?: any }) {
    const supabase = createClient();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Edit mode detection
    const editId = searchParams?.get("edit");
    const isEditMode = Boolean(editId);
    const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode);

    // Categories
    const [categories, setCategories] = useState<CategoryOption[]>([]);

    // Brand logos
    const [brandLogos, setBrandLogos] = useState<BrandItem[]>(BRAND_LIST);
    const [brandSearch, setBrandSearch] = useState("");
    const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
    const brandDropdownRef = useRef<HTMLDivElement>(null);

    // Upload states
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const [galleryFiles, setGalleryFiles] = useState<string[]>(initialData?.images || []);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);
    const thumbInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [deletedCombos, setDeletedCombos] = useState<string[]>([]);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            brand: "NoBrand",
            origin: "Việt Nam",
            warranty_months: 12,
            category_id: null,
            thumbnail: "",
            images: [],
            attrGroups: [],
            variants: [],
            custom_tabs: []
        },
    });

    const { fields: attrFields, append: addGroup, remove: removeGroup } = useFieldArray({
        control: form.control,
        name: "attrGroups"
    });

    const { fields: tabFields, append: addTab, remove: removeTab } = useFieldArray({
        control: form.control,
        name: "custom_tabs"
    });

    const watchedGroups = form.watch("attrGroups");

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from("categories")
                .select("id, name, parent_id")
                .order("name");
            setCategories(data || []);
        };
        fetchCategories();
    }, [supabase]);

    // Fetch brand logos (Supabase + fallback to BRAND_LIST)
    useEffect(() => {
        const fetchBrandLogos = async () => {
            try {
                const { data, error } = await supabase
                    .from("brand_logos")
                    .select("id, brand_name, logo_url, created_at")
                    .order("brand_name");
                if (data && data.length > 0) {
                    setBrandLogos(data);
                } else {
                    setBrandLogos(BRAND_LIST);
                }
            } catch {
                setBrandLogos(BRAND_LIST);
            }
        };
        fetchBrandLogos();
    }, [supabase]);

    // Close brand dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
                setBrandDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load product data when in edit mode
    useEffect(() => {
        if (!isEditMode || !editId) {
            // Reset to create mode - clear form
            setIsLoadingProduct(false);
            form.reset({
                name: "",
                brand: "NoBrand",
                origin: "Việt Nam",
                warranty_months: 12,
                category_ids: [],
                description: "",
                thumbnail: "",
                images: [],
                attrGroups: [],
                variants: [],
                custom_tabs: []
            });
            return;
        }

        async function loadProduct() {
            setIsLoadingProduct(true);

            // Fetch product
            const { data: product, error: productError } = await supabase
                .from("products")
                .select("*")
                .eq("id", editId)
                .single();

            if (productError || !product) {
                toast({ title: "Lỗi", description: "Không tìm thấy sản phẩm", variant: "destructive" });
                window.location.href = "/admin/products/list";
                return;
            }

            // Fetch selected categories from mapping table
            const { data: catMapping } = await supabase
                .from("product_categories_mapping")
                .select("category_id")
                .eq("product_id", editId);

            const categoryIds = (catMapping || []).map((m: any) => m.category_id);

            // Fetch variants
            const { data: variants } = await supabase
                .from("product_variants")
                .select("*")
                .eq("product_id", editId)
                .order("created_at");

            // Build attrGroups from variants
            const attrGroups: Record<string, Set<string>> = {};
            (variants || []).forEach((v: any) => {
                Object.entries(v.attributes || {}).forEach(([key, value]) => {
                    if (!attrGroups[key]) attrGroups[key] = new Set();
                    attrGroups[key].add(value as string);
                });
            });

            // Sort keys based on semantic priority
            const sortedKeys = Object.keys(attrGroups).sort(sortAttributes);

            const attrGroupsArray = sortedKeys.map((name) => ({
                name,
                values: Array.from(attrGroups[name])
            }));

            // Map variants to form format
            const variantsArray = (variants || []).map((v: any) => ({
                attributes: v.attributes,
                price: v.price,
                stock: v.stock,
                vat_percent: v.vat_percent || 0,
                discount_percent: v.discount_percent || 0,
                sku: v.sku || "",
                image: v.image || ""
            }));

            // Reset form with loaded data
            form.reset({
                name: product.name,
                brand: product.brand || "NoBrand",
                origin: product.origin || "Việt Nam",
                warranty_months: product.warranty_months ?? 12,
                category_ids: categoryIds,
                description: product.description || "",
                thumbnail: product.thumbnail || "",
                images: product.images || [],
                attrGroups: attrGroupsArray.length > 0 ? attrGroupsArray : [],
                variants: variantsArray,
                custom_tabs: product.custom_tabs || []
            });

            setIsLoadingProduct(false);
        }

        loadProduct();
    }, [editId, isEditMode, supabase, toast, form]);

    // Logic sinh biến thể (Optimized để giữ lại data cũ)
    useEffect(() => {
        // Skip if loading product in edit mode
        if (isLoadingProduct) return;

        const validGroups = watchedGroups.filter((g: { name: string; values: string[] }) => g.name && g.values?.length > 0);
        if (validGroups.length === 0) {
            form.setValue("variants", []);
            return;
        }

        const cartesian = (acc: any[], curr: any) => {
            return curr.values.flatMap((value: string) =>
                acc.map(item => ({ ...item, [curr.name]: value }))
            );
        };

        const combinations = validGroups.reduce(cartesian, [{}]);
        const currentVariants = form.getValues("variants");

        // Helper: normalize key order for reliable comparison
        const sortedStringify = (obj: Record<string, string>) => {
            const sorted: Record<string, string> = {};
            Object.keys(obj).sort().forEach(k => { sorted[k] = obj[k]; });
            return JSON.stringify(sorted);
        };

        const newVariants = combinations
            .filter((combo: any) => !deletedCombos.includes(JSON.stringify(combo)))
            .map((combo: any) => {
                // Tìm xem biến thể này đã tồn tại chưa để giữ lại Price/Stock/SKU
                const comboKey = sortedStringify(combo);
                const existing = currentVariants.find((v: { attributes: Record<string, string> }) =>
                    sortedStringify(v.attributes) === comboKey
                );

                return existing || {
                    attributes: combo,
                    price: 0,
                    stock: 0,
                    vat_percent: 0,
                    discount_percent: 0,
                    sku: "",
                    image: ""
                };
            });

        form.setValue("variants", newVariants);
    }, [JSON.stringify(watchedGroups), deletedCombos, isLoadingProduct]);

    const onSubmit = async (values: ProductFormValues) => {
        try {
            if (isEditMode && editId) {
                // === UPDATE MODE ===

                // 1. Update product
                const { error: productError } = await supabase
                    .from("products")
                    .update({
                        name: values.name,
                        slug: generateSlug(values.name),
                        description: values.description || null,
                        brand: values.brand,
                        origin: values.origin,
                        warranty_months: values.warranty_months ?? 12,
                        category_id: values.category_id || null,
                        thumbnail: values.thumbnail,
                        images: values.images || [],
                        custom_tabs: values.custom_tabs || [],
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editId);

                if (productError) throw productError;

                // 1.1 Sync categories
                await supabase.from("product_categories_mapping").delete().eq("product_id", editId);
                if (values.category_ids.length > 0) {
                    await supabase.from("product_categories_mapping").insert(
                        values.category_ids.map((cid: string) => ({ product_id: editId, category_id: cid }))
                    );
                }

                // 2. Fetch existing variants for this product
                const { data: existingVariants } = await supabase
                    .from("product_variants")
                    .select("id, attributes")
                    .eq("product_id", editId);

                const existingList = existingVariants || [];
                const newVariants = values.variants || [];

                // 3. Match new variants to existing ones by attributes
                const matchedExistingIds = new Set<string>();
                const toUpdate: { id: string; data: any }[] = [];
                const toInsert: any[] = [];

                for (const v of newVariants) {
                    const match = existingList.find(
                        (ev: any) =>
                            !matchedExistingIds.has(ev.id) &&
                            JSON.stringify(ev.attributes) === JSON.stringify(v.attributes)
                    );

                    if (match) {
                        matchedExistingIds.add(match.id);
                        toUpdate.push({
                            id: match.id,
                            data: {
                                sku: v.sku || null,
                                price: Number(v.price) || 0,
                                stock: Number(v.stock) || 0,
                                vat_percent: Number(v.vat_percent || 0),
                                discount_percent: Number(v.discount_percent || 0),
                                attributes: v.attributes,
                                image: v.image || null,
                            },
                        });
                    } else {
                        toInsert.push({
                            product_id: editId,
                            sku: v.sku || null,
                            price: Number(v.price) || 0,
                            stock: Number(v.stock) || 0,
                            vat_percent: Number(v.vat_percent || 0),
                            discount_percent: Number(v.discount_percent || 0),
                            attributes: v.attributes,
                            image: v.image || null,
                        });
                    }
                }

                // 4. Update existing variants
                for (const item of toUpdate) {
                    const { error: updateError } = await supabase
                        .from("product_variants")
                        .update(item.data)
                        .eq("id", item.id);
                    if (updateError) throw updateError;
                }

                // 5. Insert new variants
                if (toInsert.length > 0) {
                    const { error: insertError } = await supabase
                        .from("product_variants")
                        .insert(toInsert);
                    if (insertError) throw insertError;
                }

                // 6. Delete variants that are no longer needed (only if not referenced by order_items)
                const unmatchedIds = existingList
                    .filter((ev: any) => !matchedExistingIds.has(ev.id))
                    .map((ev: any) => ev.id);

                if (unmatchedIds.length > 0) {
                    // Check which ones are referenced by order_items
                    const { data: referencedItems } = await supabase
                        .from("order_items")
                        .select("variant_id")
                        .in("variant_id", unmatchedIds);

                    const referencedIds = new Set((referencedItems || []).map((r: any) => r.variant_id));
                    const safeToDelete = unmatchedIds.filter((id: string) => !referencedIds.has(id));
                    const keptVariantIds = unmatchedIds.filter((id: string) => referencedIds.has(id));

                    if (safeToDelete.length > 0) {
                        const { error: deleteError } = await supabase
                            .from("product_variants")
                            .delete()
                            .in("id", safeToDelete);
                        if (deleteError) throw deleteError;
                    }

                    // Notify user about variants that couldn't be removed
                    if (keptVariantIds.length > 0) {
                        // Get the attributes of kept variants for display
                        const keptVariants = existingList.filter((ev: any) => keptVariantIds.includes(ev.id));
                        const keptNames = keptVariants
                            .map((v: any) => Object.values(v.attributes || {}).join(" / "))
                            .join(", ");

                        toast({
                            title: `⚠️ ${keptVariantIds.length} biến thể không thể xóa`,
                            description: `Các biến thể "${keptNames}" đang được liên kết với đơn hàng nên không thể xóa. Chúng sẽ được giữ lại trong hệ thống.`,
                            variant: "destructive",
                            duration: 8000,
                        });
                    }
                }

                toast({ title: "Đã cập nhật!", description: "Sản phẩm đã được cập nhật thành công.", className: "bg-green-600 text-white" });
                const returnPage = searchParams?.get("returnPage") || "1";
                window.location.href = `/admin/products?page=${returnPage}`;
            } else {
                // === CREATE MODE ===

                // 1. Insert product
                const { data: product, error: productError } = await supabase
                    .from("products")
                    .insert({
                        name: values.name,
                        slug: generateSlug(values.name),
                        description: values.description || null,
                        brand: values.brand,
                        origin: values.origin,
                        warranty_months: values.warranty_months ?? 12,
                        category_id: values.category_ids[0] || null, // Fallback for legacy column
                        thumbnail: values.thumbnail,
                        images: values.images || [],
                        custom_tabs: values.custom_tabs || [],
                    })
                    .select("id")
                    .single();

                if (productError) throw productError;

                // 1.1 Sync categories
                if (values.category_ids.length > 0) {
                    await supabase.from("product_categories_mapping").insert(
                        values.category_ids.map((cid: string) => ({ product_id: product.id, category_id: cid }))
                    );
                }

                // 2. Insert variants
                if (values.variants && values.variants.length > 0) {
                    const variantRows = values.variants.map((v: any) => ({
                        product_id: product.id,
                        sku: v.sku || null,
                        price: Number(v.price) || 0,
                        stock: Number(v.stock) || 0,
                        vat_percent: Number(v.vat_percent || 0),
                        discount_percent: Number(v.discount_percent || 0),
                        attributes: v.attributes,
                        image: v.image || null,
                    }));

                    const { error: variantError } = await supabase
                        .from("product_variants")
                        .insert(variantRows);

                    if (variantError) throw variantError;
                }

                toast({ title: "Thành công!", description: "Sản phẩm đã được tạo", className: "bg-green-600 text-white" });
                window.location.href = `/admin/products/create`;
            }
        } catch (error: any) {
            console.error(error);
            toast({
                title: isEditMode ? "Lỗi cập nhật sản phẩm" : "Lỗi tạo sản phẩm",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    // --- UPLOAD HELPERS ---
    const compressImage = async (file: File): Promise<File> => {
        const options = {
            maxSizeMB: 0.05, // 100KB max
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: "image/webp" as const,
            initialQuality: 0.7,
        };

        try {
            const compressed = await imageCompression(file, options);
            const sizeMB = compressed.size / 1024;
            console.log(`Ảnh nén: ${(file.size / 1024).toFixed(0)}KB → ${sizeMB.toFixed(0)}KB`);
            return compressed;
        } catch (err) {
            console.warn("Không thể nén ảnh, sử dụng ảnh gốc:", err);
            return file;
        }
    };

    const uploadFileToSupabase = async (file: File): Promise<string | null> => {
        // Compress image before uploading
        const compressed = await compressImage(file);
        const fileName = `${Date.now()}-${sanitizeFileName(file.name.split('.')[0])}.webp`;
        const { error } = await supabase.storage.from('products').upload(fileName, compressed, {
            contentType: 'image/webp',
        });
        if (error) {
            toast({ title: "Upload lỗi", description: error.message, variant: "destructive" });
            return null;
        }
        return supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
    };

    const handleThumbnailUpload = async (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast({ title: "File quá lớn", description: "Tối đa 5MB", variant: "destructive" });
            return;
        }
        setIsUploadingThumb(true);
        const url = await uploadFileToSupabase(file);
        if (url) {
            form.setValue("thumbnail", url, { shouldValidate: true });
        }
        setIsUploadingThumb(false);
    };

    const handleGalleryUpload = async (files: FileList) => {
        const currentImages = form.getValues("images") || [];
        const remaining = MAX_GALLERY_FILES - currentImages.length;
        if (remaining <= 0) {
            toast({ title: "Quá tải", description: `Tối đa ${MAX_GALLERY_FILES} ảnh`, variant: "destructive" });
            return;
        }
        const selected = Array.from(files).slice(0, remaining);
        setIsUploadingGallery(true);
        const urls: string[] = [];
        for (const file of selected) {
            if (file.size > MAX_FILE_SIZE) {
                toast({ title: "File quá lớn", description: `${file.name} vượt quá 5MB`, variant: "destructive" });
                continue;
            }
            const url = await uploadFileToSupabase(file);
            if (url) urls.push(url);
        }
        if (urls.length > 0) {
            form.setValue("images", [...currentImages, ...urls]);
        }
        setIsUploadingGallery(false);
    };

    const removeGalleryImage = (index: number) => {
        const current = form.getValues("images") || [];
        form.setValue("images", current.filter((_: string, i: number) => i !== index));
    };

    const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);

    const handleVariantImageUpload = async (file: File, variantIdx: number) => {
        if (file.size > MAX_FILE_SIZE) {
            toast({ title: "File quá lớn", description: "Tối đa 5MB", variant: "destructive" });
            return;
        }
        setUploadingVariantIdx(variantIdx);
        const url = await uploadFileToSupabase(file);
        if (url) {
            form.setValue(`variants.${variantIdx}.image`, url);
        }
        setUploadingVariantIdx(null);
    };

    // Loading state for edit mode
    if (isLoadingProduct) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                    <p className="text-sm text-slate-500">Đang tải dữ liệu sản phẩm...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1219] pb-24">
            <div className="max-w-7xl mx-auto p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* CỘT TRÁI: THÔNG TIN CHÍNH */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" /> Thông tin cơ bản
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <InputField control={form.control} name="name" label="Tên sản phẩm" placeholder="Ví dụ: Áo thun nam co giãn..." />

                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Brand Logo Selector */}
                                        <FormField
                                            control={form.control}
                                            name="brand"
                                            render={({ field }) => {
                                                const selectedLogo = brandLogos.find(b => b.brand_name.toLowerCase() === (field.value || "").toLowerCase());
                                                const filteredBrands = brandLogos.filter(b => {
                                                    if (!brandSearch.trim()) return true;
                                                    return b.brand_name.toLowerCase().includes(brandSearch.toLowerCase().trim());
                                                });

                                                return (
                                                    <FormItem>
                                                        <FormLabel>Thương hiệu</FormLabel>
                                                        <div className="relative" ref={brandDropdownRef}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setBrandDropdownOpen(prev => !prev);
                                                                    setBrandSearch("");
                                                                }}
                                                                className="w-full h-10 px-3 flex items-center gap-2 rounded-md border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f1219] hover:border-orange-400 transition-colors text-left text-sm"
                                                            >
                                                                {selectedLogo?.logo_url ? (
                                                                    <img src={selectedLogo.logo_url} alt={selectedLogo.brand_name} className="h-5 w-auto max-w-[28px] object-contain rounded bg-white p-0.5" />
                                                                ) : field.value && field.value !== "NoBrand" ? (
                                                                    <div className="h-5 w-5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold">
                                                                        {field.value.charAt(0).toUpperCase()}
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-5 w-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[9px]">
                                                                        N/A
                                                                    </div>
                                                                )}
                                                                <span className="truncate flex-1 text-slate-700 dark:text-slate-200 font-medium">
                                                                    {field.value || "Chọn thương hiệu"}
                                                                </span>
                                                                <svg className={`h-4 w-4 text-slate-400 transition-transform ${brandDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>

                                                            {brandDropdownOpen && (
                                                                <div className="absolute z-50 top-full left-0 mt-1 w-[340px] max-h-[380px] overflow-hidden flex flex-col bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl p-2">
                                                                    {/* Search box */}
                                                                    <div className="mb-2">
                                                                        <Input
                                                                            value={brandSearch}
                                                                            onChange={(e) => setBrandSearch(e.target.value)}
                                                                            placeholder="Tìm hoặc nhập thương hiệu..."
                                                                            className="h-8 text-xs bg-slate-50 dark:bg-[#0f1219] border-slate-200 dark:border-white/10"
                                                                            autoFocus
                                                                        />
                                                                    </div>

                                                                    <div className="overflow-y-auto max-h-[300px] space-y-1 pr-1">
                                                                        {/* NoBrand option */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { field.onChange("NoBrand"); setBrandDropdownOpen(false); setBrandSearch(""); }}
                                                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${field.value === "NoBrand" ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-600" : "hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent"
                                                                                }`}
                                                                        >
                                                                            <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-semibold">N/A</div>
                                                                            <span className="text-slate-600 dark:text-slate-300 font-medium">NoBrand</span>
                                                                        </button>

                                                                        {/* Custom brand option if search doesn't match exactly */}
                                                                        {brandSearch.trim() && !brandLogos.some(b => b.brand_name.toLowerCase() === brandSearch.trim().toLowerCase()) && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => { field.onChange(brandSearch.trim().toUpperCase()); setBrandDropdownOpen(false); setBrandSearch(""); }}
                                                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-orange-600 dark:text-orange-400 bg-orange-50/60 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-dashed border-orange-300 dark:border-orange-600 transition-colors text-left"
                                                                            >
                                                                                <span>+ Dùng thương hiệu: <strong>{brandSearch.trim().toUpperCase()}</strong></span>
                                                                            </button>
                                                                        )}

                                                                        {/* Brands grid */}
                                                                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                                            {filteredBrands.map((brand) => (
                                                                                <button
                                                                                    key={brand.id}
                                                                                    type="button"
                                                                                    onClick={() => { field.onChange(brand.brand_name); setBrandDropdownOpen(false); setBrandSearch(""); }}
                                                                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition-all text-left ${field.value === brand.brand_name
                                                                                        ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-600 shadow-sm"
                                                                                        : "border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
                                                                                        }`}
                                                                                >
                                                                                    {brand.logo_url ? (
                                                                                        <img src={brand.logo_url} alt={brand.brand_name} className="h-7 w-7 object-contain rounded flex-shrink-0 bg-white p-0.5" />
                                                                                    ) : (
                                                                                        <div className="h-7 w-7 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400 flex-shrink-0">
                                                                                            {brand.brand_name.charAt(0)}
                                                                                        </div>
                                                                                    )}
                                                                                    <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{brand.brand_name}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>

                                                                        {filteredBrands.length === 0 && !brandSearch.trim() && (
                                                                            <div className="text-center py-4 text-xs text-slate-400">Không có thương hiệu nào</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="origin"
                                            render={({ field }) => {
                                                const [originOpen, setOriginOpen] = useState(false);
                                                const [originSearch, setOriginSearch] = useState("");
                                                const originRef = useRef<HTMLDivElement>(null);

                                                // Close dropdown on outside click
                                                useEffect(() => {
                                                    const handler = (e: MouseEvent) => {
                                                        if (originRef.current && !originRef.current.contains(e.target as Node)) {
                                                            setOriginOpen(false);
                                                        }
                                                    };
                                                    document.addEventListener("mousedown", handler);
                                                    return () => document.removeEventListener("mousedown", handler);
                                                }, []);

                                                const filtered = ORIGIN_LIST.filter(o => {
                                                    if (!originSearch.trim()) return true;
                                                    const q = originSearch.toLowerCase().trim();
                                                    return o.label.toLowerCase().includes(q) || o.aliases.some(a => a.includes(q));
                                                });

                                                return (
                                                    <FormItem>
                                                        <FormLabel>Xuất xứ</FormLabel>
                                                        <div className="relative" ref={originRef}>
                                                            <Input
                                                                value={originOpen ? originSearch : field.value || ""}
                                                                onChange={(e) => {
                                                                    setOriginSearch(e.target.value);
                                                                    if (!originOpen) setOriginOpen(true);
                                                                }}
                                                                onFocus={() => {
                                                                    setOriginOpen(true);
                                                                    setOriginSearch(field.value || "");
                                                                }}
                                                                placeholder="Tìm quốc gia..."
                                                                className="h-10 bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5"
                                                                autoComplete="off"
                                                            />
                                                            {originOpen && (
                                                                <div className="absolute z-50 top-full left-0 mt-1 w-full max-h-[240px] overflow-y-auto bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl p-1">
                                                                    {filtered.length === 0 ? (
                                                                        <div className="px-3 py-2 text-xs text-slate-400">Không tìm thấy</div>
                                                                    ) : (
                                                                        filtered.map(o => (
                                                                            <button
                                                                                key={o.label}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    field.onChange(o.label);
                                                                                    setOriginOpen(false);
                                                                                    setOriginSearch("");
                                                                                }}
                                                                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                                                                    field.value === o.label
                                                                                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold"
                                                                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                                                                }`}
                                                                            >
                                                                                {o.label}
                                                                            </button>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="warranty_months"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bảo hành (tháng)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min={0} placeholder="12" {...field} className="h-10 bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Multi-Category Selector */}
                                    <FormField
                                        control={form.control}
                                        name="category_ids"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center justify-between">
                                                    Danh mục (Chọn nhiều)
                                                    <span className="text-[10px] text-slate-400 font-normal">Đã chọn: {field?.value?.length}</span>
                                                </FormLabel>
                                                <div className="border border-slate-200 dark:border-white/5 rounded-md p-3 max-h-60 overflow-y-auto bg-white dark:bg-[#0f1219] space-y-3">
                                                    {categories.filter(c => !c.parent_id).map(parent => (
                                                        <div key={parent.id} className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`cat-${parent.id}`}
                                                                    checked={field.value.includes(parent.id)}
                                                                    onChange={(e) => {
                                                                        const current = [...field.value];
                                                                        if (e.target.checked) {
                                                                            field.onChange([...current, parent.id]);
                                                                        } else {
                                                                            field.onChange(current.filter(id => id !== parent.id));
                                                                        }
                                                                    }}
                                                                    className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                                                />
                                                                <label htmlFor={`cat-${parent.id}`} className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                                                    {parent.name}
                                                                </label>
                                                            </div>
                                                            <div className="ml-6 flex flex-col gap-2">
                                                                {categories.filter(c => c.parent_id === parent.id).map(child => (
                                                                    <div key={child.id} className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`cat-${child.id}`}
                                                                            checked={field.value.includes(child.id)}
                                                                            onChange={(e) => {
                                                                                const current = [...field.value];
                                                                                if (e.target.checked) {
                                                                                    field.onChange([...current, child.id]);
                                                                                } else {
                                                                                    field.onChange(current.filter(id => id !== child.id));
                                                                                }
                                                                            }}
                                                                            className="h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                                                        />
                                                                        <label htmlFor={`cat-${child.id}`} className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                                                                            {child.name}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mô tả sản phẩm</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} rows={6} placeholder="Nhập mô tả chi tiết sản phẩm..." className="bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    {/* PHẦN TAB TÙY CHỈNH */}
                                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-base flex items-center gap-2">
                                                <Layers className="h-4 w-4" /> Tabs mô tả tùy chỉnh
                                            </FormLabel>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    addTab({
                                                        id: crypto.randomUUID(),
                                                        name: "",
                                                        sections: []
                                                    });
                                                }}
                                                className="border-dashed"
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Thêm tab (Ví dụ: Thông số, Model...)
                                            </Button>
                                        </div>

                                        {tabFields.map((tab, tIdx) => (
                                            <div key={tab.id} className="p-4 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50/50 dark:bg-white/5 space-y-4 relative group/tab">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover/tab:opacity-100 transition-opacity h-8 w-8"
                                                    onClick={() => removeTab(tIdx)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>

                                                <InputField
                                                    control={form.control}
                                                    name={`custom_tabs.${tIdx}.name`}
                                                    label={`Tên Tab ${tIdx + 1}`}
                                                    placeholder="Ví dụ: Phụ kiện tương thích"
                                                />

                                                {/* SECTIONS */}
                                                <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-white/10 ml-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Các nhóm trong tab:</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-[13px]"
                                                            onClick={() => {
                                                                const currentSections = form.getValues(`custom_tabs.${tIdx}.sections`) || [];
                                                                form.setValue(`custom_tabs.${tIdx}.sections`, [
                                                                    ...currentSections,
                                                                    { id: crypto.randomUUID(), name: "", links: [] }
                                                                ]);
                                                            }}
                                                        >
                                                            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm nhóm
                                                        </Button>
                                                    </div>

                                                    {(form.watch(`custom_tabs.${tIdx}.sections`) || []).map((section: any, sIdx: number) => (
                                                        <div key={section.id} className="p-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f1219] rounded-md relative group/sec space-y-3">
                                                            <div className="flex gap-2">
                                                                <div className="flex-1">
                                                                    <InputField
                                                                        control={form.control}
                                                                        name={`custom_tabs.${tIdx}.sections.${sIdx}.name`}
                                                                        placeholder="Tên nhóm (VD: Sách hướng dẫn)"
                                                                    />
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 h-10 w-10 shrink-0"
                                                                    onClick={() => {
                                                                        const currentSections = form.getValues(`custom_tabs.${tIdx}.sections`);
                                                                        form.setValue(`custom_tabs.${tIdx}.sections`, currentSections.filter((_: any, i: number) => i !== sIdx));
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            {/* LINKS */}
                                                            <div className="space-y-2 pl-4">
                                                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                                    <span>Danh sách Link:</span>
                                                                    <button
                                                                        type="button"
                                                                        className="flex items-center hover:text-orange-500 transition-colors"
                                                                        onClick={() => {
                                                                            const currentLinks = form.getValues(`custom_tabs.${tIdx}.sections.${sIdx}.links`) || [];
                                                                            form.setValue(`custom_tabs.${tIdx}.sections.${sIdx}.links`, [
                                                                                ...currentLinks,
                                                                                { id: crypto.randomUUID(), name: "", url: "" }
                                                                            ]);
                                                                        }}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" /> Thêm link
                                                                    </button>
                                                                </div>
                                                                {(form.watch(`custom_tabs.${tIdx}.sections.${sIdx}.links`) || []).map((link: any, lIdx: number) => (
                                                                    <div key={link.id} className="grid grid-cols-12 gap-2 items-start">
                                                                        <div className="col-span-5">
                                                                            <InputField
                                                                                control={form.control}
                                                                                name={`custom_tabs.${tIdx}.sections.${sIdx}.links.${lIdx}.name`}
                                                                                placeholder="Tên link hiển thị"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-6">
                                                                            <InputField
                                                                                control={form.control}
                                                                                name={`custom_tabs.${tIdx}.sections.${sIdx}.links.${lIdx}.url`}
                                                                                placeholder="URL (https://...)"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-1 pt-1">
                                                                            <button
                                                                                type="button"
                                                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                                                onClick={() => {
                                                                                    const currentLinks = form.getValues(`custom_tabs.${tIdx}.sections.${sIdx}.links`);
                                                                                    form.setValue(`custom_tabs.${tIdx}.sections.${sIdx}.links`, currentLinks.filter((_: any, i: number) => i !== lIdx));
                                                                                }}
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </CardContent>
                            </Card>

                            {/* PHẦN BIẾN THỂ */}
                            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-primary" /> Phân loại sản phẩm
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {attrFields.map((field, index) => (
                                        <div key={field.id} className="p-4 border border-slate-200 dark:border-white/5 rounded-lg bg-slate-50 dark:bg-[#0f1219] relative group">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeGroup(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <InputField control={form.control} name={`attrGroups.${index}.name`} label="Tên nhóm" placeholder="Màu sắc..." />
                                                <div className="md:col-span-2 space-y-2">
                                                    <FormLabel>Giá trị phân loại</FormLabel>
                                                    <div className="flex flex-wrap gap-2 p-2 border border-slate-200 dark:border-white/5 rounded-md bg-white dark:bg-[#1e2330] min-h-[42px]">
                                                        {form.watch(`attrGroups.${index}.values`).map((val: string, vIdx: number) => (
                                                            <span key={vIdx} className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded text-sm flex items-center gap-1">
                                                                {val}
                                                                <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => {
                                                                    const current = form.getValues(`attrGroups.${index}.values`);
                                                                    form.setValue(`attrGroups.${index}.values`, current.filter((_: string, i: number) => i !== vIdx));
                                                                }} />
                                                            </span>
                                                        ))}
                                                        <input
                                                            className="flex-1 outline-none bg-transparent text-sm min-w-[120px]"
                                                            placeholder="Nhấn Enter để thêm..."
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    const val = e.currentTarget.value.trim();
                                                                    if (val) {
                                                                        const current = form.getValues(`attrGroups.${index}.values`);
                                                                        if (!current.includes(val)) {
                                                                            form.setValue(`attrGroups.${index}.values`, [...current, val]);
                                                                        }
                                                                        e.currentTarget.value = "";
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {attrFields.length < 2 && (
                                        <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => addGroup({ name: "", values: [] })}>
                                            <Plus className="h-4 w-4 mr-2" /> Thêm nhóm thuộc tính (Ví dụ: Size, Chất liệu)
                                        </Button>
                                    )}

                                    {/* BẢNG BIẾN THỂ */}
                                    {form.watch("variants").length > 0 && (
                                        <div className="mt-4 overflow-x-auto border border-slate-200 dark:border-white/5 rounded-lg whitespace-nowrap">
                                            <table className="w-full min-w-[800px] text-sm text-left">
                                                <thead className="bg-slate-50 dark:bg-[#0f1219] border-b border-slate-200 dark:border-white/5">
                                                    <tr>
                                                        <th className="p-3 font-semibold">Biến thể</th>
                                                        <th className="p-3 font-semibold w-16 text-center">Ảnh</th>
                                                        <th className="p-3 font-semibold w-32">Giá bán</th>
                                                        <th className="p-3 font-semibold w-28">Kho hàng</th>
                                                        <th className="p-3 font-semibold w-28">Thuế VAT (%)</th>
                                                        <th className="p-3 font-semibold w-28">Giảm giá (%)</th>
                                                        <th className="p-3 font-semibold">Mã SKU</th>
                                                        <th className="p-3 font-semibold w-12 text-center">Xóa</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.watch("variants").map((variant: { attributes: Record<string, string>; price: number; stock: number; sku?: string }, vIdx: number) => (
                                                        <tr key={vIdx} className="border-b border-slate-200 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                            <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                                                {Object.values(variant.attributes).join(" / ")}
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="relative w-12 h-12 mx-auto">
                                                                    {form.watch(`variants.${vIdx}.image`) ? (
                                                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 group">
                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                            <img src={form.watch(`variants.${vIdx}.image`)} alt="" className="w-full h-full object-cover" />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => form.setValue(`variants.${vIdx}.image`, "")}
                                                                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            >
                                                                                <X className="h-3 w-3 text-white" />
                                                                            </button>
                                                                        </div>
                                                                    ) : uploadingVariantIdx === vIdx ? (
                                                                        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center">
                                                                            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                                                        </div>
                                                                    ) : (
                                                                        <label className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors">
                                                                            <ImageIcon className="h-4 w-4 text-slate-400" />
                                                                            <input
                                                                                type="file"
                                                                                accept="image/png, image/jpeg, image/webp"
                                                                                className="hidden"
                                                                                onChange={(e) => {
                                                                                    if (e.target.files?.[0]) handleVariantImageUpload(e.target.files[0], vIdx);
                                                                                    e.target.value = "";
                                                                                }}
                                                                            />
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <Input type="number" {...form.register(`variants.${vIdx}.price`)} className="h-9 bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Input type="number" {...form.register(`variants.${vIdx}.stock`)} className="h-9 bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Input type="number" {...form.register(`variants.${vIdx}.vat_percent`)} className="h-9 bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Input type="number" min={0} max={100} {...form.register(`variants.${vIdx}.discount_percent`)} placeholder="0" className="h-9 bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5" />
                                                            </td>
                                                            <td className="p-3">
                                                                <Input {...form.register(`variants.${vIdx}.sku`)} placeholder="SKU..." className="h-9 bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5" />
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    onClick={() => {
                                                                        const variant = form.getValues(`variants.${vIdx}`);
                                                                        setDeletedCombos(prev => [...prev, JSON.stringify(variant.attributes)]);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* CỘT PHẢI: HÌNH ẢNH & MEDIA */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* THUMBNAIL */}
                            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ImageIcon className="h-4 w-4" /> Ảnh bìa sản phẩm
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {form.watch("thumbnail") ? (
                                        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={form.watch("thumbnail")} alt="Thumbnail" className="w-full aspect-square object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => form.setValue("thumbnail", "")}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className="border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl p-8 flex flex-col items-center cursor-pointer bg-slate-50 dark:bg-[#0f1219] hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors relative"
                                            onClick={() => thumbInputRef.current?.click()}
                                        >
                                            <input
                                                ref={thumbInputRef}
                                                type="file"
                                                accept="image/png, image/jpeg, image/webp"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleThumbnailUpload(e.target.files[0]);
                                                    e.target.value = "";
                                                }}
                                            />
                                            {isUploadingThumb ? (
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                                                    <p className="text-sm font-medium text-slate-600">Bấm để tải ảnh bìa</p>
                                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP. Tối đa 5MB</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {form.formState.errors.thumbnail && (
                                        <p className="text-[0.8rem] font-medium text-red-500 mt-2">
                                            {form.formState.errors.thumbnail.message as string}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* GALLERY */}
                            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ImageIcon className="h-4 w-4" /> Album hình ảnh ({(form.watch("images") || []).length}/{MAX_GALLERY_FILES})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        {(form.watch("images") || []).map((url: string, i: number) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 group">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeGalleryImage(i)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {(form.watch("images") || []).length < MAX_GALLERY_FILES && (
                                        <div
                                            className="border-2 border-dashed border-slate-200 dark:border-white/5 rounded-lg p-4 flex flex-col items-center cursor-pointer bg-slate-50 dark:bg-[#0f1219] hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                                            onClick={() => galleryInputRef.current?.click()}
                                        >
                                            <input
                                                ref={galleryInputRef}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                                                    e.target.value = "";
                                                }}
                                            />
                                            {isUploadingGallery ? (
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <UploadCloud className="h-6 w-6 text-slate-400 mb-1" />
                                                    <p className="text-xs text-slate-500">Thêm ảnh chi tiết</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* FIXED FOOTER */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#1e2330]/80 backdrop-blur-md border-t border-slate-200 dark:border-white/5 p-4 z-[99] shadow-lg">
                            <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
                                <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
                                    Đang chỉnh sửa: <span className="font-bold text-slate-900 dark:text-white">{form.watch("name") || "Sản phẩm mới"}</span>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <Button type="button" variant="outline" className="flex-1 md:flex-none dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5" onClick={() => window.history.back()}>
                                        Hủy bỏ
                                    </Button>
                                    <Button type="submit" className="bg-[#020080] hover:bg-[#020080]/80 text-white px-10 flex-1 md:flex-none shadow-md transition-all duration-200" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                        Lưu sản phẩm
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}