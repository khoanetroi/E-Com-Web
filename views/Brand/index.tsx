import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Shield,
    Truck,
    RefreshCw,
    ShoppingCart,
    CreditCard,
    Package,
    Zap,
    Award,
    CheckCircle,
    Star,
    ArrowRight,
} from "lucide-react"

export default function BrandPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0d14]">
            {/* ===== HERO SECTION ===== */}
            <section className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1a2332] to-[#0F172A]" />

                {/* Animated decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-electric-orange/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-electric-orange/5 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-orange/5 rounded-full blur-3xl" />

                    {/* Grid pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,122,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,0,0.3) 1px, transparent 1px)`,
                            backgroundSize: "60px 60px",
                        }}
                    />
                </div>

                <div className="relative container mx-auto max-w-7xl px-4 py-20 md:py-32 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-electric-orange/10 border border-electric-orange/20 rounded-full px-4 py-1.5 mb-8">
                        <Zap size={14} className="text-electric-orange" />
                        <span className="text-xs font-semibold text-electric-orange tracking-wider uppercase">
                            Thương Hiệu Uy Tín
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        TELECTRIC
                        <span className="block text-electric-orange mt-2">
                            ĐIỂM TỰA KỸ THUẬT
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-4 leading-relaxed">
                        Chuẩn Xác Từng Thông Số
                    </p>

                    <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto mb-10">
                        Đo chuẩn xác, Làm an toàn — Chuyên gia thiết bị đo, Uy tín tạo niềm tin.
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                        {[
                            { value: "100%", label: "Chính Hãng" },
                            { value: "10x", label: "Đền Bù Nếu Giả" },
                            { value: "24/7", label: "Tư Vấn Kỹ Thuật" },
                            { value: "1 Đổi 1", label: "Bảo Hành" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-2xl md:text-3xl font-extrabold text-electric-orange tracking-tight">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 dark:from-[#0a0d14] to-transparent" />
            </section>

            {/* ===== GIỚI THIỆU SECTION ===== */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Section header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 bg-electric-orange/10 dark:bg-electric-orange/5 rounded-full px-4 py-1.5 mb-6">
                                <Award size={14} className="text-electric-orange" />
                                <span className="text-xs font-semibold text-electric-orange tracking-wider uppercase">
                                    Về Chúng Tôi
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                                Câu Chuyện TELECTRIC
                            </h2>
                            <div className="w-16 h-1 bg-electric-orange mx-auto rounded-full" />
                        </div>

                        {/* Content */}
                        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed text-base md:text-lg">
                            <p>
                                Trong kỷ nguyên công nghiệp 4.0, khi sự chính xác quyết định chất lượng
                                của mọi công trình và sản phẩm, nhu cầu sở hữu những thiết bị đo lường
                                chuẩn xác chưa bao giờ cấp thiết đến thế.{" "}
                                <strong className="text-slate-900 dark:text-white">TELECTRIC</strong> ra đời
                                không chỉ đơn thuần là một kênh bán lẻ trực tuyến, mà là câu trả lời cho
                                bài toán tìm kiếm nguồn thiết bị đo điện{" "}
                                <span className="text-electric-orange font-semibold">
                                    Chính Hãng - Giá Tốt - An Tâm
                                </span>{" "}
                                giữa thị trường thật giả lẫn lộn.
                            </p>

                            <p>
                                Được thành lập với tâm huyết của những người làm kỹ thuật, chúng tôi hiểu
                                rằng một chiếc đồng hồ vạn năng hay ampe kìm không chỉ là công cụ, mà là{" "}
                                <em className="text-slate-900 dark:text-white not-italic font-medium">
                                    người bạn đồng hành của các kỹ sư và thợ điện
                                </em>
                                . Tại TELECTRIC, chúng tôi nói{" "}
                                <strong className="text-red-500">KHÔNG</strong> với hàng trôi nổi.
                            </p>
                        </div>

                        {/* 3 Commitment Cards */}
                        <div className="grid md:grid-cols-3 gap-6 mt-12">
                            <CommitmentCard
                                icon={<Shield className="w-8 h-8" />}
                                title="Cam Kết Chính Hãng"
                                description="Sẵn sàng đền bù gấp 10 lần giá trị nếu phát hiện hàng nhái. Danh dự của người làm nghề quan trọng hơn lợi nhuận."
                                color="orange"
                            />
                            <CommitmentCard
                                icon={<Star className="w-8 h-8" />}
                                title="Dịch Vụ 5 Sao"
                                description="Tư vấn kỹ thuật chuyên sâu 24/7. Bạn chưa biết dùng? Chúng tôi hướng dẫn. Máy lỗi? Chúng tôi đổi mới."
                                color="blue"
                            />
                            <CommitmentCard
                                icon={<CheckCircle className="w-8 h-8" />}
                                title="Giá Trị Thực"
                                description="Cắt giảm chi phí mặt bằng để mang lại mức giá cạnh tranh nhất thị trường, giúp anh em thợ thuyền tiết kiệm tối đa."
                                color="green"
                            />
                        </div>

                        <p className="text-center text-lg font-semibold text-slate-900 dark:text-white mt-12">
                            Hãy để TELECTRIC đồng hành cùng sự{" "}
                            <span className="text-electric-orange">an toàn</span> và{" "}
                            <span className="text-electric-orange">chính xác</span> trong công việc của bạn!
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== TẠI SAO CHỌN TELECTRIC ===== */}
            <section className="py-16 md:py-24 bg-white dark:bg-[#0f111a] border-y border-slate-200 dark:border-slate-800">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-electric-orange/10 dark:bg-electric-orange/5 rounded-full px-4 py-1.5 mb-6">
                            <Zap size={14} className="text-electric-orange" />
                            <span className="text-xs font-semibold text-electric-orange tracking-wider uppercase">
                                Lý Do Lựa Chọn
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                            Tại Sao Giới Kỹ Thuật Chọn TELECTRIC?
                        </h2>
                        <div className="w-16 h-1 bg-electric-orange mx-auto rounded-full" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <WhyChooseCard
                            icon={<Shield className="w-10 h-10" />}
                            emoji="⚡"
                            title="Chất Lượng Là Danh Dự"
                            description='Mỗi sản phẩm tại TELECTRIC đều đi kèm cam kết "Thép": Đền tiền gấp 10 lần ngay lập tức nếu quý khách phát hiện hàng giả, hàng nhái. Chúng tôi chỉ bán hàng chính hãng, hoặc không bán gì cả.'
                            highlight="Đền gấp 10x"
                        />
                        <WhyChooseCard
                            icon={<Truck className="w-10 h-10" />}
                            emoji="🚚"
                            title="Giao Hàng Thần Tốc"
                            description="Thời gian là vàng bạc. Dù bạn ở công trường hay xưởng máy, TELECTRIC giao hàng tận tay miễn phí trong 24-72h. Đặt là có, cần là giao."
                            highlight="Miễn phí vận chuyển"
                        />
                        <WhyChooseCard
                            icon={<RefreshCw className="w-10 h-10" />}
                            emoji="🛡️"
                            title="Bảo Hành Siêu Tốc"
                            description="Lỗi do nhà sản xuất? Đừng lo, chính sách 1 đổi 1 trong 10 ngày và bảo hành 12 tháng cho mọi sản phẩm sẽ giúp bạn hoàn toàn yên tâm sử dụng. Chúng tôi bảo hành cả niềm tin của bạn."
                            highlight="1 Đổi 1 trong 10 ngày"
                        />
                    </div>
                </div>
            </section>

            {/* ===== QUY TRÌNH MUA HÀNG ===== */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-electric-orange/10 dark:bg-electric-orange/5 rounded-full px-4 py-1.5 mb-6">
                            <ShoppingCart size={14} className="text-electric-orange" />
                            <span className="text-xs font-semibold text-electric-orange tracking-wider uppercase">
                                Hướng Dẫn Mua Hàng
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                            Quy Trình &quot;Rước&quot; Hàng Tại TELECTRIC
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            Dễ hơn ăn kẹo 🍬
                        </p>
                        <div className="w-16 h-1 bg-electric-orange mx-auto rounded-full mt-4" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <StepCard
                            step={1}
                            icon={<ShoppingCart className="w-8 h-8" />}
                            emoji="🛒"
                            title="Chốt Đơn Không Cần Nghĩ"
                            description='Dạo một vòng shop, ưng em máy đo nào thì "nhặt" ngay vào giỏ. Hàng chính hãng, thông số chuẩn, ảnh thật việc thật nên các bác cứ yên tâm mà chọn.'
                        />
                        <StepCard
                            step={2}
                            icon={<CreditCard className="w-8 h-8" />}
                            emoji="💸"
                            title="Ép Giá & Thanh Toán"
                            description='Có mã giảm giá? Add ngay kẻo phí! Muốn tâm sự thêm về giá hay kỹ thuật? Cứ liên hệ hotline/zalo để được tư vấn tận răng. Chốt được giá "nét nèn nẹt" thì mình thanh toán thôi.'
                        />
                        <StepCard
                            step={3}
                            icon={<Package className="w-8 h-8" />}
                            emoji="📦"
                            title="Ngồi Rung Đùi Chờ Hàng"
                            description="Việc còn lại để shipper và TELECTRIC lo. Hàng sẽ bay về tận cửa nhà các bác. Nhận hàng, kiểm tra, test máy thoải mái. Có vấn đề gì cứ ới em xử lý trong một nốt nhạc!"
                        />
                    </div>

                    {/* Connecting arrows (desktop only) */}
                    <div className="hidden md:flex justify-center items-center gap-4 mt-[-180px] mb-[140px] max-w-5xl mx-auto px-16 pointer-events-none">
                        <div className="flex-1" />
                        <ArrowRight className="text-electric-orange/30 w-8 h-8" />
                        <div className="flex-1" />
                        <ArrowRight className="text-electric-orange/30 w-8 h-8" />
                        <div className="flex-1" />
                    </div>
                </div>
            </section>

            {/* ===== CTA / SLOGAN SECTION ===== */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-electric-orange to-[#ff9a3e]" />
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                    }}
                />

                <div className="relative container mx-auto max-w-7xl px-4 py-16 md:py-20 text-center">
                    <Zap className="w-12 h-12 text-white/80 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                        TELECTRIC — Nơi Mua Sắm Thiết Bị Đo Không Lo Về Giá
                    </h2>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto mb-2">
                        Đo chuẩn xác, Làm an toàn.
                    </p>
                    <p className="text-white/60 text-sm">
                        Chuyên gia thiết bị đo — Uy tín tạo niềm tin.
                    </p>
                </div>
            </section>
        </div>
    )
}

