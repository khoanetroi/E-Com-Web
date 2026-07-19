import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* 404 visual */}
        <div className="relative mb-8">
          <span className="text-[120px] sm:text-[160px] font-black text-slate-100 dark:text-slate-800/50 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-3xl flex items-center justify-center">
              <Search className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Không tìm thấy trang
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-orange-200 dark:shadow-none"
          >
            <Home className="h-4 w-4" />
            Trang chủ
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}
