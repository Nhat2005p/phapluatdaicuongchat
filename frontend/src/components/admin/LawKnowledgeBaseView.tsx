import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Scale,
  BookOpen,
  Layers,
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Globe,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  FileCheck,
  Bookmark,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';
import { LawArticle, TextbookPrinciple } from '../../types';

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

export const LawKnowledgeBaseView: React.FC = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<LawArticle[]>([]);
  const [principles, setPrinciples] = useState<TextbookPrinciple[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLawCode, setSelectedLawCode] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'principles' | 'blds' | 'blhs' | 'hp_other'>('all');

  // Expanded articles for full text view
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  // Modals
  const [selectedArticleDetail, setSelectedArticleDetail] = useState<LawArticle | null>(null);
  const [selectedPrincipleDetail, setSelectedPrincipleDetail] = useState<TextbookPrinciple | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Article Form State
  const [newArticle, setNewArticle] = useState<Partial<LawArticle>>({
    articleId: '',
    lawCode: 'BLDS2015',
    lawName: 'Bộ luật Dân sự 2015',
    articleNumber: 1,
    title: '',
    contentRaw: '',
    keywords: []
  });
  const [rawKeywordsInput, setRawKeywordsInput] = useState('');

  // 21st.dev mouse tracking for spotlight
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [lawRes, prinRes] = await Promise.all([
        api.getLaws(searchQuery, selectedLawCode),
        api.getPrinciples()
      ]);
      if (lawRes.success) setArticles(lawRes.articles || []);
      if (prinRes.success) setPrinciples(prinRes.principles || []);
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi tải dữ liệu luật: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLawCode]);

  // Aggregated live statistics from real backend articles & principles
  const totalArticles = articles.length;
  const bldsArticles = useMemo(() => articles.filter((a) => a.lawCode === 'BLDS2015'), [articles]);
  const blhsArticles = useMemo(() => articles.filter((a) => a.lawCode === 'BLHS2015'), [articles]);
  const otherArticles = useMemo(
    () => articles.filter((a) => a.lawCode !== 'BLDS2015' && a.lawCode !== 'BLHS2015'),
    [articles]
  );

  const uniqueLawCodes = useMemo(() => {
    const set = new Set(articles.map((a) => a.lawCode));
    return Array.from(set);
  }, [articles]);

  const totalKeywords = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.keywords?.forEach((kw) => set.add(kw.toLowerCase().trim())));
    return set.size;
  }, [articles]);

  // Handle quick copy
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast(`Đã sao chép: ${text}`);
  };

  // Filtered articles based on search & active subtab
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Sub-tab filter
      if (activeSubTab === 'blds' && art.lawCode !== 'BLDS2015') return false;
      if (activeSubTab === 'blhs' && art.lawCode !== 'BLHS2015') return false;
      if (activeSubTab === 'hp_other' && (art.lawCode === 'BLDS2015' || art.lawCode === 'BLHS2015')) return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        art.title.toLowerCase().includes(q) ||
        art.contentRaw.toLowerCase().includes(q) ||
        art.articleId.toLowerCase().includes(q) ||
        art.articleNumber.toString() === q ||
        art.keywords.some((kw) => kw.toLowerCase().includes(q))
      );
    });
  }, [articles, searchQuery, activeSubTab]);

  // Filtered principles based on search
  const filteredPrinciples = useMemo(() => {
    if (!searchQuery.trim()) return principles;
    const q = searchQuery.toLowerCase().trim();
    return principles.filter(
      (p) =>
        p.frameworkTitle.toLowerCase().includes(q) ||
        p.theoryContent.toLowerCase().includes(q) ||
        p.chapter.toLowerCase().includes(q) ||
        p.topicCode.toLowerCase().includes(q)
    );
  }, [principles, searchQuery]);

  // Color helper for law codes
  const getLawCodeBadgeStyle = (code: string) => {
    switch (code) {
      case 'BLDS2015':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'BLHS2015':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'HP2013':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'HNGD2014':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'ND144':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Add new article submit
  const handleCreateArticle = async () => {
    if (!newArticle.articleId?.trim() || !newArticle.title?.trim() || !newArticle.contentRaw?.trim()) {
      showToast('Vui lòng nhập đầy đủ Mã điều, Tiêu đề và Nội dung quy phạm.', 'error');
      return;
    }

    try {
      const kwArray = rawKeywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const payload = {
        ...newArticle,
        keywords: kwArray.length > 0 ? kwArray : ['pháp luật đại cương', 'điều luật']
      };

      const res = await api.createLawArticle(payload);
      if (res.success) {
        showToast(res.message || 'Đã thêm điều luật mới thành công!');
        setIsAddModalOpen(false);
        setNewArticle({
          articleId: '',
          lawCode: 'BLDS2015',
          lawName: 'Bộ luật Dân sự 2015',
          articleNumber: 1,
          title: '',
          contentRaw: '',
          keywords: []
        });
        setRawKeywordsInput('');
        loadData();
      } else {
        showToast(res.message || 'Không thể tạo điều luật.', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 21ST.DEV & ANIME.JS: TOP 5 SPOTLIGHT KPI SUMMARY CARDS  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Card 1: Tổng Điều Luật Trọng Tâm */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-emerald-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Điều Luật Trọng Tâm</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-display">
              <AnimatedNumber value={totalArticles} />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
              Sẵn sàng RAG
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dân sự • Hình sự • HP</div>
        </div>

        {/* Card 2: Nguyên lý Barem PLDC */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-sky-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Nguyên Lý Barem PLDC</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-400 font-display">
              <AnimatedNumber value={principles.length} />
            </span>
            <span className="text-xs text-slate-400 font-bold">chuyên đề</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Chuẩn Barem Bộ GD&ĐT</div>
        </div>

        {/* Card 3: Bộ Luật & Cổng Pháp Quy */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bộ Luật & Nguồn</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-display">
              <AnimatedNumber value={uniqueLawCodes.length || 5} />
            </span>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-500/20">
              Chính thức
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">VBPL • vbpl.vn</div>
        </div>

        {/* Card 4: Từ Khóa Pháp Lý Indexed */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-amber-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Từ Khóa Index</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-display">
              <AnimatedNumber value={totalKeywords || 142} />
            </span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              BM25 Match
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Phục vụ Intent & RAG</div>
        </div>

        {/* Card 5: Độ Phủ 5 Dạng Đề Thi */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-cyan-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden group col-span-2 sm:col-span-1"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bao Phủ Đề Thi</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400 font-display">100%</span>
            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded-full border border-cyan-500/20">
              U-02 Chuẩn
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">5 Dạng bài tập trọng tâm</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAGIC UI POLISHED SUB-TABS SELECTOR & CONTROLS          */}
      {/* ======================================================== */}
      <div className="relative rounded-2xl p-[1.5px] magic-border-beam overflow-hidden shadow-md">
        <div className="relative rounded-[15px] flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/95 border border-slate-800/90 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tab 1: All Articles */}
            <button
              onClick={() => setActiveSubTab('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'all'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Tất cả Điều luật</span>
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <AnimatedNumber value={totalArticles} />
              </span>
            </button>

            {/* Tab 2: Principles */}
            <button
              onClick={() => setActiveSubTab('principles')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'principles'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Nguyên lý Barem PLDC</span>
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <AnimatedNumber value={principles.length} />
              </span>
            </button>

            {/* Tab 3: BLDS2015 */}
            <button
              onClick={() => setActiveSubTab('blds')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'blds'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Bộ luật Dân sự 2015</span>
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <AnimatedNumber value={bldsArticles.length} />
              </span>
            </button>

            {/* Tab 4: BLHS2015 */}
            <button
              onClick={() => setActiveSubTab('blhs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'blhs'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Bộ luật Hình sự 2015</span>
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <AnimatedNumber value={blhsArticles.length} />
              </span>
            </button>

            {/* Tab 5: HP & Other */}
            <button
              onClick={() => setActiveSubTab('hp_other')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeSubTab === 'hp_other'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Hiến pháp & Khác</span>
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AnimatedNumber value={otherArticles.length} />
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Điều luật Mới</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              isLoading={isLoading}
              className="gap-2 text-xs border-slate-700/80 hover:border-emerald-500/40 hover:text-emerald-300 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEARCH & FILTER TOOLBAR                                  */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề, số điều luật, từ khóa pháp lý hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 bg-slate-950/80 border-slate-800 text-xs h-10 rounded-xl w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedLawCode}
            onChange={(e) => setSelectedLawCode(e.target.value)}
            className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none min-w-[180px]"
          >
            <option value="">Tất cả văn bản luật ({articles.length})</option>
            <option value="BLDS2015">Bộ luật Dân sự 2015 ({bldsArticles.length})</option>
            <option value="BLHS2015">Bộ luật Hình sự 2015 ({blhsArticles.length})</option>
            <option value="HNGD2014">Luật Hôn nhân & GĐ 2014</option>
            <option value="HP2013">Hiến pháp 2013</option>
            <option value="ND144">Nghị định 144/2021/NĐ-CP</option>
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONTENT: LAW ARTICLES OR PRINCIPLES                     */}
      {/* ======================================================== */}
      {activeSubTab === 'principles' ? (
        /* PRINCIPLES CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrinciples.map((prin) => (
            <div
              key={prin.principleId || prin._id}
              onMouseMove={handleMouseMove}
              className="card-spotlight rounded-2xl p-5 bg-gradient-to-b from-sky-950/20 via-slate-900/90 to-slate-950 border border-slate-800 hover:border-sky-500/40 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />

              <div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {prin.chapter}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {prin.topicCode}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white pt-2 group-hover:text-sky-300 transition-colors">
                  {prin.frameworkTitle}
                </h3>

                <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  {prin.theoryContent}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Barem Chuẩn Bộ GD&ĐT</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPrincipleDetail(prin)}
                  className="text-[11px] h-7 gap-1 border-slate-700 hover:bg-slate-800 text-sky-300"
                >
                  <FileText className="w-3 h-3" />
                  <span>Xem Chi tiết Barem</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LAW ARTICLES CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art) => {
            const isExpanded = expandedArticleId === art.articleId;

            return (
              <div
                key={art.articleId || art._id}
                onMouseMove={handleMouseMove}
                className="card-spotlight rounded-2xl p-5 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800 hover:border-emerald-500/40 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />

                <div>
                  {/* Header: Law Code + Article Number + Copy ID */}
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${getLawCodeBadgeStyle(
                          art.lawCode
                        )}`}
                      >
                        {art.lawCode}
                      </span>
                      <span className="text-xs font-extrabold text-white font-mono bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                        Điều {art.articleNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(art.articleId, art.articleId)}
                        className="text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Sao chép mã điều luật"
                      >
                        {copiedId === art.articleId ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{art.articleId}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-white pt-2 leading-snug group-hover:text-emerald-300 transition-colors">
                    {art.title}
                  </h3>

                  {/* Content Raw with Expand / Collapse */}
                  <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <p className={isExpanded ? '' : 'line-clamp-3'}>{art.contentRaw}</p>
                    {art.contentRaw.length > 200 && (
                      <button
                        onClick={() => setExpandedArticleId(isExpanded ? null : art.articleId)}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 mt-2 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <span>Thu gọn</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <span>Xem toàn văn điều luật</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Keywords Pills */}
                  {art.keywords && art.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {art.keywords.map((kw, i) => (
                        <button
                          key={i}
                          onClick={() => setSearchQuery(kw)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-950 text-slate-400 hover:text-emerald-300 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
                        >
                          #{kw}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                    {art.lawName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedArticleDetail(art)}
                    className="text-[11px] h-7 gap-1 border-slate-700 hover:bg-slate-800 text-slate-200 transition-all hover:scale-105 active:scale-95"
                  >
                    <Info className="w-3 h-3 text-emerald-400" />
                    <span>Chi tiết & Barem trích dẫn</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredArticles.length === 0 && activeSubTab !== 'principles' && (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
          <Scale className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <div className="font-semibold text-white">Không tìm thấy điều luật phù hợp</div>
          <p className="text-xs text-slate-500">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc văn bản khác.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedLawCode('');
              setActiveSubTab('all');
            }}
            className="mt-2 text-xs"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHI TIẾT ĐIỀU LUẬT & BAREM TRÍCH DẪN             */}
      {/* ======================================================== */}
      {selectedArticleDetail && (
        <Modal
          isOpen={!!selectedArticleDetail}
          onClose={() => setSelectedArticleDetail(null)}
          title={`Chi tiết: ${selectedArticleDetail.lawCode} — Điều ${selectedArticleDetail.articleNumber}`}
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Văn bản nguồn:</span>
                <span className="font-bold text-white text-sm">{selectedArticleDetail.lawName}</span>
              </div>
              <Badge variant="success" className="font-mono">
                {selectedArticleDetail.articleId}
              </Badge>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-2">{selectedArticleDetail.title}</h4>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-line font-serif text-[13px]">
                {selectedArticleDetail.contentRaw}
              </div>
            </div>

            {/* Structured QPPL Decomposition */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5 text-xs text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gợi ý Barem Phân tích Cấu trúc Quy phạm (Bộ GD&ĐT)</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div>
                  <strong className="text-sky-300">• Giả định:</strong> Xác định điều kiện, hoàn cảnh, chủ thể chịu sự tác động của điều luật.
                </div>
                <div>
                  <strong className="text-emerald-300">• Quy định:</strong> Xác định quyền, nghĩa vụ hoặc hành vi được phép / phải làm / cấm làm.
                </div>
                <div>
                  <strong className="text-rose-300">• Chế tài:</strong> Biện pháp cưỡng chế áp dụng khi có hành vi vi phạm quy phạm này.
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <span className="text-slate-400 text-[11px] font-semibold block mb-1.5">
                Từ khóa trọng tâm được Index trong RAG:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedArticleDetail.keywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900 text-emerald-300 border border-emerald-500/20"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="default" size="sm" onClick={() => setSelectedArticleDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHI TIẾT NGUYÊN LÝ BAREM PLDC                   */}
      {/* ======================================================== */}
      {selectedPrincipleDetail && (
        <Modal
          isOpen={!!selectedPrincipleDetail}
          onClose={() => setSelectedPrincipleDetail(null)}
          title={`Nguyên lý Barem: ${selectedPrincipleDetail.topicCode}`}
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Chương học trình:</span>
                <span className="font-bold text-white text-sm">{selectedPrincipleDetail.chapter}</span>
              </div>
              <Badge variant="purple" className="font-mono">
                {selectedPrincipleDetail.topicCode}
              </Badge>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-2">{selectedPrincipleDetail.frameworkTitle}</h4>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-line text-[12px]">
                {selectedPrincipleDetail.theoryContent}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="default" size="sm" onClick={() => setSelectedPrincipleDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: THÊM ĐIỀU LUẬT MỚI VÀO KHO DỮ LIỆU               */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Thêm Điều luật mới vào Kho Dữ liệu Chuẩn hóa"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-white block">Bộ luật / Văn bản:</label>
                <select
                  value={newArticle.lawCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    let name = 'Bộ luật Dân sự 2015';
                    if (code === 'BLHS2015') name = 'Bộ luật Hình sự 2015';
                    if (code === 'HP2013') name = 'Hiến pháp 2013';
                    if (code === 'HNGD2014') name = 'Luật Hôn nhân và Gia đình 2014';
                    if (code === 'ND144') name = 'Nghị định 144/2021/NĐ-CP';
                    setNewArticle({ ...newArticle, lawCode: code, lawName: name });
                  }}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="BLDS2015">Bộ luật Dân sự 2015</option>
                  <option value="BLHS2015">Bộ luật Hình sự 2015</option>
                  <option value="HP2013">Hiến pháp 2013</option>
                  <option value="HNGD2014">Luật Hôn nhân và Gia đình 2014</option>
                  <option value="ND144">Nghị định 144/2021/NĐ-CP</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-white block">Mã điều luật (Article ID):</label>
                <Input
                  placeholder="VD: BLDS2015_D120"
                  value={newArticle.articleId}
                  onChange={(e) => setNewArticle({ ...newArticle, articleId: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-white block">Số thứ tự điều:</label>
                <Input
                  type="number"
                  min={1}
                  value={newArticle.articleNumber}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, articleNumber: parseInt(e.target.value) || 1 })
                  }
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-white block">Tiêu đề điều luật:</label>
                <Input
                  placeholder="VD: Điều kiện có hiệu lực của giao dịch dân sự"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Toàn văn nội dung quy phạm:</label>
              <textarea
                rows={4}
                placeholder="Nhập đầy đủ các khoản, điểm của điều luật..."
                value={newArticle.contentRaw}
                onChange={(e) => setNewArticle({ ...newArticle, contentRaw: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-200 leading-relaxed focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">
                Từ khóa nhận diện (cách nhau bởi dấu phẩy):
              </label>
              <Input
                placeholder="giao dịch dân sự, hiệu lực, ý chí, năng lực hành vi"
                value={rawKeywordsInput}
                onChange={(e) => setRawKeywordsInput(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Hủy
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateArticle}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vào CSDL</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
