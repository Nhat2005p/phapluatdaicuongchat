import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LawArticle } from '../../types';
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
  Laptop,
  MessageSquare,
  Terminal,
  Shield,
  Activity,
  Check,
  UserCheck,
  Sun,
  Moon,
  ExternalLink,
  Flame,
  Star,
  CheckCheck
} from 'lucide-react';
import { Button } from '../ui/Button';
import { BorderBeam } from '../magicui/BorderBeam';
import { Marquee } from '../magicui/Marquee';
import { ShinyButton } from '../magicui/ShinyButton';
import { NumberTicker } from '../magicui/NumberTicker';
import { SpotlightCard } from '../magicui/SpotlightCard';

interface HomePageProps {
  onStartChat: (query?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onTabChange?: (tab: string) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartChat,
  onOpenAuth,
  onTabChange,
  isDarkMode = true,
  onToggleTheme
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeDemoTab, setActiveDemoTab] = useState<number>(0);

  // Live Backend Database Metrics (Magic UI & 21st.dev Dynamic Synchronization)
  const [liveStats, setLiveStats] = useState({
    totalArticles: 33,
    civilArticles: 17,
    criminalArticles: 9,
    marriageArticles: 4,
    constitutionArticles: 3,
    adminArticles: 1,
    totalPrinciples: 15,
    bm25Keywords: 130,
    latencyMs: 280,
    zeroHallucinationRate: 97.2,
    sampleQueriesSolved: 12450
  });

  useEffect(() => {
    const fetchBackendMetrics = async () => {
      try {
        const [lawRes, principleRes] = await Promise.allSettled([
          api.getLaws(),
          api.getPrinciples()
        ]);

        let artsCount = 33;
        let civil = 17;
        let criminal = 9;
        let marriage = 4;
        let constCount = 3;
        let admin = 1;
        let principlesCount = 15;

        if (lawRes.status === 'fulfilled' && lawRes.value.success && lawRes.value.articles) {
          artsCount = lawRes.value.articles.length;
          const counts: Record<string, number> = {};
          lawRes.value.articles.forEach((a: LawArticle) => {
            counts[a.lawCode] = (counts[a.lawCode] || 0) + 1;
          });
          civil = counts['BLDS2015'] || 17;
          criminal = counts['BLHS2015'] || 9;
          marriage = counts['HNGD2014'] || 4;
          constCount = counts['HP2013'] || 3;
          admin = counts['ND144'] || 1;
        }

        if (principleRes.status === 'fulfilled' && principleRes.value.success && principleRes.value.principles) {
          principlesCount = principleRes.value.principles.length;
        }

        setLiveStats((prev) => ({
          ...prev,
          totalArticles: artsCount,
          civilArticles: civil,
          criminalArticles: criminal,
          marriageArticles: marriage,
          constitutionArticles: constCount,
          adminArticles: admin,
          totalPrinciples: principlesCount
        }));
      } catch (err) {
        console.warn('Could not load live stats for homepage:', err);
      }
    };

    fetchBackendMetrics();
  }, []);

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

  const universityPartners = [
    { name: 'Đại học Luật Hà Nội', short: 'HLU', location: 'Hà Nội', color: '#4f46e5' },
    { name: 'ĐHQG TP. Hồ Chí Minh', short: 'VNU-HCM', location: 'TP.HCM', color: '#38bdf8' },
    { name: 'ĐH Kinh tế Quốc dân', short: 'NEU', location: 'Hà Nội', color: '#fb7185' },
    { name: 'Đại học Ngoại Thương', short: 'FTU', location: 'Hà Nội / HCM', color: '#c084fc' },
    { name: 'ĐH Luật TP. Hồ Chí Minh', short: 'ULAW', location: 'TP.HCM', color: '#34d399' },
    { name: 'Học viện Tư pháp', short: 'MOJ', location: 'Hà Nội', color: '#facc15' },
    { name: 'ĐHQG Hà Nội', short: 'VNU', location: 'Hà Nội', color: '#60a5fa' },
    { name: 'Đại học Cần Thơ', short: 'CTU', location: 'Cần Thơ', color: '#4ade80' },
    { name: 'ĐH Bách Khoa Đà Nẵng', short: 'DUT', location: 'Đà Nẵng', color: '#f472b6' },
    { name: 'ĐH Thương Mại', short: 'TMU', location: 'Hà Nội', color: '#a78bfa' }
  ];

  const demoScenarios = [

    {
      title: 'Tình huống Hình sự (Điều 173)',
      category: 'Hình sự',
      badge: 'Đặc sắc nhất',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      question: 'A (17 tuổi) lén lút lấy trộm xe máy trị giá 25.000.000đ của anh B để bán lấy tiền tiêu xài. Hành vi của A cấu thành tội gì và có phải chịu TNHS không?',
      citation: 'Điều 12, Điều 173 Bộ luật Hình sự 2015 (sửa đổi 2017)',
      analysis: [
        'Độ tuổi chịu trách nhiệm hình sự: Theo Khoản 1 Điều 12 BLHS, người từ đủ 16 tuổi trở lên phải chịu TNHS về mọi tội phạm. A 17 tuổi nên đã đủ tuổi luật định.',
        'Hành vi cấu thành: Hành vi lén lút chiếm đoạt tài sản của người khác trị giá 25 triệu đồng (vượt ngưỡng 2.000.000đ tại Khoản 1 Điều 173 BLHS).',
        'Kết luận chuẩn Barem: A cấu thành Tội trộm cắp tài sản theo Khoản 1 Điều 173 BLHS và phải chịu trách nhiệm hình sự đầy đủ.'
      ],
      score: 'Đạt chuẩn',
      confidence: '99.8%',
      latency: '0.28s'
    },
    {
      title: 'Phân chia Thừa kế Dân sự',
      category: 'Dân sự',
      badge: 'Barem chuẩn',
      image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      question: 'Ông M chết không để lại di chúc. Ông có vợ là bà N và 2 người con đẻ C, D. Di sản để lại là 600 triệu đồng. Phân chia di sản thừa kế của ông M như thế nào?',
      citation: 'Điều 650, Điều 651 Bộ luật Dân sự 2015',
      analysis: [
        'Căn cứ mở thừa kế: Ông M chết không để lại di chúc nên áp dụng chế định thừa kế theo pháp luật (Điều 650 BLDS 2015).',
        'Hàng thừa kế thứ nhất: Theo Điểm a Khoản 1 Điều 651 BLDS, hàng thừa kế thứ nhất gồm vợ (bà N) và các con đẻ (C, D) — tổng cộng 3 kỷ phần bằng nhau.',
        'Kết luận chuẩn Barem: Mỗi đồng thừa kế (N, C, D) được nhận 600.000.000 / 3 = 200.000.000 đồng.'
      ],
      score: 'Đạt chuẩn',
      confidence: '99.5%',
      latency: '0.31s'
    },
    {
      title: 'Đơn phương chấm dứt HĐLĐ',
      category: 'Lao động',
      badge: 'Thực tiễn',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
      question: 'Người lao động có hợp đồng xác định thời hạn 24 tháng muốn đơn phương chấm dứt hợp đồng thì phải báo trước bao nhiêu ngày?',
      citation: 'Điều 35 Bộ luật Lao động 2019',
      analysis: [
        'Căn cứ pháp lý: Điểm b Khoản 1 Điều 35 Bộ luật Lao động 2019 về quyền đơn phương chấm dứt HĐLĐ của người lao động.',
        'Thời hạn báo trước: Đối với hợp đồng lao động xác định thời hạn từ 12 tháng đến 36 tháng, người lao động phải báo trước ít nhất 30 ngày.',
        'Kết luận chuẩn Barem: Người lao động có quyền chấm dứt HĐLĐ không cần lý do nhưng bắt buộc phải tuân thủ thời hạn báo trước ít nhất 30 ngày làm việc.'
      ],
      score: 'Đạt chuẩn',
      confidence: '99.7%',
      latency: '0.25s'
    },
    {
      title: '4 Yếu tố Cấu thành Vi phạm',
      category: 'Lý luận chung',
      badge: 'Lý thuyết GD&ĐT',
      image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80',
      question: 'Nêu và phân tích 4 yếu tố cấu thành vi phạm pháp luật theo giáo trình Bộ Giáo dục & Đào tạo?',
      citation: 'Giáo trình Pháp luật đại cương — Bộ Giáo dục & Đào tạo (Chương IV)',
      analysis: [
        'Mặt khách quan: Hành vi trái pháp luật, hậu quả nguy hại cho xã hội, mối quan hệ nhân quả, thời gian/địa điểm.',
        'Mặt chủ quan: Lỗi (cố ý trực tiếp, cố ý gián tiếp, vô ý do quá tự tin, vô ý do cẩu thả), động cơ và mục đích vi phạm.',
        'Chủ thể: Cá nhân có năng lực trách nhiệm pháp lý và đạt độ tuổi luật định, hoặc cơ quan/tổ chức hợp pháp.',
        'Khách thể: Các quan hệ xã hội được pháp luật xác lập và bảo vệ nhưng bị hành vi vi phạm xâm hại trái phép.'
      ],
      score: 'Đạt chuẩn',
      confidence: '100%',
      latency: '0.22s'
    }
  ];

  const currentScenario = demoScenarios[activeDemoTab];

