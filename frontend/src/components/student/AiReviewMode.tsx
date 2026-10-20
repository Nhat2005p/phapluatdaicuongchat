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
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface AiReviewModeProps {
  initialContent?: string;
  onAskAi: (query: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const AiReviewMode: React.FC<AiReviewModeProps> = ({ initialContent = '', onAskAi, onOpenAuth }) => {
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
    const reportText = `BÁO CÁO RÀ SOÁT PHÁP LÝ AI - CHATBOT HỖ TRỢ PHÁP LUẬT ĐẠI CƯƠNG
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
      {/* Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-red-50 via-white to-slate-50 border border-slate-200 shadow-sm overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 text-[#ec2227] text-xs font-bold border border-red-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>TÍNH NĂNG MỚI: AI RÀ SOÁT VĂN BẢN & HỢP ĐỒNG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Rà soát Lỗi Pháp lý, Đối chiếu Rủi ro & Barem Chuẩn
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Hỗ trợ sinh viên và người dùng tải lên hợp đồng, văn bản thỏa thuận hoặc bài làm tự luận. AI tự động quét các điều khoản vi phạm điều cấm, nguy cơ vô hiệu và đề xuất giải pháp sửa đổi chuẩn xác.
          </p>
        </div>
      </div>

      {/* Mandatory Login Notice if not authenticated */}
      {!isAuthenticated && (
        <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Yêu cầu Đăng nhập để sử dụng AI Rà soát</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Bạn cần đăng nhập tài khoản để đối chiếu và rà soát lỗi pháp lý hợp đồng. Miễn phí 30 lượt rà soát & hỏi đáp mỗi tháng!
            </p>
          </div>
          <div className="pt-1 flex justify-center gap-2">
            <Button
              onClick={() => onOpenAuth?.('login')}
              className="bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold"
            >
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input and Upload (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ec2227]" />
                <span>Nội dung văn bản cần rà soát</span>
              </label>

              {/* Upload file button */}
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors">
                <Upload className="w-3.5 h-3.5" />
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
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all font-mono leading-relaxed"
            />

            {/* Quick Template Picker */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500">Mẫu tình huống & Hợp đồng thực tế:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setContent(tpl.content);
                      setDocumentType(tpl.name);
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200/80 text-left transition-all"
                  >
                    <div className="text-xs font-bold text-slate-800">{tpl.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{tpl.desc}</div>
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
                className="w-full py-3 bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold text-sm rounded-xl shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI đang phân tích & đối chiếu điều luật...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>AI Bắt đầu rà soát rủi ro pháp lý</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Review Results Dashboard (7 Cols) */}
        <div className="lg:col-span-7">
          {!reviewResult && !isLoading && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#ec2227] flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Sẵn sàng rà soát hợp đồng & bài tập
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập văn bản hoặc chọn một trong các mẫu tình huống bên trái, sau đó nhấn <strong>"AI Bắt đầu rà soát"</strong> để nhận báo cáo đối chiếu chi tiết theo quy định pháp luật.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#ec2227] border-t-transparent animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Đang quét rà soát điều khoản...</h4>
                <p className="text-xs text-slate-500">Đối chiếu 38 lĩnh vực pháp luật, Bộ luật Dân sự, Lao động, Hình sự và Barem chuẩn</p>
              </div>
            </div>
          )}

          {reviewResult && (
            <div className="space-y-6 animate-fade-in no-print">
              {/* Score & Summary Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Score badge */}
                  <div
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${
                      reviewResult.score >= 80
                        ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-300'
                        : reviewResult.score >= 60
                        ? 'bg-amber-50 text-amber-600 border-2 border-amber-300'
                        : 'bg-red-50 text-red-600 border-2 border-red-300'
                    }`}
                  >
                    <span className="text-2xl">{reviewResult.score}</span>
                    <span className="text-[10px] tracking-wider uppercase font-bold">/100 Điểm</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Điểm an toàn pháp lý:</span>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          reviewResult.riskLevel === 'low'
                            ? 'bg-emerald-100 text-emerald-700'
                            : reviewResult.riskLevel === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {reviewResult.riskLevel === 'low'
                          ? 'Mức rủi ro: Thấp'
                          : reviewResult.riskLevel === 'medium'
                          ? 'Mức rủi ro: Trung bình'
                          : 'Mức rủi ro: Cao (Nguy cơ vô hiệu)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Phát hiện <strong>{reviewResult.totalIssues}</strong> vấn đề cần lưu ý hoặc khắc phục trong văn bản.
                    </p>
                  </div>
                </div>

                {/* Report Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Sao chép toàn bộ báo cáo"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In / PDF</span>
                  </button>
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Danh sách vấn đề & Kiến nghị sửa đổi ({reviewResult.issues.length})</span>
                </h3>

                {reviewResult.issues.map((issue: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-3xl bg-white border shadow-sm space-y-3 transition-all ${
                      issue.severity === 'critical'
                        ? 'border-red-200 ring-1 ring-red-100'
                        : issue.severity === 'warning'
                        ? 'border-amber-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            issue.severity === 'critical'
                              ? 'bg-red-500'
                              : issue.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-sky-500'
                          }`}
                        />
                        {issue.category}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                          issue.severity === 'critical'
                            ? 'bg-red-50 text-red-600'
                            : issue.severity === 'warning'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-sky-50 text-sky-600'
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
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 font-mono italic">
                      "{issue.clauseText}"
                    </div>

                    {/* Analysis Description */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {issue.description}
                    </p>

                    {/* Legal Basis */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700">Căn cứ pháp lý:</span>
                      <span className="px-2 py-0.5 rounded bg-red-50 text-[#ec2227] font-semibold border border-red-200">
                        {issue.legalBasis}
                      </span>
                    </div>

                    {/* Recommendation */}
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-800 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900">
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
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#ec2227] hover:underline"
                      >
                        <span>Hỏi sâu hơn với AI</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Valid Points */}
              {reviewResult.validPoints && reviewResult.validPoints.length > 0 && (
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Các điểm hợp lệ ghi nhận:</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
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
