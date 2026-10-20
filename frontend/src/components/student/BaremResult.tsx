import React, { useState } from 'react';
import { QueryResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CitationGuardrailBadge } from './CitationGuardrailBadge';
import {
  ShieldCheck,
  Printer,
  Clock,
  BookMarked,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Scale,
  FileText,
  Bookmark,
  Check
} from 'lucide-react';
import { api } from '../../services/api';

interface BaremResultProps {
  result: QueryResponse;
  query: string;
}

const ARCHETYPE_NAMES: Record<string, { title: string; color: string }> = {
  QPPL_STRUCT: { title: 'Cơ cấu 3 bộ phận Quy phạm pháp luật (Giả định - Quy định - Chế tài)', color: 'text-amber-700' },
  VPPL_4_ELEMENTS: { title: 'Cấu thành 4 yếu tố Vi phạm pháp luật (Khách quan, Chủ quan, Khách thể, Chủ thể)', color: 'text-blue-700' },
  TRUE_FALSE: { title: 'Câu hỏi Nhận định Đúng / Sai & Luận cứ chứng minh', color: 'text-emerald-700' },
  CIVIL_INHERIT: { title: 'Bài tập Chia Di sản Thừa kế (Điều 644, 651, 652 BLDS)', color: 'text-purple-700' },
  CRIMINAL_AGE: { title: 'Xác định Năng lực Trách nhiệm hình sự theo Độ tuổi (Điều 12 BLHS)', color: 'text-rose-700' },
  GENERAL_THEORY: { title: 'Lý luận chung Pháp luật đại cương (Bộ GD&ĐT)', color: 'text-slate-700' }
};

