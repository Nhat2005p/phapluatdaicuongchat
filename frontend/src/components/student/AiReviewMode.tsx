import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Printer,
  FileCheck,
  RefreshCw,
  Info,
  Lock,
  Scale,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface AiReviewModeProps {
  initialContent?: string;
  onAskAi: (query: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  isDarkMode?: boolean;
}

export const AiReviewMode: React.FC<AiReviewModeProps> = ({ 
  initialContent = '', 
  onAskAi, 
  onOpenAuth,
  isDarkMode = false
}) => {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [documentType, setDocumentType] = useState('Hợp đồng / Văn bản pháp lý');
  const [isLoading, setIsLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleTemplates = [
    {
      name: 'HĐ Mua bán (Chủ thể 16 tuổi)',
      desc: 'Nguy cơ vô hiệu do người chưa thành niên tự ý giao kết',
      content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc

HỢP ĐỒNG MUA BÁN XE MÁY
Hôm nay, ngày 10/10/2026, chúng tôi gồm có:
Bên bán (Bên A): Nguyễn Văn Nam, sinh ngày 15/08/2010 (hiện 16 tuổi), CCCD số: 048200001234.
Bên mua (Bên B): Trần Văn Bình, sinh năm 1995, CCCD số: 048095005678.

Hai bên thống nhất thỏa thuận:
Điều 1: Bên A đồng ý bán chiếc xe máy hiệu Honda Wave thuộc quyền sở hữu của mình cho Bên B với giá 15.000.000 VNĐ.
Điều 2: Bên B thanh toán đủ tiền mặt một lần. Bên A tự chịu trách nhiệm ký giấy bán xe mà không cần sự đồng ý hay chữ ký của cha mẹ hay người giám hộ.
Điều 3: Nếu một bên hủy hợp đồng thì phải nộp phạt 50% giá trị hợp đồng.`
    },
    {
      name: 'HĐ Lao động (Vi phạm điều cấm)',
      desc: 'Giữ bằng gốc & thử việc 90 ngày trái Bộ luật Lao động',
      content: `HỢP ĐỒNG LAO ĐỘNG THỬ VIỆC
Công ty TNHH Công nghệ Alpha (Bên sử dụng lao động) và Ông Lê Văn Cường (Người lao động) ký kết:
Điều 1: Vị trí công việc: Nhân viên Lập trình phần mềm.
Điều 2: Thời gian thử việc là 90 ngày (03 tháng) kể từ ngày nhận việc. Mức lương thử việc bằng 70% lương chính thức.
Điều 3: Để đảm bảo không tự ý bỏ việc giữa chừng, Người lao động có nghĩa vụ nộp bản chính Bằng tốt nghiệp Đại học và bản chính CCCD cho Phòng Nhân sự lưu giữ trong suốt quá trình làm việc.
Điều 4: Người lao động nghỉ việc trước thời hạn phải đền bù 3 tháng tiền lương.`
    },
    {
      name: 'HĐ Thuê nhà (Tự ý cắt điện nước)',
      desc: 'Tự ý cưỡng chế & thỏa thuận phạt cọc vượt mức',
      content: `HỢP ĐỒNG THUÊ NHÀ TRỌ
Bên cho thuê (Bên A) và Bên thuê (Bên B) thỏa thuận:
Điều 1: Bên A cho Bên B thuê phòng trọ số 302, thời hạn thuê 12 tháng, tiền thuê 4.000.000 đ/tháng.
Điều 2: Bên B chậm trả tiền nhà từ 03 ngày trở lên thì Bên A có toàn quyền tự ý cắt điện, cắt nước và khóa cửa phòng thu hồi tài sản ngay lập tức mà không cần báo trước hoặc chờ Tòa án.
Điều 3: Mức phạt vi phạm chậm nộp tiền nhà là 500% giá trị tiền thuê tháng đó.`
    },
    {
      name: 'Bài tự luận Sinh viên (Chia thừa kế)',
      desc: 'Bài làm thiếu điều luật và xác định sai hàng thừa kế',
      content: `BÀI LÀM TỰ LUẬN MÔN PHÁP LUẬT ĐẠI CƯƠNG
Đề bài: Ông A chết không để lại di chúc, có khối tài sản riêng là 1,2 tỷ đồng. Gia đình gồm vợ B, 2 con đẻ C và D, và bố đẻ E. Hỏi chia tài sản như thế nào?

Bài giải của sinh viên:
Theo quy định pháp luật thì tài sản của ông A sẽ được chia đều cho vợ B và các con C, D. Bố đẻ E già rồi nên không được hưởng thừa kế.
Mỗi người gồm B, C, D sẽ được chia: 1,2 tỷ / 3 = 400 triệu đồng.
Kết luận: Vợ và các con mỗi người nhận 400 triệu đồng.`
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleStartReview = async () => {
    if (!isAuthenticated) {
      onOpenAuth?.('login');
      return;
    }
    if (!content.trim()) return;
    setIsLoading(true);
    setReviewResult(null);

    try {
      const res = await api.reviewDocument(content.trim(), documentType);
      if (res.success) {
        setReviewResult(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!reviewResult) return;
    const reportText = `BÁO CÁO RÀ SOÁT PHÁP LÝ - CHATBOT HỖ TRỢ PHÁP LUẬT ĐẠI CƯƠNG
Điểm an toàn: ${reviewResult.score}/100 (Mức rủi ro: ${reviewResult.riskLevel.toUpperCase()})
Tổng số vấn đề phát hiện: ${reviewResult.totalIssues}

CHI TIẾT VẤN ĐỀ:
${reviewResult.issues
  .map(
    (issue: any, i: number) =>
      `[${i + 1}] ${issue.category} (${issue.severity.toUpperCase()})\n` +
      `- Điều khoản: "${issue.clauseText}"\n` +
      `- Phân tích: ${issue.description}\n` +
      `- Căn cứ: ${issue.legalBasis}\n` +
      `- Kiến nghị sửa đổi: ${issue.recommendation}\n`
  )
  .join('\n')}
`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* =========================================================================
          1. HERO BANNER: Contract / Legal Review (Bright & Luminous)
          ========================================================================= */}
      <div className={`relative rounded-3xl overflow-hidden border shadow-sm transition-all ${
        isDarkMode 
          ? 'border-[#272967] bg-[#100e2f]' 
          : 'border-slate-200 bg-gradient-to-r from-amber-50/70 via-white to-slate-50'
      }`}>
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1600&q=80"
            alt="Contract and Legal Signature"
            className={`w-full h-full object-cover object-center filter ${
              isDarkMode ? 'brightness-[0.25] contrast-125' : 'brightness-[0.95] opacity-20'
            }`}
          />
          <div className={`absolute inset-0 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-[#100e2f] via-[#100e2f]/92 to-[#181818]/85' 
              : 'bg-gradient-to-r from-white/90 via-white/80 to-amber-50/60'
          }`} />
        </div>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 space-y-4 max-w-4xl">
          {/* Eyebrow */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md border ${
            isDarkMode 
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' 
              : 'bg-amber-100 text-[#b25e00] border-amber-200'
          }`}>
            <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>TÍNH NĂNG MỚI: RÀ SOÁT VĂN BẢN &amp; HỢP ĐỒNG</span>
          </div>

          <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Rà soát Lỗi Pháp lý, Đối chiếu Rủi ro &amp; Barem Chuẩn
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed max-w-3xl ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Hỗ trợ sinh viên và người dùng tải lên hợp đồng, văn bản thỏa thuận hoặc bài làm tự luận. Hệ thống tự động quét các điều khoản vi phạm điều cấm, nguy cơ vô hiệu và đề xuất giải pháp sửa đổi chuẩn xác.
          </p>

          {/* Feature Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold ${
              isDarkMode 
                ? 'bg-white/10 text-slate-200 border-white/10' 
                : 'bg-white text-slate-700 border-slate-200 shadow-xs'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Chấm điểm an toàn pháp lý
            </span>
            <span className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold ${
              isDarkMode 
                ? 'bg-white/10 text-slate-200 border-white/10' 
                : 'bg-white text-slate-700 border-slate-200 shadow-xs'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Nhận diện nguy cơ vô hiệu
            </span>
            <span className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold ${
              isDarkMode 
                ? 'bg-white/10 text-slate-200 border-white/10' 
                : 'bg-white text-slate-700 border-slate-200 shadow-xs'
            }`}>
              <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Kiến nghị điều khoản sửa đổi
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Login Notice if not authenticated */}
      {!isAuthenticated && (
        <div className={`p-8 rounded-3xl border text-center space-y-4 shadow-sm relative overflow-hidden ${
          isDarkMode 
            ? 'bg-[#100e2f] border-[#ffa000]/40' 
            : 'bg-amber-50/60 border-amber-200'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-[#b25e00] border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Yêu cầu Đăng nhập để sử dụng tính năng Rà soát
            </h3>
            <p className={`text-xs sm:text-sm max-w-md mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Bạn cần đăng nhập tài khoản để đối chiếu và rà soát lỗi pháp lý hợp đồng. Miễn phí 30 lượt rà soát &amp; hỏi đáp mỗi tháng!
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              onClick={() => onOpenAuth?.('login')}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md cursor-pointer"
            >
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input and Upload (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
            isDarkMode ? 'bg-[#100e2f] border-[#272967]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-sm font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Nội dung văn bản cần rà soát</span>
              </label>

              {/* Upload file button */}
              <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/10' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}>
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Tải file (.txt)</span>
                <input
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dán nội dung hợp đồng, điều khoản thỏa thuận hoặc bài làm tự luận cần kiểm tra vào đây..."
              className={`w-full p-4 rounded-2xl border text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono leading-relaxed ${
                isDarkMode 
                  ? 'bg-[#181818] border-[#272967] text-slate-100 placeholder:text-slate-500' 
                  : 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />

            {/* Quick Template Picker */}
            <div className="space-y-2.5">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Mẫu tình huống &amp; Hợp đồng thực tế:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sampleTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setContent(tpl.content);
                      setDocumentType(tpl.name);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                      isDarkMode 
                        ? 'bg-[#181818] hover:bg-[#181818]/80 hover:border-[#ffa000] border-[#272967]' 
                        : 'bg-slate-50 hover:bg-amber-50/60 hover:border-indigo-500 border-slate-200'
                    }`}
                  >
                    <div className={`text-xs font-bold transition-colors ${
                      isDarkMode ? 'text-slate-200 group-hover:text-[#ffa000]' : 'text-slate-800 group-hover:text-[#b25e00]'
                    }`}>
                      {tpl.name}
                    </div>
                    <div className={`text-[10px] truncate mt-0.5 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {tpl.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <Button
                onClick={handleStartReview}
                disabled={isLoading || !content.trim()}
                variant="default"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Đang phân tích &amp; đối chiếu điều luật...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Bắt đầu rà soát rủi ro pháp lý</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Review Results Dashboard (7 Cols) */}
        <div className="lg:col-span-7">
          {!reviewResult && !isLoading && (
            <div className={`p-12 sm:p-16 text-center rounded-3xl border shadow-sm space-y-5 ${
              isDarkMode ? 'bg-[#100e2f] border-[#272967]' : 'bg-white border-slate-200'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-[#b25e00] border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Sẵn sàng rà soát hợp đồng &amp; bài tập
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Nhập văn bản hoặc chọn một trong các mẫu tình huống bên trái, sau đó nhấn <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>"Bắt đầu rà soát"</strong> để nhận báo cáo đối chiếu chi tiết theo quy định pháp luật.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className={`p-16 text-center rounded-3xl border shadow-sm space-y-4 ${
              isDarkMode ? 'bg-[#100e2f] border-[#272967]' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <div className="space-y-1.5">
                <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Đang quét rà soát điều khoản...
                </h4>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Đối chiếu 38 lĩnh vực pháp luật, Bộ luật Dân sự, Lao động, Hình sự và Barem chuẩn
                </p>
              </div>
            </div>
          )}

          {reviewResult && (
            <div className="space-y-6 animate-fade-in no-print">
              {/* Score & Summary Card */}
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
                isDarkMode ? 'bg-[#100e2f] border-[#272967]' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-5">
                  {/* Score badge */}
                  <div
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${
                      reviewResult.score >= 80
                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300'
                        : reviewResult.score >= 60
                        ? 'bg-amber-50 text-amber-700 border-2 border-amber-300'
                        : 'bg-rose-50 text-rose-700 border-2 border-rose-300'
                    }`}
                  >
                    <span className="text-3xl font-black">{reviewResult.score}</span>
                    <span className="text-[10px] tracking-wider uppercase font-bold">/100 Điểm</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Điểm an toàn pháp lý:
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          reviewResult.riskLevel === 'low'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : reviewResult.riskLevel === 'medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {reviewResult.riskLevel === 'low'
                          ? 'Mức rủi ro: Thấp'
                          : reviewResult.riskLevel === 'medium'
                          ? 'Mức rủi ro: Trung bình'
                          : 'Mức rủi ro: Cao (Nguy cơ vô hiệu)'}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Phát hiện <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{reviewResult.totalIssues}</strong> vấn đề cần lưu ý hoặc khắc phục trong văn bản.
                    </p>
                  </div>
                </div>

                {/* Report Action buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className={`p-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDarkMode 
                        ? 'border-[#272967] hover:bg-white/10 text-slate-200' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                    title="Sao chép toàn bộ báo cáo"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={`p-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDarkMode 
                        ? 'bg-white/15 hover:bg-white/20 text-white' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>In / PDF</span>
                  </button>
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-4">
                <h3 className={`text-base font-bold flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Danh sách vấn đề &amp; Kiến nghị sửa đổi ({reviewResult.issues.length})</span>
                </h3>

                {reviewResult.issues.map((issue: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-3xl border shadow-sm space-y-4 transition-all ${
                      isDarkMode ? 'bg-[#100e2f]' : 'bg-white'
                    } ${
                      issue.severity === 'critical'
                        ? 'border-rose-200 ring-1 ring-rose-100'
                        : issue.severity === 'warning'
                        ? 'border-amber-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-xs font-bold flex items-center gap-2 ${
                        isDarkMode ? 'text-white' : 'text-slate-800'
                      }`}>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            issue.severity === 'critical'
                              ? 'bg-rose-500'
                              : issue.severity === 'warning'
                              ? 'bg-indigo-600'
                              : 'bg-sky-500'
                          }`}
                        />
                        {issue.category}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md ${
                          issue.severity === 'critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : issue.severity === 'warning'
                            ? 'bg-amber-50 text-[#b25e00] border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {issue.severity === 'critical'
                          ? 'Nghiêm trọng (Vô hiệu)'
                          : issue.severity === 'warning'
                          ? 'Cảnh báo rủi ro'
                          : 'Gợi ý barem'}
                      </span>
                    </div>

                    {/* Excerpt */}
                    <div className={`p-3.5 rounded-xl border text-xs font-mono italic ${
                      isDarkMode ? 'bg-[#181818] border-[#272967] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}>
                      "{issue.clauseText}"
                    </div>

                    {/* Analysis Description */}
                    <p className={`text-xs sm:text-sm leading-relaxed ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {issue.description}
                    </p>

                    {/* Legal Basis */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Căn cứ pháp lý:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-[#b25e00] font-bold border border-amber-200">
                        {issue.legalBasis}
                      </span>
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Kiến nghị giải pháp điều chỉnh:</span>
                      </div>
                      <p className="leading-relaxed">{issue.recommendation}</p>
                    </div>

                    {/* Ask AI about this issue */}
                    <div className="pt-1 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onAskAi(`Giải thích chi tiết về quy định: ${issue.legalBasis} và cách viết lại điều khoản này?`)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c67100] hover:text-[#995700] hover:underline transition-colors cursor-pointer"
                      >
                        <span>Hỏi sâu hơn về quy định</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Valid Points */}
              {reviewResult.validPoints && reviewResult.validPoints.length > 0 && (
                <div className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
                  isDarkMode ? 'bg-[#100e2f] border-[#272967]' : 'bg-white border-slate-200'
                }`}>
                  <h4 className={`text-xs font-bold flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Các điểm hợp lệ ghi nhận:</span>
                  </h4>
                  <ul className={`space-y-2 text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {reviewResult.validPoints.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
