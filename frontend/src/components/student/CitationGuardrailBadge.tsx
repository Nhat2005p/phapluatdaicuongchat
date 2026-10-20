import React, { useState } from 'react';
import { Citation } from '../../types';
import { CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

interface CitationProps {
  citation: Citation;
}

export const CitationGuardrailBadge: React.FC<CitationProps> = ({ citation }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block my-1 mr-2">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
          citation.verified
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70'
        }`}
      >
        {citation.verified ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        )}
        <span className="font-semibold">{citation.rawText}</span>
      </button>

      {/* Popover Card */}
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 w-72 p-3.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1.5 border-b border-slate-100">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Xác thực Kho Luật Thực định</span>
          </div>
          <div className="mt-2 space-y-1">
            <div>
              <span className="text-slate-500">Văn bản: </span>
              <span className="font-semibold text-slate-900">{citation.lawCode}</span>
            </div>
            <div>
              <span className="text-slate-500">Điều luật: </span>
              <span className="font-semibold text-slate-900">Điều {citation.articleNumber}</span>
            </div>
            <div>
              <span className="text-slate-500">Tiêu đề: </span>
              <span className="text-slate-700 italic">{citation.lawTitle}</span>
            </div>
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                  citation.verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {citation.verified ? '✓ Đã kiểm định hợp lệ trong CSDL' : '⚠️ Cần kiểm tra lại điều khoản'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
