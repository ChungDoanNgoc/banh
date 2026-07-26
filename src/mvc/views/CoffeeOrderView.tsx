import React, { useState, useEffect } from 'react';
import { OrderGroupUtils } from '../utils/OrderGroupUtils';
import { Coffee, DollarSign, Trash2, CupSoda, X, User } from 'lucide-react';

interface CoffeeOrderViewProps {
  user: { username: string; role: string };
  orders: any[];
  products: any[];
  isOrderingWindowClosed: boolean;
  onRefreshOrders: () => void;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const CoffeeOrderView: React.FC<CoffeeOrderViewProps> = ({
  user,
  orders,
  products,
  isOrderingWindowClosed,
  onRefreshOrders,
  onNotify
}) => {
  const [selectedDrink, setSelectedDrink] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sugar, setSugar] = useState('Normal (100%)');
  const [ice, setIce] = useState('Normal (100%)');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const caffeProducts = products.filter(p => {
    if (p.flag === 2) return true;
    if (p.flag === 1) return false;
    const cat = (p.category || '').toLowerCase();
    if (cat === 'beverage' || cat === 'đồ uống') return true;
    return false;
  });

  useEffect(() => {
    if (caffeProducts.length > 0 && (!selectedDrink || !caffeProducts.some(p => p.name === selectedDrink))) {
      setSelectedDrink(caffeProducts[0].name);
    }
  }, [caffeProducts, selectedDrink]);

  const caffeOrders = orders.filter(o => o.category === 'beverage' || o.productName?.toLowerCase().includes('cà phê') || o.productName?.toLowerCase().includes('trà'));

  const currentDrinkName = selectedDrink || (caffeProducts.length > 0 ? caffeProducts[0].name : 'Cà Phê Đen');

  const totalQuantity = caffeOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
  
  const groupedOrders = OrderGroupUtils.groupOrdersByCustomer(caffeOrders);
  const totalRevenue = groupedOrders.reduce((sum, g) => sum + g.finalTotalPrice, 0);

  // Phí ship = 1.000đ * số người đặt
  const orderingUserCount = groupedOrders.length;
  const totalShippingFee = orderingUserCount * 1000;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedProd = caffeProducts.find(p => p.name === currentDrinkName);
    const unitPrice = matchedProd ? matchedProd.price : 15000;

    const fullNote = [
      `Đường: ${sugar}`,
      `Đá: ${ice}`,
      note ? `Ghi chú: ${note}` : ''
    ].filter(Boolean).join(' | ');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user.username,
          category: 'beverage',
          productName: currentDrinkName,
          quantity,
          unitPrice,
          note: fullNote
        })
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        onNotify(data.error || 'Đặt đồ uống thất bại!', 'error');
      } else {
        onNotify('Đặt đồ uống thành công!', 'success');
        setQuantity(1);
        setNote('');
        onRefreshOrders();
      }
    } catch {
      setIsSubmitting(false);
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  const handleDeleteUserOrders = async (customerName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tất cả đơn đồ uống của ${customerName}?`)) return;
    try {
      const res = await fetch(`/api/orders?customerName=${encodeURIComponent(customerName)}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify(`Đã xóa đơn của ${customerName}!`, 'success');
        onRefreshOrders();
      }
    } catch {
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Metric Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Tổng Ly Đã Đặt</span>
            <div className="text-2xl font-black text-slate-100">{totalQuantity} ly</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Tổng Tiền Cà Phê (+1k/User)</span>
            <div className="text-2xl font-black text-emerald-400">{totalRevenue.toLocaleString('vi-VN')} đ</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
            <CupSoda className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Phí Ship</span>
            <div className="text-2xl font-black text-orange-400">{totalShippingFee.toLocaleString('vi-VN')} đ</div>
            <span className="text-[10px] text-slate-500">({orderingUserCount} người đặt x 1.000đ)</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl h-fit space-y-6 shadow-xl">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-slate-100">Đặt Cà Phê & Đồ Uống</h2>
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

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Loại Đồ Uống</label>
              <select
                value={currentDrinkName}
                onChange={(e) => setSelectedDrink(e.target.value)}
                disabled={isOrderingWindowClosed}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none font-semibold"
              >
                {caffeProducts.length === 0 ? (
                  <option value="">Đang tải thực đơn đồ uống...</option>
                ) : (
                  caffeProducts.map((p) => (
                    <option key={p.id || p.name} value={p.name}>
                      {p.name} - {p.price.toLocaleString('vi-VN')} đ
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Đường</label>
                <select
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  disabled={isOrderingWindowClosed}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="Normal (100%)">100% Đường</option>
                  <option value="70% Đường">70% Đường</option>
                  <option value="50% Đường">50% Đường</option>
                  <option value="Không Đường">Không Đường</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Đá</label>
                <select
                  value={ice}
                  onChange={(e) => setIce(e.target.value)}
                  disabled={isOrderingWindowClosed}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="Normal (100%)">100% Đá</option>
                  <option value="70% Đá">70% Đá</option>
                  <option value="Ít Đá">Ít Đá</option>
                  <option value="Không Đá">Không Đá</option>
                  <option value="Nóng">Uống Nóng</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Số Lượng</label>
              <input
                type="number"
                min="1"
                max="20"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={isOrderingWindowClosed}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ghi Chú Thêm</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thêm sữa, đậm đà..."
                disabled={isOrderingWindowClosed}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isOrderingWindowClosed || isSubmitting}
              className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isOrderingWindowClosed ? 'Form Đặt Hàng Đã Đóng' : 'Xác Nhận Đặt Cà Phê'}
            </button>
          </form>
        </div>

        {/* Table Column */}
        <div className="lg:col-span-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl space-y-6 shadow-2xl">
          <div>
            <h3 className="font-bold text-lg text-slate-100">Danh Sách Đặt Cà Phê Hôm Nay</h3>
            <p className="text-xs text-slate-400">Gộp theo người dùng ({groupedOrders.length} người đặt - tổng {caffeOrders.length} đơn)</p>
          </div>

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
                {groupedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                      Chưa có đơn đặt cà phê nào
                    </td>
                  </tr>
                ) : (
                  groupedOrders.map((group) => {
                    const isOwnerOrAdmin = user.role === 'ADMIN' || user.username.toLowerCase() === group.customerName.toLowerCase();

                    return (
                      <tr key={group.customerName} className="hover:bg-slate-800/60 transition-all">
                        <td className="p-4 font-bold text-amber-400 border-r border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                              <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-black">{group.customerName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center border-r border-slate-800/60">
                          <span className="inline-block px-3 py-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-extrabold rounded-xl text-xs shadow-sm">
                            {group.totalQuantity} ly
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-100 border-r border-slate-800/60">
                          <div className="space-y-1 text-sm leading-relaxed">
                            {group.itemsSummaryLines.map((line, lIdx) => (
                              <div key={lIdx} className="font-bold text-slate-200">{line}</div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right font-black text-amber-400 text-sm font-mono border-r border-slate-800/60">
                          {group.totalPrice.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="p-4 text-right font-black text-amber-400 text-sm font-mono border-r border-slate-800/60">
                          {group.finalTotalPrice.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="p-4 text-center">
                          {isOwnerOrAdmin && (
                            <button
                              onClick={() => handleDeleteUserOrders(group.customerName)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/50 text-rose-400 rounded-xl transition-all shadow-sm cursor-pointer"
                              title="Xóa đơn hàng"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};
