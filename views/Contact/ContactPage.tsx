import ContactForm from "@/components/contact/contact-form";
import { MapPin, Phone, Mail } from "lucide-react";
import DefaultLayout from "@/components/layout/DefaultLayout";

export default function ContactPage() {
    return (
        <DefaultLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-[#0a0d14]">
                {/* Header Gradient Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1a2332] to-[#0F172A] py-16 md:py-20 text-center border-b border-white/5">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 right-1/4 w-96 h-96 bg-electric-orange/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-electric-orange/5 rounded-full blur-3xl pointer-events-none" />
                        <div
                            className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{
                                backgroundImage: `linear-gradient(rgba(255,122,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,0,0.3) 1px, transparent 1px)`,
                                backgroundSize: "60px 60px",
                            }}
                        />
                    </div>

                    <div className="relative container mx-auto px-4 z-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                            LIÊN HỆ VỚI CHÚNG TÔI
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Đội ngũ TELECTRIC luôn sẵn sàng hỗ trợ kỹ thuật và giải đáp mọi thắc mắc của bạn một cách nhanh chóng nhất.
                        </p>
                    </div>
                </section>

                <div className="container mx-auto max-w-7xl px-4 py-16">
                    {/* Google Map Section - Elevated */}
                    <div className="w-full mb-16 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/60 h-[450px] relative group bg-white dark:bg-[#1e2330]">
                        <div className="absolute inset-0 bg-electric-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.6860264017773!2d106.62672649999999!3d10.8353222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752bd517fb85c7%3A0x219d0aa30363d8cb!2zNjEgxJDDtG5nIEjGsG5nIFRodeG6rW4gMywgxJDDtG5nIEjGsG5nIFRodeG6rW4sIFF14bqtbiAxMiwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1772371183545!5m2!1sen!2s"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="w-full h-full grayscale-[10%] contrast-[1.1] group-hover:grayscale-0 transition-all duration-700"
                        ></iframe>
                    </div>

                    {/* Unified Premium Contact Card */}
                    <div className="rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1e2330] flex flex-col lg:flex-row">

                        {/* Left Side: Contact Info Sidebar */}
                        <div className="w-full lg:w-2/5 p-8 md:p-12 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/5">
                            {/* Background decoration */}
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-electric-orange/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10 h-full flex flex-col justify-between space-y-12">

                                <div className="space-y-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                                            <div className="bg-orange-50 dark:bg-orange-500/10 p-2 rounded-xl text-electric-orange">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            Hotline Hỗ Trợ
                                        </h3>
                                        <div className="pl-4 border-l-2 border-electric-orange">
                                            <a href="tel:0934001435" className="text-3xl font-extrabold text-electric-orange mb-1 tracking-tight hover:underline block">093.400.14.35</a>
                                            <p className="text-sm text-slate-500 font-medium">(9:00 - 17:30, Thứ 2 - Thứ 7)</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                                            <div className="bg-orange-50 dark:bg-orange-500/10 p-2 rounded-xl text-electric-orange">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            Thông Tin Liên Hệ
                                        </h3>

                                        <div className="space-y-6 text-slate-600 dark:text-slate-400">
                                            <div className="flex gap-4">
                                                <div className="mt-1"><MapPin className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" /></div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white mb-1">Địa điểm kinh doanh:</p>
                                                    <p className="leading-relaxed">61/9/6 ĐHT03, tổ 12, khu phố 5,<br />Phường Tân Hưng Thuận, Quận 12, TP.HCM</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 items-center">
                                                <div><Mail className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" /></div>
                                                <a href="mailto:telectric1992@gmail.com" className="hover:text-electric-orange font-medium transition-colors">
                                                    telectric1992@gmail.com
                                                </a>
                                            </div>

                                            <div className="pt-6 border-t border-slate-200 dark:border-white/5">
                                                <p className="italic text-xs text-slate-500 leading-relaxed">
                                                    Số GCNĐKKD: <span className="font-semibold text-slate-600 dark:text-slate-400">41L8037603</span><br />
                                                    Đăng ký lần đầu: 17/5/2023<br />
                                                    Đại diện: <span className="font-semibold text-slate-600 dark:text-slate-400">Nguyễn Đắc Tài</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 lg:mt-0">
                                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 text-sm">
                                        KẾT NỐI VỚI CHÚNG TÔI
                                    </h3>
                                    <div className="flex gap-4">
                                        <a href="https://www.facebook.com/telectric1992/" target="_blank" rel="noreferrer" className="transform hover:-translate-y-1 transition-transform duration-300 drop-shadow-sm hover:opacity-90">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/500px-Facebook_Logo_%282019%29.png" alt="Facebook" className="h-10" />
                                        </a>
                                        <a href="https://shopee.vn/telectric" target="_blank" rel="noreferrer" className="transform hover:-translate-y-1 transition-transform duration-300 drop-shadow-sm hover:opacity-90">
                                            <img src="https://play-lh.googleusercontent.com/vrrgAukb27gHzlI-lwHQoabie4ByvZKMN9QVN7jgd5KCFgEKCbQClsujkfqhExpfrUdS=w600-h300-pc0xffffff-pd" alt="Shopee" className="h-10 rounded-lg" />
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Right Side: Contact Form Section */}
                        <div className="w-full lg:w-3/5 p-8 md:p-12 relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-electric-orange/5 rounded-full blur-3xl -z-0 pointer-events-none" />
                            <div className="relative z-10 w-full mb-8">
                                <h2 className="text-3xl font-extrabold mb-3 text-slate-900 dark:text-white tracking-tight">Gửi Yêu Cầu</h2>
                                <p className="text-slate-500 dark:text-slate-400">Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất qua email hoặc điện thoại.</p>
                            </div>
                            <div className="relative z-10">
                                <ContactForm />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
}
