"use client"

import { useState, ChangeEvent, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, UploadCloud, X, Package, DollarSign, Layers } from "lucide-react"
import EditorJS from "@editorjs/editorjs"

// --- UI COMPONENTS ---
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILES = 5

const sanitizeFileName = (str: string) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9.-]/g, '')
        .toLowerCase()
}

const productSchema = z.object({
    name: z.string().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự"),
    short_description: z.string().optional(),
    description: z.any(), // Lưu Object JSON từ Editor.js
    price: z.coerce.number().min(1000, "Giá tối thiểu là 1.000 VNĐ"),
    stock_quantity: z.coerce.number().min(0, "Số lượng không được âm"),
}) as any

export function AddProductModal({ onRefresh }: { onRefresh: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])

    // Tham chiếu cho EditorJS
    const ejInstance = useRef<EditorJS | null>(null)
    const { toast } = useToast()
    const supabase = createClient()

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            short_description: "",
            description: {},
            price: 0,
            stock_quantity: 0,
        },
    })

    // Khởi tạo EditorJS
    const initEditor = () => {
        const editor = new EditorJS({
            holder: "editorjs", // ID của div chứa editor
            placeholder: "Viết mô tả chi tiết sản phẩm tại đây...",
            tools: {
                header: require("@editorjs/header"),
                list: require("@editorjs/list"),
                code: require("@editorjs/code"),
            },
            data: form.getValues("description"),
            async onChange(api) {
                const data = await api.saver.save()
                form.setValue("description", data) // Cập nhật giá trị vào form
            },
        })
        ejInstance.current = editor
    }

    useEffect(() => {
        if (open && !ejInstance.current) {
            initEditor()
        }
        return () => {
            if (ejInstance.current) {
                ejInstance.current.destroy()
                ejInstance.current = null
            }
        }
    }, [open])

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files)
            if (files.length + selectedFiles.length > MAX_FILES) {
                toast({ title: "Quá tải", description: `Tối đa ${MAX_FILES} ảnh`, variant: "destructive" })
                return
            }
            const validFiles: File[] = []
            const newPreviews: string[] = []
            selectedFiles.forEach(file => {
                if (file.size > MAX_FILE_SIZE) {
                    toast({ title: "File quá lớn", description: `${file.name} vượt quá 5MB`, variant: "destructive" })
                } else {
                    validFiles.push(file)
                    newPreviews.push(URL.createObjectURL(file))
                }
            })
            setFiles(prev => [...prev, ...validFiles])
            setPreviews(prev => [...prev, ...newPreviews])
            e.target.value = ''
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index])
            return prev.filter((_, i) => i !== index)
        })
    }

    async function onSubmit(values: z.infer<typeof productSchema>) {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Bạn cần đăng nhập")

            let uploadedUrls: string[] = []
            if (files.length > 0) {
                const uploadPromises = files.map(async (file) => {
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${Date.now()}-${sanitizeFileName(file.name.split('.')[0])}.${fileExt}`
                    const { error } = await supabase.storage.from('products').upload(fileName, file)
                    if (error) throw error
                    return supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl
                })
                uploadedUrls = await Promise.all(uploadPromises)
            }

            const { error } = await supabase.from("products").insert([
                {
                    ...values,
                    image_urls: uploadedUrls,
                    created_by: user.id,
                    description: values.description, // Lưu dưới dạng JSON
                },
            ])

            if (error) throw error

            toast({ title: "Thành công!", className: "bg-green-600 text-white" })
            setOpen(false)
            form.reset()
            setFiles([])
            setPreviews([])
            onRefresh()
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[1000px] max-h-[95vh] p-0 bg-white dark:bg-[#1e2330]">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-6 h-6 text-orange-600" /> Tạo sản phẩm mới
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[80vh] p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Phần Upload Ảnh (Giữ nguyên logic của bạn) */}
                            <div className="space-y-3">
                                <FormLabel className="font-semibold">Hình ảnh ({files.length}/{MAX_FILES})</FormLabel>
                                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center relative cursor-pointer bg-slate-50">
                                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10" />
                                    <UploadCloud className="w-8 h-8 text-orange-500 mb-2" />
                                    <p className="text-sm font-medium">Bấm để tải ảnh</p>
                                </div>
                                {/* Preview Grid */}
                                <div className="grid grid-cols-5 gap-4">
                                    {previews.map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tên sản phẩm</FormLabel>
                                            <Input {...field} />
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="price" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Giá bán</FormLabel>
                                                <Input type="number" {...field} />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="stock_quantity" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tồn kho</FormLabel>
                                                <Input type="number" {...field} />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="short_description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mô tả ngắn</FormLabel>
                                            <Textarea className="h-[100px]" {...field} />
                                        </FormItem>
                                    )} />
                                </div>

                                {/* CỘT PHẢI: EDITOR.JS */}
                                <div className="flex flex-col">
                                    <FormLabel className="mb-2">Chi tiết sản phẩm (Rich Text)</FormLabel>
                                    <div
                                        id="editorjs"
                                        className="flex-1 min-h-[300px] p-4 border rounded-md bg-slate-50 dark:bg-slate-900 prose dark:prose-invert max-w-none"
                                    />
                                    {form.formState.errors.description && (
                                        <p className="text-red-500 text-xs mt-1">Vui lòng nhập nội dung chi tiết</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                                <Button type="submit" disabled={loading} className="bg-orange-600 min-w-[140px]">
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Lưu sản phẩm"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}