export const BaremResult: React.FC<BaremResultProps> = ({ result, query }) => {
  const [showLawReferences, setShowLawReferences] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSaveToBookmarks = async () => {
    setIsSaving(true);
    try {
      const historyRes = await api.getHistory();
      if (historyRes.success && historyRes.history && historyRes.history.length > 0) {
        // Find matching item or first item
        const target = historyRes.history.find((h) => h.query === query) || historyRes.history[0];
        if (target) {
          const res = await api.toggleBookmark(target._id, 'Lưu từ kết quả giải đề trực tiếp');
          if (res.success) {
            setIsSaved(true);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const archetypeInfo = ARCHETYPE_NAMES[result.intentCode] || {
    title: result.intentCode,
    color: 'text-blue-700'
  };

  // Convert markdown tables and headers to clean styled JSX
  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableRows: string[] = [];
    let inTable = false;

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('|')) {
        inTable = true;
        tableRows.push(line);
      } else {
        if (inTable) {
          elements.push(renderTable(tableRows, `table-${idx}`));
          tableRows = [];
          inTable = false;
        }

        if (line.startsWith('### ')) {
          elements.push(
            <h3 key={idx} className="text-base font-bold text-blue-700 mt-5 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
              {line.replace('### ', '')}
            </h3>
          );
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={idx} className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-1.5">
              {line.replace('## ', '')}
            </h2>
          );
        } else if (line.trim() === '---') {
          elements.push(<hr key={idx} className="my-4 border-slate-200" />);
        } else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          elements.push(
            <li key={idx} className="text-slate-700 ml-4 list-disc text-sm my-1 leading-relaxed">
              {line.replace(/^[-•]\s*/, '')}
            </li>
          );
        } else if (line.trim()) {
          elements.push(
            <p key={idx} className="text-slate-800 text-sm my-2 leading-relaxed">
              {line}
            </p>
          );
        }
      }
    });

    if (inTable && tableRows.length > 0) {
      elements.push(renderTable(tableRows, 'table-end'));
    }

    return elements;
  };

  const renderTable = (rows: string[], key: string) => {
    if (rows.length < 2) return null;
    const headerRow = rows[0]
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    const bodyRows = rows.slice(2).map((r) =>
      r
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
    );

    return (
      <div key={key} className="overflow-x-auto my-4 rounded-xl border border-blue-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-blue-50/90 text-blue-900 border-b border-blue-200 uppercase tracking-wider text-[11px] font-semibold">
            <tr>
              {headerRow.map((col, i) => (
                <th key={i} className="px-4 py-3 border-r border-blue-200/60 last:border-r-0">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-3 align-top border-r border-slate-100 last:border-r-0 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: cell.replace(/<br>/g, '<br/>') }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4 print-page">
      {/* Printable University Header for Exam Paper */}
      <div className="hidden print-only mb-6 text-center border-b pb-4">
        <div className="text-xs font-semibold uppercase tracking-wider">ĐẠI HỌC ĐÀ NẴNG - TRƯỜNG ĐẠI HỌC BÁCH KHOA</div>
        <div className="text-sm font-bold mt-1 uppercase">BÀI THI / LỜI GIẢI MÔN PHÁP LUẬT ĐẠI CƯƠNG (CHUẨN GIÁO TRÌNH BỘ GD&ĐT)</div>
        <div className="text-xs text-gray-600 mt-1 italic">Hệ thống Trợ lý Pháp lý VietLawAssist - Phân hệ U-02</div>
        <div className="mt-3 text-left text-xs bg-gray-50 p-2.5 rounded border border-gray-200">
          <strong>Đề bài tình huống:</strong> {query}
        </div>
      </div>

      <Card className="border-blue-200/90 bg-white shadow-md rounded-2xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base text-slate-900 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Lời giải chi tiết chuẩn Bộ GD&ĐT</span>
              </CardTitle>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {result.intentCode}
              </span>
            </div>
            <p className={`text-xs mt-1 font-semibold ${archetypeInfo.color}`}>
              {archetypeInfo.title}
            </p>
            {result.textbookFramework && (
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-slate-400" />
                <span>Khung lý luận: {result.textbookFramework}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 no-print self-end sm:self-auto">
            <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{result.latencyMs}ms</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToBookmarks}
              disabled={isSaving}
              className={`gap-1.5 text-xs transition-colors border-slate-200 bg-white hover:bg-slate-50 ${
                isSaved
                  ? 'text-amber-600 border-amber-300 bg-amber-50'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isSaved ? 'Đã lưu vào bộ đề' : 'Lưu câu hỏi'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintPdf} className="gap-1.5 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
              <Printer className="w-3.5 h-3.5" />
              <span>Xuất PDF / In</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Citation Guardrail Verification Bar */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-emerald-800">
                  Citation Guardrail: Đạt {result.guardrailMetrics.precisionRate}% Độ chuẩn xác trích dẫn
                </div>
                <div className="text-[11px] text-slate-600">
                  Đã đối soát {result.guardrailMetrics.verifiedCount}/{result.guardrailMetrics.totalFound} căn cứ điều luật
                  thực định
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center">
              {result.citations.map((c, i) => (
                <CitationGuardrailBadge key={i} citation={c} />
              ))}
            </div>
          </div>

          {/* Formatted Answer Body */}
          <div className="prose max-w-none text-slate-800 text-sm leading-relaxed">{formatMarkdown(result.response)}</div>

          {/* Collapsible Section: Tra cứu Căn cứ Pháp lý Thực định & Giáo trình Tham khảo */}
          {result.retrievedArticles && result.retrievedArticles.length > 0 && (
            <div className="pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => setShowLawReferences(!showLawReferences)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/60 hover:bg-blue-50 border border-blue-200/80 text-xs font-semibold text-blue-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span>
                    Toàn văn {result.retrievedArticles.length} Điều luật Thực định được Hệ thống RAG đối chiếu ({showLawReferences ? 'Thu gọn' : 'Bấm để mở rộng đối chiếu'})
                  </span>
                </div>
                {showLawReferences ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
              </button>

              {showLawReferences && (
                <div className="mt-3 space-y-3 pl-1">
                  {result.theoryContent && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-blue-700 flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-blue-600" />
                        <span>Trích đoạn Giáo trình chuẩn:</span>
                      </div>
                      <p className="leading-relaxed text-slate-600 italic">{result.theoryContent}</p>
                    </div>
                  )}

                  {result.retrievedArticles.map((art, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>{art.lawCode} — Điều {art.articleNumber}: {art.title}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {art.articleId}
                        </span>
                      </div>
                      {art.contentRaw && (
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line font-mono text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                          {art.contentRaw}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
