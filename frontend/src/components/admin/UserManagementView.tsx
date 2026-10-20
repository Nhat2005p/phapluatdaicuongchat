import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Lock,
  Unlock,
  Shield,
  UserCheck,
  UserX,
  PlusCircle,
  RotateCcw,
  History,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen,
  Filter,
  RefreshCw,
  Mail,
  Scale
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import { User, UserRole, SystemQuotaConfig } from '../../types';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [isQuotaConfigModalOpen, setIsQuotaConfigModalOpen] = useState(false);
  const [quotaConfig, setQuotaConfig] = useState<SystemQuotaConfig>({
    defaultNewUserQuota: 30,
    monthlyAutoReset: true,
    warningThresholdPercent: 80
  });

  // User Quota Edit Modal
  const [quotaModalUser, setQuotaModalUser] = useState<User | null>(null);
  const [quotaAction, setQuotaAction] = useState<'add' | 'set' | 'reset'>('add');
  const [quotaAmount, setQuotaAmount] = useState<number>(10);
  const [quotaCustomValue, setQuotaCustomValue] = useState<number>(30);

  // User Lock Modal
  const [lockModalUser, setLockModalUser] = useState<User | null>(null);
  const [lockReason, setLockReason] = useState('Vi phạm điều khoản cộng đồng và chuẩn mực pháp luật');

  // User History Modal
  const [historyModalUser, setHistoryModalUser] = useState<User | null>(null);
  const [userHistoryLogs, setUserHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (err: any) {
      showToast('Lỗi khi tải danh sách người dùng: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuotaConfig = async () => {
    try {
      const res = await api.getQuotaConfig();
      if (res.success && res.config) {
        setQuotaConfig(res.config);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadQuotaConfig();
  }, []);

  // Update Role
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) {
        showToast(res.message);
        loadUsers();
      } else {
        showToast(res.message || 'Không thể đổi vai trò', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Toggle or Set User Status (Lock/Unlock)
  const handleConfirmLockOrUnlock = async () => {
    if (!lockModalUser) return;
    const targetStatus = lockModalUser.status === 'locked' ? 'active' : 'locked';
    try {
      const res = await api.updateUserStatus(
        lockModalUser.id || (lockModalUser as any)._id,
        targetStatus,
        targetStatus === 'locked' ? lockReason : undefined
      );
      if (res.success) {
        showToast(res.message);
        setLockModalUser(null);
        loadUsers();
      } else {
        showToast(res.message || 'Không thể đổi trạng thái', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Adjust User Quota
  const handleSaveUserQuota = async () => {
    if (!quotaModalUser) return;
    try {
      const payload: any = { action: quotaAction };
      if (quotaAction === 'add') {
        payload.amount = quotaAmount;
      } else if (quotaAction === 'set') {
        payload.quota = quotaCustomValue;
      }
      const res = await api.updateUserQuota(
        quotaModalUser.id || (quotaModalUser as any)._id,
        payload
      );
      if (res.success) {
        showToast(res.message);
        setQuotaModalUser(null);
        loadUsers();
      } else {
        showToast(res.message || 'Không thể cập nhật hạn mức', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Quick Reset Quota to 0 used
  const handleQuickResetUsed = async (user: User) => {
    try {
      const res = await api.updateUserQuota(user.id || (user as any)._id, { action: 'reset' });
      if (res.success) {
        showToast(res.message);
        loadUsers();
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // View User History
  const handleOpenHistory = async (user: User) => {
    setHistoryModalUser(user);
    setIsLoadingHistory(true);
    setUserHistoryLogs([]);
    try {
      const res = await api.getUserHistory(user.id || (user as any)._id);
      if (res.success) {
        setUserHistoryLogs(res.history || []);
      }
    } catch (err: any) {
      showToast('Lỗi tải lịch sử người dùng: ' + err.message, 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save System Quota Config
  const handleSaveSystemQuotaConfig = async () => {
    try {
      const res = await api.updateQuotaConfig(quotaConfig);
      if (res.success) {
        showToast(res.message);
        setIsQuotaConfigModalOpen(false);
      }
    } catch (err: any) {
      showToast('Lỗi cấu hình: ' + err.message, 'error');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.studentId && u.studentId.toLowerCase().includes(q));

    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;

    return matchQuery && matchRole && matchStatus;
  });

  // Summary counts
  const totalUsers = users.length;
  const studentCount = users.filter((u) => u.role === 'student').length;
  const modCount = users.filter((u) => u.role === 'moderator').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const lockedCount = users.filter((u) => u.status === 'locked').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-sm shadow-lg transition-all ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-xs text-slate-400 hover:text-white ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Tổng tài khoản</div>
            <div className="text-base font-bold text-white">{totalUsers}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Sinh viên (User)</div>
            <div className="text-base font-bold text-emerald-400">{studentCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Biên tập viên (Mod)</div>
            <div className="text-base font-bold text-amber-400">{modCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Quản trị viên</div>
            <div className="text-base font-bold text-purple-400">{adminCount}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Tài khoản bị khóa</div>
            <div className="text-base font-bold text-rose-400">{lockedCount}</div>
          </div>
        </div>
      </div>

      {/* Control Toolbar & Filters */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <Input
                placeholder="Tìm kiếm theo Tên, Email, Username, Mã sinh viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-800 text-xs"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400">Vai trò:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">Tất cả vai trò</option>
                  <option value="student" className="bg-slate-900">Sinh viên (User)</option>
                  <option value="moderator" className="bg-slate-900">Biên tập viên pháp lý</option>
                  <option value="admin" className="bg-slate-900">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                <span className="text-[11px] text-slate-400">Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">Tất cả trạng thái</option>
                  <option value="active" className="bg-slate-900">Đang hoạt động</option>
                  <option value="locked" className="bg-slate-900">Bị tạm khóa</option>
                </select>
              </div>

              {/* System Quota Config Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQuotaConfigModalOpen(true)}
                className="gap-2 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Cấu hình Quota Hệ thống ({quotaConfig.defaultNewUserQuota} câu)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={loadUsers}
                isLoading={isLoading}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Table (Hình 18) */}
      <Card className="border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Danh sách Tài khoản & Quản lý Hạn mức Quota ({filteredUsers.length} tài khoản)</span>
            </CardTitle>
            <span className="text-xs text-slate-400">
              Mặc định đăng ký mới: <strong className="text-emerald-400">{quotaConfig.defaultNewUserQuota} câu hỏi/tháng</strong>
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Người dùng & Định danh</th>
                <th className="px-4 py-3.5">Email & Ngày tạo</th>
                <th className="px-4 py-3.5">Vai trò (Role Assignment)</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Hạn mức Quota (Đã dùng / Tổng)</th>
                <th className="px-4 py-3.5 text-right">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const quotaTotal = u.questionsQuota ?? 30;
                  const quotaUsed = u.questionsUsed ?? 0;
                  const remaining = Math.max(0, quotaTotal - quotaUsed);
                  const usagePercent = Math.min(100, Math.round((quotaUsed / (quotaTotal || 1)) * 100));
                  const isLocked = u.status === 'locked';

                  return (
                    <tr
                      key={u.id || (u as any)._id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isLocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Name & ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase border ${
                            u.role === 'admin'
                              ? 'bg-purple-950/60 border-purple-500/30 text-purple-300'
                              : u.role === 'moderator'
                              ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                              : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                          }`}>
                            {u.fullName ? u.fullName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isLocked && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-400 font-normal">
                                  Bị khóa
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>@{u.username}</span>
                              {u.studentId && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500">MSV: {u.studentId}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Date */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-300 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString('vi-VN')
                              : '2026-09-01'}
                          </span>
                        </div>
                      </td>

                      {/* Role Assignment Selector */}
                      <td className="px-4 py-3.5">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id || (u as any)._id, e.target.value as UserRole)
                          }
                          className={`rounded-lg px-2.5 py-1 text-xs border font-medium focus:outline-none cursor-pointer transition-colors ${
                            u.role === 'admin'
                              ? 'bg-purple-950/50 border-purple-500/30 text-purple-300'
                              : u.role === 'moderator'
                              ? 'bg-amber-950/50 border-amber-500/30 text-amber-300'
                              : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          <option value="student" className="bg-slate-900 text-slate-200">
                            Sinh viên (User)
                          </option>
                          <option value="moderator" className="bg-slate-900 text-slate-200">
                            Biên tập viên (Moderator)
                          </option>
                          <option value="admin" className="bg-slate-900 text-slate-200">
                            Quản trị viên (Admin)
                          </option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isLocked ? (
                          <div className="space-y-1">
                            <Badge variant="destructive" className="gap-1 text-[11px]">
                              <Lock className="w-3 h-3" />
                              <span>Đã tạm khóa</span>
                            </Badge>
                            {u.lockReason && (
                              <div className="text-[10px] text-rose-400 max-w-[150px] truncate" title={u.lockReason}>
                                {u.lockReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="success" className="gap-1 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đang hoạt động</span>
                          </Badge>
                        )}
                      </td>

                      {/* Quota Progress & Quick Action */}
                      <td className="px-4 py-3.5 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">
                              Đã dùng: <strong className="text-white">{quotaUsed}</strong> / {quotaTotal} câu
                            </span>
                            <span className={remaining > 5 ? 'text-emerald-400' : 'text-rose-400 font-semibold'}>
                              Còn {remaining}
                            </span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                usagePercent > 90
                                  ? 'bg-rose-500'
                                  : usagePercent > 60
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              onClick={() => handleQuickResetUsed(u)}
                              className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-0.5 transition-colors"
                              title="Reset số câu đã hỏi về 0 (trả lại 100% quota)"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Reset</span>
                            </button>
                            <span className="text-slate-600">•</span>
                            <button
                              onClick={() => {
                                setQuotaModalUser(u);
                                setQuotaAction('add');
                                setQuotaAmount(10);
                              }}
                              className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 transition-colors"
                              title="Cộng thêm hạn mức câu hỏi cho người dùng này"
                            >
                              <PlusCircle className="w-2.5 h-2.5" />
                              <span>+ Thêm quota</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* History / Audit Log */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenHistory(u)}
                            className="h-7 px-2 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 gap-1"
                            title="Xem nhật ký câu hỏi & hội thoại của người dùng"
                          >
                            <History className="w-3.5 h-3.5 text-blue-400" />
                            <span>Nhật ký</span>
                          </Button>

                          {/* Lock / Unlock Toggle */}
                          {isLocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLockModalUser(u);
                              }}
                              className="h-7 px-2 text-[11px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Mở khóa</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLockModalUser(u);
                                setLockReason('Vi phạm điều khoản cộng đồng và chuẩn mực pháp luật');
                              }}
                              className="h-7 px-2 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-1"
                              title="Tạm khóa tài khoản này"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Khóa</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 1. MODAL CẤU HÌNH QUOTA HỆ THỐNG                         */}
      {/* ======================================================== */}
      <Modal
        isOpen={isQuotaConfigModalOpen}
        onClose={() => setIsQuotaConfigModalOpen(false)}
        title="Cấu hình Hạn mức Quota Toàn Hệ thống"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p className="text-slate-400">
            Thiết lập này áp dụng cho toàn bộ người dùng mới đăng ký vào hệ thống và quy tắc gia hạn câu hỏi định kỳ.
          </p>

          <div className="space-y-2 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <label className="block text-xs font-semibold text-white">
              Số câu hỏi miễn phí mặc định cho người dùng mới (câu/tháng):
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={500}
                value={quotaConfig.defaultNewUserQuota}
                onChange={(e) =>
                  setQuotaConfig({
                    ...quotaConfig,
                    defaultNewUserQuota: Math.max(1, parseInt(e.target.value) || 1)
                  })
                }
                className="w-32 bg-slate-950 border-slate-700 text-sm font-bold text-emerald-400"
              />
              <span className="text-slate-400">câu hỏi / tháng</span>
            </div>
            <p className="text-[11px] text-slate-500">
              * Khi đăng ký mới, mỗi tài khoản sinh viên sẽ tự động được cấp mức này.
            </p>
          </div>

          <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Tự động làm mới hạn mức hàng tháng</div>
                <div className="text-[11px] text-slate-400">Reset số câu hỏi đã dùng về 0 sau mỗi chu kỳ 30 ngày</div>
              </div>
              <input
                type="checkbox"
                checked={quotaConfig.monthlyAutoReset}
                onChange={(e) =>
                  setQuotaConfig({ ...quotaConfig, monthlyAutoReset: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <div className="font-semibold text-white">Ngưỡng hiển thị cảnh báo sắp hết lượt</div>
                <div className="text-[11px] text-slate-400">Cảnh báo nhắc nhở khi đã dùng vượt mức % này</div>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={50}
                  max={95}
                  value={quotaConfig.warningThresholdPercent}
                  onChange={(e) =>
                    setQuotaConfig({
                      ...quotaConfig,
                      warningThresholdPercent: Math.max(50, parseInt(e.target.value) || 80)
                    })
                  }
                  className="w-16 h-8 text-xs bg-slate-950 border-slate-700 text-center"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsQuotaConfigModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveSystemQuotaConfig}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lưu Cấu hình</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* 2. MODAL ĐIỀU CHỈNH QUOTA CHO TỪNG TÀI KHOẢN             */}
      {/* ======================================================== */}
      {quotaModalUser && (
        <Modal
          isOpen={!!quotaModalUser}
          onClose={() => setQuotaModalUser(null)}
          title={`Điều chỉnh Hạn mức Quota: ${quotaModalUser.fullName}`}
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">{quotaModalUser.fullName}</div>
                <div className="text-[11px] text-slate-400">{quotaModalUser.email}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Hiện tại:</div>
                <div className="font-bold text-emerald-400 text-sm">
                  {quotaModalUser.questionsUsed ?? 0} / {quotaModalUser.questionsQuota ?? 30} câu
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-white block">Chọn hình thức điều chỉnh:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setQuotaAction('add')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    quotaAction === 'add'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span>Cộng thêm lượt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuotaAction('set')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    quotaAction === 'set'
                      ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <Sliders className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <span>Đặt tổng quota mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuotaAction('reset')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    quotaAction === 'reset'
                      ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                  <span>Reset về 0 đã dùng</span>
                </button>
              </div>
            </div>

            {quotaAction === 'add' && (
              <div className="space-y-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
                <label className="text-white font-medium block">Số lượt hỏi muốn cộng thêm:</label>
                <div className="flex gap-2 mb-2">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuotaAmount(amt)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                        quotaAmount === amt
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={1}
                  value={quotaAmount}
                  onChange={(e) => setQuotaAmount(parseInt(e.target.value) || 1)}
                  className="bg-slate-950 border-slate-700 text-xs"
                />
              </div>
            )}

            {quotaAction === 'set' && (
              <div className="space-y-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
                <label className="text-white font-medium block">Tổng hạn mức mới (câu hỏi):</label>
                <Input
                  type="number"
                  min={0}
                  value={quotaCustomValue}
                  onChange={(e) => setQuotaCustomValue(parseInt(e.target.value) || 0)}
                  className="bg-slate-950 border-slate-700 text-xs"
                />
              </div>
            )}

            {quotaAction === 'reset' && (
              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg text-purple-300 text-xs">
                Hành động này sẽ đưa số lượt hỏi đã sử dụng về 0, giúp tài khoản có trọn vẹn{' '}
                <strong>{quotaModalUser.questionsQuota ?? 30} câu hỏi</strong> như lúc đầu tháng.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setQuotaModalUser(null)}>
                Hủy
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveUserQuota}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Xác nhận cập nhật
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL KHÓA / MỞ KHÓA TÀI KHOẢN                        */}
      {/* ======================================================== */}
      {lockModalUser && (
        <Modal
          isOpen={!!lockModalUser}
          onClose={() => setLockModalUser(null)}
          title={
            lockModalUser.status === 'locked'
              ? `Xác nhận mở khóa tài khoản: ${lockModalUser.fullName}`
              : `Tạm khóa tài khoản: ${lockModalUser.fullName}`
          }
        >
          <div className="space-y-4 text-xs text-slate-300">
            {lockModalUser.status === 'locked' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                  Bạn có chắc chắn muốn mở khóa cho tài khoản <strong>{lockModalUser.fullName}</strong> ({lockModalUser.email})? Người dùng sẽ có thể đăng nhập và tiếp tục hỏi đáp bình thường.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>
                    Khi bị tạm khóa, người dùng sẽ <strong>không thể đăng nhập</strong> hoặc đặt câu hỏi vào hệ thống.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-white block">Lý do khóa tài khoản:</label>
                  <select
                    onChange={(e) => setLockReason(e.target.value)}
                    value={lockReason}
                    className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 mb-2 focus:outline-none"
                  >
                    <option value="Vi phạm điều khoản cộng đồng và chuẩn mực pháp luật">
                      Vi phạm điều khoản cộng đồng và chuẩn mực pháp luật
                    </option>
                    <option value="Spam câu hỏi hoặc truy vấn bất thường ngoài phạm vi">
                      Spam câu hỏi hoặc truy vấn bất thường ngoài phạm vi
                    </option>
                    <option value="Nghi vấn tài khoản giả mạo hoặc gian lận thi cử">
                      Nghi vấn tài khoản giả mạo hoặc gian lận thi cử
                    </option>
                    <option value="Yêu cầu tạm ngưng từ Hội đồng Quản trị">
                      Yêu cầu tạm ngưng từ Hội đồng Quản trị
                    </option>
                  </select>

                  <Input
                    placeholder="Nhập lý do cụ thể..."
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setLockModalUser(null)}>
                Hủy
              </Button>
              <Button
                variant={lockModalUser.status === 'locked' ? 'default' : 'destructive'}
                size="sm"
                onClick={handleConfirmLockOrUnlock}
                className={lockModalUser.status === 'locked' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''}
              >
                {lockModalUser.status === 'locked' ? 'Xác nhận Mở khóa' : 'Xác nhận Khóa tài khoản'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL NHẬT KÝ TƯƠNG TÁC & AUDIT HỘI THOẠI             */}
      {/* ======================================================== */}
      {historyModalUser && (
        <Modal
          isOpen={!!historyModalUser}
          onClose={() => setHistoryModalUser(null)}
          title={`Nhật ký Tương tác & Lịch sử Hội thoại: ${historyModalUser.fullName}`}
          className="max-w-3xl"
        >
          <div className="space-y-4 text-xs text-slate-300 max-h-[70vh] flex flex-col">
            {/* User Meta Card */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  {historyModalUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white">{historyModalUser.fullName}</div>
                  <div className="text-[11px] text-slate-400">
                    {historyModalUser.email} • @{historyModalUser.username}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={historyModalUser.role === 'admin' ? 'purple' : 'success'}>
                  {historyModalUser.role}
                </Badge>
                <div className="text-[11px] text-slate-400">
                  Hạn mức: <strong className="text-emerald-400">{historyModalUser.questionsUsed ?? 0}/{historyModalUser.questionsQuota ?? 30}</strong>
                </div>
              </div>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
                  <div>Đang trích xuất nhật ký tương tác và dữ liệu hội thoại...</div>
                </div>
              ) : userHistoryLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Người dùng này chưa thực hiện lượt hỏi đáp hoặc rà soát văn bản nào.
                </div>
              ) : (
                userHistoryLogs.map((log, index) => (
                  <div
                    key={log._id || index}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px]">
                          {log.activityType === 'review'
                            ? 'AI Rà soát Hợp đồng'
                            : log.activityType === 'search'
                            ? 'Tra cứu Pháp luật'
                            : 'AI Giải đề Barem'}
                        </Badge>
                        <span className="text-slate-500">Mã: {log.intentCode || 'SOLVER'}</span>
                      </div>
                      <span className="text-slate-400">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString('vi-VN')
                          : 'Vừa xong'}
                      </span>
                    </div>

                    {/* Question */}
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-sky-400" />
                        <span>Nội dung câu hỏi của người dùng:</span>
                      </div>
                      <p className="text-slate-200 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {log.query}
                      </p>
                    </div>

                    {/* AI Response Preview */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Lời giải đáp AI & Căn cứ:</span>
                      </div>
                      <p className="text-slate-300 line-clamp-3 leading-relaxed">
                        {log.response}
                      </p>
                      {log.citations && log.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-emerald-500/20">
                          {log.citations.map((c: any, ci: number) => (
                            <span
                              key={ci}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono"
                            >
                              {c.lawCode} Đ.{c.articleNumber}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 shrink-0">
              <span className="text-[11px] text-slate-500">
                Hiển thị tối đa 50 lượt tương tác gần nhất để kiểm tra gian lận & hỗ trợ kỹ thuật.
              </span>
              <Button variant="outline" size="sm" onClick={() => setHistoryModalUser(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
