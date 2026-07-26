'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LoginView } from '@/mvc/views/LoginView';
import { HeaderView } from '@/mvc/views/HeaderView';
import { DashboardView } from '@/mvc/views/DashboardView';
import { CoffeeOrderView } from '@/mvc/views/CoffeeOrderView';
import { UserManagementView } from '@/mvc/views/UserManagementView';
import { PriceManagementView } from '@/mvc/views/PriceManagementView';
import { ChangePasswordView } from '@/mvc/views/ChangePasswordView';
import { ToastNotificationView } from '@/mvc/views/ToastNotificationView';

export default function MainPage() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'pastry' | 'coffee'>('pastry');

  // Application Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isOrderingWindowClosed, setIsOrderingWindowClosed] = useState(false);
  const [adminUsernames, setAdminUsernames] = useState<Set<string>>(new Set());

  // Modal States
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isPricesModalOpen, setIsPricesModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch Current Session
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        if (userData) {
          setUser(userData);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Orders Overview
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setIsOrderingWindowClosed(Boolean(data.isOrderingWindowClosed));
        if (Array.isArray(data.admins)) {
          setAdminUsernames(new Set(data.admins.map((a: string) => a.toLowerCase())));
        }
      }
    } catch {}
  }, []);

  // Fetch Products Catalog
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {}
  }, []);

  // Poll Orders & Products when user is logged in
  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchProducts();
      const interval = setInterval(() => {
        fetchOrders();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchOrders, fetchProducts]);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    showToast(`Chào mừng ${userData.username} đã đăng nhập!`, 'success');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    showToast('Đã đăng xuất khỏi hệ thống', 'success');
  };

  const handleToggleWindowStatus = async () => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFormClosed: !isOrderingWindowClosed })
      });
      if (res.ok) {
        const data = await res.json();
        setIsOrderingWindowClosed(data.isOrderingWindowClosed);
        showToast(data.isOrderingWindowClosed ? 'Đã đóng form đặt hàng!' : 'Đã mở form đặt hàng!', 'success');
      }
    } catch {
      showToast('Lỗi cập nhật trạng thái form!', 'error');
    }
  };

  if (!user) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onNotify={showToast}
        />
        <ToastNotificationView toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      {/* Header Bar */}
      <HeaderView
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOrderingWindowClosed={isOrderingWindowClosed}
        onToggleWindowStatus={handleToggleWindowStatus}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onOpenPricesModal={() => setIsPricesModalOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Screen Views */}
      <main className="pb-16">
        {activeTab === 'pastry' ? (
          <DashboardView
            user={user}
            orders={orders}
            products={products}
            isOrderingWindowClosed={isOrderingWindowClosed}
            adminUsernames={adminUsernames}
            onRefreshOrders={fetchOrders}
            onNotify={showToast}
          />
        ) : (
          <CoffeeOrderView
            user={user}
            orders={orders}
            products={products}
            isOrderingWindowClosed={isOrderingWindowClosed}
            onRefreshOrders={fetchOrders}
            onNotify={showToast}
          />
        )}
      </main>

      {/* Modals */}
      <UserManagementView
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        currentUser={user}
        onNotify={showToast}
      />

      <PriceManagementView
        isOpen={isPricesModalOpen}
        onClose={() => setIsPricesModalOpen(false)}
        onNotify={showToast}
      />

      <ChangePasswordView
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        currentUser={user}
        onNotify={showToast}
      />

      {/* Global Toast */}
      <ToastNotificationView toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
