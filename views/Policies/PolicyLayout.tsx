import DefaultLayout from "@/components/layout/DefaultLayout";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PolicyLayoutProps {
    title: string;
    children: React.ReactNode;
}

export default function PolicyLayout({ title, children }: PolicyLayoutProps) {
    const policies = [
        { name: "Hướng Dẫn Mua Hàng", href: "/chinh-sach/huong-dan-mua-hang" },
        { name: "Chính Sách Vận Chuyển & Thanh Toán", href: "/chinh-sach/chinh-sach-van-chuyen" },
        { name: "Bảo Hành, Đổi Trả & Hỗ Trợ KT", href: "/chinh-sach/chinh-sach-bao-hanh" },
        { name: "Bảo Mật Thông Tin", href: "/chinh-sach/chinh-sach-bao-mat" },
        { name: "Quy Định Chung", href: "/chinh-sach/quy-dinh-chung" },
        { name: "Giải Quyết Tranh Chấp & Khiếu Nại", href: "/chinh-sach/giai-quyet-khieu-nai" },
    ];

    return (
        <DefaultLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-[#0a0d14]">
                {/* Header Gradient Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1a2332] to-[#0F172A] py-16 md:py-20 text-center border-b border-white/5">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-1/4 w-96 h-96 bg-electric-orange/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-electric-orange/5 rounded-full blur-3xl pointer-events-none" />
                    </div>

                    <div className="relative container mx-auto px-4 z-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                            {title.toUpperCase()}
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Chính sách và quy định hoạt động tại Telectric.vn
                        </p>
                    </div>
                </section>

                <div className="container mx-auto max-w-7xl px-4 py-12">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <div className="w-full lg:w-1/4">
                            <div className="bg-white dark:bg-[#1e2330] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-4 sticky top-24">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 px-2">
                                    DANH MỤC CHÍNH SÁCH
                                </h3>
                                <div className="space-y-1">
                                    {policies.map((policy) => (
                                        <Link
                                            key={policy.href}
                                            href={policy.href}
                                            className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-electric-orange dark:hover:text-electric-orange font-medium"
                                        >
                                            {policy.name}
                                            <ChevronRight className="w-4 h-4 opacity-50" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="w-full lg:w-3/4">
                            <div className="bg-white dark:bg-[#1e2330] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-8 md:p-12">
                                <div className="max-w-none 
                                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:border-b [&_h2]:pb-2 [&_h2]:border-slate-200 dark:[&_h2]:border-slate-800 [&_h2]:text-slate-900 dark:[&_h2]:text-white
                                    [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-slate-900 dark:[&_h3]:text-white
                                    [&_p]:text-slate-600 dark:[&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-4
                                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:text-slate-600 dark:[&_ul]:text-slate-300
                                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:text-slate-600 dark:[&_ol]:text-slate-300
                                    [&_li]:mb-2
                                    [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-white
                                    [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6
                                    [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:p-3 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800/50 [&_th]:text-left [&_th]:font-bold [&_th]:text-slate-900 dark:[&_th]:text-white
                                    [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-700 [&_td]:p-3 [&_td]:text-slate-600 dark:[&_td]:text-slate-300
                                    [&>*:first-child]:mt-0">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
} 
