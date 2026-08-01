import Link from 'next/link';
import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-industrial-black text-slate-900 dark:text-white pt-16 pb-8 mt-auto border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Cột 1: Điều hướng */}
                    <div>
                        <h4 className="font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-wider">Khám phá</h4>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-gray">
                            <li><Link href="/" className="hover:text-electric-orange transition-colors">Trang chủ</Link></li>
                            <li><Link href="/products" className="hover:text-electric-orange transition-colors">Sản phẩm</Link></li>

                            <li><Link href="/warranty-check" className="hover:text-electric-orange transition-colors">Tra cứu bảo hành</Link></li>
                            <li><Link href="/contact" className="hover:text-electric-orange transition-colors">Liên hệ</Link></li>
                        </ul>
                    </div>

                    {/* Cột 2: Chính sách */}
                    <div>
                        <h4 className="font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-wider">Chính sách</h4>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-gray">
                            <li><Link href="/chinh-sach/huong-dan-mua-hang" className="hover:text-electric-orange transition-colors">Hướng dẫn mua hàng</Link></li>
                            <li><Link href="/chinh-sach/chinh-sach-bao-hanh" className="hover:text-electric-orange transition-colors">Chính sách bảo hành &amp; đổi trả</Link></li>
                            <li><Link href="/chinh-sach/chinh-sach-van-chuyen" className="hover:text-electric-orange transition-colors">Vận chuyển &amp; thanh toán</Link></li>
                            <li><Link href="/chinh-sach/chinh-sach-bao-mat" className="hover:text-electric-orange transition-colors">Chính sách bảo mật</Link></li>
                            <li><Link href="/chinh-sach/quy-dinh-chung" className="hover:text-electric-orange transition-colors">Quy định chung</Link></li>
                            <li><Link href="/chinh-sach/giai-quyet-khieu-nai" className="hover:text-electric-orange transition-colors">Giải quyết khiếu nại</Link></li>
                        </ul>
                    </div>

                    {/* Cột 3: Hotline & Social */}
                    <div>
                        <h4 className="font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-wider">Hotline:</h4>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="text-electric-orange">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <a href="tel:0934001435" className="text-xl font-bold text-electric-orange hover:underline">
                                    093.400.14.35
                                </a>
                                <p className="text-xs text-slate-500">(9:00 - 17:30, Thứ 2 – Thứ 7)</p>
                            </div>
                        </div>

                        <h4 className="font-bold mb-4 text-slate-900 dark:text-white uppercase tracking-wider text-sm">Kết nối với chúng tôi:</h4>
                        <div className="flex gap-3">
                            <Link href="https://www.facebook.com/telectric1992/" target="_blank" rel="noopener noreferrer">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/500px-Facebook_Logo_%282019%29.png" alt="Facebook" className="h-6" />
                            </Link>
                            <Link href="https://shopee.vn/telectric" target="_blank" rel="noopener noreferrer">
                                <img src="https://play-lh.googleusercontent.com/vrrgAukb27gHzlI-lwHQoabie4ByvZKMN9QVN7jgd5KCFgEKCbQClsujkfqhExpfrUdS=w600-h300-pc0xffffff-pd" alt="Shopee" className="h-6" />
                            </Link>
                        </div>

                        <div className="mt-6">
                            <a href="http://online.gov.vn/Home/WebDetails/140980" target="_blank" rel="noopener noreferrer">
                                <img
                                    src="//bizweb.dktcdn.net/100/342/772/themes/701682/assets/guarantee_img.png?1692241652903"
                                    alt="Đã thông báo Bộ Công Thương"
                                    className="h-16 w-auto"
                                />
                            </a>
                        </div>
                    </div>

                    {/* Cột 4: Thông tin doanh nghiệp */}
                    <div>
                        <h4 className="font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-wider">Thông tin liên hệ</h4>
                        <div className="text-sm text-slate-600 dark:text-slate-gray space-y-3">
                            <p>
                                <strong className="text-slate-800 dark:text-slate-200">Tên hộ kinh doanh:</strong><br />
                                TELECTRIC
                            </p>
                            <p>
                                <strong className="text-slate-800 dark:text-slate-200">Địa chỉ:</strong><br />
                                61/9/6 ĐHT03, tổ 12, khu phố 5,<br />
                                Phường Tân Hưng Thuận, Quận 12, TP.HCM
                            </p>
                            <p>
                                <strong className="text-slate-800 dark:text-slate-200">Email:</strong>{' '}
                                <a href="mailto:khoa95905@gmail.com" className="hover:text-electric-orange transition-colors">
                                    khoa95905@gmail.com
                                </a>
                            </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/5">
                            <p className="italic text-xs text-slate-500 leading-relaxed">
                                Số GCNĐKKD: <span className="font-semibold text-slate-600 dark:text-slate-400">41L8037603</span><br />
                                Đăng ký lần đầu: 17/5/2023<br />
                                Cơ quan cấp: UBND Quận 12
                            </p>
                        </div>

                    </div>

                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-gray">
                    <p>
                        &copy; 2023–2026 <strong className="text-slate-700 dark:text-slate-300">TELECTRIC</strong>. All rights reserved.
                    </p>
                    <p className="text-center sm:text-right">
                        Đại diện: <strong className="text-slate-700 dark:text-slate-300">Nguyễn Đắc Tài</strong>
                        {' · '}
                        <a href="tel:0934001435" className="hover:text-electric-orange transition-colors">0934 001 435</a>
                    </p>

                </div>
            </div>
        </footer>
    );
};

export default Footer;