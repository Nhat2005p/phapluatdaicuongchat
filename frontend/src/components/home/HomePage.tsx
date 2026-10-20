import React, { useState } from 'react';
import {
  Scale,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Layers,
  GraduationCap,
  Zap,
  Users,
  Compass,
  FileCheck2,
  Clock,
  Award,
  ChevronRight,
  Laptop
} from 'lucide-react';
import { Button } from '../ui/Button';

interface HomePageProps {
  onStartChat: (query?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartChat, onOpenAuth }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sampleQuestions = [
    'Phân tích 4 yếu tố cấu thành vi phạm pháp luật?',
    'Thừa kế theo pháp luật được chia như thế nào?',
    'Người sử dụng lao động có được đơn phương chấm dứt HĐLĐ?',
    'Phân biệt năng lực pháp luật và năng lực hành vi dân sự?',
    'Tải đề thi & đáp án mẫu môn Pháp luật đại cương'
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onStartChat(searchQuery.trim());
    } else {
      onStartChat();
    }
  };

  const legalFields = [
    'Pháp luật đại cương', 'Dân sự & Hợp đồng', 'Hình sự & Tố tụng', 'Hôn nhân & Gia đình',
    'Lao động & Việc làm', 'Doanh nghiệp & Đầu tư', 'Đất đai & Bất động sản', 'Thương mại & Dịch vụ',
    'Tài chính - Ngân hàng', 'Thuế - Phí - Lệ phí', 'Hành chính & Khiếu nại', 'Giao thông & Vận tải',
    'Sở hữu trí tuệ', 'Xây dựng & Đô thị', 'Bảo hiểm xã hội', 'Y tế & Dược phẩm',
    'Giáo dục & Đào tạo', 'Môi trường & Tài nguyên', 'Công nghệ thông tin & AI', 'Xuất nhập khẩu',
    'Hải quan & Biên mậu', 'Tài sản & Thừa kế', 'Trọng tài thương mại', 'Thi hành án dân sự',
    'An ninh trật tự', 'Thủ tục tố tụng', 'Hợp đồng lao động', 'Nghĩa vụ quân sự',
    'Hộ tịch & Quốc tịch', 'Phòng cháy chữa cháy', 'Thương mại điện tử', 'Bảo vệ người tiêu dùng',
    'An toàn thực phẩm', 'Chứng khoán & Cổ phần', 'Bồi thường thiệt hại', 'Công chứng & Chứng thực',
    'Hợp tác quốc tế', 'Khiếu nại & Tố cáo'
  ];

  return (
    <div className="w-full bg-[#fcfdfd] text-slate-800 transition-colors">
      {/* =========================================================================
          SECTION 1: HERO - CHATBOT HỖ TRỢ PHÁP LUẬT ĐẠI CƯƠNG (BRIGHT LIGHT THEME)
          ========================================================================= */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden bg-gradient-to-b from-rose-50/60 via-white to-slate-50/50 border-b border-slate-200/70">
        {/* Subtle decorative lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-red-100/40 via-rose-50/20 to-amber-100/30 blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Heading, Search & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Personal Project Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 shadow-sm text-xs font-semibold text-rose-600">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Trợ lý AI Pháp luật Đại cương • Chuẩn Giáo trình</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Hỏi đáp Pháp lý & Giải đề thi{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec2227] via-red-600 to-rose-600">
                  Chuẩn Bộ Giáo Dục & Đào Tạo
                </span>
              </h1>

              {/* Sub-description */}
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Hệ thống Chatbot Trí tuệ Nhân tạo chuyên biệt cho sinh viên ôn tập môn Pháp luật đại cương. 
                Tự động phân tích tình huống, đối chiếu chuẩn giáo trình Bộ GD&ĐT và trích dẫn quy định pháp luật chính xác trong 
                <span className="text-[#ec2227] font-semibold"> ~0.3 giây</span>.
              </p>

              {/* Main Search / Query Input Box */}
              <div className="relative pt-1">
                <form 
                  onSubmit={handleSearchSubmit}
                  className="relative p-2 rounded-2xl bg-white border-2 border-slate-200/90 shadow-xl shadow-slate-200/60 focus-within:border-[#ec2227] focus-within:ring-4 focus-within:ring-red-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="pl-3 text-slate-400">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nhập tình huống pháp luật hoặc câu hỏi ôn thi (VD: Cấu thành tội phạm, chia thừa kế)..."
                      className="w-full bg-transparent px-2 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="shrink-0 px-5 py-2.5 rounded-xl bg-[#ec2227] hover:bg-[#d01c21] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-red-500/25 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Hỏi AI</span>
                    </button>
                  </div>
                </form>

                {/* Quick Suggestion Chips */}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 shrink-0">
                    Gợi ý đề bài:
                  </span>
                  {sampleQuestions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onStartChat(q)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-100/90 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200/80 text-slate-600 transition-all duration-150"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => onStartChat()}
                  variant="default"
                  className="bg-[#ec2227] hover:bg-[#d01c21] text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-red-500/20"
                >
                  <span>Bắt đầu ôn luyện ngay</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={() => onOpenAuth('register')}
                  variant="outline"
                  className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm"
                >
                  <span>Tạo tài khoản cá nhân</span>
                </Button>
              </div>
            </div>

            {/* Right Column: High Quality Realistic Visual & Floating Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80"
                    alt="Pháp luật Đại cương & Cán cân Công lý"
                    className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                      <GraduationCap className="w-4 h-4 text-rose-400" />
                      <span>Giáo trình & Văn bản Pháp luật</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-0.5 line-clamp-1">
                      Mô hình AI tích hợp văn bản quy phạm pháp luật & bộ câu hỏi tình huống thực tế
                    </p>
                  </div>
                </div>

                {/* Floating Metric Badge 1: 10.000+ Dữ liệu */}
                <div className="absolute -top-4 -left-4 p-3 rounded-2xl bg-white shadow-xl border border-slate-200/90 flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#ec2227] flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">10.000+ Mẫu SFT</div>
                    <div className="text-[10px] text-slate-500">Dữ liệu huấn luyện chuyên sâu</div>
                  </div>
                </div>

                {/* Floating Metric Badge 2: Tốc độ phản hồi */}
                <div className="absolute -bottom-4 -right-4 p-3 rounded-2xl bg-white shadow-xl border border-slate-200/90 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Tốc độ ~0.3s</div>
                    <div className="text-[10px] text-slate-500">Không ảo giác (Zero Hallucination)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: 4 Key Metrics */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ec2227] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">10.000+</div>
                <div className="text-xs text-slate-500">Mẫu hỏi đáp chuẩn GD&ĐT</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">38</div>
                <div className="text-xs text-slate-500">Lĩnh vực pháp lý hỗ trợ</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">~0.3 Giây</div>
                <div className="text-xs text-slate-500">Thời gian phản hồi tức thì</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">100%</div>
                <div className="text-xs text-slate-500">Bám sát giáo trình Bộ GD&ĐT</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: 3 TÍNH NĂNG NỔI BẬT VỚI HÌNH ẢNH MINH HỌA CHẤT LƯỢNG CAO
          ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ec2227] text-xs font-bold border border-red-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NĂNG LỰC CỐT LÕI CỦA DỰ ÁN</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Chatbot có thể giúp bạn giải quyết những gì?
            </h2>
            <p className="text-sm text-slate-500">
              Không chỉ là trả lời thông thường, mô hình phân tích bài tập theo đúng 4 bước tư duy pháp lý chuyên nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Giải đáp tình huống cơ bản */}
            <div className="group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80"
                  alt="Giải đáp tình huống học tập"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-xs font-bold text-slate-800 shadow-sm">
                  Cơ bản
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#ec2227] transition-colors">
                    Giải đáp tình huống pháp luật
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Phân tích đầy đủ 4 yếu tố: Mặt khách quan, mặt chủ quan, chủ thể, khách thể. Xác định tính chất hành vi và điều kiện vi phạm.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => onStartChat('Phân tích 4 yếu tố cấu thành vi phạm pháp luật?')}
                    className="inline-flex items-center text-xs font-bold text-[#ec2227] hover:text-[#d01c21] group-hover:translate-x-1 transition-all"
                  >
                    <span>Trải nghiệm ngay</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Lập luận chi tiết & Trích dẫn chuẩn */}
            <div className="group rounded-3xl bg-white border-2 border-red-200 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col relative">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80"
                  alt="Nghiên cứu tài liệu và văn bản luật"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#ec2227] text-white text-xs font-bold shadow-sm">
                  Đặc sắc nhất
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#ec2227] transition-colors">
                    Tự động lập luận giải chi tiết
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Trích dẫn chính xác Điều, Khoản, Điểm của Bộ luật Dân sự, Hình sự, Lao động... kèm lập luận logic để đạt điểm tối đa khi thi cử.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => onStartChat('Giải bài tập tình huống chi tiết theo chuẩn Bộ GD&ĐT')}
                    className="inline-flex items-center text-xs font-bold text-[#ec2227] hover:text-[#d01c21] group-hover:translate-x-1 transition-all"
                  >
                    <span>Xem bài tập mẫu</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Trợ lý AI đồng hành 24/7 */}
            <div className="group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
                  alt="Trợ lý công nghệ AI 24/7"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-xs font-bold text-slate-800 shadow-sm">
                  Trực tuyến
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#ec2227] transition-colors">
                    Tương tác & Học tập thông minh 24/7
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Hỗ trợ sinh viên ôn bài mọi lúc, mọi nơi. Gợi ý thêm câu hỏi mở rộng tư duy và xuất file PDF bài giải chuẩn mẫu để in ấn, nộp bài.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => onStartChat()}
                    className="inline-flex items-center text-xs font-bold text-[#ec2227] hover:text-[#d01c21] group-hover:translate-x-1 transition-all"
                  >
                    <span>Bắt đầu trò chuyện</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TẠI SAO NÊN CHỌN CHATBOT (ẢNH CÁN CÂN CÔNG LÝ & ĐỐI SÁNH)
          ========================================================================= */}
      <section className="py-16 sm:py-20 bg-slate-50/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual Image */}
            <div className="lg:col-span-5 relative order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80"
                  alt="Cán cân công lý và bộ sách luật"
                  className="w-full h-80 sm:h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="text-2xl font-black">Tiết kiệm 60%</div>
                  <div className="text-xs text-slate-200 mt-1">
                    Thời gian đọc giáo trình & tra cứu văn bản pháp luật
                  </div>
                  <div className="mt-3">
                    <Button
                      onClick={() => onStartChat()}
                      variant="default"
                      size="sm"
                      className="bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold"
                    >
                      Thử nghiệm ngay
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Deep Dive */}
            <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ec2227] text-xs font-bold border border-red-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>KIẾN TRÚC & CÔNG NGHỆ</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Lý do nên sử dụng Chatbot Hỗ Trợ Pháp Luật Đại Cương?
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Được nghiên cứu và xây dựng bài bản nhằm giải quyết bài toán khó khăn của sinh viên khi tiếp cận môn học có khối lượng kiến thức đồ sộ và thuật ngữ chuyên ngành phức tạp.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-[#ec2227] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Kiến trúc 4 Tầng chống ảo giác (No Hallucination)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kết hợp giữa RAG (Retrieval-Augmented Generation), hệ chuyên gia lọc điều luật và mô hình ngôn ngữ lớn Qwen2.5 đã huấn luyện SFT/LoRA.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-[#ec2227] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Kho dữ liệu giáo trình chuẩn Bộ Giáo dục & Đào tạo</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bao quát trọn vẹn 10 chương trọng tâm: Nguồn gốc nhà nước, quy phạm pháp luật, quan hệ pháp luật, vi phạm & trách nhiệm pháp lý, các ngành luật cơ bản.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-[#ec2227] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Xuất báo cáo PDF chuẩn mẫu nộp bài</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chỉ với 1 click, toàn bộ bài giải kèm trích dẫn điều luật được đóng gói thành tài liệu PDF hoàn chỉnh để phục vụ học tập và in ấn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: 38 LĨNH VỰC PHÁP LÝ HỖ TRỢ TRA CỨU
          ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ec2227] text-xs font-bold border border-red-200">
              <Compass className="w-3.5 h-3.5" />
              <span>DỮ LIỆU PHÁP LUẬT ĐẦY ĐỦ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              38 Lĩnh vực Pháp luật Hỗ trợ Tra cứu
            </h2>
            <p className="text-sm text-slate-500">
              Hệ sinh thái tri thức được phân loại rõ ràng giúp sinh viên dễ dàng định vị chuyên đề bài tập.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {legalFields.map((field, idx) => (
              <button
                key={idx}
                onClick={() => onStartChat(`Tư vấn bài tập môn: ${field}`)}
                className="group p-3 rounded-2xl bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-200 text-left transition-all duration-200 shadow-sm hover:shadow"
              >
                <div className="text-[10px] font-bold text-slate-400 group-hover:text-[#ec2227] mb-1">
                  #{idx + 1}
                </div>
                <div className="text-xs font-semibold text-slate-800 group-hover:text-[#ec2227] line-clamp-1">
                  {field}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: BẢNG GIÁ & GÓI DỊCH VỤ (LIGHT CLEAN CARDS)
          ========================================================================= */}
      <section id="dichvu" className="py-16 sm:py-20 bg-slate-50/70 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ec2227] text-xs font-bold border border-red-200">
              <Award className="w-3.5 h-3.5" />
              <span>GÓI TRẢI NGHIỆM</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bảng giá Dịch vụ AI Luật
            </h2>
            <p className="text-sm text-slate-500">
              Miễn phí hoàn toàn cho sinh viên học tập & nghiên cứu. Tùy chọn nâng cao cho nhu cầu chuyên sâu.
            </p>

            {/* Toggle Month / Year */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-semibold ${billingPeriod === 'month' ? 'text-slate-900' : 'text-slate-400'}`}>
                Thanh toán theo tháng
              </span>
              <button
                type="button"
                onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
                className="w-12 h-6 rounded-full bg-slate-200 p-1 relative transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-[#ec2227] shadow transition-transform ${
                    billingPeriod === 'year' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${billingPeriod === 'year' ? 'text-slate-900' : 'text-slate-400'}`}>
                Thanh toán theo năm{' '}
                <span className="text-[10px] font-bold text-[#ec2227] bg-red-100 px-1.5 py-0.5 rounded-full">
                  -20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Gói Sinh viên (0đ) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Miễn phí</div>
                <h3 className="text-lg font-bold text-slate-900">Gói Sinh viên</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">0 đ</span>
                  <span className="text-xs text-slate-500"> / vĩnh viễn</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>30 câu hỏi miễn phí / tháng (Chuẩn giáo trình)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tra cứu 38 lĩnh vực pháp luật</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tốc độ phản hồi ~0.3s</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => onStartChat()}
                variant="outline"
                className="w-full mt-6 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sử dụng miễn phí
              </Button>
            </div>

            {/* Gói Cơ bản (425.000đ) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cá nhân</div>
                <h3 className="text-lg font-bold text-slate-900">Gói Cơ bản</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingPeriod === 'month' ? '425.000 đ' : '340.000 đ'}
                  </span>
                  <span className="text-xs text-slate-500"> / tháng</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Toàn bộ quyền lợi gói Sinh viên</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Xuất báo cáo PDF không giới hạn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Ưu tiên băng thông máy chủ</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => onOpenAuth('register')}
                variant="outline"
                className="w-full mt-6 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đăng ký ngay
              </Button>
            </div>

            {/* Gói Nâng cao (2.490.000đ - Phổ biến) */}
            <div className="p-6 rounded-3xl bg-white border-2 border-[#ec2227] shadow-xl relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#ec2227] text-white text-[11px] font-extrabold tracking-wide uppercase">
                Phổ biến nhất
              </div>
              <div>
                <div className="text-xs font-bold text-[#ec2227] uppercase tracking-wider mb-2">Chuyên sâu</div>
                <h3 className="text-lg font-bold text-slate-900">Gói Nâng cao</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-extrabold text-[#ec2227]">
                    {billingPeriod === 'month' ? '2.490.000 đ' : '1.990.000 đ'}
                  </span>
                  <span className="text-xs text-slate-500"> / tháng</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ec2227] shrink-0" />
                    <span>Lập luận giải chi tiết từng bước</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ec2227] shrink-0" />
                    <span>Truy cập hệ thống đánh giá 4 Tầng</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#ec2227] shrink-0" />
                    <span>Hỗ trợ kỹ thuật 24/7 trực tiếp</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => onOpenAuth('register')}
                variant="default"
                className="w-full mt-6 bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold shadow-md shadow-red-500/20"
              >
                Chọn gói Nâng cao
              </Button>
            </div>

            {/* Gói Doanh nghiệp (8.000.000đ) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tổ chức</div>
                <h3 className="text-lg font-bold text-slate-900">Gói Doanh nghiệp</h3>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingPeriod === 'month' ? '8.000.000 đ' : '6.400.000 đ'}
                  </span>
                  <span className="text-xs text-slate-500"> / tháng</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tích hợp API trực tiếp cho website</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tài khoản quản trị phân quyền đa cấp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tùy biến bộ dữ liệu chuyên ngành riêng</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => onOpenAuth('register')}
                variant="outline"
                className="w-full mt-6 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Liên hệ hợp tác
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FAQ ACCORDION (CÂU HỎI THƯỜNG GẶP)
          ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ec2227] text-xs font-bold border border-red-200">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>GIẢI ĐÁP THẮC MẮC</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Câu hỏi thường gặp về Chatbot
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Chatbot Hỗ Trợ Pháp Luật Đại Cương có đảm bảo độ chính xác theo giáo trình không?',
                a: 'Có. Mô hình được tinh chỉnh (fine-tuned) trên bộ câu hỏi chuẩn giáo trình Bộ GD&ĐT kết hợp với kho văn bản pháp luật hiện hành và kiến trúc kiểm định 4 Tầng để triệt tiêu hiện tượng ảo giác (hallucination).'
              },
              {
                q: 'Làm thế nào để đạt điểm tối đa khi giải bài tập tình huống?',
                a: 'Chatbot hướng dẫn bạn cấu trúc bài làm theo đúng chuẩn chấm thi: (1) Nêu căn cứ pháp lý, (2) Phân tích 4 yếu tố cấu thành (Chủ thể, Khách thể, Mặt chủ quan, Mặt khách quan), (3) Lập luận áp dụng điều luật, và (4) Kết luận giải pháp.'
              },
              {
                q: 'Tôi có thể xuất câu trả lời ra file PDF để nộp bài hoặc in ấn ôn tập không?',
                a: 'Hoàn toàn được! Ở màn hình Hỏi đáp AI, bạn chỉ cần bấm nút "Xuất file PDF", hệ thống sẽ tự động định dạng chuẩn A4 có tiêu đề, ngày tháng và nội dung phân tích rõ ràng.'
              },
              {
                q: 'Dự án này sử dụng mô hình trí tuệ nhân tạo nào?',
                a: 'Hệ thống sử dụng mô hình ngôn ngữ lớn Qwen2.5-3B được kết hợp LoRA Adapter huấn luyện chuyên sâu trên dữ liệu môn Pháp luật đại cương, chạy offline hoàn toàn để đảm bảo tốc độ và quyền riêng tư dữ liệu.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-[#ec2227] transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-[#ec2227]' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: BOTTOM CTA BANNER (HÌNH ẢNH SINH VIÊN & KÊU GỌI HÀNH ĐỘNG)
          ========================================================================= */}
      <section className="py-16 bg-gradient-to-r from-red-600 via-[#ec2227] to-rose-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-white shadow-lg">
            <Scale className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Sẵn sàng chinh phục môn Pháp luật Đại cương ngay hôm nay?
          </h2>
          <p className="text-sm sm:text-base text-rose-100 max-w-2xl mx-auto leading-relaxed">
            Tham gia cùng hàng ngàn sinh viên sử dụng Chatbot AI để giải đề thi, nắm vững kiến thức pháp lý và đạt kết quả cao nhất.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onStartChat()}
              className="px-8 py-3.5 rounded-2xl bg-white text-[#ec2227] font-bold text-sm sm:text-base hover:bg-rose-50 shadow-xl transition-all"
            >
              Bắt đầu hỏi đáp ngay
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-3.5 rounded-2xl bg-black/20 hover:bg-black/30 text-white font-semibold text-sm sm:text-base border border-white/20 transition-all"
            >
              Tạo tài khoản miễn phí
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