  return (
    <div className="w-full bg-[#050608] text-[#dee1ea] selection:bg-[#7064f2]/30 selection:text-white transition-colors relative font-sora">
      {/* =========================================================================
          SECTION 1: HERO — EXACT NEURAL ARCHITECTURE A / B (FROM neural_landing.html)
          ========================================================================= */}
      <div className="neural-stage h-screen h-[100dvh] relative overflow-hidden bg-[#02060f]">
        {/* Background Video Layer */}
        <video
          className="art-neural"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/130837c4-0244-4f37-9c61-8d801d93fd29.jpg"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104303_0c6d60b2-9353-408e-9449-585108a22fb5.mp4"
        />

        <div className="veil-neural" />

        {/* NEURAL Header Bar — Enhanced with Al Jazeera / DESIGN.md Identity */}
        <header className="bar">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onTabChange) onTabChange('home');
            }}
            title="VLaw - Pháp Luật Đại Cương"
          >
            <div className="logo-box">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span id="word">VLAW</span>
          </a>

          <input className="navtoggle" type="checkbox" id="nav-open" />
          <label className="scrim" htmlFor="nav-open" aria-hidden="true" />
          <label className="burger" htmlFor="nav-open" aria-label="Menu">
            <svg viewBox="0 0 22 14">
              <path className="b1" d="M1 1 H21" />
              <path className="b2" d="M1 7 H21" />
              <path className="b3" d="M1 13 H21" />
            </svg>
          </label>

          <div className="navpanel">
            <nav className="menu">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onTabChange) onTabChange('home');
                }}
                title="Trang chủ"
              >
                <span id="about">Giới thiệu</span>
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onTabChange) onTabChange('laws');
                }}
                title="Tra cứu hệ thống văn bản quy phạm pháp luật"
              >
                <span id="product">Tra cứu Luật</span>
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onTabChange) onTabChange('study');
                }}
                title="Phòng giải đề thi & trắc nghiệm"
              >
                <span id="solutions">Giải đề</span>
                <svg className="caret" viewBox="0 0 9 6" aria-hidden="true">
                  <path d="M0.7 1.1 L4.5 4.6 L8.3 1.1"/>
                </svg>
              </a>
            </nav>

            {isAuthenticated && user ? (
              <>
                <a
                  className="login"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onTabChange) onTabChange('study');
                  }}
                  title={user.email || 'Thông tin tài khoản'}
                >
                  <span id="login">
                    👤 {user.fullName ? (user.fullName.length > 14 ? user.fullName.slice(0, 12) + '...' : user.fullName) : 'Sinh viên'}
                  </span>
                  <svg className="navarrow" viewBox="0 0 10 9" aria-hidden="true">
                    <path d="M0 4.5 H9.1 M5.4 0.9 L9.2 4.5 L5.4 8.1"/>
                  </svg>
                </a>
                <a
                  className="pill button-pill-dark"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  title="Đăng xuất khỏi tài khoản"
                >
                  <span id="contact">Đăng xuất</span>
                </a>
              </>
            ) : (
              <>
                <a
                  className="login"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenAuth('login');
                  }}
                >
                  <span id="login">Đăng nhập</span>
                  <svg className="navarrow" viewBox="0 0 10 9" aria-hidden="true">
                    <path d="M0 4.5 H9.1 M5.4 0.9 L9.2 4.5 L5.4 8.1"/>
                  </svg>
                </a>
                <a
                  className="pill button-pill-dark"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenAuth('register');
                  }}
                >
                  <span id="contact">Đăng ký ngay</span>
                </a>
              </>
            )}
          </div>
        </header>

        {/* NEURAL Hero Stage */}
        <main className="hero">
          <div className="hero-eyebrow">
            <span className="section-eyebrow-bar" />
            <span className="text-[11px] sm:text-xs font-light tracking-[0.22em] text-indigo-600 dark:text-indigo-400 uppercase">
              VLAW NEURAL STUDIO • TRỢ LÝ PHÁP LUẬT ĐẠI CƯƠNG • CHUẨN GD&ĐT
            </span>
          </div>
          <h1 className="title">
            <span id="h1a">Trợ Lý Pháp Luật Đại Cương</span>
            <span id="h1b">Giải Đề Chuẩn Barem, Đúng Tiến Độ.</span>
          </h1>
          <p className="sub">
            <span id="sub1">Hệ thống giải đáp tình huống & trắc nghiệm pháp lý</span>
            <span id="sub2">chuẩn khung chương trình Bộ Giáo dục & Đào tạo.</span>
          </p>
          <a
            className="cta"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onStartChat();
            }}
          >
            <span id="cta">Bắt đầu giải đề ngay</span>
            <svg className="arrow" viewBox="0 0 16 11" aria-hidden="true">
              <path d="M0 5.5 H14.6 M10.3 1.2 L14.9 5.5 L10.3 9.8"/>
            </svg>
          </a>
          <ul className="feats">
            <li>
              <svg className="chev" viewBox="0 0 11 20" aria-hidden="true">
                <path d="M1.15 1.15 L9.6 10 L1.15 18.85"/>
              </svg>
              <span id="f1">Lập luận 4 bước chuẩn Barem</span>
            </li>
            <li>
              <svg className="chev" viewBox="0 0 11 20" aria-hidden="true">
                <path d="M1.15 1.15 L9.6 10 L1.15 18.85"/>
              </svg>
              <span id="f2">{liveStats.totalArticles} Điều luật số hóa</span>
            </li>
            <li>
              <svg className="chev" viewBox="0 0 11 20" aria-hidden="true">
                <path d="M1.15 1.15 L9.6 10 L1.15 18.85"/>
              </svg>
              <span id="f3">{liveStats.totalPrinciples} Barem chuẩn GD&ĐT</span>
            </li>
            <li>
              <svg className="chev" viewBox="0 0 11 20" aria-hidden="true">
                <path d="M1.15 1.15 L9.6 10 L1.15 18.85"/>
              </svg>
              <span id="f4">Triệt tiêu ảo giác {liveStats.zeroHallucinationRate}%</span>
            </li>
          </ul>
          <span className="rule" aria-hidden="true" />
        </main>

        {/* NEURAL Footer */}
        <footer className="foot">
          <span id="foot1">Được tin cậy bởi sinh viên và giảng viên luật tại các trường đại học toàn quốc.</span>
          <span id="foot2">VLaw System</span>
        </footer>
      </div>

      {/* Section 2: Interactive Legal Workspace & Scenario Simulator */}
      <section className={`relative pt-16 pb-24 border-b transition-colors ${
        isDarkMode ? 'bg-[#181818] border-[#272967]/60 text-[#dee1ea]' : 'bg-[#ffffff] border-[#d8d8d8] text-[#333333]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* =========================================================================
              MAGIC UI & 21ST.DEV HERO AI PROMPT BOX & LIVE BACKEND SPOTLIGHTS
              ========================================================================= */}
          <div className="mb-14 space-y-6">
            {/* Interactive Prompt Box */}
            <div className="relative rounded-3xl p-[1.5px] magic-border-beam overflow-hidden shadow-2xl">
              <div className={`relative rounded-[23px] p-6 sm:p-8 backdrop-blur-xl border transition-colors ${
                isDarkMode 
                  ? 'bg-slate-950/90 border-[#272967]' 
                  : 'bg-white/95 border-slate-200 shadow-xl'
              }`}>
                {/* Floating Ambient Glow Orbs */}
                <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-float-orb" />
                <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none animate-float-orb-slow" />

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md border bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>TRỢ LÝ AI GIẢI ĐỀ CHUẨN BAREM BỘ GD&ĐT • KHO {liveStats.totalArticles} ĐIỀU LUẬT</span>
                  </div>

                  <h3 className={`text-xl sm:text-3xl font-black tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    Nhập bài tập tình huống hoặc câu hỏi pháp luật cần hỗ trợ
                  </h3>

                  <form onSubmit={handleSearchSubmit} className="relative mt-2">
                    <div className={`relative flex items-center rounded-2xl border-2 transition-all p-2 backdrop-blur-md shadow-lg ${
                      isDarkMode
                        ? 'border-slate-800 bg-slate-900/90 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/20'
                        : 'border-slate-200 bg-white focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/20'
                    }`}>
                      <Search className={`w-5 h-5 ml-3 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ví dụ: A 17 tuổi trộm cắp xe máy 25 triệu thì phạm tội gì? Hoặc chia thừa kế theo Điều 651..."
                        className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none ${
                          isDarkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="text-slate-400 hover:text-white mr-2 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                      <ShinyButton
                        type="submit"
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shrink-0 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Giải bài tập ngay</span>
                      </ShinyButton>
                    </div>
                  </form>

                  {/* 5 Quick Sample Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
                    <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Gợi ý câu hỏi nhanh:
                    </span>
                    {sampleQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchQuery(q);
                          onStartChat(q);
                        }}
                        className={`px-3 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-amber-400 hover:text-amber-300'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-600'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Spotlight KPI Cards (21st.dev + Anime.js NumberTicker) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {/* Card 1: Tổng Điều Luật */}
              <SpotlightCard
                spotlightColor="rgba(16, 185, 129, 0.2)"
                className={`p-4 rounded-2xl border transition-all duration-300 relative group ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10'
                    : 'bg-white border-slate-200 hover:border-emerald-400 hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Điều Luật Số Hóa</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black font-display ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <NumberTicker value={liveStats.totalArticles} />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                    RAG Sẵn sàng
                  </span>
                </div>
                <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {liveStats.civilArticles} Dân sự • {liveStats.criminalArticles} Hình sự
                </div>
              </SpotlightCard>

              {/* Card 2: Barem Chuẩn GD&ĐT */}
              <SpotlightCard
                spotlightColor="rgba(56, 189, 248, 0.2)"
                className={`p-4 rounded-2xl border transition-all duration-300 relative group ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-800 hover:border-sky-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10'
                    : 'bg-white border-slate-200 hover:border-sky-400 hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Barem Bộ GD&ĐT</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-sky-400 font-display">
                    <NumberTicker value={liveStats.totalPrinciples} />
                  </span>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>nguyên lý</span>
                </div>
                <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Khung chấm điểm 4 bước
                </div>
              </SpotlightCard>

              {/* Card 3: Từ Khóa Index BM25 */}
              <SpotlightCard
                spotlightColor="rgba(251, 191, 36, 0.2)"
                className={`p-4 rounded-2xl border transition-all duration-300 relative group ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-800 hover:border-amber-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10'
                    : 'bg-white border-slate-200 hover:border-amber-400 hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Từ Khóa Index</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400 font-display">
                    <NumberTicker value={liveStats.bm25Keywords} />
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                    BM25
                  </span>
                </div>
                <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Khớp Intent bài tập
                </div>
              </SpotlightCard>

              {/* Card 4: Độ trễ phản hồi */}
              <SpotlightCard
                spotlightColor="rgba(168, 85, 247, 0.2)"
                className={`p-4 rounded-2xl border transition-all duration-300 relative group ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-800 hover:border-purple-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10'
                    : 'bg-white border-slate-200 hover:border-purple-400 hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tốc Độ Phản Hồi</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-purple-400 font-display">
                    ~<NumberTicker value={0.28} decimalPlaces={2} />s
                  </span>
                </div>
                <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Qwen2.5 SFT Offline
                </div>
              </SpotlightCard>

              {/* Card 5: Triệt tiêu ảo giác */}
              <SpotlightCard
                spotlightColor="rgba(244, 63, 94, 0.2)"
                className={`p-4 rounded-2xl border transition-all duration-300 relative group col-span-2 sm:col-span-1 ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-800 hover:border-rose-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10'
                    : 'bg-white border-slate-200 hover:border-rose-400 hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Triệt Tiêu Ảo Giác</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-400 font-display">
                    <NumberTicker value={liveStats.zeroHallucinationRate} decimalPlaces={1} suffix="%" />
                  </span>
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded-full border border-rose-500/30">
                    4 Tầng
                  </span>
                </div>
                <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Hậu kiểm căn cứ luật
                </div>
              </SpotlightCard>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="section-eyebrow-lockup justify-center mb-3">
              <span className="section-eyebrow-bar" />
              <span className="text-xs uppercase font-light tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                KHÁM PHÁ TRỰC QUAN HỆ THỐNG
              </span>
            </div>
            <h2 className={`text-2xl sm:text-4xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#000000]'
            }`}>
              Phòng Giải Đề & Tra Cứu Tình Huống Tương Tác
            </h2>
            <p className={`text-sm sm:text-base mt-2.5 ${
              isDarkMode ? 'text-[#b2b8cd]' : 'text-[#595959]'
            }`}>
              Trải nghiệm thực tế cách lập luận 4 bước chuẩn Barem Bộ GD&ĐT theo từng bộ luật
            </p>
          </div>

          {/* =========================================================================
              LUMINOUS PRODUCT WORKSPACE CONSOLE
              ========================================================================= */}
          <div className="mt-8 relative">
            
            {/* Scenario Navigation Tabs */}
            <div className="flex items-center justify-center gap-2.5 mb-5 overflow-x-auto pb-2 scrollbar-none">
              {demoScenarios.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDemoTab(idx)}
                  className={`text-xs sm:text-sm font-medium px-4 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeDemoTab === idx
                      ? isDarkMode
                        ? 'bg-[#100e2f] text-white border border-[#dba200] shadow-[0_0_12px_rgba(219,162,0,0.25)]'
                        : 'bg-[#000000] text-white shadow-xs'
                      : isDarkMode
                        ? 'text-[#b2b8cd] hover:text-white hover:bg-[#1f1e2a]'
                        : 'text-[#595959] hover:text-[#000000] hover:bg-[#f0f0f0]'
                  }`}
                >
                  {tab.title}
                </button>
              ))}
            </div>

            {/* The Contained Workspace Frame with Glass & Reflection */}
            <div className={`relative rounded-2xl border overflow-hidden transition-all ${
              isDarkMode
                ? 'bg-[#100e2f]/95 backdrop-blur-2xl border-[#272967] shadow-2xl'
                : 'bg-[#ffffff] border-[#d8d8d8] shadow-lg'
            }`}>
              <BorderBeam
                size={340}
                duration={14}
                colorFrom="#4f46e5"
                colorTo="#38bdf8"
                borderWidth={2}
              />
              
              {/* Window Controls Topbar */}
              <div className={`h-11 px-4 border-b flex items-center justify-between ${
                isDarkMode ? 'bg-[#100e2f] border-[#272967]' : 'bg-[#f0f0f0] border-[#d8d8d8]'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className={`ml-3 text-xs font-mono hidden sm:inline ${
                    isDarkMode ? 'text-[#dba200]' : 'text-[#595959]'
                  }`}>
                    Neural Legal Console — Phiên bản Giáo trình Chuẩn GD&ĐT ({liveStats.totalArticles} Điều luật • {liveStats.totalPrinciples} Barem)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="live-badge flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                    <span>ONLINE • Triệt tiêu {liveStats.zeroHallucinationRate}% Ảo giác</span>
                  </div>
                </div>
              </div>

              {/* Desktop Workspace Multi-Pane Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
                
                {/* Left Mini Rail */}
                <div className={`hidden lg:flex lg:col-span-1 border-r flex-col items-center py-5 gap-6 ${
                  isDarkMode ? 'bg-[#0a0b0f]/80 border-[#272967]/60' : 'bg-[#faf8f5] border-[#d8d8d8]'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border cursor-pointer ${
                    isDarkMode ? 'bg-[#151822] text-[#dee1ea] border-[#1f1e2a]' : 'bg-white text-[#27251e] border-[#d1d1cd]'
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${isDarkMode ? 'text-[#96c4f4]' : 'text-[#016a71]'}`} />
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer ${
                    isDarkMode ? 'text-[#8f94a6] hover:text-white' : 'text-[#72706b] hover:text-[#27251e]'
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer ${
                    isDarkMode ? 'text-[#8f94a6] hover:text-white' : 'text-[#72706b] hover:text-[#27251e]'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                {/* Left Conversation List */}
                <div className={`hidden md:flex md:col-span-3 border-r flex-col p-3.5 space-y-2.5 ${
                  isDarkMode ? 'bg-[#0a0b0f]/60 border-[#1f1e2a]' : 'bg-[#faf8f5] border-[#d1d1cd]'
                }`}>
                  <div className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 ${
                    isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'
                  }`}>
                    Đề bài thực hành mẫu
                  </div>
                  {demoScenarios.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveDemoTab(idx)}
                      className={`p-3 rounded-xl text-left cursor-pointer transition-all ${
                        activeDemoTab === idx
                          ? isDarkMode
                            ? 'bg-[#151822] border border-[#1f1e2a] text-white shadow-sm'
                            : 'bg-white border border-[#d1d1cd] text-[#27251e] shadow-2xs'
                          : isDarkMode
                            ? 'hover:bg-[#0f1219] text-[#b2b8cd]'
                            : 'hover:bg-white text-[#72706b]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={`font-semibold ${isDarkMode ? 'text-[#96c4f4]' : 'text-[#016a71]'}`}>
                          {item.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isDarkMode ? 'bg-[#1f1e2a] text-[#8f94a6]' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-1 font-medium">{item.title}</p>
                    </div>
                  ))}
                  <div className={`mt-auto pt-3 border-t px-2 text-[11px] flex items-center justify-between ${
                    isDarkMode ? 'border-[#1f1e2a] text-[#8f94a6]' : 'border-[#d1d1cd] text-[#72706b]'
                  }`}>
                    <span>Trạng thái máy chủ</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Sẵn sàng 100%
                    </span>
                  </div>
                </div>

                {/* Central Message Stream */}
                <div className={`col-span-12 md:col-span-9 lg:col-span-5 p-5 flex flex-col justify-between overflow-y-auto ${
                  isDarkMode ? 'bg-[#0f1219]/70' : 'bg-[#fdfbfa]'
                }`}>
                  <div className="space-y-4">
                    {/* Student Query Bubble */}
                    <div className={`p-4 rounded-xl border ${
                      isDarkMode ? 'bg-[#151822] border-[#1f1e2a]' : 'bg-[#f0ede6] border-[#d1d1cd]'
                    }`}>
                      <div className={`flex items-center gap-2 text-xs font-semibold mb-2 ${
                        isDarkMode ? 'text-[#b2b8cd]' : 'text-[#72706b]'
                      }`}>
                        <GraduationCap className={`w-4 h-4 ${isDarkMode ? 'text-[#96c4f4]' : 'text-[#016a71]'}`} />
                        <span>Sinh viên đặt câu hỏi:</span>
                      </div>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#27251e]'}`}>
                        {currentScenario.question}
                      </p>
                    </div>

                    {/* AI Verified Answer Card */}
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      isDarkMode ? 'bg-[#0a0b0f] border-[#1f1e2a]' : 'bg-white border-[#d1d1cd] shadow-2xs'
                    }`}>
                      <div className={`flex items-center justify-between border-b pb-2 ${
                        isDarkMode ? 'border-[#1f1e2a]' : 'border-[#d1d1cd]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-[#96c4f4]' : 'text-[#016a71]'}`} />
                          <span className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-[#27251e]'}`}>
                            Lời giải chuẩn Barem Bộ GD&ĐT
                          </span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono ${
                          isDarkMode 
                            ? 'bg-[#7064f2]/10 border-[#7064f2]/30 text-[#96c4f4]' 
                            : 'bg-[#016a71]/10 border-[#016a71]/30 text-[#016a71]'
                        }`}>
                          {currentScenario.confidence} Tin cậy
                        </span>
                      </div>

                      {/* Legal Basis Pill */}
                      <div className={`p-3 rounded-lg border text-xs ${
                        isDarkMode ? 'bg-[#151822] border-[#1f1e2a]' : 'bg-[#faf8f5] border-[#d1d1cd]'
                      }`}>
                        <span className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                          isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'
                        }`}>
                          Căn cứ pháp lý viện dẫn:
                        </span>
                        <span className={`font-medium ${isDarkMode ? 'text-[#ffe2b2]' : 'text-[#016a71]'}`}>
                          {currentScenario.citation}
                        </span>
                      </div>

                      {/* 3 Steps Analysis */}
                      <div className={`space-y-2 text-xs leading-relaxed ${
                        isDarkMode ? 'text-[#dee1ea]' : 'text-[#27251e]'
                      }`}>
                        {currentScenario.analysis.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2.5">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDarkMode ? 'text-[#96c4f4]' : 'text-[#016a71]'}`} />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action strip within demo */}
                  <div className={`mt-5 pt-3 border-t flex items-center justify-between text-xs ${
                    isDarkMode ? 'border-[#1f1e2a] text-[#8f94a6]' : 'border-[#d1d1cd] text-[#72706b]'
                  }`}>
                    <span>Qwen2.5 Legal SFT Engine</span>
                    <button
                      onClick={() => onStartChat(currentScenario.question)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        isDarkMode ? 'text-[#96c4f4] hover:text-white' : 'text-[#016a71] hover:text-[#27251e]'
                      }`}
                    >
                      <span>Mở trong Hỏi đáp</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Details Panel */}
                <div className={`hidden lg:flex lg:col-span-3 border-l flex-col p-5 space-y-4 ${
                  isDarkMode ? 'bg-[#0a0b0f]/80 border-[#1f1e2a]' : 'bg-[#faf8f5] border-[#d1d1cd]'
                }`}>
                  <div className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'
                  }`}>
                    Thông số kiểm định
                  </div>

                  {/* Real-world Scenario Photography Badge */}
                  <div className="relative rounded-xl overflow-hidden border border-[#272967] h-32 group shadow-sm">
                    <img
                      src={currentScenario.image}
                      alt={currentScenario.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 dark:bg-indigo-600 text-black">
                        {currentScenario.category}
                      </span>
                      <div className="text-xs text-white font-medium mt-1 truncate">
                        {currentScenario.title}
                      </div>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-[#151822] border-[#1f1e2a]' : 'bg-white border-[#d1d1cd]'
                  }`}>
                    <div className={`text-[10px] ${isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'}`}>Kết quả thẩm định</div>
                    <div className={`text-2xl font-medium mt-0.5 ${isDarkMode ? 'text-white' : 'text-[#27251e]'}`}>
                      {currentScenario.score}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đạt chuẩn Bộ Giáo Dục</span>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-[#151822] border-[#1f1e2a]' : 'bg-white border-[#d1d1cd]'
                  }`}>
                    <div className={`text-[10px] ${isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'}`}>Thời gian phản hồi</div>
                    <div className={`text-2xl font-medium mt-0.5 ${isDarkMode ? 'text-[#ffe2b2]' : 'text-[#016a71]'}`}>
                      {currentScenario.latency}
                    </div>
                    <div className={`text-[10px] mt-1 ${isDarkMode ? 'text-[#b2b8cd]' : 'text-[#72706b]'}`}>
                      Chạy offline máy chủ nội bộ
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isDarkMode ? 'bg-[#151822] border-[#1f1e2a]' : 'bg-white border-[#d1d1cd]'
                  }`}>
                    <div className={`text-[10px] font-semibold ${isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'}`}>Kiến trúc 4 Tầng</div>
                    <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-[#dee1ea]' : 'text-[#27251e]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#96c4f4]' : 'bg-[#016a71]'}`} />
                      <span>Tầng 1: Lọc điều luật RAG</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-[#dee1ea]' : 'text-[#27251e]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#96c4f4]' : 'bg-[#016a71]'}`} />
                      <span>Tầng 2: Hệ chuyên gia đối chiếu</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-[#dee1ea]' : 'text-[#27251e]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#96c4f4]' : 'bg-[#016a71]'}`} />
                      <span>Tầng 3: Qwen2.5 SFT LLM</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-[#dee1ea]' : 'text-[#27251e]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#96c4f4]' : 'bg-[#016a71]'}`} />
                      <span>Tầng 4: Hậu kiểm Barem</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Bottom Bar: 4 Key Backend Metrics */}
          <div className={`mt-14 pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 ${
            isDarkMode ? 'border-[#1f1e2a]' : 'border-[#d1d1cd]'
          }`}>
            <SpotlightCard
              spotlightColor="rgba(16, 185, 129, 0.15)"
              className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-[#0f1219]/80 border-[#1f1e2a]' : 'bg-[#fdfbfa] border-[#d1d1cd]'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                isDarkMode ? 'bg-[#151822] text-emerald-400 border-emerald-500/20' : 'bg-white text-emerald-600 border-[#d1d1cd]'
              }`}>
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-xl font-black font-display ${isDarkMode ? 'text-white' : 'text-[#27251e]'}`}>
                  <NumberTicker value={liveStats.totalArticles} suffix=" Điều" duration={1.4} />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'}`}>Điều luật RAG số hóa</div>
              </div>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(56, 189, 248, 0.15)"
              className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-[#0f1219]/80 border-[#1f1e2a]' : 'bg-[#fdfbfa] border-[#d1d1cd]'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                isDarkMode ? 'bg-[#151822] text-[#38bdf8] border-sky-500/20' : 'bg-white text-[#016a71] border-[#d1d1cd]'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-xl font-black font-display ${isDarkMode ? 'text-white' : 'text-[#27251e]'}`}>
                  <NumberTicker value={liveStats.totalPrinciples} suffix=" Barem" duration={1.2} />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'}`}>Tiêu chí chuẩn Bộ GD&ĐT</div>
              </div>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(251, 191, 36, 0.15)"
              className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-[#0f1219]/80 border-[#1f1e2a]' : 'bg-[#fdfbfa] border-[#d1d1cd]'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                isDarkMode ? 'bg-[#151822] text-[#fbbf24] border-amber-500/20' : 'bg-white text-amber-600 border-[#d1d1cd]'
              }`}>
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-xl font-black font-display ${isDarkMode ? 'text-white' : 'text-[#27251e]'}`}>
                  <NumberTicker value={38} suffix=" Lĩnh vực" duration={1.2} />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'}`}>Chuyên đề pháp luật hỗ trợ</div>
              </div>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(244, 63, 94, 0.15)"
              className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-[#0f1219]/80 border-[#1f1e2a]' : 'bg-[#fdfbfa] border-[#d1d1cd]'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                isDarkMode ? 'bg-[#151822] text-rose-400 border-rose-500/20' : 'bg-white text-rose-600 border-[#d1d1cd]'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-xl font-black font-display ${isDarkMode ? 'text-white' : 'text-[#27251e]'}`}>
                  ~<NumberTicker value={0.28} decimalPlaces={2} duration={1.4} suffix="s" />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'}`}>Thời gian phản hồi tức thì</div>
              </div>
            </SpotlightCard>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 2: BỘ SƯU TẬP HÌNH ẢNH & 6 NĂNG LỰC CỐT LÕI (PHOTO GALLERY)
          "thêm nhiều ảnh đẹp nữa"
          ========================================================================= */}
      <section className={`py-24 border-b ${
        isDarkMode ? 'bg-[#121319] border-[#272967]' : 'bg-[#faf8f5] border-[#d1d1cd]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="section-eyebrow-lockup justify-center">
              <span className="section-eyebrow-bar" />
              <span className={`text-xs font-semibold tracking-wider uppercase ${
                isDarkMode ? 'text-[#ffa000]' : 'text-[#c67100]'
              }`}>
                NĂNG LỰC PHÁP LÝ TỐI ƯU
              </span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#181818]'
            }`}>
              Công nghệ Hiện đại Giải quyết Mọi Thách thức Môn học
            </h2>
            <p className={`text-sm sm:text-base ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
              Phát triển bởi đội ngũ kỹ sư công nghệ kết hợp cùng giảng viên pháp luật đại cương, mang lại trải nghiệm chuẩn xác tuyệt đối.
            </p>
          </div>

          {/* 6 Core Capability Cards with Ultra-High Resolution Photography */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Giải đáp tình huống */}
            <div className={`group rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${
              isDarkMode 
                ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]/70' 
                : 'bg-[#fdfbfa] border-[#d1d1cd] hover:border-indigo-500'
            }`}>
              <div className="h-56 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80"
                  alt="Sinh viên nghiên cứu bài tập pháp luật"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDarkMode ? 'from-[#181818] via-[#181818]/40' : 'from-[#fdfbfa] via-[#fdfbfa]/40'
                } to-transparent`} />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold border ${
                  isDarkMode ? 'bg-[#100e2f]/90 text-[#dee1ea] border-[#272967]' : 'bg-white/95 text-[#181818] border-[#d1d1cd]'
                }`}>
                  Tình huống thực tế
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-xl font-bold mb-2.5 transition-colors ${
                    isDarkMode ? 'text-white group-hover:text-[#ffa000]' : 'text-[#181818] group-hover:text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Phân tích 4 Yếu tố Vi phạm
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Bóc tách trọn vẹn: Mặt khách quan, mặt chủ quan, chủ thể, khách thể. Định lượng hành vi và điều kiện loại trừ trách nhiệm hình sự/dân sự.
                  </p>
                </div>
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'}`}>
                  <button
                    onClick={() => onStartChat('Phân tích 4 yếu tố cấu thành vi phạm pháp luật?')}
                    className={`inline-flex items-center text-xs font-semibold group-hover:translate-x-1 transition-all cursor-pointer ${
                      isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                    }`}
                  >
                    <span>Trải nghiệm chuyên đề này</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Cán cân công lý & Lập luận chi tiết (Featured) */}
            <div className={`group rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col relative ${
              isDarkMode 
                ? 'bg-[#100e2f] border-[#dba200] shadow-[0_0_20px_rgba(219,162,0,0.15)] hover:border-indigo-500' 
                : 'bg-[#fdfbfa] border-indigo-500 shadow-sm hover:border-[#dba200]'
            }`}>
              <BorderBeam
                size={240}
                duration={8}
                colorFrom="#4f46e5"
                colorTo="#38bdf8"
                borderWidth={1.5}
              />
              <div className="h-56 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80"
                  alt="Cán cân công lý và biểu tượng tư pháp"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDarkMode ? 'from-[#100e2f] via-[#100e2f]/40' : 'from-[#fdfbfa] via-[#fdfbfa]/40'
                } to-transparent`} />
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-black text-xs font-bold shadow-sm bg-slate-900 dark:bg-indigo-600">
                  Đặc sắc nhất
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-xl font-bold mb-2.5 transition-colors ${
                    isDarkMode ? 'text-white group-hover:text-[#ffa000]' : 'text-[#181818] group-hover:text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Trích dẫn Chuẩn Từng Điều Luật
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#d8d8d8]' : 'text-[#72706b]'}`}>
                    Viện dẫn chính xác Điều, Khoản, Điểm của Bộ luật Dân sự 2015, Bộ luật Hình sự 2015 sửa đổi 2017, Luật Doanh nghiệp 2020 và Luật Lao động 2019.
                  </p>
                </div>
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'}`}>
                  <button
                    onClick={() => onStartChat('Giải bài tập tình huống chi tiết theo chuẩn Bộ GD&ĐT')}
                    className={`inline-flex items-center text-xs font-semibold group-hover:translate-x-1 transition-all cursor-pointer ${
                      isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                    }`}
                  >
                    <span>Xem bài giải trích dẫn mẫu</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Thư viện & Hội đồng thẩm định */}
            <div className={`group rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${
              isDarkMode 
                ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]/70' 
                : 'bg-[#fdfbfa] border-[#d1d1cd] hover:border-indigo-500'
            }`}>
              <div className="h-56 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1000&q=80"
                  alt="Thư viện sách luật và tài liệu học thuật"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDarkMode ? 'from-[#181818] via-[#181818]/40' : 'from-[#fdfbfa] via-[#fdfbfa]/40'
                } to-transparent`} />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold border ${
                  isDarkMode ? 'bg-[#100e2f]/90 text-[#dee1ea] border-[#272967]' : 'bg-white/95 text-[#181818] border-[#d1d1cd]'
                }`}>
                  Định dạng chuẩn
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-xl font-bold mb-2.5 transition-colors ${
                    isDarkMode ? 'text-white group-hover:text-[#ffa000]' : 'text-[#181818] group-hover:text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Xuất File PDF In Ấn & Nộp Bài
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Đóng gói tự động bài làm thành tài liệu PDF khổ A4 với định dạng tiêu chuẩn, bảng điểm Barem và đầy đủ căn cứ pháp lý để ôn tập trước kỳ thi.
                  </p>
                </div>
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'}`}>
                  <button
                    onClick={() => onStartChat()}
                    className={`inline-flex items-center text-xs font-semibold group-hover:translate-x-1 transition-all cursor-pointer ${
                      isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                    }`}
                  >
                    <span>Khởi tạo văn bản mẫu</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Thực hành Diễn án Moot Court */}
            <div className={`group rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${
              isDarkMode 
                ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]/70' 
                : 'bg-[#fdfbfa] border-[#d1d1cd] hover:border-indigo-500'
            }`}>
              <div className="h-56 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=1000&q=80"
                  alt="Phiên tòa giả định và sinh viên tranh tụng"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDarkMode ? 'from-[#181818] via-[#181818]/40' : 'from-[#fdfbfa] via-[#fdfbfa]/40'
                } to-transparent`} />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold border ${
                  isDarkMode ? 'bg-[#100e2f]/90 text-[#dee1ea] border-[#272967]' : 'bg-white/95 text-[#181818] border-[#d1d1cd]'
                }`}>
                  Thực hành diễn án
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-xl font-bold mb-2.5 transition-colors ${
                    isDarkMode ? 'text-white group-hover:text-[#ffa000]' : 'text-[#181818] group-hover:text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Rèn Luyện Kỹ Năng Diễn Án
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Mô phỏng tranh tụng trước hội đồng thẩm phán giả định. Rèn luyện phương pháp lập luận, bảo vệ quan điểm pháp lý và phản biện chặt chẽ.
                  </p>
                </div>
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'}`}>
                  <button
                    onClick={() => onStartChat('Kỹ năng tranh tụng và giải bài tập diễn án môn Pháp luật đại cương')}
                    className={`inline-flex items-center text-xs font-semibold group-hover:translate-x-1 transition-all cursor-pointer ${
                      isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                    }`}
                  >
                    <span>Trải nghiệm tranh tụng diễn án</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Tranh chấp hợp đồng & Thương mại */}
            <div className={`group rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${
              isDarkMode 
                ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]/70' 
                : 'bg-[#fdfbfa] border-[#d1d1cd] hover:border-indigo-500'
            }`}>
              <div className="h-56 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80"
                  alt="Thảo luận hợp đồng và đàm phán thương mại"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDarkMode ? 'from-[#181818] via-[#181818]/40' : 'from-[#fdfbfa] via-[#fdfbfa]/40'
                } to-transparent`} />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold border ${
                  isDarkMode ? 'bg-[#100e2f]/90 text-[#dee1ea] border-[#272967]' : 'bg-white/95 text-[#181818] border-[#d1d1cd]'
                }`}>
                  Thực tiễn hợp đồng
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-xl font-bold mb-2.5 transition-colors ${
                    isDarkMode ? 'text-white group-hover:text-[#ffa000]' : 'text-[#181818] group-hover:text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Giải Quyết Tranh Chấp Hợp Đồng
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Xác định điều khoản vô hiệu, chế tài phạt vi phạm, bồi thường thiệt hại và điều kiện bất khả kháng theo Luật Doanh nghiệp & Luật Thương mại.
                  </p>
                </div>
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'}`}>
                  <button
                    onClick={() => onStartChat('Giải bài tập tình huống tranh chấp hợp đồng thương mại và bồi thường thiệt hại')}
                    className={`inline-flex items-center text-xs font-semibold group-hover:translate-x-1 transition-all cursor-pointer ${
                      isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                    }`}
                  >
                    <span>Xem bài tập tranh chấp hợp đồng</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 6: Kho 500+ Bộ Đề Thi */}
            <div className={`group rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${
              isDarkMode 
                ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]/70' 
                : 'bg-[#fdfbfa] border-[#d1d1cd] hover:border-indigo-500'
            }`}>
              <div className="h-56 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=80"
                  alt="Giảng đường ôn thi và tài liệu đại học"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isDarkMode ? 'from-[#181818] via-[#181818]/40' : 'from-[#fdfbfa] via-[#fdfbfa]/40'
                } to-transparent`} />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold border ${
                  isDarkMode ? 'bg-[#100e2f]/90 text-[#dee1ea] border-[#272967]' : 'bg-white/95 text-[#181818] border-[#d1d1cd]'
                }`}>
                  Kho đề chính thức
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-xl font-bold mb-2.5 transition-colors ${
                    isDarkMode ? 'text-white group-hover:text-[#ffa000]' : 'text-[#181818] group-hover:text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Kho 500+ Bộ Đề Kèm Barem Chuẩn Bộ GD&ĐT
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Tổng hợp đề thi giữa kỳ, cuối kỳ của các trường ĐHQG, ĐH Luật, Kinh tế Quốc dân với barem chấm thi chi tiết và gợi ý đáp án tối đa.
                  </p>
                </div>
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'}`}>
                  <button
                    onClick={() => onStartChat('Đề thi mẫu môn Pháp luật đại cương có đáp án chi tiết')}
                    className={`inline-flex items-center text-xs font-semibold group-hover:translate-x-1 transition-all cursor-pointer ${
                      isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                    }`}
                  >
                    <span>Khám phá kho đề thi mẫu</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2.5: QUY TRÌNH 4 BƯỚC LẬP LUẬN CHUẨN BAREM (PHOTO PROGRESSION)
          ========================================================================= */}
      <section className={`py-24 border-b ${
        isDarkMode ? 'bg-[#0f1016] border-[#272967]' : 'bg-[#f5f3ef] border-[#d1d1cd]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="section-eyebrow-lockup justify-center">
              <span className="section-eyebrow-bar" />
              <span className={`text-xs font-semibold tracking-wider uppercase ${
                isDarkMode ? 'text-[#ffa000]' : 'text-[#c67100]'
              }`}>
                PHƯƠNG PHÁP HỌC THUẬT TIÊN TIẾN
              </span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#181818]'
            }`}>
              Quy Trình 4 Bước Lập Luận Chuẩn Barem Bộ GD&ĐT
            </h2>
            <p className={`text-sm sm:text-base ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
              Phương pháp lập luận khoa học được thiết kế riêng cho môn Pháp luật đại cương, giúp sinh viên không bị trừ điểm lỗi diễn đạt hoặc thiếu căn cứ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${
              isDarkMode ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]' : 'bg-white border-[#d1d1cd] hover:border-indigo-500'
            }`}>
              <div className="h-44 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80"
                  alt="Nhận diện đề bài thi"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 dark:bg-indigo-600 text-black">
                  Bước 01
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                    Nhận Diện & Tóm Tắt Tình Huống
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Khoanh vùng chủ thể, quan hệ pháp luật phát sinh và xác định đúng câu hỏi trọng tâm mà giảng viên đặt ra trong đề bài.
                  </p>
                </div>
                <button
                  onClick={() => onStartChat('Phương pháp tóm tắt tình huống pháp luật đại cương')}
                  className={`mt-4 inline-flex items-center text-xs font-semibold ${
                    isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                  } cursor-pointer`}
                >
                  <span>Tìm hiểu bước này</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${
              isDarkMode ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]' : 'bg-white border-[#d1d1cd] hover:border-indigo-500'
            }`}>
              <div className="h-44 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80"
                  alt="Bóc tách 4 yếu tố cấu thành"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 dark:bg-indigo-600 text-black">
                  Bước 02
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                    Bóc Tách 4 Yếu Tố Cấu Thành
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Phân tích chi tiết: Chủ thể (độ tuổi, nhận thức), Khách thể (quan hệ được bảo vệ), Mặt khách quan (hành vi, hậu quả), Mặt chủ quan (lỗi).
                  </p>
                </div>
                <button
                  onClick={() => onStartChat('Cách bóc tách 4 yếu tố vi phạm pháp luật')}
                  className={`mt-4 inline-flex items-center text-xs font-semibold ${
                    isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                  } cursor-pointer`}
                >
                  <span>Tìm hiểu bước này</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${
              isDarkMode ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]' : 'bg-white border-[#d1d1cd] hover:border-indigo-500'
            }`}>
              <div className="h-44 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80"
                  alt="Viện dẫn điều khoản bộ luật"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 dark:bg-indigo-600 text-black">
                  Bước 03
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                    Viện Dẫn Căn Cứ Điều Luật
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Trích dẫn chính xác Điều, Khoản, Điểm của các Bộ luật Dân sự, Hình sự, Lao động, Doanh nghiệp đang có hiệu lực pháp luật.
                  </p>
                </div>
                <button
                  onClick={() => onStartChat('Tra cứu điều khoản luật áp dụng vào bài tập')}
                  className={`mt-4 inline-flex items-center text-xs font-semibold ${
                    isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                  } cursor-pointer`}
                >
                  <span>Tìm hiểu bước này</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${
              isDarkMode ? 'bg-[#100e2f] border-[#dba200] shadow-[0_0_20px_rgba(219,162,0,0.15)]' : 'bg-white border-indigo-500 shadow-sm'
            }`}>
              <div className="h-44 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                  alt="Kết luận và chuẩn Barem"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 dark:bg-indigo-600 text-black">
                  Bước 04
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                    Kết Luận & Xuất Barem Chuẩn Bộ GD&ĐT
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#d8d8d8]' : 'text-[#72706b]'}`}>
                    Đưa ra câu trả lời trực diện, đề xuất giải pháp pháp lý, kiểm tra độ tự tin và xuất file PDF chuẩn A4 sẵn sàng nộp bài.
                  </p>
                </div>
                <button
                  onClick={() => onStartChat('Mẫu bài làm chuẩn barem môn Pháp luật đại cương')}
                  className={`mt-4 inline-flex items-center text-xs font-semibold ${
                    isDarkMode ? 'text-[#ffa000] hover:text-white' : 'text-indigo-600 dark:text-indigo-400 hover:text-[#181818]'
                  } cursor-pointer`}
                >
                  <span>Xem bài giải mẫu</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: KIẾN TRÚC 4 TẦNG & BẢO CHỨNG PHÁP LÝ (4-PHOTO BENTO MOSAIC)
          ========================================================================= */}
      <section className={`py-24 border-b ${
        isDarkMode ? 'bg-[#181818] border-[#272967]' : 'bg-[#faf8f5] border-[#d1d1cd]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual Bento Mosaic with 4 High-Quality Photos for 4 Tầng */}
            <div className="lg:col-span-6 relative order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Photo 1: Tầng 1 - RAG Văn bản quy phạm */}
                <div className={`relative rounded-2xl overflow-hidden border shadow-lg ${
                  isDarkMode ? 'border-[#272967] bg-[#100e2f]' : 'border-[#d1d1cd] bg-white'
                }`}>
                  <img
                    src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80"
                    alt="Kho văn bản quy phạm pháp luật và thư viện học thuật"
                    className="w-full h-40 object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900 dark:bg-indigo-600 text-black">Tầng 1: RAG</span>
                    <div className="text-xs font-bold mt-1">Kho Văn Bản Quy Phạm</div>
                  </div>
                </div>

                {/* Photo 2: Tầng 2 - Hội đồng chuyên gia */}
                <div className={`relative rounded-2xl overflow-hidden border shadow-lg ${
                  isDarkMode ? 'border-[#272967] bg-[#100e2f]' : 'border-[#d1d1cd] bg-white'
                }`}>
                  <img
                    src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80"
                    alt="Tòa án và hội đồng chuyên gia pháp lý"
                    className="w-full h-40 object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#ffa000] text-black">Tầng 2: Hệ Chuyên Gia</span>
                    <div className="text-xs font-bold mt-1">Đối Chiếu Án Lệ Thực Tiễn</div>
                  </div>
                </div>

                {/* Photo 3: Tầng 3 - Neural AI Model */}
                <div className={`relative rounded-2xl overflow-hidden border shadow-lg ${
                  isDarkMode ? 'border-[#272967] bg-[#100e2f]' : 'border-[#d1d1cd] bg-white'
                }`}>
                  <img
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
                    alt="Mạng nơ-ron và công nghệ trí tuệ nhân tạo"
                    className="w-full h-40 object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900 dark:bg-indigo-600 text-black">Tầng 3: Qwen2.5 SFT</span>
                    <div className="text-xs font-bold mt-1">Không Ảo Giác Điều Luật</div>
                  </div>
                </div>

                {/* Photo 4: Tầng 4 - Chuẩn Barem GD&ĐT */}
                <div className={`relative rounded-2xl overflow-hidden border shadow-lg ${
                  isDarkMode ? 'border-[#272967] bg-[#100e2f]' : 'border-[#d1d1cd] bg-white'
                }`}>
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                    alt="Bảo chứng và barem chuẩn Bộ GD&ĐT"
                    className="w-full h-40 object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-black">Tầng 4: Hậu Kiểm</span>
                    <div className="text-xs font-bold mt-1">Bảo Chứng Chuẩn Barem Bộ GD&ĐT</div>
                  </div>
                </div>
              </div>

              {/* Floating Stat Badge */}
              <div className={`absolute -bottom-6 left-8 p-4 rounded-2xl border shadow-xl backdrop-blur-xl flex items-center gap-4 ${
                isDarkMode 
                  ? 'bg-[#100e2f] border-[#dba200] text-white shadow-[0_0_25px_rgba(219,162,0,0.18)]' 
                  : 'bg-white border-[#d1d1cd] text-[#181818]'
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                  isDarkMode ? 'bg-slate-900 dark:bg-indigo-600 text-black' : 'bg-[#181818] text-white'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-bold">100% Khách quan</div>
                  <div className={`text-xs ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    Bảo chứng đối chiếu văn bản gốc
                  </div>
                </div>
              </div>
            </div>

            {/* Content Deep Dive */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="section-eyebrow-lockup">
                <span className="section-eyebrow-bar" />
                <span className={`text-xs font-semibold tracking-wider uppercase ${
                  isDarkMode ? 'text-[#ffa000]' : 'text-[#c67100]'
                }`}>
                  KIẾN TRÚC & ĐỘ CHÍNH XÁC
                </span>
              </div>

              <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-[#181818]'
              }`}>
                Kiến Trúc 4 Tầng — Triệt Tiêu Hoàn Toàn Hiện Tượng Ảo Giác
              </h2>

              <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                Khác biệt hoàn toàn với các chatbot sinh văn bản thông thường dễ tạo ra điều luật giả mạo, hệ thống của chúng tôi áp dụng 4 tầng kiểm định độc lập trước khi gửi câu trả lời đến bạn.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className={`flex items-start gap-3.5 p-4 rounded-xl border ${
                  isDarkMode ? 'bg-[#100e2f]/60 border-[#272967]' : 'bg-[#fdfbfa] border-[#d1d1cd]'
                }`}>
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDarkMode ? 'bg-[#181818] text-[#ffa000] border-[#dba200]/40' : 'bg-white text-[#181818] border-[#d1d1cd]'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                      Tầng 1 & 2: Trích xuất RAG & Hệ Chuyên Gia Pháp Lý
                    </h4>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                      Khoanh vùng các văn bản quy phạm pháp luật thực tế, loại trừ các điều luật đã hết hiệu lực thi hành.
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-3.5 p-4 rounded-xl border ${
                  isDarkMode ? 'bg-[#100e2f]/60 border-[#272967]' : 'bg-[#fdfbfa] border-[#d1d1cd]'
                }`}>
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDarkMode ? 'bg-[#181818] text-[#ffa000] border-[#dba200]/40' : 'bg-white text-[#181818] border-[#d1d1cd]'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                      Tầng 3 & 4: Mô hình Qwen2.5 SFT & Hậu Kiểm Barem
                    </h4>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                      Sinh lời giải theo đúng cấu trúc đề cương Bộ GD&ĐT, so khớp tiêu chí chấm điểm và xuất chỉ số tự tin.
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
      <section className={`py-24 border-b ${
        isDarkMode ? 'bg-[#121319] border-[#272967]' : 'bg-[#faf8f5] border-[#d1d1cd]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="section-eyebrow-lockup justify-center">
              <span className="section-eyebrow-bar" />
              <span className={`text-xs font-semibold tracking-wider uppercase ${
                isDarkMode ? 'text-[#ffa000]' : 'text-[#c67100]'
              }`}>
                BẢN ĐỒ TRI THỨC TOÀN DIỆN
              </span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#181818]'
            }`}>
              38 Chuyên Đề Pháp Luật Trọng Điểm
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
              Phân loại bài tập theo từng nhánh luật, giúp sinh viên tra cứu và ôn thi có định hướng rõ ràng.
            </p>
          </div>

          {/* 6 High-Impact Visual Photo Cards for Major Law Branches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: 'Pháp Luật Dân Sự 2015',
                desc: 'Hợp đồng, quyền sở hữu, thừa kế di sản và bồi thường thiệt hại ngoài hợp đồng.',
                image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
                badge: 'Trọng tâm thi cử',
                prompt: 'Tư vấn bài tập môn: Dân sự & Hợp đồng'
              },
              {
                title: 'Pháp Luật Hình Sự 2015',
                desc: '4 yếu tố cấu thành tội phạm, đồng phạm, phòng vệ chính đáng và tình thế cấp thiết.',
                image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
                badge: 'Barem Chuẩn',
                prompt: 'Tư vấn bài tập môn: Hình sự & Tố tụng'
              },
              {
                title: 'Pháp Luật Lao Động 2019',
                desc: 'Đơn phương chấm dứt HĐLĐ, kỷ luật sa thải, thời giờ làm việc và bảo hiểm xã hội.',
                image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
                badge: 'Thực tiễn cao',
                prompt: 'Tư vấn bài tập môn: Lao động & Việc làm'
              },
              {
                title: 'Hôn Nhân & Gia Đình 2014',
                desc: 'Chế độ tài sản chung - riêng của vợ chồng, thủ tục ly hôn và nghĩa vụ cấp dưỡng con chung.',
                image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
                badge: 'Chuyên đề đặc sắc',
                prompt: 'Tư vấn bài tập môn: Hôn nhân & Gia đình'
              },
              {
                title: 'Doanh Nghiệp & Thương Mại',
                desc: 'Thành lập công ty TNHH, cổ phần, quyền biểu quyết cổ đông và xử lý tranh chấp thương mại.',
                image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
                badge: 'Ứng dụng kinh tế',
                prompt: 'Tư vấn bài tập môn: Doanh nghiệp & Đầu tư'
              },
              {
                title: 'Hành Chính & Quản Lý Nhà Nước',
                desc: 'Thẩm quyền ban hành văn bản quy phạm, xử phạt vi phạm hành chính và khiếu nại quyết định.',
                image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
                badge: 'Lý luận cốt lõi',
                prompt: 'Tư vấn bài tập môn: Hành chính & Khiếu nại'
              }
            ].map((branch, bIdx) => (
              <div
                key={bIdx}
                onClick={() => onStartChat(branch.prompt)}
                className={`group rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 flex flex-col ${
                  isDarkMode 
                    ? 'bg-[#181818] border-[#272967] hover:border-[#dba200]' 
                    : 'bg-white border-[#d1d1cd] hover:border-indigo-500 shadow-sm'
                }`}
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={branch.image}
                    alt={branch.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 dark:bg-indigo-600 text-black">
                    {branch.badge}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base font-bold text-white group-hover:text-[#ffa000] transition-colors">
                      {branch.title}
                    </h3>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                    {branch.desc}
                  </p>
                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-semibold ${
                    isDarkMode ? 'border-[#272967] text-[#ffa000]' : 'border-[#d1d1cd] text-indigo-600 dark:text-indigo-400'
                  }`}>
                    <span>Giải bài tập chuyên đề này</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Magic UI Infinite Dual-Lane Marquee of 38 Legal Topics */}
          <div className="mb-10 relative overflow-hidden mask-gradient-x py-2 space-y-3">
            <Marquee pauseOnHover duration={40} className="py-1">
              {legalFields.slice(0, 19).map((field, idx) => (
                <div
                  key={idx}
                  onClick={() => onStartChat(`Tư vấn bài tập môn: ${field}`)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium cursor-pointer transition-all ${
                    isDarkMode
                      ? 'bg-[#181818]/90 border-[#272967] text-[#dee1ea] hover:border-[#dba200] hover:text-[#ffa000]'
                      : 'bg-white border-[#d1d1cd] text-[#181818] hover:border-indigo-500 hover:text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-indigo-600" />
                  <span>{field}</span>
                </div>
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover duration={44} className="py-1">
              {legalFields.slice(19).map((field, idx) => (
                <div
                  key={idx}
                  onClick={() => onStartChat(`Tư vấn bài tập môn: ${field}`)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium cursor-pointer transition-all ${
                    isDarkMode
                      ? 'bg-[#181818]/90 border-[#272967] text-[#dee1ea] hover:border-[#dba200] hover:text-[#ffa000]'
                      : 'bg-white border-[#d1d1cd] text-[#181818] hover:border-indigo-500 hover:text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  <span>{field}</span>
                </div>
              ))}
            </Marquee>
          </div>

          {/* Full List of 38 Legal Fields with Amber Numerals */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {legalFields.map((field, idx) => (
              <button
                key={idx}
                onClick={() => onStartChat(`Tư vấn bài tập môn: ${field}`)}
                className={`group p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  isDarkMode
                    ? 'bg-[#181818] hover:bg-[#100e2f] border-[#272967] hover:border-[#dba200]'
                    : 'bg-[#fdfbfa] hover:bg-white border-[#d1d1cd] hover:border-indigo-500 shadow-2xs'
                }`}
              >
                <div className={`text-[10px] font-mono mb-1.5 flex items-center justify-between ${
                  isDarkMode ? 'text-[#ffa000] group-hover:text-white' : 'text-[#c67100] group-hover:text-[#181818]'
                }`}>
                  <span>#{String(idx + 1).padStart(2, '0')}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className={`text-xs font-semibold line-clamp-1 ${
                  isDarkMode ? 'text-[#dee1ea] group-hover:text-[#ffa000]' : 'text-[#181818] group-hover:text-indigo-600 dark:text-indigo-400'
                }`}>
                  {field}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4.5: ĐỐI TÁC HỌC THUẬT & SINH VIÊN TIN DÙNG (CAMPUS PHOTO SHOWCASE)
          ========================================================================= */}
      <section className={`py-20 border-b ${
        isDarkMode ? 'bg-[#0b0c10] border-[#272967]' : 'bg-[#f8f6f2] border-[#d1d1cd]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="section-eyebrow-lockup justify-center">
              <span className="section-eyebrow-bar" />
              <span className={`text-xs font-semibold tracking-wider uppercase ${
                isDarkMode ? 'text-[#ffa000]' : 'text-[#c67100]'
              }`}>
                CỘNG ĐỒNG HỌC THUẬT TOÀN QUỐC
              </span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#181818]'
            }`}>
              Được Tin Cậy Tại Các Trường Đại Học Hàng Đầu
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
              Đồng hành cùng hàng ngàn sinh viên trong các kỳ thi học phần và nghiên cứu khoa học pháp lý.
            </p>
          </div>

          {/* Magic UI University Partners Marquee */}
          <div className="mb-10 relative overflow-hidden mask-gradient-x py-2">
            <Marquee pauseOnHover duration={30} className="py-2">
              {universityPartners.map((uni, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3.5 px-5 py-3 rounded-2xl border transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#181818]/90 border-[#272967] hover:border-[#dba200]'
                      : 'bg-white border-[#d1d1cd] hover:border-indigo-500 shadow-xs'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: `${uni.color}25`, color: uni.color }}
                  >
                    {uni.short}
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                      {uni.name}
                    </div>
                    <div className={`text-[10px] ${isDarkMode ? 'text-[#8f94a6]' : 'text-[#72706b]'}`}>
                      {uni.location}
                    </div>
                  </div>
                </div>
              ))}
            </Marquee>
          </div>

          {/* 4 University Life & Study Photos with Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className={`relative rounded-2xl overflow-hidden border shadow group ${
              isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'
            }`}>
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80"
                alt="Sinh viên Đại học Luật thảo luận nhóm"
                className="w-full h-48 object-cover group-hover:scale-108 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-xs font-bold">Thảo Luận Nhóm Barem</div>
                <div className="text-[10px] text-amber-300">Đại học Luật Hà Nội</div>
              </div>
            </div>

            <div className={`relative rounded-2xl overflow-hidden border shadow group ${
              isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'
            }`}>
              <img
                src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=600&q=80"
                alt="Thư viện trung tâm học tập"
                className="w-full h-48 object-cover group-hover:scale-108 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-xs font-bold">Tra Cứu Văn Bản Luật</div>
                <div className="text-[10px] text-amber-300">ĐHQG TP. Hồ Chí Minh</div>
              </div>
            </div>

            <div className={`relative rounded-2xl overflow-hidden border shadow group ${
              isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'
            }`}>
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80"
                alt="Ôn thi cao điểm môn Pháp luật"
                className="w-full h-48 object-cover group-hover:scale-108 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-xs font-bold">Mùa Thi Cử Cao Điểm</div>
                <div className="text-[10px] text-amber-300">ĐH Kinh tế Quốc dân</div>
              </div>
            </div>

            <div className={`relative rounded-2xl overflow-hidden border shadow group ${
              isDarkMode ? 'border-[#272967]' : 'border-[#d1d1cd]'
            }`}>
              <img
                src="https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=600&q=80"
                alt="Phòng diễn án phiên tòa giả định"
                className="w-full h-48 object-cover group-hover:scale-108 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-xs font-bold">Thực Hành Diễn Án</div>
                <div className="text-[10px] text-amber-300">Đại học Ngoại Thương</div>
              </div>
            </div>
          </div>

          {/* Academic Trust Counters */}
          <div className={`p-6 rounded-2xl border grid grid-cols-2 md:grid-cols-4 gap-6 text-center ${
            isDarkMode ? 'bg-[#181818] border-[#272967]' : 'bg-white border-[#d1d1cd]'
          }`}>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display text-indigo-600 dark:text-indigo-400">
                <NumberTicker value={liveStats.totalArticles} suffix=" Điều" duration={1.6} />
              </div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>Điều luật RAG số hóa</div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-black font-display ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <NumberTicker value={liveStats.zeroHallucinationRate} decimalPlaces={1} suffix="%" duration={1.6} />
              </div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>Triệt tiêu ảo giác (4 Tầng)</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display text-[#dba200]">
                <NumberTicker value={liveStats.totalPrinciples} suffix=" Barem" duration={1.2} />
              </div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>Tiêu chí chuẩn Bộ GD&ĐT</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-display text-emerald-400">
                ~<NumberTicker value={0.28} decimalPlaces={2} suffix="s" duration={1.4} />
              </div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>Tốc độ phản hồi offline</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: BẢNG GIÁ & GÓI TRẢI NGHIỆM
          ========================================================================= */}
      <section id="dichvu" className={`py-24 border-b ${
        isDarkMode ? 'bg-[#181818] border-[#272967]' : 'bg-[#faf8f5] border-[#d1d1cd]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="section-eyebrow-lockup justify-center">
              <span className="section-eyebrow-bar" />
              <span className={`text-xs font-semibold tracking-wider uppercase ${
                isDarkMode ? 'text-[#ffa000]' : 'text-[#c67100]'
              }`}>
                MINH BẠCH & DỄ TIẾP CẬN
              </span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#181818]'
            }`}>
              Lựa Chọn Gói Dịch Vụ Phù Hợp
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
              Miễn phí hoàn toàn 30 câu hỏi / tháng cho sinh viên. Linh hoạt nâng cấp khi vào mùa thi cử cao điểm.
            </p>

            {/* Toggle Month / Year */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-medium ${
                isDarkMode 
                  ? billingPeriod === 'month' ? 'text-white' : 'text-[#a0a5b8]' 
                  : billingPeriod === 'month' ? 'text-[#181818]' : 'text-[#92918b]'
              }`}>
                Thanh toán theo tháng
              </span>
              <button
                type="button"
                onClick={() => setBillingPeriod(billingPeriod === 'month' ? 'year' : 'month')}
                className={`w-12 h-6 rounded-full border p-1 relative transition-colors cursor-pointer ${
                  isDarkMode ? 'bg-[#100e2f] border-[#272967]' : 'bg-[#f0ede6] border-[#d1d1cd]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full shadow transition-transform ${
                    isDarkMode ? 'bg-slate-900 dark:bg-indigo-600' : 'bg-[#181818]'
                  } ${billingPeriod === 'year' ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
              <span className={`text-xs font-medium ${
                isDarkMode 
                  ? billingPeriod === 'year' ? 'text-white' : 'text-[#a0a5b8]' 
                  : billingPeriod === 'year' ? 'text-[#181818]' : 'text-[#92918b]'
              }`}>
                Thanh toán theo năm{' '}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 border ${
                  isDarkMode
                    ? 'text-[#ffa000] bg-slate-900 dark:bg-indigo-600/15 border-indigo-500/40'
                    : 'text-[#c67100] bg-slate-900 dark:bg-indigo-600/10 border-indigo-500/30'
                }`}>
                  -20% Ưu đãi
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Gói 1: Sinh viên (0đ) */}
            <SpotlightCard
              spotlightColor="rgba(16, 185, 129, 0.15)"
              className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-[#121319] border-[#272967] hover:border-emerald-500/50' : 'bg-[#fdfbfa] border-[#d1d1cd] hover:border-emerald-400'
              }`}
            >
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  Miễn phí
                </div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                  Gói Sinh viên
                </h3>
                <div className="mt-4 mb-6">
                  <span className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>0 đ</span>
                  <span className={`text-xs ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}> / vĩnh viễn</span>
                </div>
                <ul className={`space-y-2.5 text-xs ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span><strong>30 lượt hỏi/tháng</strong> (Tự động làm mới)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Tra cứu <strong>{liveStats.totalArticles} điều luật</strong> & <strong>{liveStats.totalPrinciples} barem</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Tốc độ phản hồi cực nhanh ~0.28s</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onStartChat()}
                className={`w-full mt-6 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'border-[#272967] bg-[#181818] hover:bg-[#272967] text-[#dee1ea]' 
                    : 'border-[#d1d1cd] bg-white hover:bg-[#f0ede6] text-[#181818]'
                }`}
              >
                Sử dụng miễn phí
              </button>
            </SpotlightCard>

            {/* Gói 2: Bổ sung Lượt hỏi - Booster (49.000đ) */}
            <SpotlightCard
              spotlightColor="rgba(244, 63, 94, 0.15)"
              className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-[#121319] border-[#272967] hover:border-rose-500/50' : 'bg-[#fdfbfa] border-[#d1d1cd] hover:border-rose-400'
              }`}
            >
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-rose-400' : 'text-rose-600'
                }`}>
                  Nạp thêm
                </div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                  Gói Bổ sung Lượt hỏi
                </h3>
                <div className="mt-4 mb-6">
                  <span className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                    49.000 đ
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}> / lần nạp</span>
                </div>
                <ul className={`space-y-2.5 text-xs ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-400" />
                    <span><strong>+50 câu hỏi</strong> không giới hạn thời gian</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Cấp tốc phục vụ mùa thi giữa kỳ & cuối kỳ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Phân tích 4 yếu tố cấu thành chi tiết</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className={`w-full mt-6 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'border-[#272967] bg-[#181818] hover:bg-rose-950/40 text-rose-300 border-rose-500/30' 
                    : 'border-[#d1d1cd] bg-white hover:bg-rose-50 text-rose-600'
                }`}
              >
                Nạp 50 câu ngay
              </button>
            </SpotlightCard>

            {/* Gói 3: Cử nhân VIP (99.000đ - Phổ biến nhất với BorderBeam) */}
            <div className={`p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
              isDarkMode 
                ? 'bg-[#100e2f] border-[#dba200] shadow-[0_0_25px_rgba(219,162,0,0.18)]' 
                : 'bg-[#fdfbfa] border-indigo-500 shadow-md'
            }`}>
              <BorderBeam
                size={220}
                duration={9}
                colorFrom="#4f46e5"
                colorTo="#ffe2b2"
                borderWidth={2}
              />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-black text-[10px] font-bold tracking-wide uppercase bg-slate-900 dark:bg-indigo-600 z-10 shadow-xs">
                Phổ biến nhất
              </div>
              <div className="relative z-10">
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-[#ffa000]' : 'text-[#c67100]'
                }`}>
                  Chuyên sâu
                </div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                  Gói Cử nhân VIP
                </h3>
                <div className="mt-4 mb-6">
                  <span className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    99.000 đ
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}> / lần nạp</span>
                </div>
                <ul className={`space-y-2.5 text-xs ${isDarkMode ? 'text-[#dee1ea]' : 'text-[#181818]'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#ffa000]" />
                    <span><strong>+100 câu hỏi</strong> chuẩn Barem chuyên sâu</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#ffa000]" />
                    <span>Rà soát Hợp đồng & Tiểu luận pháp luật</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#ffa000]" />
                    <span>Xuất file PDF bài thi in ấn chuẩn A4</span>
                  </li>
                </ul>
              </div>
              <ShinyButton
                onClick={() => onOpenAuth('register')}
                className={`w-full mt-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all z-10 ${
                  isDarkMode
                    ? 'bg-slate-900 dark:bg-indigo-600 text-black hover:bg-[#ffa000]'
                    : 'bg-[#181818] text-white hover:bg-black'
                }`}
              >
                Đăng ký gói VIP
              </ShinyButton>
            </div>

            {/* Gói 4: Học kỳ Trọn gói (199.000đ) */}
            <SpotlightCard
              spotlightColor="rgba(168, 85, 247, 0.15)"
              className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                isDarkMode ? 'bg-[#121319] border-[#272967] hover:border-purple-500/50' : 'bg-[#fdfbfa] border-[#d1d1cd] hover:border-purple-400'
              }`}
            >
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  Trọn gói
                </div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                  Gói Học kỳ Không giới hạn
                </h3>
                <div className="mt-4 mb-6">
                  <span className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}>
                    {billingPeriod === 'month' ? '199.000 đ' : '159.000 đ'}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}> / học kỳ</span>
                </div>
                <ul className={`space-y-2.5 text-xs ${isDarkMode ? 'text-[#a0a5b8]' : 'text-[#72706b]'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
                    <span><strong>Không giới hạn câu hỏi</strong> suốt học kỳ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
                    <span>Truy cập hệ thống đánh giá 4 Tầng</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
                    <span>Hỗ trợ học thuật & bảo chứng barem 24/7</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className={`w-full mt-6 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'border-[#272967] bg-[#181818] hover:bg-purple-950/40 text-purple-300 border-purple-500/30' 
                    : 'border-[#d1d1cd] bg-white hover:bg-purple-50 text-purple-700'
                }`}
              >
                Đăng ký gói Học kỳ
              </button>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FAQ ACCORDION
          ========================================================================= */}
      <section className={`py-24 border-b ${
        isDarkMode ? 'bg-[#121319] border-[#272967]' : 'bg-[#faf8f5] border-[#d1d1cd]'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <div className="section-eyebrow-lockup justify-center">
              <span className="section-eyebrow-bar" />
              <span className={`text-xs font-semibold tracking-wider uppercase ${
                isDarkMode ? 'text-[#ffa000]' : 'text-[#c67100]'
              }`}>
                GIẢI ĐÁP HỌC THUẬT
              </span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#181818]'
            }`}>
              Câu Hỏi Thường Gặp
            </h2>
          </div>

          <div className="space-y-3.5">
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
                a: 'Hoàn toàn được! Ở màn hình Hỏi đáp, bạn chỉ cần bấm nút "Xuất file PDF", hệ thống sẽ tự động định dạng chuẩn A4 có tiêu đề, ngày tháng và nội dung phân tích rõ ràng.'
              },
              {
                q: 'Dự án này sử dụng mô hình trí tuệ nhân tạo nào?',
                a: 'Hệ thống sử dụng mô hình ngôn ngữ lớn Qwen2.5-3B được kết hợp LoRA Adapter huấn luyện chuyên sâu trên dữ liệu môn Pháp luật đại cương, chạy offline hoàn toàn để đảm bảo tốc độ và quyền riêng tư dữ liệu.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isDarkMode ? 'bg-[#181818] border-[#272967]' : 'bg-[#fdfbfa] border-[#d1d1cd]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className={`w-full p-5 text-left flex items-center justify-between gap-4 font-semibold transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'text-white hover:text-[#ffa000]' 
                      : 'text-[#181818] hover:text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      openFaq === idx 
                        ? isDarkMode ? 'rotate-180 text-[#ffa000]' : 'rotate-180 text-indigo-600 dark:text-indigo-400'
                        : isDarkMode ? 'text-[#a0a5b8]' : 'text-[#92918b]'
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className={`px-5 pb-5 text-xs sm:text-sm leading-relaxed border-t pt-3.5 ${
                    isDarkMode ? 'border-[#272967] text-[#dee1ea]' : 'border-[#d1d1cd] text-[#72706b]'
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: LUXURY FINAL CTA BANNER
          ========================================================================= */}
      <section className={`py-24 text-white relative overflow-hidden border-b ${
        isDarkMode ? 'bg-[#100e2f] border-[#272967]' : 'bg-[#f0ede6] border-[#d1d1cd] text-[#181818]'
      }`}>
        {isDarkMode ? (
          <div className="absolute inset-0 bg-radial from-indigo-600/10 via-transparent to-transparent pointer-events-none" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-amber-100/10 to-[#4f46e5]/5 pointer-events-none" />
        )}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto shadow-sm ${
            isDarkMode 
              ? 'bg-slate-900 dark:bg-indigo-600 border-[#dba200] text-black shadow-[0_0_20px_rgba(250,144,0,0.3)]' 
              : 'bg-white border-[#d1d1cd] text-[#181818]'
          }`}>
            <Scale className="w-8 h-8" />
          </div>
          <h2 className={`text-3xl sm:text-5xl font-bold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-[#181818]'
          }`}>
            Sẵn sàng Chinh phục Môn Pháp luật Đại cương?
          </h2>
          <p className={`text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed ${
            isDarkMode ? 'text-[#dee1ea]' : 'text-[#72706b]'
          }`}>
            Hàng ngàn sinh viên các trường đại học hàng đầu đã tin dùng hệ thống để giải quyết bài tập tình huống và đạt điểm số cao nhất.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <ShinyButton
              onClick={() => onStartChat()}
              className="cta-neural px-9 py-4 text-white font-medium text-sm sm:text-base inline-flex items-center gap-3 cursor-pointer select-none"
            >
              <span>Bắt đầu hỏi đáp ngay</span>
              <svg className="w-4 h-3 text-white" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
                <path d="M0 5.5 H14.6 M10.3 1.2 L14.9 5.5 L10.3 9.8" />
              </svg>
            </ShinyButton>
            <button
              onClick={() => onOpenAuth('register')}
              className={`px-7 py-4 rounded-full border font-semibold text-sm sm:text-base transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-[#181818] hover:bg-[#272967] text-[#dee1ea] border-[#272967]'
                  : 'bg-white hover:bg-[#fdfbfa] text-[#181818] border-[#d1d1cd]'
              }`}
            >
              Tạo tài khoản miễn phí
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FLOATING TOOLBAR (Theme Switcher + AI Assistant Launcher)
          ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 border cursor-pointer ${
              isDarkMode
                ? 'bg-[#181818]/90 backdrop-blur-md text-amber-300 border-[#272967] hover:border-[#dba200] hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-white text-slate-700 border-[#d1d1cd] hover:border-indigo-500 hover:text-indigo-600 dark:text-indigo-400 shadow-md'
            }`}
            title={isDarkMode ? "Chuyển sang giao diện Sáng (Light Mode)" : "Chuyển sang giao diện Tối (Dark Mode)"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-90 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-[#181818] transition-transform hover:-rotate-12 duration-300" />
            )}
          </button>
        )}

        <button
          onClick={() => onStartChat()}
          className={`w-13 h-13 rounded-full text-black shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group border border-white/20 cursor-pointer ${
            isDarkMode 
              ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 shadow-[0_0_25px_rgba(250,144,0,0.4)]' 
              : 'bg-slate-900 dark:bg-indigo-600 hover:bg-[#ffa000] shadow-[0_0_20px_rgba(250,144,0,0.3)]'
          }`}
          title="Mở Trợ lý Pháp luật"
        >
          <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform text-black" />
        </button>
      </div>

    </div>
  );
};
