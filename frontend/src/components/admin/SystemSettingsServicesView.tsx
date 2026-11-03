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
  Search,
  Sparkles,
  Zap,
  Award,
  ArrowUpRight,
  Activity
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

// Anime.js / Spring-style Animated Number Counter Component
const AnimatedNumber: React.FC<{
  value: number;
  duration?: number;
  formatFn?: (val: number) => string;
}> = ({ value, duration = 800, formatFn = (v) => Math.round(v).toLocaleString('vi-VN') }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic curve (Anime.js easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{formatFn(displayValue)}</span>;
};

export const SystemSettingsServicesView: React.FC = () => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<
    'pricing' | 'transactions' | 'api_keys' | 'auto_crawl' | 'contact'
  >('pricing');

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
      copyright: '© 2026 Chatbot Hỗ Trợ Pháp Luật Đại Cương — Barem Chuẩn Bộ GD&ĐT',
      disclaimer: 'Hệ thống hỗ trợ học tập và ôn thi môn Pháp luật đại cương, không thay thế văn bản gốc.'
    }
  });

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [txSummary, setTxSummary] = useState({
    totalRevenue: 345000,
    completedCount: 6,
    totalCount: 6,
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

  // Interactive mouse position for 21st.dev spotlights
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

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

  // Features list by package tier
  const getPlanFeatures = (planId: string) => {
    switch (planId) {
      case 'vip':
        return [
          'Hạn mức 150 câu hỏi / tháng, xử lý tình huống phức hợp',
          'Ưu tiên GPU Dedicated phản hồi siêu tốc (< 1.5s)',
          'Đối chiếu sâu Án lệ TANDTC & Văn bản hợp nhất',
          'Hỗ trợ giải đề thi thử PLDC không giới hạn lượt'
        ];
      case 'pro':
        return [
          'Gấp đôi câu hỏi phục vụ đợt ôn thi cao điểm',
          'Hỗ trợ giải thích chi tiết trắc nghiệm & tình huống',
          'Trích dẫn trực tiếp Điều khoản Bộ luật Dân sự & Hình sự',
          'Ưu tiên đường truyền xử lý song song hạn chế nghẽn'
        ];
      default:
        return [
          'Tra cứu quy phạm & Barem PLDC chuẩn Bộ GD&ĐT',
          'Nhận diện 5 dạng bài tập trọng tâm môn học',
          'Chu kỳ 30 ngày tự động gia hạn hoàn toàn miễn phí',
          'Truy cập cổng văn bản pháp quy thời gian thực'
        ];
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 21ST.DEV & ANIME.JS: TOP 5 SPOTLIGHT KPI SUMMARY CARDS  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Card 1: Gói Cước Phát Hành */}
        <div
          onMouseMove={handleCardMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-emerald-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gói Cước Phát Hành</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-display">
              <AnimatedNumber value={settings.pricingPlans.length} />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
              Hoạt động
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Basic • Pro • VIP</div>
        </div>

        {/* Card 2: Tổng Doanh Thu Tích Lũy */}
        <div
          onMouseMove={handleCardMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-cyan-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Doanh Thu Tích Lũy</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-400 font-display">
              <AnimatedNumber
                value={txSummary.totalRevenue}
                formatFn={(v) => Math.round(v).toLocaleString('vi-VN')}
              />
            </span>
            <span className="text-xs text-slate-400 font-bold">đ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">VietQR & Ví điện tử</div>
        </div>

        {/* Card 3: Giao Dịch Thành Công */}
        <div
          onMouseMove={handleCardMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-sky-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Giao Dịch Đã Khớp</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-400 font-display">
              <AnimatedNumber value={txSummary.completedCount} />
            </span>
            <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-500/20">
              {txSummary.successRate}% Thành công
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{txSummary.totalCount} lượt đăng ký</div>
        </div>

        {/* Card 4: Khóa API Đối Tác Live */}
        <div
          onMouseMove={handleCardMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Khóa API Đối Tác</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-display">
              <AnimatedNumber value={apiKeys.length} />
            </span>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-500/20">
              Live Gateway
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Trường học & Doanh nghiệp</div>
        </div>

        {/* Card 5: Lịch trình Auto-Crawl & Cron */}
        <div
          onMouseMove={handleCardMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-amber-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden group col-span-2 sm:col-span-1"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lịch Trình Cron</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-display font-mono">
              {settings.autoCrawl.executionTime}
            </span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              {settings.autoCrawl.frequency === 'weekly' ? 'Hàng tuần' : 'Hàng ngày'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {settings.autoCrawl.enabled ? 'Đang chạy tự động' : 'Tạm dừng'}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAGIC UI POLISHED SUB-TABS SELECTOR                     */}
      {/* ======================================================== */}
      <div className="relative rounded-2xl p-[1.5px] magic-border-beam overflow-hidden shadow-md">
        <div className="relative rounded-[15px] flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/95 border border-slate-800/90 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tab 1: Auto Crawl */}
            <button
              onClick={() => setActiveSubTab('auto_crawl')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'auto_crawl'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Lịch trình Auto Crawl</span>
            </button>

            {/* Tab 2: Pricing */}
            <button
              onClick={() => setActiveSubTab('pricing')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'pricing'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Bảng giá & Gói cước</span>
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <AnimatedNumber value={settings.pricingPlans.length} />
              </span>
            </button>

            {/* Tab 3: Transactions */}
            <button
              onClick={() => setActiveSubTab('transactions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'transactions'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Tra cứu Giao dịch & Doanh thu</span>
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <AnimatedNumber value={transactions.length} />
              </span>
            </button>

            {/* Tab 4: API Keys */}
            <button
              onClick={() => setActiveSubTab('api_keys')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'api_keys'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Quản lý API Key Đối tác</span>
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30">
                <AnimatedNumber value={apiKeys.length} />
              </span>
            </button>

            {/* Tab 5: Contact */}
            <button
              onClick={() => setActiveSubTab('contact')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'contact'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline & Hỗ trợ</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAll}
            isLoading={isLoading}
            className="gap-2 text-xs border-slate-700/80 hover:border-emerald-500/40 hover:text-emerald-300 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SUB-TAB: BẢNG GIÁ & GÓI CƯỚC (ACTIVE MẶC ĐỊNH)        */}
      {/* ======================================================== */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative rounded-2xl p-5 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <DollarSign className="w-4 h-4" />
                </span>
                <span>Quản trị Bảng giá & Thiết lập Gói cước Dịch vụ</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Cấu hình số câu hỏi tối đa, thời hạn sử dụng và mức phí cho từng gói tài khoản sinh viên. Tích hợp trực tiếp cổng VietQR và cấp phát tự động.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Barem Chuẩn Bộ GD&ĐT</span>
              </span>
            </div>
          </div>

          {/* 3 Pricing Spotlight Cards (Basic, Pro, VIP) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {settings.pricingPlans.map((plan) => {
              const isVIP = plan.id === 'vip';
              const isPro = plan.id === 'pro';
              const isBasic = plan.id === 'basic';

              return (
                <div
                  key={plan.id}
                  onMouseMove={handleCardMouseMove}
                  className={`card-spotlight rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between ${
                    isVIP
                      ? 'bg-gradient-to-b from-purple-950/30 via-slate-900/90 to-slate-950 border-2 border-purple-500/40 hover:border-purple-400 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1.5'
                      : isPro
                      ? 'bg-gradient-to-b from-sky-950/30 via-slate-900/90 to-slate-950 border-2 border-sky-500/40 hover:border-sky-400 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1.5'
                      : 'bg-gradient-to-b from-emerald-950/20 via-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-500/40 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1.5'
                  }`}
                >
                  {/* Shimmer sweep effect */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />

                  <div>
                    {/* Top Tier Badge & ID */}
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">
                        MÃ: {plan.id}
                      </span>
                      {plan.badge && (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                            isVIP
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : isPro
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {isPro && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />}
                          {isVIP && <Sparkles className="w-3 h-3 text-purple-300 animate-spin-slow" />}
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-lg font-black text-white pt-1">{plan.name}</h3>

                    {/* Price Box with Anime.js AnimatedNumber */}
                    <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-sm">
                      <div
                        className={`text-2xl font-black font-display tracking-tight ${
                          isVIP
                            ? 'text-purple-400'
                            : isPro
                            ? 'text-sky-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {plan.price === 0 ? (
                          'Miễn phí'
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <AnimatedNumber
                              value={plan.price}
                              formatFn={(v) => Math.round(v).toLocaleString('vi-VN')}
                            />
                            <span className="text-sm font-bold text-slate-400">đ</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>Thời hạn sử dụng:</span>
                        <span className="text-white font-semibold">
                          <AnimatedNumber value={plan.durationDays} /> ngày
                        </span>
                      </div>
                    </div>

                    {/* Quota & Status details */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                        <span className="text-slate-400">Hạn mức câu hỏi:</span>
                        <span className="font-mono font-bold text-white flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <AnimatedNumber value={plan.questionsLimit} /> câu / tháng
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                        <span className="text-slate-400">Trạng thái phát hành:</span>
                        <Badge
                          variant={plan.status === 'active' ? 'success' : 'warning'}
                          className="text-[10px] font-semibold"
                        >
                          {plan.status === 'active' ? 'Đang mở bán' : 'Tạm ngừng'}
                        </Badge>
                      </div>

                      <p className="text-slate-400 text-[11px] leading-relaxed pt-1 italic">
                        "{plan.description}"
                      </p>
                    </div>

                    {/* Features Checklist */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Đặc quyền gói cước:
                      </div>
                      {getPlanFeatures(plan.id).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              isVIP
                                ? 'text-purple-400'
                                : isPro
                                ? 'text-sky-400'
                                : 'text-emerald-400'
                            }`}
                          />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edit Action Button */}
                  <div className="pt-6 mt-4 border-t border-slate-800/60 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPlan({ ...plan })}
                      className="w-full gap-2 text-xs font-semibold border-slate-700/80 hover:bg-slate-800 text-slate-200 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                    >
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>Chỉnh sửa cấu hình gói</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SUB-TAB: TRA CỨU TOÀN BỘ GIAO DỊCH & DOANH THU        */}
      {/* ======================================================== */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="card-spotlight rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-emerald-500/40 transition-all">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tổng doanh thu tích lũy
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-display">
                <AnimatedNumber
                  value={txSummary.totalRevenue}
                  formatFn={(v) => Math.round(v).toLocaleString('vi-VN') + ' đ'}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Đồng bộ tự động từ VietQR</div>
            </div>

            <div className="card-spotlight rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-sky-500/40 transition-all">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Giao dịch thành công
              </div>
              <div className="text-2xl font-black text-white mt-1 font-display flex items-baseline gap-1.5">
                <AnimatedNumber value={txSummary.completedCount} />
                <span className="text-xs text-slate-400 font-normal">đơn</span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">100% Khớp đơn tức thì</div>
            </div>

            <div className="card-spotlight rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-cyan-500/40 transition-all">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tổng lượt kích hoạt
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-1 font-display flex items-baseline gap-1.5">
                <AnimatedNumber value={txSummary.totalCount} />
                <span className="text-xs text-slate-400 font-normal">lượt</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Bao gồm gói tặng chào mừng</div>
            </div>

            <div className="card-spotlight rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-purple-500/40 transition-all">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tỷ lệ thanh toán thành công
              </div>
              <div className="text-2xl font-black text-purple-400 mt-1 font-display">
                <AnimatedNumber value={txSummary.successRate} />%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Không có đơn bị treo lỗi</div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <Input
              placeholder="Tìm kiếm theo mã giao dịch, email sinh viên, tên gói cước, phương thức thanh toán..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="pl-10 bg-slate-900/80 border-slate-800 text-xs h-10 rounded-xl"
            />
          </div>

          {/* All Transactions Table */}
          <Card className="border-slate-800 bg-slate-950 overflow-hidden shadow-xl rounded-2xl">
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
                        <span className="font-mono font-semibold text-sky-400 px-2.5 py-1 rounded-md bg-sky-950/40 border border-sky-500/20">
                          {tx.transactionCode}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-white font-medium">{tx.userEmail}</td>

                      <td className="px-4 py-3.5 text-slate-200">
                        <div className="font-semibold">{tx.planName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">+{tx.questionsAdded} câu hỏi</div>
                      </td>

                      <td className="px-4 py-3.5 font-black text-emerald-400 font-mono">
                        {tx.amount === 0 ? '0 đ' : `${tx.amount.toLocaleString('vi-VN')} đ`}
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">{tx.paymentMethod}</td>

                      <td className="px-4 py-3.5">
                        <Badge
                          variant={tx.status === 'completed' ? 'success' : 'warning'}
                          className="gap-1.5 text-[11px] font-semibold"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{tx.status === 'completed' ? 'Thành công' : 'Chờ xử lý'}</span>
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-right text-slate-400 text-[11px] font-mono">
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
      {/* 3. SUB-TAB: QUẢN LÝ API KEY ĐỐI TÁC                     */}
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
              className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 text-xs shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cấp mới Khóa API</span>
            </Button>
          </div>

          <Card className="border-slate-800 bg-slate-950 overflow-hidden shadow-xl rounded-2xl">
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
                        <div className="text-[11px] text-slate-400">
                          {k.partnerType} • {k.contactEmail}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded border border-purple-500/20 max-w-[220px] truncate">
                            {k.key.slice(0, 15)}••••••••••••••••
                          </span>
                          <button
                            onClick={() => handleCopyKey(k.key, k._id || k.id!)}
                            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
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

                      <td className="px-4 py-3.5 text-slate-300 font-mono">
                        {k.rateLimitRpm} <span className="text-slate-500 text-[10px]">req/min</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-emerald-400 font-mono">
                          <AnimatedNumber value={k.requestsUsed} /> req
                        </div>
                        <div className="text-[10px] text-slate-400">
                          / {k.monthlyLimit.toLocaleString('vi-VN')} quota
                        </div>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${Math.min((k.requestsUsed / k.monthlyLimit) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          variant={k.status === 'active' ? 'success' : 'destructive'}
                          className="gap-1 text-[11px] font-semibold"
                        >
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

                      <td className="px-4 py-3.5 text-slate-400 text-[11px] font-mono">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('vi-VN') : 'Chưa gọi'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleApiKey(k)}
                          className={`h-7 px-2.5 text-[11px] gap-1 font-semibold transition-all hover:scale-105 active:scale-95 ${
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
      {/* 4. SUB-TAB: CẤU HÌNH LỊCH TRÌNH THU THẬP TỰ ĐỘNG         */}
      {/* ======================================================== */}
      {activeSubTab === 'auto_crawl' && (
        <Card className="border-slate-800 bg-slate-950 shadow-xl rounded-2xl">
          <CardHeader className="border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Cấu hình Lịch trình Thu thập Tự động (Auto Crawl Daemon)</span>
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
                <div className="text-sm font-semibold text-white">
                  Chế độ tự động quét dữ liệu (Auto Crawl Daemon)
                </div>
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cài đặt Lịch trình Crawl</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 5. SUB-TAB: THÔNG TIN LIÊN HỆ & HỖ TRỢ TỔNG ĐÀI         */}
      {/* ======================================================== */}
      {activeSubTab === 'contact' && (
        <Card className="border-slate-800 bg-slate-950 shadow-xl rounded-2xl">
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs shadow-md transition-all hover:scale-105 active:scale-95"
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
                  className="bg-slate-900 border-slate-700 text-xs font-bold text-emerald-400 font-mono"
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