/* ─── Sub-components ─── */

function CommitmentCard({
    icon,
    title,
    description,
    color,
}: {
    icon: React.ReactNode
    title: string
    description: string
    color: "orange" | "blue" | "green"
}) {
    const colorMap = {
        orange: {
            bg: "bg-orange-50 dark:bg-orange-900/10",
            icon: "text-electric-orange",
            border: "border-orange-100 dark:border-orange-900/20",
        },
        blue: {
            bg: "bg-blue-50 dark:bg-blue-900/10",
            icon: "text-blue-500",
            border: "border-blue-100 dark:border-blue-900/20",
        },
        green: {
            bg: "bg-emerald-50 dark:bg-emerald-900/10",
            icon: "text-emerald-500",
            border: "border-emerald-100 dark:border-emerald-900/20",
        },
    }

    const colors = colorMap[color]

    return (
        <Card className={`${colors.bg} ${colors.border} border hover:shadow-lg transition-all duration-300 group`}>
            <CardContent className="p-6 text-center">
                <div className={`${colors.icon} mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}

function WhyChooseCard({
    icon,
    emoji,
    title,
    description,
    highlight,
}: {
    icon: React.ReactNode
    emoji: string
    title: string
    description: string
    highlight: string
}) {
    return (
        <Card className="group bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-800 hover:border-electric-orange/50 hover:shadow-xl hover:shadow-electric-orange/5 transition-all duration-500">
            <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{emoji}</span>
                    <div className="text-electric-orange group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {description}
                </p>
                <div className="inline-flex items-center gap-2 bg-electric-orange/10 dark:bg-electric-orange/5 text-electric-orange text-xs font-bold px-3 py-1.5 rounded-full">
                    <CheckCircle size={12} />
                    {highlight}
                </div>
            </CardContent>
        </Card>
    )
}

function StepCard({
    step,
    icon,
    emoji,
    title,
    description,
}: {
    step: number
    icon: React.ReactNode
    emoji: string
    title: string
    description: string
}) {
    return (
        <div className="relative group">
            {/* Step number badge */}
            <div className="absolute -top-4 left-6 z-10">
                <div className="bg-electric-orange text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-electric-orange/30 group-hover:scale-110 transition-transform duration-300">
                    {step}
                </div>
            </div>

            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-800 hover:border-electric-orange/30 pt-8 transition-all duration-300 hover:shadow-lg h-full">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{emoji}</span>
                        <div className="text-slate-400 dark:text-slate-500">
                            {icon}
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {description}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
