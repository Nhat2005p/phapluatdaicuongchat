import React, { useState } from 'react';
import { ShieldCheck, Play, Sparkles, CheckCircle2, XCircle, ArrowUpRight, BarChart3, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';
import { BenchmarkResult } from '../../types';

export const CouncilBenchmark: React.FC = () => {
  const [query, setQuery] = useState(
    'Nguyễn Văn A (19 tuổi, không bị tâm thần) do mâu thuẫn đã dùng gậy sắt đánh B thương tật 22%. Hãy phân tích các yếu tố cấu thành vi phạm pháp luật theo đúng giáo trình Pháp luật Đại cương.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResult | null>(null);
  const [selectedTierTab, setSelectedTierTab] = useState<number>(4);

  const handleRunBenchmark = async () => {
    setIsLoading(true);
    try {
      const res = await api.compareTiers(query);
      if (res.success && res.data) {
        setBenchmarkData(res.data);
      }
    } catch (err) {
      console.error('Benchmark failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Council Header Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dành cho Hội đồng Thẩm định & Đánh giá Dự án</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Bảng Đối sánh Năng lực 4 Tầng Công nghệ (Benchmarking Suite)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Kiểm thử và đánh giá trực quan sự tiến hóa về độ chuẩn barem, tỷ lệ ảo giác thông tin và tính chính xác trích dẫn
              điều luật giữa 4 tầng công nghệ: <strong>Tier 1 (Zero-shot)</strong> ➔ <strong>Tier 2 (Few-shot)</strong> ➔{' '}
              <strong>Tier 3 (RAG)</strong> ➔ <strong>Tier 4 (Fine-tuned LoRA)</strong>.
            </p>
          </div>

          <Button
            variant="emerald"
            size="lg"
            onClick={handleRunBenchmark}
            isLoading={isLoading}
            className="gap-2 shrink-0 self-start md:self-auto shadow-purple-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Kích hoạt Đối sánh 4 Tầng</span>
          </Button>
        </div>
      </div>

      {/* Query Formulation */}
      <Card className="border-slate-800 bg-slate-950/80">
        <CardContent className="p-4 space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Tình huống bài toán thực nghiệm:
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </CardContent>
      </Card>

      {/* Results Section */}
      {benchmarkData && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Tầng đạt điểm cao nhất:</span>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{benchmarkData.evaluationSummary.bestTier}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Mức độ cải thiện Barem:</span>
              <div className="text-base font-bold text-sky-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-sky-400" />
                <span>{benchmarkData.evaluationSummary.baremImprovement}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Kiểm định trích dẫn pháp lý:</span>
              <div className="text-base font-bold text-purple-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>{benchmarkData.evaluationSummary.citationAccuracyImprovement}</span>
              </div>
            </div>
          </div>

          {/* 4-Tier Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {benchmarkData.tiers.map((tier) => {
              const isBest = tier.tierNumber === 4;
              return (
                <div
                  key={tier.tierNumber}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    isBest
                      ? 'bg-gradient-to-b from-sky-950/40 to-slate-950 border-sky-500/50 shadow-xl shadow-sky-500/10'
                      : 'bg-slate-950/70 border-slate-800/80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tier.tierName}</span>
                      {isBest && <Badge variant="success">Khuyên dùng</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-400 min-h-[32px]">{tier.technology}</p>

                    {/* Progress Metrics */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Độ chuẩn Barem:</span>
                          <span className="font-bold text-sky-400">{tier.baremAdherenceScore}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div
                            className="bg-sky-500 h-1.5 rounded-full"
                            style={{ width: `${tier.baremAdherenceScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Tỷ lệ ảo giác (Hallucination):</span>
                          <span className="font-bold text-amber-400">{tier.hallucinationRate}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full"
                            style={{ width: `${tier.hallucinationRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] pt-1">
                        <span className="text-slate-400">Độ trễ:</span>
                        <span className="font-medium text-slate-200">{tier.latencyMs} ms</span>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ưu điểm:
                        </span>
                        <ul className="text-slate-400 list-disc ml-3 space-y-0.5">
                          {tier.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-red-400 font-medium flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Hạn chế:
                        </span>
                        <ul className="text-slate-400 list-disc ml-3 space-y-0.5">
                          {tier.weaknesses.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedTierTab(tier.tierNumber)}
                      className="w-full py-1.5 text-xs text-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium border border-slate-800 transition-all"
                    >
                      Xem chi tiết văn bản sinh
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Output Viewer */}
          <Card className="border-slate-800 bg-slate-950">
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Chi tiết phản hồi sinh bởi {benchmarkData.tiers[selectedTierTab - 1].tierName}</span>
                </CardTitle>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTierTab(t)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        selectedTierTab === t
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tier {t}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                {benchmarkData.tiers[selectedTierTab - 1].response}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
