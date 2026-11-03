import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Scale,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  FileText,
  Bookmark,
  CheckCircle2,
  GraduationCap,
  X,
  Layers,
  Award,
  Zap,
  TrendingUp,
  Shield,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { LawArticle } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

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

interface LawSearchModeProps {
  onAskAi: (query: string) => void;
  onReviewAi: (content: string) => void;
  isDarkMode?: boolean;
}

export const LawSearchMode: React.FC<LawSearchModeProps> = ({ onAskAi, onReviewAi, isDarkMode = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLawCode, setSelectedLawCode] = useState<string>('ALL');
  const [allArticles, setAllArticles] = useState<LawArticle[]>([]);
  const [articles, setArticles] = useState<LawArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 21st.dev mouse tracking for spotlight
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Fetch all articles from real backend on mount to compute live stats
  const fetchAllInitialArticles = async () => {
    try {
      const res = await api.getLaws();
      if (res.success && res.articles && res.articles.length > 0) {
        setAllArticles(res.articles);
        setArticles(res.articles);
      }
    } catch (err) {
      console.error('Error loading law articles:', err);
    }
  };

  useEffect(() => {
    fetchAllInitialArticles();
  }, []);

  // Compute live counts per law code directly from backend data
  const lawCounts = useMemo(() => {
    const counts: Record<string, number> = {
      BLDS2015: 0,
      BLHS2015: 0,
      HNGD2014: 0,
      HP2013: 0,
      ND144: 0
    };
    allArticles.forEach((art) => {
      if (counts[art.lawCode] !== undefined) {
        counts[art.lawCode]++;
      } else {
        counts[art.lawCode] = 1;
      }
    });
    return counts;
  }, [allArticles]);

  const totalLawCount = allArticles.length || 33;

  // Law cards metadata synchronized with real backend database
  const lawCardsMeta = [
    {
      code: 'BLDS2015',
      name: 'Bộ luật Dân sự 2015',
      shortName: 'Dân sự',
      desc: 'Năng lực hành vi, giao dịch vô hiệu, hợp đồng dân sự và thừa kế di sản',
      img: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
      articlesCount: lawCounts['BLDS2015'] || 17,
      badgeColor: 'border-sky-500/40 text-sky-300 bg-sky-500/15'
    },
    {
      code: 'BLHS2015',
      name: 'Bộ luật Hình sự 2015',
      shortName: 'Hình sự',
      desc: '4 Yếu tố cấu thành tội phạm, tuổi chịu TNHS, phòng vệ chính đáng',
      img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      articlesCount: lawCounts['BLHS2015'] || 9,
      badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-500/15'
    },
    {
      code: 'HNGD2014',
      name: 'Luật Hôn nhân & Gia đình 2014',
      shortName: 'Hôn nhân & GĐ',
      desc: 'Điều kiện kết hôn, tài sản chung/riêng vợ chồng, quyền ly hôn và cấp dưỡng',
      img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
      articlesCount: lawCounts['HNGD2014'] || 4,
      badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-500/15'
    },
    {
      code: 'HP2013',
      name: 'Hiến pháp 2013',
      shortName: 'Hiến pháp',
      desc: 'Đạo luật cơ bản, chế độ chính trị, quyền và nghĩa vụ cơ bản của công dân',
      img: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
      articlesCount: lawCounts['HP2013'] || 3,
      badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/15'
    },
    {
      code: 'ND144',
      name: 'Nghị định 144/2021/NĐ-CP',
      shortName: 'Xử phạt Hành chính',
      desc: 'Xử phạt vi phạm trật tự công cộng, phòng chống bạo lực và an ninh trật tự',
      img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      articlesCount: lawCounts['ND144'] || 1,
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/15'
    }
  ];

  const lawCategories = [
    { code: 'ALL', name: `Tất cả văn bản (${totalLawCount})` },
    { code: 'BLDS2015', name: `Bộ luật Dân sự (${lawCounts['BLDS2015'] || 17})` },
    { code: 'BLHS2015', name: `Bộ luật Hình sự (${lawCounts['BLHS2015'] || 9})` },
    { code: 'HNGD2014', name: `Hôn nhân & Gia đình (${lawCounts['HNGD2014'] || 4})` },
    { code: 'HP2013', name: `Hiến pháp 2013 (${lawCounts['HP2013'] || 3})` },
    { code: 'ND144', name: `Nghị định 144 (${lawCounts['ND144'] || 1})` }
  ];

  // Fetch articles based on search & law code filter
  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const codeParam = selectedLawCode === 'ALL' ? undefined : selectedLawCode;
      const res = await api.getLaws(searchTerm.trim() || undefined, codeParam);
      if (res.success && res.articles) {
        setArticles(res.articles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedLawCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  const handleCopy = (article: LawArticle) => {
    const text = `${article.title} - ${article.lawName}\n${article.contentRaw}`;
    navigator.clipboard.writeText(text);
    setCopiedId(article.articleId);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* =========================================================================
          1. HERO BANNER WITH MAGIC UI BORDER BEAM & AMBIENT GLOW
          ========================================================================= */}
      <div className="relative rounded-3xl p-[1.5px] magic-border-beam overflow-hidden shadow-2xl">
        <div className="relative rounded-[23px] overflow-hidden border border-emerald-500/20 bg-gradient-to-r from-emerald-950/80 via-slate-900/95 to-teal-950/80 backdrop-blur-xl">
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-float-orb" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none animate-float-orb-slow" />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12 space-y-4 max-w-4xl">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-xs">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>KHO VĂN BẢN QUY PHẠM PHÁP LUẬT ĐẠI CƯƠNG</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white font-display">
              Tra cứu Điều luật & Căn cứ Pháp lý Hiện hành
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed max-w-3xl text-slate-300">
              Hệ thống cơ sở dữ liệu luật thực định chuẩn hóa, phục vụ việc đối chiếu căn cứ giải bài tập tình huống và trích dẫn chuẩn barem Bộ GD&ĐT. Tích hợp trực tiếp engine tra cứu RAG thời gian thực.
            </p>

            {/* Quick Stats Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold bg-slate-900/80 text-emerald-300 border-emerald-500/30 shadow-xs">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <strong><AnimatedNumber value={totalLawCount} /></strong> Điều luật trọng tâm
              </span>
              <span className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold bg-slate-900/80 text-sky-300 border-sky-500/30 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <strong>5</strong> Cổng pháp quy chính thức
              </span>
              <span className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold bg-slate-900/80 text-amber-300 border-amber-500/30 shadow-xs">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                Chuẩn barem Bộ GD&ĐT (U-02)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. TOP 5 SPOTLIGHT KPI CARDS (21ST.DEV & ANIME.JS)
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Card 1: Tổng Điều Luật */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-emerald-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Điều Luật Số Hóa</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-display">
              <AnimatedNumber value={totalLawCount} />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
              Sẵn sàng RAG
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dân sự • Hình sự • HP</div>
        </div>

        {/* Card 2: Bộ luật Dân sự 2015 */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-sky-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bộ Luật Dân Sự</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-400 font-display">
              <AnimatedNumber value={lawCounts['BLDS2015'] || 17} />
            </span>
            <span className="text-xs text-slate-400 font-bold">điều luật</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hợp đồng & Thừa kế</div>
        </div>

        {/* Card 3: Bộ luật Hình sự 2015 */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-rose-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bộ Luật Hình Sự</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-400 font-display">
              <AnimatedNumber value={lawCounts['BLHS2015'] || 9} />
            </span>
            <span className="text-xs text-slate-400 font-bold">điều luật</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">4 Cấu thành tội phạm</div>
        </div>

        {/* Card 4: Hiến pháp & Hôn nhân */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">HP & Hôn Nhân</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-400 font-display">
              <AnimatedNumber value={(lawCounts['HNGD2014'] || 4) + (lawCounts['HP2013'] || 3)} />
            </span>
            <span className="text-xs text-slate-400 font-bold">điều luật</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Quyền công dân & Hôn nhân</div>
        </div>

        {/* Card 5: Từ Khóa Lập Chỉ Mục BM25 */}
        <div
          onMouseMove={handleMouseMove}
          className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-amber-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden group col-span-2 sm:col-span-1"
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
              <AnimatedNumber value={130} />
            </span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full border border-amber-500/30">
              BM25
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Khớp Intent tự động</div>
        </div>
      </div>

      {/* =========================================================================
          3. VISUAL CARDS: CORE LAW CODES (Bento Quick Filter)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider px-1">
          <span className="flex items-center gap-2 text-slate-200">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Chọn nhanh Bộ luật chuyên ngành:</span>
          </span>
          {selectedLawCode !== 'ALL' && (
            <button
              onClick={() => setSelectedLawCode('ALL')}
              className="text-emerald-400 hover:underline normal-case font-bold cursor-pointer"
            >
              Hiện tất cả {totalLawCount} văn bản
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {lawCardsMeta.map((card) => {
            const isSelected = selectedLawCode === card.code;
            return (
              <button
                key={card.code}
                type="button"
                onClick={() => setSelectedLawCode(isSelected ? 'ALL' : card.code)}
                className={`group relative rounded-2xl overflow-hidden border p-4 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 ${
                  isSelected
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-xl shadow-emerald-500/20 bg-slate-900 scale-[1.02]'
                    : 'border-slate-800 hover:border-emerald-400/60 bg-slate-900/80 hover:bg-slate-900 hover:-translate-y-1 shadow-md'
                }`}
              >
                {/* Background photo with subtle overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={card.img}
                    alt={card.name}
                    className="w-full h-full object-cover filter brightness-[0.25] transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent" />
                </div>

                <div className="relative z-10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-400 shadow-xs'
                          : card.badgeColor
                      }`}
                    >
                      {card.code}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-400 font-mono">
                      <AnimatedNumber value={card.articlesCount} /> Điều
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 pt-0.5">
                    {card.shortName}
                  </div>
                </div>

                <div className="relative z-10 text-[11px] line-clamp-2 leading-relaxed text-slate-300">
                  {card.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. SEARCH BAR & CATEGORY FILTER TABS (MAGIC UI)
          ========================================================================= */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center rounded-2xl border-2 border-slate-800 bg-slate-900/90 shadow-xl transition-all p-2 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-400/20 backdrop-blur-md">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập từ khóa tra cứu (VD: điều kiện có hiệu lực, chia thừa kế, cố ý gây thương tích, năng lực hành vi)..."
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  fetchArticles();
                }}
                className="text-slate-400 hover:text-white mr-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Button
              type="submit"
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold text-xs sm:text-sm shrink-0 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              Tìm kiếm
            </Button>
          </div>
        </form>

        {/* Filter Sub-Tabs */}
        <div className="relative rounded-2xl p-[1.5px] magic-border-beam overflow-hidden shadow-md">
          <div className="relative rounded-[15px] flex items-center gap-2 p-2 bg-slate-950/95 border border-slate-800/90 overflow-x-auto scrollbar-none">
            {lawCategories.map((cat) => (
              <button
                key={cat.code}
                type="button"
                onClick={() => setSelectedLawCode(cat.code)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 border cursor-pointer ${
                  selectedLawCode === cat.code
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs scale-[1.02]'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. ARTICLE RESULTS GRID (21ST.DEV SPOTLIGHT CARDS)
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <span>
            Tìm thấy{' '}
            <strong className="text-white font-mono text-sm">
              <AnimatedNumber value={articles.length} />
            </strong>{' '}
            điều khoản quy phạm chuẩn hóa
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Trạng thái: <strong>Hiệu lực thi hành</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 text-center rounded-3xl border border-slate-800 bg-slate-900/50 text-sm space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-semibold text-slate-200">Đang tìm kiếm trong cơ sở dữ liệu luật...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-14 text-center rounded-3xl border border-slate-800 bg-slate-900/40 space-y-3">
            <FileText className="w-12 h-12 text-slate-500 mx-auto" />
            <div className="text-lg font-bold text-white">Không tìm thấy điều luật phù hợp với từ khóa</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Hãy thử tìm với các từ khóa phổ biến: thừa kế, hợp đồng, hình sự, trách nhiệm pháp lý, năng lực hành vi...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {articles.map((art) => (
              <div
                key={art.articleId || art._id}
                onMouseMove={handleMouseMove}
                className="card-spotlight rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 p-6 transition-all duration-300 flex flex-col justify-between space-y-5 group hover:border-emerald-500/40 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 relative overflow-hidden"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none" />

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-md border shadow-xs ${getLawCodeBadgeStyle(
                            art.lawCode
                          )}`}
                        >
                          {art.lawCode}
                        </span>
                        <span className="text-xs font-black tracking-wide text-emerald-400 font-mono bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                          Điều {art.articleNumber}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug transition-colors group-hover:text-emerald-300">
                        {art.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(art)}
                      className="p-2 rounded-xl transition-colors shrink-0 cursor-pointer text-slate-400 hover:text-white hover:bg-white/10 bg-slate-950 border border-slate-800"
                      title="Sao chép toàn văn điều luật"
                    >
                      {copiedId === art.articleId ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Law Name Subtitle */}
                  <div className="text-xs italic mb-4 flex items-center gap-1.5 text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{art.lawName}</span>
                  </div>

                  {/* Raw Content Box */}
                  <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 text-xs leading-relaxed max-h-52 overflow-y-auto whitespace-pre-line font-serif text-slate-200 border-l-4 border-l-emerald-500 shadow-inner">
                    {art.contentRaw}
                  </div>

                  {/* Keywords Tagging with Instant Filter Click */}
                  {art.keywords && art.keywords.length > 0 && (
                    <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
                      {art.keywords.map((k, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSearchTerm(k);
                            fetchArticles();
                          }}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-md border border-slate-800 bg-slate-950 text-slate-400 hover:text-emerald-300 hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                          #{k}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onAskAi(
                        `Phân tích các yếu tố cấu thành và cho ví dụ áp dụng thực tiễn của ${art.title} theo quy định tại ${art.lawName}?`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hỏi AI về điều này</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onReviewAi(art.contentRaw)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Rà soát văn bản</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
