import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Globe, Settings, Database, Cpu, Shield, Search, Check, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { api } from '../../services/api';
import { User, LawArticle, TextbookPrinciple } from '../../types';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { UserManagementView } from './UserManagementView';
import { KnowledgeCrawlManagementView } from './KnowledgeCrawlManagementView';
import { SystemSettingsServicesView } from './SystemSettingsServicesView';

export const AdminHub: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'knowledge' | 'settings' | 'laws' | 'pipeline'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [laws, setLaws] = useState<LawArticle[]>([]);
  const [principles, setPrinciples] = useState<TextbookPrinciple[]>([]);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [lawSearch, setLawSearch] = useState('');
  const [lawCodeFilter, setLawCodeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isAuthenticated || role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Yêu cầu quyền Quản trị viên (Admin)</h2>
        <p className="text-sm text-slate-400">
          Khu vực này chỉ dành cho quản trị viên hệ thống. Vui lòng đăng nhập bằng tài khoản được cấp quyền để truy cập.
        </p>
      </div>
    );
  }

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await api.getUsers();
        if (res.success) setUsers(res.users);
      } else if (activeTab === 'laws') {
        const [lawRes, prinRes] = await Promise.all([
          api.getLaws(lawSearch, lawCodeFilter),
          api.getPrinciples()
        ]);
        if (lawRes.success) setLaws(lawRes.articles);
        if (prinRes.success) setPrinciples(prinRes.principles);
      } else if (activeTab === 'pipeline') {
        const res = await api.getPipelineStatus();
        if (res.success) setPipelineData(res.pipeline);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, lawCodeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Admin Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Bảng Điều khiển Quản trị Hệ thống (Admin Hub)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Quản trị Người dùng, Hạn mức Quota & Giám sát Hệ thống
            </h1>
          </div>

          <Button variant="outline" size="sm" onClick={loadData} isLoading={isLoading} className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới dữ liệu</span>
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          {feedbackMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors shrink-0 ${
            activeTab === 'dashboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tổng quan Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors shrink-0 ${
            activeTab === 'users' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản lý Người dùng & Hạn mức</span>
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors shrink-0 ${
            activeTab === 'knowledge' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Quản lý Tri thức & Thu thập (Hình 17 & 19)</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors shrink-0 ${
            activeTab === 'settings' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cấu hình Hệ thống & Dịch vụ (Hình 21)</span>
        </button>
        <button
          onClick={() => setActiveTab('laws')}
          className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors shrink-0 ${
            activeTab === 'laws' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Kho Dữ liệu Luật & Barem ({laws.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors shrink-0 ${
            activeTab === 'pipeline'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Giám sát Pipeline Thu thập & Model</span>
        </button>
      </div>

      {/* Tab 0: Dashboard Overview */}
      {activeTab === 'dashboard' && <AdminDashboardOverview />}

      {/* Tab 1: Users & Quota Management (Hình 18) */}
      {activeTab === 'users' && <UserManagementView />}

      {/* Tab 2: Knowledge Base & Crawl Management (Hình 17 & 19) */}
      {activeTab === 'knowledge' && <KnowledgeCrawlManagementView />}

      {/* Tab 3: System Settings & Services (Hình 21) */}
      {activeTab === 'settings' && <SystemSettingsServicesView />}

      {/* Tab 4: Laws & Principles */}
      {activeTab === 'laws' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề, số điều luật hoặc từ khóa..."
                value={lawSearch}
                onChange={(e) => setLawSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="pl-9"
              />
            </div>
            <select
              value={lawCodeFilter}
              onChange={(e) => setLawCodeFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100"
            >
              <option value="">Tất cả văn bản luật</option>
              <option value="BLHS2015">Bộ luật Hình sự 2015</option>
              <option value="BLDS2015">Bộ luật Dân sự 2015</option>
              <option value="HP2013">Hiến pháp 2013</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {laws.map((art) => (
              <Card key={art._id} className="border-slate-800 bg-slate-950/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="default">{art.lawCode}</Badge>
                    <span className="text-slate-400">Điều {art.articleNumber}</span>
                  </div>
                  <CardTitle className="text-sm font-semibold text-white pt-1">{art.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-300 space-y-2">
                  <p className="line-clamp-3 leading-relaxed text-slate-400">{art.contentRaw}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {art.keywords.map((kw, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Pipeline */}
      {activeTab === 'pipeline' && pipelineData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-800 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Trạng thái Pipeline Thu thập Dữ liệu (Crawler)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Trạng thái crawler:</span>
                <Badge variant="success">{pipelineData.crawler.status}</Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Số điều luật đã chỉ mục:</span>
                <span className="font-semibold text-white">{pipelineData.crawler.totalLawsIndexed} điều</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Nguồn pháp lý:</span>
                <span>{pipelineData.crawler.sources.join(', ')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Trạng thái Mô hình & Checkpoint Huấn luyện</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Base LLM:</span>
                <span className="font-medium text-white">{pipelineData.training.baseModel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Checkpoint LoRA Adapter:</span>
                <Badge variant="purple">{pipelineData.training.fineTunedCheckpoint}</Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Số mẫu SFT Barem:</span>
                <span className="font-semibold text-sky-400">{pipelineData.training.datasetSamples} mẫu</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Định dạng nén phục vụ:</span>
                <span>{pipelineData.training.quantization}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
