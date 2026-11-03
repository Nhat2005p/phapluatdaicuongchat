import React, { useState, useEffect } from 'react';
import {
  Database,
  Globe,
  DownloadCloud,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Trash2,
  Edit3,
  Upload,
  Cpu,
  Sparkles,
  Filter,
  Check,
  PauseCircle,
  PlayCircle,
  FileUp,
  Zap,
  TrendingUp,
  Activity,
  FileCheck,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import { CrawlSourceItem, CrawlJobItem, KnowledgeChunkItem } from '../../types';

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

export const KnowledgeCrawlManagementView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'links' | 'crawl_table' | 'vector_db'>('links');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Link Management state
  const [sources, setSources] = useState<CrawlSourceItem[]>([]);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    category: 'Luật & Bộ luật' as CrawlSourceItem['category'],
    crawlFrequency: 'Hàng tuần' as CrawlSourceItem['crawlFrequency'],
    selectorRules: 'div.doc-content, table.vbpl-articles'
  });

  // Crawl Table state
  const [crawlJobs, setCrawlJobs] = useState<CrawlJobItem[]>([]);

  // Vector DB Chunks state
  const [chunks, setChunks] = useState<KnowledgeChunkItem[]>([]);
  const [totalInVectorDb, setTotalInVectorDb] = useState(0);
  const [chunkSearch, setChunkSearch] = useState('');
  const [chunkLawFilter, setChunkLawFilter] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    lawCode: 'BLDS2015',
    documentType: 'Nghị định mới ban hành',
    articleNumber: 1,
    fullContent: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  // Edit Chunk Modal
  const [editingChunk, setEditingChunk] = useState<KnowledgeChunkItem | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadSources = async () => {
    try {
      const res = await api.getCrawlSources();
      if (res.success && res.sources) {
        setSources(res.sources);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadCrawlJobs = async () => {
    try {
      const res = await api.getCrawlJobs();
      if (res.success && res.jobs) {
        setCrawlJobs(res.jobs);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadChunks = async () => {
    try {
      const res = await api.getKnowledgeChunks({
        search: chunkSearch,
        lawCode: chunkLawFilter
      });
      if (res.success) {
        setChunks(res.chunks || []);
        setTotalInVectorDb(res.totalInVectorDb || (res.chunks ? res.chunks.length : 0));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([loadSources(), loadCrawlJobs(), loadChunks()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'vector_db') {
      loadChunks();
    }
  }, [chunkLawFilter]);

  // Aggregated live statistics from backend
  const totalSources = sources.length;
  const activeSources = sources.filter(s => s.status === 'active').length;
  const pausedSources = sources.filter(s => s.status === 'paused').length;
  const totalExtractedDocs = sources.reduce((acc, s) => acc + (s.extractedDocsCount || 0), 0);
  const totalJobsCount = crawlJobs.length;
  const totalJobsChunks = crawlJobs.reduce((acc, j) => acc + (j.chunksGenerated || 0), 0);

  // 1. Thêm nguồn crawl mới
  const handleCreateSource = async () => {
    if (!newSource.name.trim() || !newSource.url.trim()) {
      showToast('Vui lòng nhập tên nguồn và đường dẫn URL.', 'error');
      return;
    }
    try {
      const res = await api.createCrawlSource(newSource);
      if (res.success) {
        showToast(res.message);
        setIsAddSourceModalOpen(false);
        setNewSource({
          name: '',
          url: '',
          category: 'Luật & Bộ luật',
          crawlFrequency: 'Hàng tuần',
          selectorRules: 'div.doc-content, table.vbpl-articles'
        });
        loadSources();
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // 2. Kích hoạt crawl thủ công cho một nguồn
  const handleTriggerCrawl = async (sourceId: string, sourceName: string) => {
    try {
      showToast(`Đang khởi động tiến trình quét dữ liệu cho "${sourceName}"...`);
      const res = await api.triggerCrawlSource(sourceId);
      if (res.success) {
        showToast(res.message);
        loadSources();
        loadCrawlJobs();
        loadChunks();
      }
    } catch (err: any) {
      showToast('Lỗi quét dữ liệu: ' + err.message, 'error');
    }
  };

  // 3. Đổi trạng thái nguồn (Active / Paused)
  const handleToggleSourceStatus = async (source: CrawlSourceItem) => {
    const nextStatus = source.status === 'active' ? 'paused' : 'active';
    try {
      const res = await api.updateCrawlSource(source._id || source.id!, { status: nextStatus });
      if (res.success) {
        showToast(`Đã chuyển nguồn "${source.name}" sang ${nextStatus === 'active' ? 'Hoạt động' : 'Tạm dừng'}.`);
        loadSources();
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // 4. Xóa nguồn
  const handleDeleteSource = async (sourceId: string, sourceName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nguồn "${sourceName}"?`)) return;
    try {
      const res = await api.deleteCrawlSource(sourceId);
      if (res.success) {
        showToast(res.message);
        loadSources();
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  // 5. Upload văn bản luật mới
  const handleUploadDocument = async () => {
    if (!uploadData.title.trim() || !uploadData.fullContent.trim()) {
      showToast('Vui lòng nhập tiêu đề văn bản và nội dung.', 'error');
      return;
    }
    setIsUploading(true);
    try {
      const res = await api.uploadNewLawDocument(uploadData);
      if (res.success) {
        showToast(res.message);
        setIsUploadModalOpen(false);
        setUploadData({
          title: '',
          lawCode: 'BLDS2015',
          documentType: 'Nghị định mới ban hành',
          articleNumber: 1,
          fullContent: ''
        });
        loadChunks();
      }
    } catch (err: any) {
      showToast('Lỗi tải văn bản: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // 6. Cập nhật chunk
  const handleSaveChunkEdit = async () => {
    if (!editingChunk) return;
    try {
      const res = await api.updateKnowledgeChunk(editingChunk._id || editingChunk.id!, {
        title: editingChunk.title,
        content: editingChunk.content,
        tags: editingChunk.tags
      });
      if (res.success) {
        showToast(res.message);
        setEditingChunk(null);
        loadChunks();
      }
    } catch (err: any) {
      showToast('Lỗi cập nhật chunk: ' + err.message, 'error');
    }
  };

  // 7. Xóa chunk
  const handleDeleteChunk = async (chunkId: string, chunkTitle: string) => {
    if (!window.confirm(`Xóa chunk tri thức "${chunkTitle}" khỏi Vector Database?`)) return;
    try {
      const res = await api.deleteKnowledgeChunk(chunkId);
      if (res.success) {
        showToast(res.message);
        loadChunks();
      }
    } catch (err: any) {
      showToast('Lỗi xóa chunk: ' + err.message, 'error');
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Luật & Bộ luật':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'Giáo trình & Barem PLDC':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      case 'Nghị định & Thông tư':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/25';
      case 'Án lệ & Giải đáp':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-sm shadow-xl transition-all ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
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
          <button onClick={() => setToastMsg(null)} className="text-xs text-slate-400 hover:text-white ml-3 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top 5 KPI Summary Cards with 21st.dev Spotlights & Anime.js Springs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Card 1: Tổng Nguồn Tri thức */}
        <div className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-emerald-400/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none"></span>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cổng Dữ liệu Nguồn</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-display">
              <AnimatedNumber value={totalSources} />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
              {activeSources} Sẵn sàng
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{pausedSources > 0 ? `${pausedSources} nguồn tạm dừng` : '100% Kết nối tốt'}</div>
        </div>

        {/* Card 2: Văn bản Đã Bóc Tách */}
        <div className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none"></span>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Văn bản Đã Bóc Tách</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-400 font-display">
              <AnimatedNumber value={totalExtractedDocs} />
            </span>
            <span className="text-xs text-slate-400 font-medium">văn bản</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đã chuẩn hóa RAG</div>
        </div>

        {/* Card 3: Khối Vector Tri thức */}
        <div className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none"></span>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vector Chunks (RAG)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-400 font-display">
              <AnimatedNumber value={totalInVectorDb} />
            </span>
            <span className="text-xs text-purple-300 font-medium">chunks</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">bge-m3 (1024-dim)</div>
        </div>

        {/* Card 4: Đợt Quét Đã Thực Hiện */}
        <div className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-sky-400/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none"></span>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đợt Quét Thu Thập</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
              <DownloadCloud className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-300 font-display">
              <AnimatedNumber value={totalJobsCount} />
            </span>
            <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-500/20">
              +{totalJobsChunks} chunks
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">100% Hoàn thành OK</div>
        </div>

        {/* Card 5: Tần Suất & Tự Động */}
        <div className="card-spotlight p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-amber-400/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden group col-span-2 sm:col-span-1">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none"></span>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tiến trình Auto-Crawl</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-display">24/7</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Cron
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hàng ngày & Hàng tuần</div>
        </div>
      </div>

      {/* Sub-Tabs Selector with Magic UI Polish */}
      <div className="relative rounded-2xl p-[1.5px] magic-border-beam overflow-hidden shadow-md">
        <div className="relative rounded-[15px] flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/95 border border-slate-800/90 backdrop-blur-md">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSubTab('links')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'links'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Nguồn Dữ liệu & Liên kết</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                <AnimatedNumber value={sources.length} />
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('crawl_table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'crawl_table'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Nhật ký Thu thập dữ liệu</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                <AnimatedNumber value={crawlJobs.length} />
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('vector_db')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'vector_db'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Quản lý Vector DB (Knowledge Base)</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/70 text-purple-300 border border-purple-500/30">
                <AnimatedNumber value={totalInVectorDb} /> Chunks
              </span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAll}
            isLoading={isLoading}
            className="gap-1.5 text-xs border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl cursor-pointer active:scale-95 transition-transform"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SUB-TAB: QUẢN LÝ NGUỒN TÀI LIỆU & LIÊN KẾT           */}
      {/* ======================================================== */}
      {activeSubTab === 'links' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-3xl border border-slate-800/90 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Danh mục Nguồn Văn bản & URL Thu thập (Link Management)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cấu hình các cổng thông tin pháp luật, trang công báo và giáo trình phục vụ hệ thống RAG thời gian thực.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddSourceModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs shadow-md rounded-xl cursor-pointer active:scale-95 transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Nguồn Dữ liệu mới</span>
            </Button>
          </div>

          <Card className="border-slate-800/90 bg-slate-950/95 overflow-hidden shadow-2xl rounded-3xl backdrop-blur-md">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Tên nguồn & Đường dẫn URL</th>
                    <th className="px-4 py-3.5">Phân loại tài liệu</th>
                    <th className="px-4 py-3.5">Tần suất quét</th>
                    <th className="px-4 py-3.5">Trạng thái kết nối</th>
                    <th className="px-4 py-3.5">Văn bản đã trích xuất</th>
                    <th className="px-4 py-3.5">Lần quét gần nhất</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sources.map((s) => (
                    <tr key={s._id || s.id} className="hover:bg-slate-900/60 transition-colors">
                      {/* Name & URL */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{s.name}</div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span className="max-w-[280px] truncate">{s.url}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getCategoryBadgeClass(s.category)}`}>
                          {s.category}
                        </span>
                      </td>

                      {/* Frequency */}
                      <td className="px-4 py-3.5 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{s.crawlFrequency}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {s.status === 'active' ? (
                          <Badge variant="success" className="gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>Hoạt động</span>
                          </Badge>
                        ) : s.status === 'paused' ? (
                          <Badge variant="warning" className="gap-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            <PauseCircle className="w-3 h-3" />
                            <span>Tạm dừng</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Lỗi kết nối</span>
                          </Badge>
                        )}
                      </td>

                      {/* Docs Count with animated counter */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-emerald-400">
                          <AnimatedNumber value={s.extractedDocsCount} />
                        </span>{' '}
                        <span className="text-slate-500">văn bản</span>
                      </td>

                      {/* Last Crawl */}
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {s.lastCrawlAt ? new Date(s.lastCrawlAt).toLocaleString('vi-VN') : 'Chưa quét'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTriggerCrawl(s._id || s.id!, s.name)}
                            className="h-7 px-2.5 text-[11px] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1 rounded-xl cursor-pointer active:scale-95 transition-transform"
                            title="Quét dữ liệu từ nguồn này ngay bây giờ"
                          >
                            <Play className="w-3 h-3" />
                            <span>Quét ngay</span>
                          </Button>

                          <button
                            onClick={() => handleToggleSourceStatus(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title={s.status === 'active' ? 'Tạm dừng nguồn' : 'Kích hoạt nguồn'}
                          >
                            {s.status === 'active' ? (
                              <PauseCircle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-emerald-400" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteSource(s._id || s.id!, s.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Xóa nguồn này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
      {/* 2. SUB-TAB: QUẢN LÝ THU THẬP DỮ LIỆU (CRAWL TABLE)       */}
      {/* ======================================================== */}
      {activeSubTab === 'crawl_table' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-3xl border border-slate-800/90 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DownloadCloud className="w-4 h-4 text-sky-400" />
                <span>Nhật ký & Lịch sử Thu thập Dữ liệu (Crawl Table)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Theo dõi toàn bộ các đợt bóc tách dữ liệu tự động hoặc kích hoạt thủ công từ các nguồn pháp luật.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (sources.length > 0) {
                  handleTriggerCrawl(sources[0]._id || sources[0].id!, sources[0].name);
                }
              }}
              className="border-sky-500/40 text-sky-300 hover:bg-sky-500/10 gap-1.5 text-xs rounded-xl cursor-pointer active:scale-95 transition-transform"
            >
              <Play className="w-3.5 h-3.5 text-sky-400" />
              <span>Kích hoạt Đợt Quét mới</span>
            </Button>
          </div>

          <Card className="border-slate-800/90 bg-slate-950/95 overflow-hidden shadow-2xl rounded-3xl backdrop-blur-md">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Mã đợt (Job Code)</th>
                    <th className="px-4 py-3.5">Nguồn thu thập</th>
                    <th className="px-4 py-3.5">Thời điểm bắt đầu</th>
                    <th className="px-4 py-3.5">Thời lượng</th>
                    <th className="px-4 py-3.5">Văn bản bóc tách</th>
                    <th className="px-4 py-3.5">Vector Chunks tạo mới</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Người kích hoạt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {crawlJobs.map((job) => (
                    <tr key={job._id || job.id || job.jobCode} className="hover:bg-slate-900/60 transition-colors">
                      {/* Job Code */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-semibold text-sky-300 px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-500/30">
                          {job.jobCode}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white max-w-[260px] truncate">{job.sourceName}</div>
                        <div className="text-[10px] text-slate-500 max-w-[260px] truncate">{job.sourceUrl}</div>
                      </td>

                      {/* Start Time */}
                      <td className="px-4 py-3.5 text-slate-400">
                        {new Date(job.startedAt).toLocaleString('vi-VN')}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        {job.durationSeconds}s
                      </td>

                      {/* Docs Extracted */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-emerald-400">+{job.docsExtracted}</span>{' '}
                        <span className="text-slate-500">văn bản</span>
                      </td>

                      {/* Chunks Generated */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-purple-400">+{job.chunksGenerated}</span>{' '}
                        <span className="text-slate-500">chunks</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {job.status === 'completed' ? (
                          <Badge variant="success" className="gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Hoàn thành 100%</span>
                          </Badge>
                        ) : job.status === 'in_progress' ? (
                          <Badge variant="warning" className="gap-1.5 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Đang bóc tách</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Thất bại</span>
                          </Badge>
                        )}
                      </td>

                      {/* Triggered By */}
                      <td className="px-4 py-3.5 text-right text-slate-400 text-[11px]">
                        {job.triggeredBy}
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
      {/* 3. SUB-TAB: QUẢN LÝ VECTOR DATABASE (KNOWLEDGE BASE)     */}
      {/* ======================================================== */}
      {activeSubTab === 'vector_db' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-3xl border border-slate-800/90 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Quản trị Cơ sở Dữ liệu Vector & Chunks Tri thức (Vector Database)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Xem, sửa đổi hoặc xóa các chunk tri thức; tải lên trực tiếp văn bản Luật/Nghị định mới để nhúng vector vào RAG.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5 text-xs shadow-md rounded-xl cursor-pointer active:scale-95 transition-transform"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>+ Tải lên Văn bản Luật mới</span>
            </Button>
          </div>

          {/* Search & Filter bar for Chunks with Magic UI polish */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <Input
                placeholder="Tìm kiếm chunk theo tiêu đề, nội dung quy phạm, chunkId..."
                value={chunkSearch}
                onChange={(e) => setChunkSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadChunks()}
                className="pl-10 bg-slate-900/90 border-slate-800 text-xs text-white placeholder-slate-500 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={chunkLawFilter}
                onChange={(e) => setChunkLawFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-800 bg-slate-900/90 px-3 text-xs text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="">Tất cả văn bản luật</option>
                <option value="BLDS2015">Bộ luật Dân sự 2015</option>
                <option value="BLHS2015">Bộ luật Hình sự 2015</option>
                <option value="HP2013">Hiến pháp 2013</option>
                <option value="GT_PLDC">Giáo trình PLDC</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={loadChunks}
                className="h-10 gap-1.5 text-xs border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl cursor-pointer active:scale-95 transition-transform"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Tìm kiếm</span>
              </Button>
            </div>
          </div>

          {/* Chunks Grid with 21st.dev Spotlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chunks.map((chk) => (
              <div
                key={chk._id || chk.id || chk.chunkId}
                className="card-spotlight p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 pointer-events-none"></span>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-500/30">
                    {chk.chunkId}
                  </span>
                  <Badge variant="purple" className="text-[10px]">
                    {chk.embeddingModel} ({chk.vectorDimensions}d)
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white pt-1 line-clamp-1">
                    {chk.title}
                  </h3>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{chk.sourceDoc}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-slate-300 line-clamp-4 leading-relaxed font-serif text-[11px]">
                  {chk.content}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  <div className="flex flex-wrap gap-1">
                    {chk.tags &&
                      chk.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-slate-950 text-slate-400 border border-slate-800 font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingChunk(chk)}
                      className="h-7 px-2.5 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800/80 gap-1 rounded-xl cursor-pointer active:scale-95 transition-transform"
                      title="Chỉnh sửa nội dung chunk & tái vector hóa"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Sửa</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChunk(chk._id || chk.id!, chk.title)}
                      className="h-7 px-2 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl cursor-pointer active:scale-95 transition-transform"
                      title="Xóa chunk này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: THÊM NGUỒN TÀI LIỆU CRAWL MỚI                   */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddSourceModalOpen}
        onClose={() => setIsAddSourceModalOpen(false)}
        title="Thêm Nguồn Dữ liệu & URL Quét mới (Link Management)"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="space-y-1.5">
            <label className="font-semibold text-white block">Tên nguồn văn bản:</label>
            <Input
              placeholder="VD: Cổng Thông tin Điện tử Bộ Tư pháp"
              value={newSource.name}
              onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
              className="bg-slate-900 border-slate-700 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-white block">Đường dẫn URL nguồn:</label>
            <Input
              placeholder="https://moj.gov.vn/van-ban-quy-pham..."
              value={newSource.url}
              onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              className="bg-slate-900 border-slate-700 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Phân loại tài liệu:</label>
              <select
                value={newSource.category}
                onChange={(e) => setNewSource({ ...newSource, category: e.target.value as any })}
                className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 focus:outline-none"
              >
                <option value="Luật & Bộ luật">Luật & Bộ luật</option>
                <option value="Nghị định & Thông tư">Nghị định & Thông tư</option>
                <option value="Giáo trình & Barem PLDC">Giáo trình & Barem PLDC</option>
                <option value="Án lệ & Giải đáp">Án lệ & Giải đáp</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Tần suất quét tự động:</label>
              <select
                value={newSource.crawlFrequency}
                onChange={(e) => setNewSource({ ...newSource, crawlFrequency: e.target.value as any })}
                className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 focus:outline-none"
              >
                <option value="Hàng ngày">Hàng ngày (Daily)</option>
                <option value="Hàng tuần">Hàng tuần (Weekly)</option>
                <option value="Thủ công">Thủ công (Manual)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-white block">Bộ chọn vùng trích xuất (CSS Selector):</label>
            <Input
              placeholder="div.doc-content, table.articles"
              value={newSource.selectorRules}
              onChange={(e) => setNewSource({ ...newSource, selectorRules: e.target.value })}
              className="bg-slate-900 border-slate-700 text-xs font-mono"
            />
            <p className="text-[11px] text-slate-500">
              * Giúp hệ thống crawler loại bỏ các thành phần quảng cáo, header, footer và chỉ trích xuất đúng điều luật.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddSourceModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateSource}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Thêm Nguồn Dữ liệu</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: TẢI LÊN TRỰC TIẾP VĂN BẢN MỚI (VECTOR DB UPLOAD) */}
      {/* ======================================================== */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Tải lên & Vector hóa Văn bản Luật mới vào Knowledge Base"
        className="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p className="text-slate-400">
            Dùng khi có Nghị định, Thông tư hay Luật mới ban hành. Hệ thống sẽ tự động bóc tách thành các đoạn chunk và tạo Vector Embeddings lưu vào cơ sở dữ liệu.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Tiêu đề văn bản quy phạm:</label>
              <Input
                placeholder="VD: Nghị định 144/2021/NĐ-CP xử phạt VPHC..."
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Mã ký hiệu văn bản (Law Code):</label>
              <Input
                placeholder="VD: ND_144_2021"
                value={uploadData.lawCode}
                onChange={(e) => setUploadData({ ...uploadData, lawCode: e.target.value })}
                className="bg-slate-900 border-slate-700 text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Loại văn bản:</label>
              <select
                value={uploadData.documentType}
                onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-200 focus:outline-none"
              >
                <option value="Nghị định mới ban hành">Nghị định mới ban hành</option>
                <option value="Thông tư hướng dẫn">Thông tư hướng dẫn</option>
                <option value="Luật / Bộ luật sửa đổi">Luật / Bộ luật sửa đổi</option>
                <option value="Barem câu hỏi giáo trình">Barem câu hỏi giáo trình</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Số điều luật bắt đầu:</label>
              <Input
                type="number"
                min={1}
                value={uploadData.articleNumber}
                onChange={(e) => setUploadData({ ...uploadData, articleNumber: parseInt(e.target.value) || 1 })}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-white block">Nội dung văn bản (hoặc paste từ PDF/Word):</label>
              <span className="text-[11px] text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Tự động phân tách Chunks & Embedding BGE-M3</span>
              </span>
            </div>
            <textarea
              rows={8}
              placeholder="Dán toàn bộ các điều khoản hoặc văn bản vào đây. Mỗi đoạn văn cách nhau 1 dòng trống sẽ tự động được phân tách thành các chunks riêng biệt..."
              value={uploadData.fullContent}
              onChange={(e) => setUploadData({ ...uploadData, fullContent: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleUploadDocument}
              isLoading={isUploading}
              className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Tiến hành Vector hóa & Lưu DB</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: SỬA ĐỔI NỘI DUNG CHUNK TRI THỨC                 */}
      {/* ======================================================== */}
      {editingChunk && (
        <Modal
          isOpen={!!editingChunk}
          onClose={() => setEditingChunk(null)}
          title={`Sửa đổi Chunk Tri thức: ${editingChunk.chunkId}`}
          className="max-w-2xl"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">{editingChunk.sourceDoc}</div>
                <div className="text-[11px] text-purple-400 font-mono">ID: {editingChunk.chunkId}</div>
              </div>
              <Badge variant="purple">{editingChunk.embeddingModel}</Badge>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Tiêu đề đoạn quy phạm:</label>
              <Input
                value={editingChunk.title}
                onChange={(e) => setEditingChunk({ ...editingChunk, title: e.target.value })}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white block">Nội dung căn cứ pháp lý:</label>
              <textarea
                rows={6}
                value={editingChunk.content}
                onChange={(e) => setEditingChunk({ ...editingChunk, content: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingChunk(null)}>
                Hủy
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveChunkEdit}
                className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu & Tái Lập chỉ mục Vector</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
