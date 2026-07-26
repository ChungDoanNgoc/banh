import React, { useState } from 'react';
import { Key, X } from 'lucide-react';

interface ChangePasswordViewProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string };
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNotify
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      onNotify('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      onNotify('Mật khẩu xác nhận không trùng khớp!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        onNotify(data.error || 'Đổi mật khẩu thất bại!', 'error');
      } else {
        onNotify('Đổi mật khẩu thành công!', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }
    } catch {
      setIsLoading(false);
      onNotify('Lỗi hệ thống!', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Đổi Mật Khẩu Tài Khoản</h3>
              <p className="text-xs text-slate-400">Cập nhật mật khẩu mã hóa Bcrypt động mới</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Mật Khẩu Hiện Tại</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Mật Khẩu Mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Xác Nhận Mật Khẩu Mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
          </button>
        </form>

      </div>
    </div>
  );
};
