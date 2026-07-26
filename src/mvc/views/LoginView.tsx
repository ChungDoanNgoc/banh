import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, Sparkles, UtensilsCrossed } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: any, token: string) => void;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNotify }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isRegistering) {
      if (password !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không trùng khớp!');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        setIsLoading(false);

        if (!res.ok) {
          setErrorMessage(data.error || 'Đăng ký thất bại!');
          onNotify(data.error || 'Đăng ký thất bại!', 'error');
        } else {
          onNotify('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
          setIsRegistering(false);
          setPassword('');
          setConfirmPassword('');
        }
      } catch {
        setIsLoading(false);
        setErrorMessage('Lỗi kết nối máy chủ!');
        onNotify('Lỗi kết nối máy chủ!', 'error');
      }
    } else {
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, isAdminMode })
        });
        const data = await res.json();
        setIsLoading(false);

        if (!res.ok) {
          setErrorMessage(data.error || 'Đăng nhập thất bại!');
          onNotify(data.error || 'Đăng nhập thất bại!', 'error');
        } else {
          onNotify('Đăng nhập thành công!', 'success');
          onLoginSuccess(data.user, data.token || '');
        }
      } catch {
        setIsLoading(false);
        setErrorMessage('Lỗi kết nối máy chủ!');
        onNotify('Lỗi kết nối máy chủ!', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/20 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400 bg-clip-text text-transparent">
            Bánh Tiêu & Coffee System
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {isRegistering ? 'Đăng ký tài khoản hệ thống' : 'Đăng nhập hệ thống MVC chuẩn'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tên Đăng Nhập
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên tài khoản..."
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Mật Khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Confirm Password (Register mode) */}
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Xác Nhận Mật Khẩu
              </label>
              <div className="relative">
                <ShieldCheck className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-amber-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Admin Mode Toggle */}
          {!isRegistering && (
            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAdminMode}
                  onChange={(e) => setIsAdminMode(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs font-semibold text-slate-400 hover:text-slate-200">
                  Chế độ Quản Trị Viên (Admin)
                </span>
              </label>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="text-xs">Đang xử lý...</span>
            ) : (
              <>
                <span>{isRegistering ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMessage(null);
            }}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký tại đây'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
