import React, { useState, useEffect } from 'react';
import { DollarSign, X, Plus, Save, Trash2 } from 'lucide-react';

interface PriceManagementViewProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const PriceManagementView: React.FC<PriceManagementViewProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState(10000);
  const [newProductCategory, setNewProductCategory] = useState<'pastry' | 'beverage'>('pastry');
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const list = await res.json();
        setProducts(list);
        const initialPrices: Record<string, number> = {};
        list.forEach((p: any) => {
          initialPrices[p.id] = p.price;
        });
        setEditingPrices(initialPrices);
      } else {
        onNotify('Lỗi tải sản phẩm!', 'error');
      }
    } catch {
      onNotify('Lỗi tải sản phẩm!', 'error');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePrice = async (id: string) => {
    const price = editingPrices[id];
    if (price === undefined || price < 0) {
      onNotify('Đơn giá không hợp lệ!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Cập nhật giá thất bại!', 'error');
      } else {
        onNotify('Cập nhật đơn giá thành công!', 'success');
        fetchProducts();
      }
    } catch {
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      onNotify('Vui lòng nhập tên món mới!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          price: newProductPrice,
          category: newProductCategory
        })
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Thêm sản phẩm thất bại!', 'error');
      } else {
        onNotify('Thêm món mới thành công!', 'success');
        setNewProductName('');
        setNewProductPrice(10000);
        fetchProducts();
      }
    } catch {
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Xóa món thất bại!', 'error');
      } else {
        onNotify('Đã xóa món thành công!', 'success');
        fetchProducts();
      }
    } catch {
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Quản Lý Thực Đơn & Đơn Giá</h3>
              <p className="text-xs text-slate-400">Thay đổi đơn giá hoặc bổ sung món ăn/đồ uống mới</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Form */}
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Thêm Món Mới
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Tên món..."
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Giá (đ)..."
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
            />
            <select
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
            >
              <option value="pastry">Bánh Tiêu</option>
              <option value="beverage">Cà Phê / Đồ Uống</option>
            </select>
          </div>

          <button
            onClick={handleAddProduct}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Lưu Món Mới
          </button>
        </div>

        {/* Catalog Table */}
        <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-3">Tên Món</th>
                <th className="p-3">Danh Mục</th>
                <th className="p-3 text-right">Đơn Giá (VNĐ)</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-100">{p.name}</td>
                  <td className="p-3">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      {p.category === 'beverage' ? 'Đồ Uống' : 'Bánh Tiêu'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      value={editingPrices[p.id] ?? p.price}
                      onChange={(e) => setEditingPrices({ ...editingPrices, [p.id]: Number(e.target.value) })}
                      className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right text-xs text-amber-300 font-bold focus:outline-none"
                    />
                  </td>
                  <td className="p-3 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleUpdatePrice(p.id)}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                      title="Lưu đơn giá"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Xóa món"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
