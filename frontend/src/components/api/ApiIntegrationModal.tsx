import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Code2,
  Key,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { QuickTooltip } from '../ui/Tooltip';

interface ApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiIntegrationModal: React.FC<ApiIntegrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('vlaw_live_sk_' + (user?.id ? user.id.slice(-8) : '948f21bc') + 'e49a01');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'curl' | 'javascript' | 'python'>('curl');

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    toast.success('Đã sao chép API Key', 'Khóa bí mật đã được lưu vào bộ nhớ tạm.');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    if (window.confirm('Bạn có chắc muốn tạo mới API Key? Khóa cũ sẽ bị vô hiệu hóa ngay lập tức.')) {
      const newKey = 'vlaw_live_sk_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      setApiKey(newKey);
      toast.info('Đã cấp lại API Key mới', 'Khóa cũ đã bị vô hiệu hóa.');
    }
  };

  const codeSnippets = {
    curl: `curl -X POST "http://localhost:8000/api/v1/query/solve" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "query": "A (19 tuổi) dùng gậy sắt gây thương tích 22%. Phân tích 4 yếu tố cấu thành vi phạm pháp luật?"
  }'`,
    javascript: `// Tích hợp Trợ lý AI Pháp luật bằng JavaScript (Fetch)
const response = await fetch("http://localhost:8000/api/v1/query/solve", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey}"
  },
  body: JSON.stringify({
    query: "Phân tích cơ cấu 3 bộ phận của Khoản 1 Điều 134 Bộ luật Hình sự 2015?"
  })
});

const data = await response.json();
console.log("Lời giải Barem chuẩn:", data.response);
console.log("Căn cứ điều luật đã xác minh:", data.citations);`,
    python: `# Tích hợp Trợ lý AI Pháp luật bằng Python
import requests

url = "http://localhost:8000/api/v1/query/solve"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer ${apiKey}"
}
payload = {
    "query": "Nhận định: 'Mọi hành vi vi phạm pháp luật đều là hành vi trái pháp luật.' Đúng hay Sai?"
}

res = requests.post(url, json=payload, headers=headers)
result = res.json()
print("Kết quả:", result["response"])
print("Độ trễ AI:", result["latencyMs"], "ms")`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedLang]);
    setCopiedCode(true);
    toast.success('Đã sao chép đoạn mã', `Đoạn mã ${selectedLang.toUpperCase()} đã được lưu vào bộ nhớ tạm.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Main Card */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 my-auto text-slate-800 animate-modal-in max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold">
                  Tích hợp API dành cho Nhà phát triển
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  RESTful v1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kết nối mô hình Trợ lý AI và Cơ sở dữ liệu Pháp luật vào ứng dụng doanh nghiệp hoặc website đào tạo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* API Key Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Khóa xác thực API Cá nhân (API Secret Key)</span>
              </label>
              <button
                type="button"
                onClick={handleRegenerateKey}
                className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tạo lại khóa</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl font-mono text-xs text-slate-900 select-all overflow-x-auto">
                {apiKey}
              </div>
              <Button
                size="sm"
                onClick={handleCopyKey}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5 py-2.5 shrink-0"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Đã sao chép' : 'Sao chép Key'}</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Bảo mật khóa này như mật khẩu tài khoản. Không chia sẻ công khai trên client-side repositories.
            </p>
          </div>

          {/* Endpoints overview */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-sky-500" />
              <span>Các Điểm cuối API (Endpoints):</span>
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    POST
                  </span>
                  <span className="text-slate-800">/api/v1/query/solve</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">Giải đề thi Barem & Trích dẫn điều luật</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    POST
                  </span>
                  <span className="text-slate-800">/api/v1/query/review</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">AI Rà soát pháp lý Hợp đồng & Văn bản</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    GET
                  </span>
                  <span className="text-slate-800">/api/v1/laws/articles</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">Tra cứu văn bản quy phạm pháp luật</span>
              </div>
            </div>
          </div>

          {/* Interactive Code Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-rose-500" />
                <span>Ví dụ Mã nguồn Tích hợp:</span>
              </h3>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                {(['curl', 'javascript', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-2.5 py-1 rounded capitalize transition-all ${
                      selectedLang === lang
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Đã chép' : 'Sao chép mã'}</span>
              </button>
              <pre className="p-4 font-mono text-slate-200 overflow-x-auto leading-relaxed pt-9">
                <code>{codeSnippets[selectedLang]}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Rate limit: 60 requests/phút. Hỗ trợ chuẩn OpenAPI 3.0 & JSON schema.</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
