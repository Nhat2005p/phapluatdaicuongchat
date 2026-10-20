import React, { useState, useEffect } from 'react';
import {
  Settings,
  Calendar,
  Clock,
  DollarSign,
  Key,
  Phone,
  Mail,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Save,
  Copy,
  Check,
  Power,
  RotateCcw,
  Sliders,
  FileText,
  Building,
  TrendingUp,
  Receipt,
  Eye,
  Lock,
  Unlock,
  Search
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { QuickTooltip } from '../ui/Tooltip';
import { api } from '../../services/api';
import {
  SystemSettingsData,
  PricingPlanItem,
  TransactionItem,
  PartnerApiKeyItem
} from '../../types';

export const SystemSettingsServicesView: React.FC = () => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<
    'auto_crawl' | 'pricing' | 'transactions' | 'api_keys' | 'contact'
  >('auto_crawl');

  const [isLoading, setIsLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<SystemSettingsData>({
    autoCrawl: {
      enabled: true,
      frequency: 'weekly',
      executionTime: '02:00',
      maxDocsPerCrawl: 50,
      retryAttempts: 3
    },
    pricingPlans: [],
    contactSupport: {
      hotline: '0366 015 348',
      email: 'hotro@vietlaw.ai',
      workHours: '08:00 - 21:00 (Thứ 2 - Chủ Nhật)',
      copyright: '© 2026 Chatbot Hỗ Trợ Pháp Luật Đại Cương — Trợ lý AI Pháp luật',
      disclaimer: 'Hệ thống hỗ trợ học tập và ôn thi môn Pháp luật đại cương, không thay thế văn bản gốc.'
    }
  });

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [txSummary, setTxSummary] = useState({
    totalRevenue: 0,
    completedCount: 0,
    totalCount: 0,
    successRate: 100
  });
  const [txSearch, setTxSearch] = useState('');

  // API Keys State
  const [apiKeys, setApiKeys] = useState<PartnerApiKeyItem[]>([]);
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    partnerType: 'Trường Đại học',
    rateLimitRpm: 120,
    monthlyLimit: 15000,
    contactEmail: ''
  });
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Edit Plan Modal
  const [editingPlan, setEditingPlan] = useState<PricingPlanItem | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      toast.error('Thông báo hệ thống', text);
    } else {
      toast.success('Thao tác thành công', text);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.getSystemSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await api.getAllTransactions();
      if (res.success) {
        setTransactions(res.transactions || []);
        if (res.summary) setTxSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadApiKeys = async () => {
    try {
      const res = await api.getPartnerApiKeys();
      if (res.success && res.apiKeys) {
        setApiKeys(res.apiKeys);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([loadSettings(), loadTransactions(), loadApiKeys()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      const res = await api.updateSystemSettings(settings);
      if (res.success) {
        showToast(res.message);
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Save Pricing Plan Changes
  const handleSavePlanEdit = () => {
    if (!editingPlan) return;
    const updatedPlans = settings.pricingPlans.map((p) =>
      p.id === editingPlan.id ? editingPlan : p
    );
    const newSettings = { ...settings, pricingPlans: updatedPlans };
    setSettings(newSettings);
    setEditingPlan(null);
    api.updateSystemSettings(newSettings).then(() => {
      showToast(`Đã cập nhật bảng giá gói "${editingPlan.name}".`);
    });
  };

  // Create Partner API Key
  const handleCreateApiKey = async () => {
    if (!newKeyData.name.trim() || !newKeyData.contactEmail.trim()) {
      showToast('Vui lòng nhập tên đối tác và email liên hệ.', 'error');
      return;
    }
    try {
      const res = await api.createPartnerApiKey(newKeyData);
      if (res.success) {
        showToast(res.message);
        setIsAddKeyModalOpen(false);
        setNewKeyData({
          name: '',
          partnerType: 'Trường Đại học',
          rateLimitRpm: 120,
          monthlyLimit: 15000,
          contactEmail: ''
        });
        loadApiKeys();
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Toggle API Key Revoke/Active
  const handleToggleApiKey = async (keyItem: PartnerApiKeyItem) => {
    try {
      const res = await api.togglePartnerApiKey(keyItem._id || keyItem.id!);
      if (res.success) {
        showToast(res.message);
        loadApiKeys();
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Copy API Key
  const handleCopyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
    showToast('Đã sao chép khóa API vào clipboard.');
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter((tx) => {
    const q = txSearch.toLowerCase().trim();
    return (
      !q ||
      tx.transactionCode.toLowerCase().includes(q) ||
      tx.userEmail.toLowerCase().includes(q) ||
      tx.planName.toLowerCase().includes(q) ||
      tx.paymentMethod.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">


      {/* Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('auto_crawl')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'auto_crawl'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lịch trình Auto Crawl (Hình 21)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pricing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'pricing'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Bảng giá & Gói cước ({settings.pricingPlans.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'transactions'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Tra cứu Giao dịch & Doanh thu</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('api_keys')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'api_keys'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Quản lý API Key Đối tác</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30">
              {apiKeys.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('contact')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'contact'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Hotline & Hỗ trợ</span>
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={loadAll} isLoading={isLoading} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* ======================================================== */}
      {/* 1. SUB-TAB: CÀI ĐẶT LỊCH TRÌNH CRAWL (HÌNH 21)           */}
      {/* ======================================================== */}
      {activeSubTab === 'auto_crawl' && (
        <Card className="border-slate-800 bg-slate-950 shadow-xl">
          <CardHeader className="border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Cấu hình Lịch trình Thu thập Tự động (Auto Crawl Settings — Hình 21)</span>
              </CardTitle>
              <Badge variant={settings.autoCrawl.enabled ? 'success' : 'warning'}>
                {settings.autoCrawl.enabled ? 'Chế độ tự động ĐANG BẬT' : 'Đang tạm dừng tự động'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 text-xs text-slate-300">
            {/* Toggle Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">Chế độ tự động quét dữ liệu (Auto Crawl Daemon)</div>
                <div className="text-slate-400">
                  Khi bật, cron job hệ thống sẽ tự động quét các URL nguồn và cập nhật điều luật mới vào Vector DB.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    autoCrawl: { ...settings.autoCrawl, enabled: !settings.autoCrawl.enabled }
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoCrawl.enabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoCrawl.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Frequency & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <label className="font-semibold text-white block">Tần suất quét tự động:</label>
                <select
                  value={settings.autoCrawl.frequency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoCrawl: {
                        ...settings.autoCrawl,
                        frequency: e.target.value as any
                      }
                    })
                  }
                  className="w-full h-10 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="daily">Hàng ngày (Daily — Lúc nửa đêm)</option>
                  <option value="weekly">Hàng tuần (Weekly — Vào Chủ Nhật)</option>
                  <option value="monthly">Hàng tháng (Monthly — Ngày 01 hàng tháng)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  * Khuyến nghị chọn 'Hàng tuần' để đảm bảo tính thời sự của quy phạm mà không gây quá tải mạng.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <label className="font-semibold text-white block">Mốc giờ thực thi cụ thể:</label>
                <Input
                  type="time"
                  value={settings.autoCrawl.executionTime}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoCrawl: { ...settings.autoCrawl, executionTime: e.target.value }
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  * Mốc 02:00 sáng là khung giờ thấp điểm, giảm thiểu độ trễ cho sinh viên đang làm bài tập trực tuyến.
                </p>
              </div>
            </div>

            {/* Limits & Retries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <label className="font-semibold text-white block">Số lượng văn bản tối đa mỗi đợt quét:</label>
                <Input
                  type="number"
                  min={10}
                  max={200}
                  value={settings.autoCrawl.maxDocsPerCrawl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoCrawl: {
                        ...settings.autoCrawl,
                        maxDocsPerCrawl: parseInt(e.target.value) || 50
                      }
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-xs"
                />
                <span className="text-[11px] text-slate-500">văn bản / đợt</span>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <label className="font-semibold text-white block">Số lần thử lại khi gặp lỗi kết nối:</label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={settings.autoCrawl.retryAttempts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoCrawl: {
                        ...settings.autoCrawl,
                        retryAttempts: parseInt(e.target.value) || 3
                      }
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-xs"
                />
                <span className="text-[11px] text-slate-500">lần thử</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveSettings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cài đặt Lịch trình Crawl</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 2. SUB-TAB: QUẢN LÝ GÓI DỊCH VỤ & BẢNG GIÁ               */}
      {/* ======================================================== */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Quản trị Bảng giá & Thiết lập Gói cước Dịch vụ</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cấu hình số câu hỏi tối đa, thời hạn sử dụng và mức phí cho từng gói tài khoản sinh viên.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {settings.pricingPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all shadow-xl relative ${
                  plan.status === 'paused' ? 'opacity-70' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Mã: {plan.id}
                    </span>
                    {plan.badge && (
                      <Badge variant={plan.id === 'vip' ? 'purple' : plan.id === 'pro' ? 'default' : 'success'}>
                        {plan.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold text-white pt-1">{plan.name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xl font-extrabold text-emerald-400">
                      {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')} đ`}
                    </div>
                    <div className="text-[11px] text-slate-400">Thời hạn: {plan.durationDays} ngày</div>
                  </div>

                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Hạn mức câu hỏi:</span>
                      <strong className="text-white font-mono">{plan.questionsLimit} câu / tháng</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Trạng thái phát hành:</span>
                      <Badge variant={plan.status === 'active' ? 'success' : 'warning'}>
                        {plan.status === 'active' ? 'Đang mở bán' : 'Tạm ngừng'}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed pt-1">{plan.description}</p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPlan({ ...plan })}
                      className="gap-1.5 text-xs border-slate-700 text-slate-200 hover:bg-slate-900"
                    >
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>Chỉnh sửa gói</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SUB-TAB: TRA CỨU TOÀN BỘ GIAO DỊCH & DOANH THU        */}
      {/* ======================================================== */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-400">Tổng doanh thu tích lũy</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {txSummary.totalRevenue.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-400">Giao dịch thành công</div>
              <div className="text-xl font-bold text-white mt-1">
                {txSummary.completedCount} <span className="text-xs text-slate-500 font-normal">đơn</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-400">Tổng lượt kích hoạt</div>
              <div className="text-xl font-bold text-sky-400 mt-1">
                {txSummary.totalCount} <span className="text-xs text-slate-500 font-normal">lượt</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-400">Tỷ lệ thanh toán thành công</div>
              <div className="text-xl font-bold text-purple-400 mt-1">{txSummary.successRate}%</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <Input
              placeholder="Tìm kiếm theo mã giao dịch, email sinh viên, tên gói cước, phương thức..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-xs"
            />
          </div>

          {/* All Transactions Table */}
          <Card className="border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Mã hóa đơn / Giao dịch</th>
                    <th className="px-4 py-3.5">Tài khoản sinh viên</th>
                    <th className="px-4 py-3.5">Gói cước đã mua</th>
                    <th className="px-4 py-3.5">Số tiền</th>
                    <th className="px-4 py-3.5">Phương thức</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Ngày giờ giao dịch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx._id || tx.transactionCode} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-semibold text-sky-400 px-2 py-0.5 rounded bg-sky-950/40 border border-sky-500/20">
                          {tx.transactionCode}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-white font-medium">{tx.userEmail}</td>

                      <td className="px-4 py-3.5 text-slate-200">
                        <div>{tx.planName}</div>
                        <div className="text-[10px] text-slate-500">+{tx.questionsAdded} câu hỏi</div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-emerald-400">
                        {tx.amount === 0 ? '0 đ' : `${tx.amount.toLocaleString('vi-VN')} đ`}
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">{tx.paymentMethod}</td>

                      <td className="px-4 py-3.5">
                        <Badge variant={tx.status === 'completed' ? 'success' : 'warning'} className="gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{tx.status === 'completed' ? 'Thành công' : 'Chờ xử lý'}</span>
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right text-slate-400 text-[11px]">
                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SUB-TAB: QUẢN LÝ API KEY ĐỐI TÁC                     */}
      {/* ======================================================== */}
      {activeSubTab === 'api_keys' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                <span>Quản lý API Key Cấp cho Đối tác & Tích hợp Doanh nghiệp</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cấp phát, theo dõi lưu lượng và quản lý quyền truy cập API Trợ lý Luật cho các đơn vị bên ngoài.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddKeyModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 text-xs shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Cấp mới Khóa API</span>
            </Button>
          </div>

          <Card className="border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Tên đối tác / Đơn vị</th>
                    <th className="px-4 py-3.5">Mã Khóa API (Secret Key)</th>
                    <th className="px-4 py-3.5">Rate Limit</th>
                    <th className="px-4 py-3.5">Lưu lượng tháng này</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Lần gọi gần nhất</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {apiKeys.map((k) => (
                    <tr key={k._id || k.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{k.name}</div>
                        <div className="text-[11px] text-slate-500">{k.partnerType} • {k.contactEmail}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20 max-w-[220px] truncate">
                            {k.key.slice(0, 15)}••••••••••••••••
                          </span>
                          <button
                            onClick={() => handleCopyKey(k.key, k._id || k.id!)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title="Sao chép toàn bộ khóa API"
                          >
                            {copiedKeyId === (k._id || k.id) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        {k.rateLimitRpm} <span className="text-slate-500">req/min</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-emerald-400">{k.requestsUsed.toLocaleString()} req</div>
                        <div className="text-[10px] text-slate-500">/ {k.monthlyLimit.toLocaleString()} quota</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant={k.status === 'active' ? 'success' : 'destructive'} className="gap-1 text-[11px]">
                          {k.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Đã thu hồi</span>
                            </>
                          )}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('vi-VN') : 'Chưa gọi'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleApiKey(k)}
                          className={`h-7 px-2 text-[11px] gap-1 ${
                            k.status === 'active'
                              ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {k.status === 'active' ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Thu hồi</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>Kích hoạt lại</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SUB-TAB: THÔNG TIN LIÊN HỆ & HỖ TRỢ TỔNG ĐÀI         */}
      {/* ======================================================== */}
      {activeSubTab === 'contact' && (
        <Card className="border-slate-800 bg-slate-950 shadow-xl">
          <CardHeader className="border-b border-slate-800/80 bg-slate-900/40">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Quản trị Thông tin Tổng đài Hotline & Bản quyền Hệ thống</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6 text-xs text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <label className="font-semibold text-white block">Số điện thoại Hotline hỗ trợ:</label>
                <Input
                  value={settings.contactSupport.hotline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactSupport: { ...settings.contactSupport, hotline: e.target.value }
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-sm font-bold text-emerald-400 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  * Số này sẽ được hiển thị trên popup hotline hỗ trợ, footer và thông báo tài khoản.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <label className="font-semibold text-white block">Email tiếp nhận phản hồi & góp ý:</label>
                <Input
                  value={settings.contactSupport.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contactSupport: { ...settings.contactSupport, email: e.target.value }
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <label className="font-semibold text-white block">Thời gian làm việc của tổng đài:</label>
              <Input
                value={settings.contactSupport.workHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contactSupport: { ...settings.contactSupport, workHours: e.target.value }
                  })
                }
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <label className="font-semibold text-white block">Thông tin Bản quyền chân trang (Copyright):</label>
              <Input
                value={settings.contactSupport.copyright}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contactSupport: { ...settings.contactSupport, copyright: e.target.value }
                  })
                }
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <label className="font-semibold text-white block">Tuyên bố miễn trừ trách nhiệm pháp lý:</label>
              <textarea
                rows={3}
                value={settings.contactSupport.disclaimer}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contactSupport: { ...settings.contactSupport, disclaimer: e.target.value }
                  })
                }
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-200 leading-relaxed focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveSettings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Thông tin Hotline & Bản quyền</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT PRICING PLAN                                 */}
      {/* ======================================================== */}
      {editingPlan && (
        <Modal
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          title={`Chỉnh sửa Gói cước: ${editingPlan.name}`}
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Tên gói cước:</label>
              <Input
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-white block">Giá tiền (VNĐ):</label>
                <Input
                  type="number"
                  min={0}
                  value={editingPlan.price}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-900 border-slate-700 text-xs font-bold text-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-white block">Số câu hỏi tối đa:</label>
                <Input
                  type="number"
                  min={1}
                  value={editingPlan.questionsLimit}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, questionsLimit: parseInt(e.target.value) || 1 })
                  }
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-white block">Thời hạn sử dụng (ngày):</label>
                <Input
                  type="number"
                  min={1}
                  value={editingPlan.durationDays}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, durationDays: parseInt(e.target.value) || 30 })
                  }
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-white block">Trạng thái phát hành:</label>
                <select
                  value={editingPlan.status}
                  onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value as any })}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="active">Đang mở bán</option>
                  <option value="paused">Tạm ngừng bán</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Mô tả gói cước:</label>
              <textarea
                rows={3}
                value={editingPlan.description}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-200 leading-relaxed focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingPlan(null)}>
                Hủy
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSavePlanEdit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Thay đổi</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL CẤP MỚI API KEY CHO ĐỐI TÁC                       */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddKeyModalOpen}
        onClose={() => setIsAddKeyModalOpen(false)}
        title="Cấp mới Khóa API Tích hợp Đối tác (Partner API Key)"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="space-y-1.5">
            <label className="font-semibold text-white block">Tên đối tác / Tổ chức / Doanh nghiệp:</label>
            <Input
              placeholder="VD: Khoa Luật — Trường ĐH Bách Khoa"
              value={newKeyData.name}
              onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
              className="bg-slate-900 border-slate-700 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Phân loại đối tác:</label>
              <select
                value={newKeyData.partnerType}
                onChange={(e) => setNewKeyData({ ...newKeyData, partnerType: e.target.value })}
                className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 focus:outline-none"
              >
                <option value="Trường Đại học">Trường Đại học</option>
                <option value="Doanh nghiệp Tư vấn">Doanh nghiệp Tư vấn</option>
                <option value="Cơ quan Nhà nước">Cơ quan Nhà nước</option>
                <option value="Nhà phát triển EdTech">Nhà phát triển EdTech</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Email kỹ thuật phụ trách:</label>
              <Input
                placeholder="api@doitac.vn"
                value={newKeyData.contactEmail}
                onChange={(e) => setNewKeyData({ ...newKeyData, contactEmail: e.target.value })}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Rate Limit (req/phút):</label>
              <Input
                type="number"
                min={10}
                value={newKeyData.rateLimitRpm}
                onChange={(e) =>
                  setNewKeyData({ ...newKeyData, rateLimitRpm: parseInt(e.target.value) || 60 })
                }
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Hạn mức tháng (requests):</label>
              <Input
                type="number"
                min={1000}
                value={newKeyData.monthlyLimit}
                onChange={(e) =>
                  setNewKeyData({ ...newKeyData, monthlyLimit: parseInt(e.target.value) || 10000 })
                }
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddKeyModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateApiKey}
              className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Cấp khóa API</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
