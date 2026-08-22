"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export function ChangePasswordDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const supabase = createClient();

  const handleReset = () => {
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast({
        variant: "success",
        title: "Đổi mật khẩu thành công!",
        description: "Mật khẩu của bạn đã được cập nhật an toàn.",
      });

      setOpen(false);
      handleReset();
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra khi đổi mật khẩu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="bg-slate-100 dark:bg-[#2a3040] border-slate-200 dark:border-0 hover:bg-slate-200 dark:hover:bg-[#353b4d] text-slate-900 dark:text-white"
          >
            Đổi mật khẩu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#121624] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
        <DialogHeader>
          <div className="mx-auto w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-electric-orange mb-1">
            <KeyRound className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            Đổi mật khẩu
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 dark:text-slate-400 text-sm">
            Nhập mật khẩu mới có tối thiểu 8 ký tự.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="new-pwd">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="new-pwd"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu mới"
                className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pr-10 text-slate-900 dark:text-white"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pwd">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Input
                id="confirm-pwd"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pr-10 text-slate-900 dark:text-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-electric-orange hover:bg-orange-600 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
