"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import imageCompression from "browser-image-compression";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ImageIcon, Save, RefreshCw, Plus, Upload, Loader2, Pencil, Trash2 } from "lucide-react";

interface BrandLogo {
    id?: string;
    brand_name: string;
    logo_url: string | null;
}

export default function BrandsManagementView() {
    const supabase = createClient();
    const { toast } = useToast();
    const [brands, setBrands] = useState<BrandLogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [uploading, setUploading] = useState<string | null>(null);
    const [newBrandName, setNewBrandName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Inline rename state
    const [editingName, setEditingName] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState("");

    // Delete confirm state
    const [confirmDelete, setConfirmDelete] = useState<BrandLogo | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const { data: productBrands } = await supabase
                .from("products").select("brand").not("brand", "is", null);

            const productUniqueNames = [
                ...new Set((productBrands || []).map((p) => p.brand)),
            ] as string[];

            const { data: existingLogos } = await supabase.from("brand_logos").select("*");

            const currentLogos: BrandLogo[] = (existingLogos || []).map((l) => ({
                id: l.id, brand_name: l.brand_name, logo_url: l.logo_url,
            }));

            productUniqueNames.forEach((name) => {
                if (!currentLogos.find((l) => l.brand_name.toLowerCase() === name.toLowerCase())) {
                    currentLogos.push({ brand_name: name, logo_url: null });
                }
            });

            setBrands(currentLogos.sort((a, b) => a.brand_name.localeCompare(b.brand_name)));
        } catch {
            toast({ title: "Thông báo", description: "Vui lòng chạy SQL setup để tạo bảng brand_logos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBrands(); }, []);

    // ── Compress & Upload ──
    const compressAndUpload = async (file: File, brandName: string): Promise<string | null> => {
        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 0.15,
                maxWidthOrHeight: 400,
                useWebWorker: true,
                fileType: "image/webp",
                initialQuality: 0.85,
            });
            const safeName = brandName.toLowerCase().replace(/[^a-z0-9]/g, "-");
            const fileName = `brand-logos/${safeName}-${Date.now()}.webp`;
            const { error } = await supabase.storage
                .from("products")
                .upload(fileName, compressed, { contentType: "image/webp", upsert: true });
            if (error) throw error;
            return supabase.storage.from("products").getPublicUrl(fileName).data.publicUrl;
        } catch (err: any) {
            toast({ title: "Upload lỗi", description: err.message, variant: "destructive" });
            return null;
        }
    };

    const handleFileUpload = async (file: File, brand: BrandLogo) => {
        setUploading(brand.brand_name);
        const url = await compressAndUpload(file, brand.brand_name);
        if (url) {
            setBrands((prev) => prev.map((b) =>
                b.brand_name === brand.brand_name ? { ...b, logo_url: url } : b
            ));
            await handleSave({ ...brand, logo_url: url });
        }
        setUploading(null);
    };

    const handleAddManual = async () => {
        if (!newBrandName.trim()) return;
        const name = newBrandName.trim();
        if (brands.find((b) => b.brand_name.toLowerCase() === name.toLowerCase())) {
            toast({ title: "Lỗi", description: "Thương hiệu này đã tồn tại." });
            return;
        }
        setBrands((prev) => [...prev, { brand_name: name, logo_url: null }]
            .sort((a, b) => a.brand_name.localeCompare(b.brand_name)));
        setNewBrandName("");
        setIsAdding(false);
    };

    const updateLogoUrl = (name: string, url: string) => {
        setBrands((prev) => prev.map((b) => b.brand_name === name ? { ...b, logo_url: url } : b));
    };

    const handleSave = async (brand: BrandLogo) => {
        setSaving(brand.brand_name);
        try {
            if (brand.id) {
                const { error } = await supabase.from("brand_logos")
                    .update({ logo_url: brand.logo_url }).eq("id", brand.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from("brand_logos")
                    .upsert({ brand_name: brand.brand_name, logo_url: brand.logo_url }, { onConflict: "brand_name" })
                    .select().single();
                if (error) throw error;
                setBrands((prev) => prev.map((b) => b.brand_name === brand.brand_name ? { ...b, id: data.id } : b));
            }
            toast({ title: "Thành công", description: `Đã lưu logo cho ${brand.brand_name}`, className: "bg-green-600 text-white" });
        } catch {
            toast({ title: "Lỗi lưu dữ liệu", description: "Đảm bảo bạn đã chạy SQL tạo bảng brand_logos.", variant: "destructive" });
        } finally {
            setSaving(null);
        }
    };

    // ── Rename ──
    const startEditName = (brand: BrandLogo) => {
        setEditingName(brand.brand_name);
        setEditNameValue(brand.brand_name);
    };

    const handleRenameSave = async (oldName: string) => {
        const newName = editNameValue.trim();
        if (!newName || newName === oldName) { setEditingName(null); return; }
        if (brands.find((b) => b.brand_name.toLowerCase() === newName.toLowerCase() && b.brand_name !== oldName)) {
            toast({ title: "Lỗi", description: "Tên thương hiệu này đã tồn tại." });
            return;
        }
        const brand = brands.find((b) => b.brand_name === oldName);
        if (!brand) return;
        try {
            if (brand.id) {
                const { error } = await supabase.from("brand_logos")
                    .update({ brand_name: newName }).eq("id", brand.id);
                if (error) throw error;
            }
            setBrands((prev) =>
                prev.map((b) => b.brand_name === oldName ? { ...b, brand_name: newName } : b)
                    .sort((a, b) => a.brand_name.localeCompare(b.brand_name))
            );
            toast({ title: "Thành công", description: `Đã đổi tên thành "${newName}"`, className: "bg-green-600 text-white" });
        } catch {
            toast({ title: "Lỗi", description: "Không thể đổi tên thương hiệu.", variant: "destructive" });
        }
        setEditingName(null);
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            if (confirmDelete.id) {
                const { error } = await supabase.from("brand_logos").delete().eq("id", confirmDelete.id);
                if (error) throw error;
            }
            setBrands((prev) => prev.filter((b) => b.brand_name !== confirmDelete.brand_name));
            toast({ title: "Đã xóa", description: `Đã xóa thương hiệu "${confirmDelete.brand_name}"`, className: "bg-green-600 text-white" });
        } catch {
            toast({ title: "Lỗi", description: "Không thể xóa thương hiệu.", variant: "destructive" });
        } finally {
            setDeleting(false);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Confirm Delete Dialog */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 w-full max-w-sm space-y-4">
                        <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
                        <p className="text-sm text-muted-foreground">
                            Bạn có chắc muốn xóa thương hiệu{" "}
                            <span className="font-bold text-foreground">{confirmDelete.brand_name}</span>?{" "}
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                                Hủy
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                                {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Xóa
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">Quản lý thương hiệu</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gán logo cho các thương hiệu. Tự động nhận diện từ sản phẩm hoặc thêm mới thủ công.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {isAdding ? (
                            <div className="flex gap-2 animate-in slide-in-from-right-2">
                                <Input
                                    placeholder="Tên hãng mới..."
                                    className="w-48 h-9"
                                    value={newBrandName}
                                    onChange={(e) => setNewBrandName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
                                    autoFocus
                                />
                                <Button size="sm" onClick={handleAddManual}>Thêm</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Hủy</Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Thêm nhanh hãng
                            </Button>
                        )}
                        <Button variant="outline" size="icon" onClick={fetchBrands} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[220px]">Tên hãng</TableHead>
                                <TableHead className="w-[90px]">Xem trước</TableHead>
                                <TableHead>URL Logo (dán link hoặc tải ảnh lên)</TableHead>
                                <TableHead className="text-right w-[260px]">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10">Đang tải...</TableCell>
                                </TableRow>
                            ) : brands.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        Chưa có thương hiệu nào.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                brands.map((brand) => (
                                    <TableRow key={brand.brand_name}>
                                        {/* Tên hãng — inline edit */}
                                        <TableCell className="font-bold uppercase tracking-tight">
                                            {editingName === brand.brand_name ? (
                                                <div className="flex gap-1 items-center">
                                                    <Input
                                                        className="h-8 text-sm font-bold uppercase w-32"
                                                        value={editNameValue}
                                                        onChange={(e) => setEditNameValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleRenameSave(brand.brand_name);
                                                            if (e.key === "Escape") setEditingName(null);
                                                        }}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleRenameSave(brand.brand_name)}
                                                        title="Lưu tên"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => setEditingName(null)}
                                                        title="Hủy"
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 group">
                                                    <span>{brand.brand_name}</span>
                                                    <button
                                                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground"
                                                        onClick={() => startEditName(brand)}
                                                        title="Chỉnh sửa tên thương hiệu"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Logo preview */}
                                        <TableCell>
                                            <div className="w-14 h-10 rounded border bg-white flex items-center justify-center overflow-hidden p-1">
                                                {brand.logo_url ? (
                                                    <img src={brand.logo_url} alt={brand.brand_name} className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-slate-200" />
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* URL input */}
                                        <TableCell>
                                            <Input
                                                placeholder="https://example.com/logo.png"
                                                value={brand.logo_url || ""}
                                                onChange={(e) => updateLogoUrl(brand.brand_name, e.target.value)}
                                            />
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Hidden file input */}
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                    className="hidden"
                                                    ref={(el) => { fileInputRefs.current[brand.brand_name] = el; }}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) await handleFileUpload(file, brand);
                                                        e.target.value = "";
                                                    }}
                                                />
                                                {/* Upload */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => fileInputRefs.current[brand.brand_name]?.click()}
                                                    disabled={uploading === brand.brand_name}
                                                    title="Tải ảnh từ máy tính (tự động nén)"
                                                >
                                                    {uploading === brand.brand_name
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <Upload className="w-4 h-4" />
                                                    }
                                                </Button>
                                                {/* Save logo */}
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSave(brand)}
                                                    disabled={saving === brand.brand_name}
                                                >
                                                    {saving === brand.brand_name
                                                        ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                                        : <Save className="w-4 h-4 mr-2" />
                                                    }
                                                    Lưu
                                                </Button>
                                                {/* Delete */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive hover:bg-destructive hover:text-white border-destructive/30"
                                                    onClick={() => setConfirmDelete(brand)}
                                                    title="Xóa thương hiệu"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
