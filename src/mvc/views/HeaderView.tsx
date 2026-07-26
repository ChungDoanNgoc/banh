import React from 'react';
import { Utensils, Coffee, Users, DollarSign, Key, LogOut, Lock, Unlock, ShieldCheck } from 'lucide-react';

interface HeaderViewProps {
  user: { username: string; role: string };
  activeTab: 'pastry' | 'coffee';
  setActiveTab: (tab: 'pastry' | 'coffee') => void;
  isOrderingWindowClosed: boolean;
  onToggleWindowStatus: () => void;
  onOpenUsersModal: () => void;
  onOpenPricesModal: () => void;
  onOpenPasswordModal: () => void;
  onLogout: () => void;
}

export const HeaderView: React.FC<HeaderViewProps> = ({
  user,
  activeTab,
  setActiveTab,
  isOrderingWindowClosed,
  onToggleWindowStatus,
  onOpenUsersModal,
  onOpenPricesModal,
  onOpenPasswordModal,
  onLogout,
}) => {
  const isAdmin = user.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tab Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
                <Utensils className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h1 className="font-extrabold text-base bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                  Bánh Tiêu & Coffee System
                </h1>
                <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider block">Strict MVC & Zero Hardcoded Hash</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
              <button
                onClick={() => setActiveTab('pastry')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'pastry'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Đặt Bánh Tiêu</span>
              </button>

              <button
                onClick={() => setActiveTab('coffee')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'coffee'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Đặt Cà Phê</span>
              </button>
            </nav>
          </div>

          {/* Controls & Profile */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleWindowStatus}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isOrderingWindowClosed 
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60' 
                      : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  }`}
                >
                  {isOrderingWindowClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isOrderingWindowClosed ? 'Form Đã Đóng' : 'Form Đang Mở'}</span>
                </button>

                <button
                  onClick={onOpenPricesModal}
                  className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
                  title="Quản lý Thực đơn & Đơn giá"
                >
                  <DollarSign className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenUsersModal}
                  className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
                  title="Quản lý Thành viên"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1 justify-end">
                  {user.username}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
                      <ShieldCheck className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={onOpenPasswordModal}
                className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
                title="Đổi Mật Khẩu"
              >
                <Key className="w-4 h-4" />
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-900/40"
                title="Đăng Xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900/90 px-4 py-2 gap-2">
        <button
          onClick={() => setActiveTab('pastry')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'pastry' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 bg-slate-800/50'
          }`}
        >
          <Utensils className="w-4 h-4" /> Đặt Bánh Tiêu
        </button>
        <button
          onClick={() => setActiveTab('coffee')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'coffee' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 bg-slate-800/50'
          }`}
        >
          <Coffee className="w-4 h-4" /> Đặt Cà Phê
        </button>
      </div>
    </header>
  );
};
