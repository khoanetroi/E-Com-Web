import Link from "next/link";
import { Mail, Phone, HelpCircle, User } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";

export const TopBar = () => {
    return (
        <div className="w-full bg-industrial-black text-slate-gray py-2 text-xs border-b border-white/10">
            <div className="container mx-auto px-4 flex justify-between items-center">
                {/* Left Side: Contact Info */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                        <Phone size={14} className="text-electric-orange" />
                        <span>Hotline: <strong className="text-white">093.400.14.35</strong></span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer hidden sm:flex">
                        <Mail size={14} className="text-electric-orange" />
                        <span>Email: <strong className="text-white">telectric1992@gmail.com</strong></span>
                    </div>
                </div>

                {/* Right Side: Utils */}
                <div className="flex items-center gap-6">
                    <Link href="/support" className="flex items-center gap-2 hover:text-white transition-colors">
                        <HelpCircle size={14} />
                        <span>Hỗ trợ khách hàng</span>
                    </Link>
                    <LoginModal>
                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                            <User size={14} />
                            <span>Tài khoản</span>
                        </button>
                    </LoginModal>
                </div>
            </div>
        </div>
    );
};
