import React, { useState, useEffect } from 'react';
import { OrderGroupUtils, IGroupedCustomerOrders } from '../utils/OrderGroupUtils';
import { Utensils, ShoppingBag, DollarSign, Download, Trash2, XCircle, Search, Clock, Lock, Filter, User, X } from 'lucide-react';

interface DashboardViewProps {
  user: { username: string; role: string };
  orders: any[];
  products: any[];
  isOrderingWindowClosed: boolean;
  adminUsernames: Set<string>;
  onRefreshOrders: () => void;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  orders,
  products,
  isOrderingWindowClosed,
  adminUsernames,
  onRefreshOrders,
  onNotify
}) => {
  const [selectedPastry, setSelectedPastry] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');

  // State cho Modal Update Đơn Hàng
  const [updatingGroup, setUpdatingGroup] = useState<IGroupedCustomerOrders | null>(null);
  const [editingItemQuantities, setEditingItemQuantities] = useState<Record<string, number>>({});
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  // Lọc danh sách các món bánh từ bảng thực đơn Settings
  const pastryProducts = products.filter(p => {
    if (p.flag === 1) return true;
    if (p.flag === 2) return false;
    const cat = (p.category || '').toLowerCase();
    if (cat === 'beverage' || cat === 'đồ uống') return false;
    return true;
  });

  useEffect(() => {
    if (pastryProducts.length > 0 && (!selectedPastry || !pastryProducts.some(p => p.name === selectedPastry))) {
      setSelectedPastry(pastryProducts[0].name);
    }
  }, [pastryProducts, selectedPastry]);

  const currentPastryName = selectedPastry || (pastryProducts.length > 0 ? pastryProducts[0].name : 'Bánh Tiêu');

  const pastryOrders = orders.filter(o => o.category === 'pastry' || o.flag === 1 || (o.productName || o.type || '').toLowerCase().includes('bánh'));

  const totalQuantity = pastryOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
  
  const groupedOrders = OrderGroupUtils.groupOrdersByCustomer(pastryOrders);

  // Tổng tiền bánh tính theo tổng tiền cuối cùng của từng user (+1000đ mỗi user)
  const totalRevenue = groupedOrders.reduce((sum, g) => sum + g.finalTotalPrice, 0);
  const unpaidCount = pastryOrders.filter(o => !o.isPaid).length;

  // Tính phí ship = 1.000 đ * Số lượng User đặt hàng
  const orderingUserCount = groupedOrders.length;
  const totalShippingFee = orderingUserCount * 1000;

  const filteredGroupedOrders = groupedOrders.filter(g => {
    const matchesSearch = g.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.itemsSummary.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterPaid === 'paid') return g.isPaid;
    if (filterPaid === 'unpaid') return !g.isPaid;
    return true;
  });

  // Tính tổng hàng TỔNG CỘNG
  const grandTotalQuantity = filteredGroupedOrders.reduce((sum, g) => sum + g.totalQuantity, 0);
  const grandTotalPrice = filteredGroupedOrders.reduce((sum, g) => sum + g.totalPrice, 0);
  const grandFinalTotalPrice = filteredGroupedOrders.reduce((sum, g) => sum + g.finalTotalPrice, 0);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedProd = pastryProducts.find(p => p.name === currentPastryName);
    const unitPrice = matchedProd ? matchedProd.price : 6000;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user.username,
          category: 'pastry',
          productName: currentPastryName,
          quantity,
          unitPrice,
          note
        })
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        onNotify(data.error || 'Đặt bánh thất bại!', 'error');
      } else {
        onNotify('Đặt bánh thành công!', 'success');
        setQuantity(1);
        setNote('');
        onRefreshOrders();
      }
    } catch {
      setIsSubmitting(false);
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  // Mở Modal Update số lượng
  const handleOpenUpdateModal = (group: IGroupedCustomerOrders) => {
    const initialQtyMap: Record<string, number> = {};
    group.items.forEach(item => {
      if (item.id) {
        initialQtyMap[item.id] = item.quantity || 1;
      }
    });
    setEditingItemQuantities(initialQtyMap);
    setUpdatingGroup(group);
  };

  // Lưu số lượng từ Modal Update
  const handleSaveUpdateModal = async () => {
    if (!updatingGroup) return;
    setIsSavingUpdate(true);

    try {
      for (const item of updatingGroup.items) {
        const newQty = editingItemQuantities[item.id!];
        if (newQty !== undefined && newQty !== item.quantity) {
          await fetch(`/api/orders/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: Math.max(1, newQty) })
          });
        }
      }
      onNotify(`Cập nhật đơn hàng của ${updatingGroup.customerName} thành công!`, 'success');
      setUpdatingGroup(null);
      onRefreshOrders();
    } catch {
      onNotify('Lỗi cập nhật số lượng!', 'error');
    } finally {
      setIsSavingUpdate(false);
    }
  };

  // Xóa đúng 1 record đơn hàng cụ thể theo id (Dùng trong Modal Update)
  const handleDeleteSingleRecord = async (orderId: string, productName: string, customerName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa món "${productName}" của ${customerName}?`)) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify(`Đã xóa món "${productName}"!`, 'success');
        if (updatingGroup) {
          const updatedItems = updatingGroup.items.filter(i => i.id !== orderId);
          if (updatedItems.length === 0) {
            setUpdatingGroup(null);
          } else {
            setUpdatingGroup({
              ...updatingGroup,
              items: updatedItems
            });
          }
        }
        onRefreshOrders();
      } else {
        onNotify('Không thể xóa món này!', 'error');
      }
    } catch {
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  // Xóa toàn bộ đơn của 1 User khi nhấp nút X ở mục Thao tác
  const handleDeleteUserOrders = async (customerName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đơn đặt của ${customerName}?`)) return;
    try {
      const res = await fetch(`/api/orders?customerName=${encodeURIComponent(customerName)}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify(`Đã xóa thành công đơn hàng của ${customerName}!`, 'success');
        onRefreshOrders();
      } else {
        onNotify('Lỗi khi xóa đơn hàng!', 'error');
      }
    } catch {
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  const handleResetOrders = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ đơn hàng trong ngày?')) return;
    try {
      const res = await fetch('/api/orders', { method: 'DELETE' });
      if (res.ok) {
        onNotify('Đã xóa toàn bộ đơn hàng!', 'success');
        onRefreshOrders();
      }
    } catch {
      onNotify('Lỗi khi reset!', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetch('/api/export');
      if (!res.ok) {
        onNotify('Lỗi xuất tệp Excel!', 'error');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BanhTieu_Orders_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onNotify('Xuất báo cáo Excel thành công!', 'success');
    } catch {
      onNotify('Lỗi xuất tệp Excel!', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Tổng Bánh Đã Đặt</span>
            <div className="text-2xl font-black text-slate-100">{totalQuantity} cái</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Tổng Tiền Bánh (+1k/User)</span>
            <div className="text-2xl font-black text-emerald-400">{totalRevenue.toLocaleString('vi-VN')} đ</div>
          </div>
        </div>

        {/* Cập nhật Phí Ship = 1.000đ * Số User đặt */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Phí Ship</span>
            <div className="text-2xl font-black text-orange-400">{totalShippingFee.toLocaleString('vi-VN')} đ</div>
            <span className="text-[10px] text-slate-500">({orderingUserCount} người đặt x 1.000đ)</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Chưa Thanh Toán</span>
            <div className="text-2xl font-black text-rose-400">{unpaidCount} đơn</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl h-fit space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base text-slate-100">Đăng Ký Đặt Bánh</h2>
            </div>
            {isOrderingWindowClosed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/40">
                <Lock className="w-3 h-3" /> Form Đã Đóng
              </span>
            )}
          </div>

          <form onSubmit={handleOrderSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Người Đặt</label>
              <input
                type="text"
                value={user.username}
                readOnly
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-300 font-medium"
              />
            </div>

            {/* Pastry Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Loại Bánh</label>
              <select
                value={currentPastryName}
                onChange={(e) => setSelectedPastry(e.target.value)}
                disabled={isOrderingWindowClosed}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none font-semibold"
              >
                {pastryProducts.length === 0 ? (
                  <option value="">Đang tải thực đơn bánh...</option>
                ) : (
                  pastryProducts.map((p) => (
                    <option key={p.id || p.name} value={p.name}>
                      {p.name} - {p.price.toLocaleString('vi-VN')} đ
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Số Lượng</label>
              <input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={isOrderingWindowClosed}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ghi Chú</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhiều mè, ít đường..."
                disabled={isOrderingWindowClosed}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isOrderingWindowClosed || isSubmitting}
              className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isOrderingWindowClosed ? 'Form Đặt Hàng Đã Đóng' : 'Xác Nhận Đặt Bánh'}
            </button>
          </form>
        </div>

        {/* Orders Table Column - Premium Border & High Visibility Frame */}
        <div className="lg:col-span-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-100">Danh Sách Đặt Bánh Hôm Nay</h3>
              <p className="text-xs text-slate-400">Gộp theo người dùng ({groupedOrders.length} người đặt - tổng {pastryOrders.length} đơn)</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>

              {user.role === 'ADMIN' && (
                <button
                  onClick={handleResetOrders}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Reset Ngày
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={filterPaid}
                onChange={(e) => setFilterPaid(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">Tất cả thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
              </select>
            </div>
          </div>

          {/* Premium Border Container Frame */}
          <div className="overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-slate-950/90 shadow-2xl shadow-amber-500/5">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-black text-[11px] uppercase tracking-wider border-b-2 border-amber-500/40">
                <tr>
                  <th className="p-4 border-r border-slate-800/80">TÊN NGƯỜI ĐẶT</th>
                  <th className="p-4 text-center border-r border-slate-800/80">SỐ LƯỢNG</th>
                  <th className="p-4 border-r border-slate-800/80">TÊN SẢN PHẨM</th>
                  <th className="p-4 text-right border-r border-slate-800/80">THÀNH TIỀN</th>
                  <th className="p-4 text-right border-r border-slate-800/80">
                    <div>TỔNG THANH TOÁN</div>
                    <div className="text-[9px] font-medium text-amber-500/80 lowercase tracking-normal">(+1.000đ phí vận chuyển)</div>
                  </th>
                  <th className="p-4 text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredGroupedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                      Chưa có đơn đặt bánh phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredGroupedOrders.map((group) => {
                    const isOwnerOrAdmin = user.role === 'ADMIN' || user.username.toLowerCase() === group.customerName.toLowerCase();

                    return (
                      <tr key={group.customerName} className="hover:bg-slate-800/60 transition-all">
                        {/* TÊN NGƯỜI ĐẶT */}
                        <td className="p-4 font-bold text-amber-400 border-r border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                              <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-black">{group.customerName}</span>
                          </div>
                        </td>

                        {/* SỐ LƯỢNG */}
                        <td className="p-4 text-center border-r border-slate-800/60">
                          <span className="inline-block px-3 py-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-extrabold rounded-xl text-xs shadow-sm">
                            {group.totalQuantity} cái
                          </span>
                        </td>

                        {/* TÊN SẢN PHẨM */}
                        <td className="p-4 font-semibold text-slate-100 border-r border-slate-800/60">
                          <div className="space-y-1 text-sm leading-relaxed">
                            {group.itemsSummaryLines.map((line, lIdx) => (
                              <div key={lIdx} className="font-bold text-slate-200">{line}</div>
                            ))}
                          </div>
                        </td>

                        {/* THÀNH TIỀN (Gốc) */}
                        <td className="p-4 text-right font-black text-amber-400 text-sm font-mono border-r border-slate-800/60">
                          {group.totalPrice.toLocaleString('vi-VN')}đ
                        </td>

                        {/* TỔNG THANH TOÁN (+1.000đ phí vận chuyển) */}
                        <td className="p-4 text-right font-black text-amber-400 text-sm font-mono border-r border-slate-800/60">
                          {group.finalTotalPrice.toLocaleString('vi-VN')}đ
                        </td>

                        {/* THAO TÁC */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isOwnerOrAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenUpdateModal(group)}
                                  className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-400 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                                >
                                  Update
                                </button>
                                <button
                                  onClick={() => handleDeleteUserOrders(group.customerName)}
                                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/50 text-rose-400 rounded-xl transition-all shadow-sm cursor-pointer"
                                  title="Xóa đơn hàng"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Dòng TỔNG CỘNG */}
                {filteredGroupedOrders.length > 0 && (
                  <tr className="bg-amber-500/5 font-black text-slate-100 border-t-2 border-amber-500/50">
                    <td className="p-4 text-slate-200 uppercase tracking-wider font-black border-r border-slate-800/80">
                      TỔNG CỘNG
                    </td>
                    <td className="p-4 text-center border-r border-slate-800/80">
                      <span className="inline-block px-3 py-1.5 bg-amber-500/20 border border-amber-500/60 text-amber-400 font-extrabold rounded-xl text-xs shadow-sm">
                        {grandTotalQuantity} cái
                      </span>
                    </td>
                    <td className="p-4 border-r border-slate-800/80"></td>
                    <td className="p-4 text-right text-amber-400 text-sm font-black font-mono border-r border-slate-800/80">
                      {grandTotalPrice.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-4 text-right text-amber-400 text-sm font-black font-mono border-r border-slate-800/80">
                      {grandFinalTotalPrice.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-4"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* Modal Update Đơn Hàng & Xóa Record Cụ Thể */}
      {updatingGroup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Cập Nhật Đơn Bánh</h3>
                <p className="text-xs text-amber-400 font-semibold">{updatingGroup.customerName}</p>
              </div>
              <button
                onClick={() => setUpdatingGroup(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {updatingGroup.items.map((item) => {
                const pName = item.productName || item.type || 'Bánh Tiêu';
                const currentQty = editingItemQuantities[item.id!] ?? item.quantity;

                return (
                  <div key={item.id} className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div>
                      <div className="font-bold text-amber-300 text-sm">{pName}</div>
                      <div className="text-xs text-slate-400">Đơn giá: {item.unitPrice?.toLocaleString('vi-VN')} đ</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingItemQuantities(prev => ({
                            ...prev,
                            [item.id!]: Math.max(1, (prev[item.id!] || item.quantity) - 1)
                          }))}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded-lg flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-slate-100 text-sm">{currentQty}</span>
                        <button
                          onClick={() => setEditingItemQuantities(prev => ({
                            ...prev,
                            [item.id!]: (prev[item.id!] || item.quantity) + 1
                          }))}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded-lg flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Nút Xóa Riêng Record Này */}
                      <button
                        onClick={() => handleDeleteSingleRecord(item.id!, pName, updatingGroup.customerName)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title={`Xóa riêng món ${pName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUpdatingGroup(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveUpdateModal}
                disabled={isSavingUpdate}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSavingUpdate ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
