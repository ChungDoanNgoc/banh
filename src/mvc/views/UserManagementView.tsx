import React, { useState, useEffect } from 'react';
import { Users, X, Trash2, ShieldCheck, Search, UserCheck } from 'lucide-react';

interface UserManagementViewProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; role: string };
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNotify
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        onNotify('Lỗi tải danh sách người dùng!', 'error');
      }
    } catch {
      onNotify('Lỗi tải danh sách người dùng!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (targetUsername: string) => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(targetUsername)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Xóa tài khoản thất bại!', 'error');
      } else {
        onNotify(`Đã xóa thành công tài khoản ${targetUsername}!`, 'success');
        fetchUsers();
      }
    } catch {
      onNotify('Lỗi kết nối máy chủ!', 'error');
    }
  };

  const handlePromoteToAdmin = async (targetUsername: string) => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(targetUsername)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN' })
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify(data.error || 'Nâng quyền Admin thất bại!', 'error');
      } else {
        onNotify(`Đã cấp quyền Admin cho tài khoản ${targetUsername}!`, 'success');
        fetchUsers();
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
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Quản Lý Thành Viên (Firebase Firestore)</h3>
              <p className="text-xs text-slate-400">Danh sách tài khoản an toàn tuyệt đối (Đã loại bỏ Mật Khẩu)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-3">Tên Tài Khoản</th>
                <th className="p-3 text-center">Vai Trò</th>
                <th className="p-3 text-right">Thao Tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-slate-500">
                    Chưa có thành viên nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.username.toLowerCase() === currentUser.username.toLowerCase();
                  const isAdminRole = u.role === 'ADMIN';

                  return (
                    <tr key={u.id || u.username} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                        <span>{u.username}</span>
                        {isSelf && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Bạn</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isAdminRole
                            ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {isAdminRole ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-right flex items-center justify-end gap-2">
                        {!isAdminRole && (
                          <button
                            onClick={() => handlePromoteToAdmin(u.username)}
                            className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 rounded-lg text-[10px] font-bold transition-all"
                          >
                            Nâng Admin
                          </button>
                        )}
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(u.username)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
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
  );
};
