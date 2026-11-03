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
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
          citation.verified
            ? 'bg-[#016a71]/10 text-[#016a71] border-[#016a71]/30 hover:bg-[#016a71]/20'
            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
        }`}
      >
        {citation.verified ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-[#016a71] shrink-0" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        )}
        <span className="font-medium">{citation.rawText}</span>
      </button>

      {/* Popover Card - Perplexity Soft Paper Style */}
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 w-72 p-3.5 bg-[#fdfbfa] border border-[#d1d1cd] rounded-xl shadow-xl z-50 text-xs text-[#27251e]">
          <div className="flex items-center gap-1.5 font-medium text-[#27251e] pb-1.5 border-b border-[#d1d1cd]">
            <BookOpen className="w-3.5 h-3.5 text-[#016a71]" />
            <span>Xác thực Kho Luật Thực định</span>
          </div>
          <div className="mt-2 space-y-1">
            <div>
              <span className="text-[#72706b]">Văn bản: </span>
              <span className="font-medium text-[#27251e]">{citation.lawCode}</span>
            </div>
            <div>
              <span className="text-[#72706b]">Điều luật: </span>
              <span className="font-medium text-[#27251e]">Điều {citation.articleNumber}</span>
            </div>
            <div>
              <span className="text-[#72706b]">Tiêu đề: </span>
              <span className="text-[#27251e] italic">{citation.lawTitle}</span>
            </div>
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                  citation.verified ? 'bg-[#016a71]/10 text-[#016a71] border border-[#016a71]/30' : 'bg-amber-50 text-amber-800 border border-amber-200'
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
