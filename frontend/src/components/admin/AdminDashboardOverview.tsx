import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Cpu,
  Server,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  BarChart3,
  PieChart,
  RefreshCw,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  FileCheck,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export const AdminDashboardOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [liveReqCount, setLiveReqCount] = useState(18);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDashboardAnalytics();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Simulate slight real-time fluctuation for system load monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveReqCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(12, Math.min(35, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const stats = data || {
    queries: {
      total: 1482,
      successful: 1465,
      pending: 3,
      failed: 14,
      successRate: 98.8,
      avgLatencyMs: 310,
      chartData: [
        { label: 'T2', queries: 195, success: 192, failed: 3 },
        { label: 'T3', queries: 238, success: 235, failed: 3 },
        { label: 'T4', queries: 284, success: 281, failed: 3 },
        { label: 'T5', queries: 256, success: 254, failed: 2 },
        { label: 'T6', queries: 310, success: 308, failed: 2 },
        { label: 'T7', queries: 120, success: 119, failed: 1 },
        { label: 'CN', queries: 79, success: 76, failed: 3 }
      ]
    },
    users: {
      total: 248,
      activeOnline: 32,
      studentUsers: 241,
      adminUsers: 7,
      growthPercent: '+24.6%',
      trendData: [
        { month: 'T05', count: 48 },
        { month: 'T06', count: 85 },
        { month: 'T07', count: 124 },
        { month: 'T08', count: 168 },
        { month: 'T09', count: 215 },
        { month: 'T10', count: 248 }
      ]
    },
    feedback: {
      totalFeedback: 940,
      positiveRate: 94.8,
      positiveCount: 891,
      neutralRate: 3.8,
      neutralCount: 36,
      negativeRate: 1.4,
      negativeCount: 13,
      categoriesRating: [
        { name: 'Cơ cấu 3 bộ phận QPPL', score: 9.8, count: 320 },
        { name: '4 Yếu tố Cấu thành VPPL', score: 9.6, count: 285 },
        { name: 'Phân tích Thừa kế BLDS', score: 9.5, count: 190 },
        { name: 'Nhận định Đúng / Sai', score: 9.2, count: 145 }
      ]
    },
    systemLoad: {
      apiRps: 18.2,
      peakRps: 46.5,
      cpuUsagePercent: 36,
      gpuVramUsedGb: 4.2,
      gpuVramTotalGb: 16.0,
      guardrailPassRate: 99.4,
      uptimeHours: 324,
      healthServices: [
        { name: 'LLM Engine (Qwen2.5 LoRA)', status: 'operational', latency: '280ms' },
        { name: 'RAG Retriever & Embedding', status: 'operational', latency: '35ms' },
        { name: 'Citation Guardrail Verifier', status: 'operational', latency: '42ms' },
        { name: 'Database (MongoDB Atlas)', status: 'operational', latency: '12ms' }
      ]
    }
  };

  const maxQueriesInDay = Math.max(...stats.queries.chartData.map((d: any) => d.queries));
  const maxUserInMonth = Math.max(...stats.users.trendData.map((d: any) => d.count));

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ec2227] flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bảng điều khiển Quản trị Tổng quan (Hình 16)
            </h2>
            <p className="text-xs text-slate-500">
              Giám sát toàn diện lượt hỏi, tài khoản người dùng, phản hồi chất lượng và tải hệ thống
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn thời gian
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            isLoading={isLoading}
            className="text-xs gap-1.5 border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Queries */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-red-300 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng câu hỏi tiếp nhận</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#ec2227] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {stats.queries.total.toLocaleString('vi-VN')}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                98.8% Thành công
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>{stats.queries.successful} xong</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>{stats.queries.pending} chờ</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                <span>{stats.queries.failed} lỗi</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Users */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tài khoản & Trực tuyến</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {stats.users.total.toLocaleString('vi-VN')}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
                {stats.users.activeOnline} Online
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Sinh viên: <strong className="text-slate-800">{stats.users.studentUsers}</strong></span>
              <span>•</span>
              <span>Quản trị: <strong className="text-slate-800">{stats.users.adminUsers}</strong></span>
              <span className="text-blue-600 font-semibold">{stats.users.growthPercent}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Feedback */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tỷ lệ Phản hồi Hài lòng</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {stats.feedback.positiveRate}%
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                {stats.feedback.positiveCount} Thích
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-emerald-600 font-medium">Like: {stats.feedback.positiveCount}</span>
              <span>Trung lập: {stats.feedback.neutralCount}</span>
              <span className="text-red-500 font-medium">Dislike: {stats.feedback.negativeCount}</span>
            </div>
          </div>
        </div>

        {/* Card 4: System Load */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-300 transition-all space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Lưu lượng & Tài nguyên</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {liveReqCount} req/s
              </span>
              <span className="text-[11px] font-bold text-purple-600">
                Peak: {stats.systemLoad.peakRps} req/s
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Độ trễ: <strong className="text-emerald-600">~{stats.queries.avgLatencyMs}ms</strong></span>
              <span>•</span>
              <span>GPU: <strong className="text-slate-800">{stats.systemLoad.gpuVramUsedGb}GB</strong></span>
              <span className="text-emerald-600 font-bold">100% OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Thống kê Lượt hỏi & Thống kê Tăng trưởng Người dùng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Thống kê truy vấn & Lượt hỏi */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#ec2227]" />
                <span>Thống kê Truy vấn & Lượt hỏi theo ngày (7 ngày gần nhất)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi số lượng câu hỏi tiếp nhận, tỷ lệ giải thành công và xử lý tự động
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Tỷ lệ thành công</span>
              <span className="text-sm font-extrabold text-emerald-600">{stats.queries.successRate}%</span>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-7 gap-2.5 items-end h-44 border-b border-slate-100 pb-2">
              {stats.queries.chartData.map((d: any, idx: number) => {
                const heightPercent = Math.max(15, Math.round((d.queries / maxQueriesInDay) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.queries}
                    </span>
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all group-hover:scale-105" style={{ height: `${heightPercent}%` }}>
                      <div className="w-full bg-gradient-to-t from-[#ec2227] to-rose-400 rounded-t-xl" style={{ height: '100%' }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{d.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Breakdown metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-semibold block">Đã xử lý thành công</span>
                <span className="text-lg font-bold text-emerald-800">{stats.queries.successful} câu</span>
                <span className="text-[10px] text-emerald-600 block">Chuẩn Giáo trình Bộ GD&ĐT</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-[11px] text-amber-700 font-semibold block">Đang xếp hàng chờ</span>
                <span className="text-lg font-bold text-amber-800">{stats.queries.pending} câu</span>
                <span className="text-[10px] text-amber-600 block">Đang nạp GPU</span>
              </div>
              <div className="p-3 rounded-2xl bg-red-50/60 border border-red-100">
                <span className="text-[11px] text-red-700 font-semibold block">Lỗi hoặc câu không hợp lệ</span>
                <span className="text-lg font-bold text-red-800">{stats.queries.failed} câu</span>
                <span className="text-[10px] text-red-600 block">Sai phạm vi luật</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Thống kê Người dùng & Biểu đồ tăng trưởng */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Tăng trưởng Người dùng (6 tháng)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng số tài khoản đăng ký và tốc độ tăng trưởng
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-200">
              {stats.users.growthPercent}
            </span>
          </div>

          {/* User Trend Chart */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-6 gap-2 items-end h-44 border-b border-slate-100 pb-2">
              {stats.users.trendData.map((t: any, idx: number) => {
                const heightPercent = Math.max(15, Math.round((t.count / maxUserInMonth) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.count}
                    </span>
                    <div className="w-full max-w-[32px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all group-hover:scale-105" style={{ height: `${heightPercent}%` }}>
                      <div className="w-full bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-xl" style={{ height: '100%' }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{t.month}</span>
                  </div>
                );
              })}
            </div>

            {/* User Distribution */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Sinh viên Đại học Bách Khoa & Các trường:</span>
                <span className="font-bold text-slate-900">{stats.users.studentUsers} tài khoản (97.2%)</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Quản trị & Giảng viên:</span>
                <span className="font-bold text-purple-600">{stats.users.adminUsers} tài khoản (2.8%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Thống kê Phản hồi (Feedback) & Giám sát Tải Hệ thống */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Thống kê phản hồi (Feedback Analytics) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-amber-500" />
                <span>Thống kê Phản hồi của Người dùng (Feedback Analytics)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tỷ lệ đánh giá Like / Dislike đối với câu trả lời của mô hình AI
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {stats.feedback.positiveRate}% Tích cực
            </span>
          </div>

          {/* Progress Distribution Bar */}
          <div className="space-y-2">
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${stats.feedback.positiveRate}%` }} title={`Thích: ${stats.feedback.positiveCount}`} />
              <div className="bg-amber-400 h-full transition-all" style={{ width: `${stats.feedback.neutralRate}%` }} title={`Trung lập: ${stats.feedback.neutralCount}`} />
              <div className="bg-red-500 h-full transition-all" style={{ width: `${stats.feedback.negativeRate}%` }} title={`Không thích: ${stats.feedback.negativeCount}`} />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Hài lòng / Like: <strong>{stats.feedback.positiveCount}</strong> ({stats.feedback.positiveRate}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Trung lập: <strong>{stats.feedback.neutralCount}</strong> ({stats.feedback.neutralRate}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Dislike: <strong>{stats.feedback.negativeCount}</strong> ({stats.feedback.negativeRate}%)</span>
              </span>
            </div>
          </div>

          {/* Category-level Performance Ratings */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Đánh giá chất lượng Barem theo từng dạng bài tập:
            </span>
            <div className="space-y-2 text-xs">
              {stats.feedback.categoriesRating.map((cat: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#ec2227] font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{cat.count} đánh giá</span>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {cat.score} / 10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Giám sát tải hệ thống & Tài nguyên */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>Giám sát Tải Hệ thống & Tài nguyên Mô hình AI</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lưu lượng API thời gian thực, độ trễ và mức tiêu thụ tài nguyên máy chủ
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Thời gian thực</span>
            </span>
          </div>

          {/* Resource Usage Meters */}
          <div className="space-y-3.5">
            {/* GPU / RAM */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  <span>Bộ nhớ GPU VRAM / CPU RAM:</span>
                </span>
                <span className="text-slate-900 font-bold">
                  {stats.systemLoad.gpuVramUsedGb} GB / {stats.systemLoad.gpuVramTotalGb} GB (26.3%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: '26.3%' }} />
              </div>
            </div>

            {/* Inference Latency */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Độ trễ xử lý mô hình AI trung bình:</span>
                </span>
                <span className="text-emerald-600 font-bold">
                  {stats.queries.avgLatencyMs}ms (Mục tiêu: &lt;500ms)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '62%' }} />
              </div>
            </div>

            {/* Guardrail verification rate */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tỷ lệ Guardrail Chống bịa luật (Anti-hallucination):</span>
                </span>
                <span className="text-slate-900 font-bold">
                  {stats.systemLoad.guardrailPassRate}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.systemLoad.guardrailPassRate}%` }} />
              </div>
            </div>
          </div>

          {/* Microservices Health Table */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Trạng thái các vi dịch vụ cốt lõi (Microservices):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {stats.systemLoad.healthServices.map((svc: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">{svc.name}</span>
                    <span className="text-[10px] text-slate-400">Độ trễ: {svc.latency}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    <span>Tốt</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
