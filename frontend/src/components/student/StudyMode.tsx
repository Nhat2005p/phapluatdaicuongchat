import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Send,
  History,
  AlertCircle,
  Lock,
  Award,
  Plus,
  Mic,
  MicOff,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Printer,
  Scale,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  BookMarked,
  Bookmark,
  SquarePen,
  ArrowUp,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { QueryResponse, QueryHistoryItem } from '../../types';
import { Button } from '../ui/Button';
import { HistoryDrawer } from './HistoryDrawer';
import { CitationGuardrailBadge } from './CitationGuardrailBadge';
import { ChatHistorySidebar, ChatSession } from './ChatHistorySidebar';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  data?: QueryResponse;
}

export interface QuestionPromptItem {
  id: string;
  title: string;
  prompt: string;
  tag?: string;
}

export interface QuestionCategory {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  iconName: 'check-circle' | 'scale' | 'briefcase' | 'book-open' | 'sparkles';
  description: string;
  template: string;
  questions: QuestionPromptItem[];
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: 'NHAN_DINH',
    name: 'Nhận định (Đúng / Sai & Luận cứ)',
    shortName: 'Nhận định',
    badge: 'Đúng / Sai',
    iconName: 'check-circle',
    description: 'Dạng câu khẳng định đúng/sai và giải thích căn cứ lý luận theo chuẩn giáo trình.',
    template: 'Nhận định: "[Nhập câu nhận định]". Nhận định này Đúng hay Sai? Phân tích căn cứ pháp lý và giải thích cơ sở lý luận theo giáo trình Bộ GD&ĐT.',
    questions: [
      {
        id: 'ND_TRAI_PL',
        title: 'Mọi hành vi trái pháp luật đều là VPPL?',
        prompt: 'Nhận định: "Mọi hành vi trái pháp luật đều là vi phạm pháp luật." Đúng hay Sai? Giải thích cơ sở lý luận?',
        tag: 'Dạng 3'
      },
      {
        id: 'ND_NLPL_NLHV',
        title: 'NLPL và NLHV chấm dứt cùng thời điểm?',
        prompt: 'Nhận định: "Năng lực pháp luật và năng lực hành vi của cá nhân xuất hiện và chấm dứt cùng một thời điểm." Đúng hay Sai? Giải thích cơ sở lý luận?',
        tag: 'Dân sự'
      },
      {
        id: 'ND_18_TUOI',
        title: 'Đủ 18 tuổi luôn có NLHV đầy đủ?',
        prompt: 'Nhận định: "Người từ đủ 18 tuổi trở lên luôn có năng lực hành vi dân sự đầy đủ." Đúng hay Sai? Nêu căn cứ pháp lý và giải thích?',
        tag: 'Chủ thể'
      },
      {
        id: 'ND_QPPL_3_BO_PHAN',
        title: 'Mọi QPPL đều phải có đủ cả 3 bộ phận?',
        prompt: 'Nhận định: "Mọi quy phạm pháp luật đều bắt buộc phải có đầy đủ cả 3 bộ phận: Giả định, Quy định và Chế tài." Đúng hay Sai? Giải thích vì sao?',
        tag: 'Lý luận'
      }
    ]
  },
  {
    id: 'SO_SANH',
    name: 'So sánh & Phân biệt (ssánhmt)',
    shortName: 'So sánh',
    badge: 'So sánh',
    iconName: 'scale',
    description: 'Đối chiếu điểm giống và khác nhau, bảng tiêu chí so sánh giữa các chế định.',
    template: 'So sánh và phân biệt giữa [Khái niệm A] và [Khái niệm B]. Lập bảng tiêu chí so sánh (khái niệm, căn cứ pháp lý, đặc điểm, hệ quả pháp lý) và lấy ví dụ minh họa.',
    questions: [
      {
        id: 'SS_PHONG_VE_CAP_THIET',
        title: 'Phòng vệ chính đáng vs Tình thế cấp thiết',
        prompt: 'Phân biệt Phòng vệ chính đáng (Điều 22 BLHS 2015) và Tình thế cấp thiết (Điều 23 BLHS 2015). Lập bảng tiêu chí so sánh và cho ví dụ minh họa cụ thể.',
        tag: 'Hình sự'
      },
      {
        id: 'SS_NLPL_NLHV',
        title: 'Năng lực pháp luật vs Năng lực hành vi',
        prompt: 'So sánh Năng lực pháp luật dân sự và Năng lực hành vi dân sự của cá nhân theo Bộ luật Dân sự 2015. Lập bảng so sánh và phân tích mối quan hệ giữa chúng.',
        tag: 'Dân sự'
      },
      {
        id: 'SS_TOI_PHAM_HANH_CHINH',
        title: 'VPPL Hình sự (Tội phạm) vs VPPL Hành chính',
        prompt: 'Phân biệt Vi phạm pháp luật hình sự (Tội phạm) và Vi phạm pháp luật hành chính. Phân tích các tiêu chí: mức độ nguy hiểm, khách thể, chế tài áp dụng.',
        tag: 'Pháp luật'
      },
      {
        id: 'SS_VO_HIEU_TUYET_DOI_TUONG_DOI',
        title: 'Hợp đồng vô hiệu tuyệt đối vs vô hiệu tương đối',
        prompt: 'So sánh Hợp đồng dân sự vô hiệu tuyệt đối và Hợp đồng dân sự vô hiệu tương đối theo Bộ luật Dân sự 2015. Nêu căn cứ và hệ quả pháp lý.',
        tag: 'Hợp đồng'
      }
    ]
  },
  {
    id: 'TINH_HUONG',
    name: 'Bài tập Tình huống thực tế',
    shortName: 'Tình huống',
    badge: 'Tình huống',
    iconName: 'briefcase',
    description: 'Phân tích tình huống thực tế: Thừa kế, Hợp đồng vay mượn, Rơi vỡ tài sản, Tai nạn.',
    template: 'Tình huống: [Mô tả chi tiết sự việc thực tế]. Phân tích căn cứ pháp lý, xác định lỗi, quyền và nghĩa vụ các bên và đưa ra hướng giải quyết chi tiết theo chuẩn giáo trình.',
    questions: [
      {
        id: 'TH_THUA_KE_BA_B',
        title: 'Chia di sản thừa kế bà B (Tài sản 2 tỷ, di chúc anh Q)',
        prompt: 'Ông A và bà B kết hôn năm 1993 và sinh được 3 người con là C (sinh 1994), D (sinh 1999) và E (sinh 2001). Bà B có một người con nuôi tên là M (sinh 1990). Năm 2014 bà B chết, tài sản chung của A và B là 2 tỷ đồng. Hãy phân chia di sản thừa kế trong các trường hợp: a) Bà B không để lại di chúc; b) Bà B để lại di chúc toàn bộ tài sản cho anh ruột Q.',
        tag: 'Thừa kế'
      },
      {
        id: 'TH_VUOT_DEN_DO_DANH_NHAU',
        title: 'Va chạm xe & Đánh lại bằng ghế (4 yếu tố VPPL)',
        prompt: 'A điều khiển xe máy vượt đèn đỏ, va chạm với xe của B làm hư hỏng tài sản trị giá 4 triệu đồng. Sau va chạm, B tức giận dùng gậy đánh A. A bỏ chạy nhưng B tiếp tục đuổi theo để đánh. Trong lúc bị truy đuổi, A nhặt một chiếc ghế gần đó đánh lại B, khiến B bị thương. Phân tích trách nhiệm pháp lý của A và B.',
        tag: 'Dạng 2'
      },
      {
        id: 'TH_MUON_LAPTOP_ROI_VO',
        title: 'Mượn laptop làm rơi vỡ & Lỗi bồi thường',
        prompt: 'A mượn laptop của B rồi làm rơi vỡ. A cho rằng đây là tai nạn nên không cần bồi thường. Phân tích căn cứ phát sinh trách nhiệm bồi thường, lỗi, nghĩa vụ bảo quản tài sản và những dữ kiện cần xác minh.',
        tag: 'Dạng 5'
      },
      {
        id: 'TH_VAY_TIEN_VIET_TAY',
        title: 'Vay 100 triệu giấy viết tay không công chứng',
        prompt: 'A vay B số tiền 100 triệu đồng có giấy viết tay không công chứng. Đến hạn A không trả và cho rằng giấy viết tay không có giá trị pháp lý. Phân tích giá trị pháp lý của giấy vay và hướng giải quyết cho B.',
        tag: 'Dạng 4'
      }
    ]
  },
  {
    id: 'DINH_NGHIA',
    name: 'Khái niệm & Định nghĩa pháp lý',
    shortName: 'Định nghĩa',
    badge: 'Định nghĩa',
    iconName: 'book-open',
    description: 'Định nghĩa, dấu hiệu bản chất, điều kiện pháp lý của các khái niệm giáo trình.',
    template: 'Nêu định nghĩa [Thuật ngữ/Chế định]. Phân tích bản chất pháp lý, các dấu hiệu đặc trưng và ý nghĩa thực tiễn theo quy định pháp luật hiện hành.',
    questions: [
      {
        id: 'DN_QHPL_DAN_SU',
        title: 'Quan hệ PLDS là gì? Cơ cấu 3 bộ phận',
        prompt: 'Quan hệ pháp luật dân sự là gì? Phân tích cơ cấu của quan hệ pháp luật dân sự (lấy ví dụ minh họa).',
        tag: 'Dạng 1'
      },
      {
        id: 'DN_PHAP_NHAN_4_DK',
        title: 'Định nghĩa & 4 điều kiện công nhận Pháp nhân',
        prompt: 'Nêu định nghĩa và 4 điều kiện để một tổ chức được công nhận là Pháp nhân theo quy định tại Điều 74 Bộ luật Dân sự 2015. Phân tích ý nghĩa của từng điều kiện.',
        tag: 'Điều 74 BLDS'
      },
      {
        id: 'DN_QUY_PHAM_PL',
        title: 'Định nghĩa Quy phạm pháp luật & Đặc điểm',
        prompt: 'Quy phạm pháp luật là gì? Trình bày định nghĩa và phân tích các đặc điểm cơ bản của quy phạm pháp luật so với các quy phạm xã hội khác (đạo đức, tập quán).',
        tag: 'Lý luận chung'
      },
      {
        id: 'DN_NANG_LUC_CHU_THE',
        title: 'Khái niệm Năng lực chủ thể trong quan hệ pháp luật',
        prompt: 'Khái niệm Năng lực chủ thể của quan hệ pháp luật là gì? Phân tích mối liên hệ biện chứng giữa Năng lực pháp luật và Năng lực hành vi.',
        tag: 'Chủ thể PL'
      }
    ]
  },
  {
    id: 'PHAN_TICH',
    name: 'Phân tích Cấu trúc & Tác hại',
    shortName: 'Phân tích',
    badge: 'Phân tích',
    iconName: 'sparkles',
    description: 'Phân tích 4 yếu tố cấu thành VPPL, 3 bộ phận QPPL, 3 tác hại lớn của Tham nhũng.',
    template: 'Phân tích cơ cấu, các yếu tố cấu thành và tác động của [Chế định/Hành vi]. Trích dẫn căn cứ điều luật thực định cụ thể và liên hệ thực tiễn.',
    questions: [
      {
        id: 'PT_4_YEU_TO_VPPL',
        title: 'Phân tích 4 yếu tố cấu thành Vi phạm pháp luật',
        prompt: 'Phân tích 4 yếu tố cấu thành của Vi phạm pháp luật (Mặt khách quan, Mặt chủ quan, Chủ thể, Khách thể). Lấy ví dụ minh họa một vụ việc cụ thể.',
        tag: 'Cấu thành'
      },
      {
        id: 'PT_3_BO_PHAN_QPPL',
        title: 'Phân tích 3 bộ phận QPPL (Giả định, Quy định, Chế tài)',
        prompt: 'Phân tích cơ cấu 3 bộ phận của Quy phạm pháp luật (Giả định, Quy định, Chế tài). Trích dẫn một điều luật cụ thể trong Bộ luật Dân sự để làm rõ.',
        tag: 'Cơ cấu QPPL'
      },
      {
        id: 'PT_3_TAC_HAI_THAM_NHUNG',
        title: 'Phân tích 3 tác hại của Tham nhũng (Chính trị, Kinh tế, Xã hội)',
        prompt: 'Tham nhũng gây ra rất nhiều hậu quả nghiêm trọng trên tất cả các lĩnh vực của đời sống xã hội. Bằng kiến thức đã học anh (chị) hãy phân tích tác hại của tham nhũng? (Tác hại về chính trị, Tác hại về kinh tế, Tác hại về xã hội).',
        tag: 'Tham nhũng'
      },
      {
        id: 'PT_4_HINH_THUC_THUC_HIEN',
        title: '4 hình thức thực hiện pháp luật',
        prompt: 'Phân tích 4 hình thức thực hiện pháp luật: Tuân thủ pháp luật, Thi hành pháp luật, Sử dụng pháp luật và Áp dụng pháp luật. Lấy ví dụ thực tế cho từng hình thức.',
        tag: 'Thực hiện PL'
      }
    ]
  }
];

interface StudyModeProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({ initialQuery, onClearInitialQuery, onOpenAuth }) => {
  const { user, isAuthenticated, remainingQuestions, decrementQuota } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [openLawsMap, setOpenLawsMap] = useState<Record<string, boolean>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  const [isListening, setIsListening] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('NHAN_DINH');

  // Quản lý các đoạn chat trong phiên đăng nhập (Chat Sessions on Sidebar)
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Khóa lưu trữ cục bộ theo từng người dùng đăng nhập
  const storageKey = `vietlaw_chat_sessions_${user?.id || user?._id || 'guest'}`;

  // 1. Tải các phiên chat đã lưu từ localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      setSessions([]);
      setActiveSessionId(null);
      setHistory([]);
      setQuery('');
      setErrorMessage('');
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: ChatSession[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
          return;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc chat sessions từ localStorage:', e);
    }
  }, [isAuthenticated, user?.id, user?._id]);

  // 2. Tự động đồng bộ lịch sử từ Server thành các đoạn chat nếu chưa có session cục bộ
  useEffect(() => {
    if (sessions.length === 0 && history.length > 0) {
      const serverSessions: ChatSession[] = history.slice(0, 30).map((h) => ({
        id: 'sess_' + h._id,
        title: h.query.slice(0, 36) + (h.query.length > 36 ? '...' : ''),
        createdAt: new Date(h.createdAt).getTime(),
        updatedAt: new Date(h.createdAt).getTime(),
        messages: [
          {
            id: 'u_' + h._id,
            role: 'user',
            content: h.query,
            timestamp: new Date(h.createdAt).getTime()
          },
          {
            id: 'b_' + h._id,
            role: 'assistant',
            content: h.response,
            timestamp: new Date(h.createdAt).getTime() + 500,
            data: {
              success: true,
              intentCode: h.intentCode,
              response: h.response,
              citations: h.citations || [],
              guardrailMetrics: {
                verifiedCount: h.verifiedCitationsCount || 0,
                totalFound: h.citations?.length || 0,
                precisionRate: 100
              },
              retrievedArticles: [],
              latencyMs: h.latencyMs || 250
            }
          }
        ]
      }));

      setSessions(serverSessions);
      if (serverSessions.length > 0) {
        setActiveSessionId(serverSessions[0].id);
        setMessages(serverSessions[0].messages);
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(serverSessions));
      } catch (err) {
        // ignore
      }
    }
  }, [history, sessions.length]);

  // Chọn 1 đoạn chat từ thanh bên để xem lại toàn bộ nội dung
  const handleSelectSession = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (s) {
      setActiveSessionId(s.id);
      setMessages(s.messages);
      setErrorMessage('');
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }
  };

  // Tạo đoạn chat mới (Fresh new conversation)
  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setQuery('');
    setErrorMessage('');
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  // Xóa 1 đoạn chat khỏi danh sách thanh bên
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  };

  // Xóa toàn bộ lịch sử các đoạn chat
  const handleClearAllSessions = async () => {
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    try {
      await api.clearHistory();
      setHistory([]);
    } catch {}
  };

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selectedCategory = QUESTION_CATEGORIES.find((c) => c.id === selectedCategoryId);
  const activeCategory =
    QUESTION_CATEGORIES.find((c) => c.id === activeCategoryId) || QUESTION_CATEGORIES[0];

  const handleSelectQuestionOrTemplate = (text: string, categoryId: string) => {
    setQuery(text);
    setSelectedCategoryId(categoryId);
    setActiveCategoryId(categoryId);
    setIsDropdownOpen(false);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
      }
    }, 50);
  };

  const renderCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'check-circle':
        return <Check className={className} />;
      case 'scale':
        return <Scale className={className} />;
      case 'briefcase':
        return <FileText className={className} />;
      case 'book-open':
        return <BookOpen className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      default:
        return <Scale className={className} />;
    }
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initialQuery if passed
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
      onClearInitialQuery?.();
    }
  }, [initialQuery]);

  // Load history on mount or auth change
  const loadHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getHistory();
      if (res.success && res.history) {
        setHistory(res.history);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadHistory();
  }, [isAuthenticated]);

  // Send message handler
  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText !== undefined ? overrideText : query).trim();
    if (!textToSend || isLoading) return;

    if (!isAuthenticated) {
      onOpenAuth?.('login');
      return;
    }

    if (remainingQuestions <= 0) {
      setErrorMessage('Bạn đã sử dụng hết hạn mức câu hỏi miễn phí trong tháng. Vui lòng nâng cấp gói để tiếp tục.');
      return;
    }

    // Xác định ID phiên hiện tại hoặc tạo phiên mới
    let currentSessionId = activeSessionId;
    let isBrandNewSession = false;

    if (!currentSessionId) {
      currentSessionId = 'sess_' + Date.now();
      isBrandNewSession = true;
      setActiveSessionId(currentSessionId);
    }

    // 1. Thêm câu hỏi người dùng vào luồng chat ngay lập tức
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. LÀM TRỐNG Ô NHẬP LIỆU NGAY LẬP TỨC để người dùng nhập câu hỏi mới
    setQuery('');
    setErrorMessage('');
    setIsLoading(true);

    // Điều chỉnh lại chiều cao textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await api.solveQuery(textToSend);
      if (res.success) {
        const botMsg: ChatMessage = {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content: res.response,
          timestamp: Date.now(),
          data: res
        };

        // Cập nhật messages và tự động lưu vào session tương ứng
        setMessages((prev) => {
          const updatedMessages = [...prev, botMsg];

          setSessions((prevSessions) => {
            let updatedList: ChatSession[];
            if (isBrandNewSession) {
              const newSession: ChatSession = {
                id: currentSessionId!,
                title: textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : ''),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messages: updatedMessages
              };
              updatedList = [newSession, ...prevSessions.filter((s) => s.id !== currentSessionId)];
            } else {
              updatedList = prevSessions.map((s) =>
                s.id === currentSessionId
                  ? {
                      ...s,
                      updatedAt: Date.now(),
                      messages: updatedMessages
                    }
                  : s
              );
            }
            try {
              localStorage.setItem(storageKey, JSON.stringify(updatedList));
            } catch {}
            return updatedList;
          });

          return updatedMessages;
        });

        decrementQuota(res.remainingQuestions);
        loadHistory();
      } else {
        setErrorMessage(res.message || 'Không thể xử lý bài tập. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ backend.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  // Enter to send, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  // Copy message text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-to-speech read aloud
  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#|`-]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Regenerate last response
  const handleRegenerate = (msgIndex: number) => {
    // Find preceding user question
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        handleSend(messages[i].content);
        break;
      }
    }
  };

  // Speech Recognition (Voice input)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói trực tiếp.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Markdown Bold Parser
  const renderFormattedInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Markdown Formatter for Assistant Response
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
              {renderFormattedInline(line.replace('### ', ''))}
            </h3>
          );
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={idx} className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-1.5">
              {renderFormattedInline(line.replace('## ', ''))}
            </h2>
          );
        } else if (line.trim() === '---') {
          elements.push(<hr key={idx} className="my-4 border-slate-200" />);
        } else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          elements.push(
            <li key={idx} className="text-slate-800 ml-4 list-disc text-[14.5px] my-1 leading-relaxed">
              {renderFormattedInline(line.replace(/^[-•]\s*/, ''))}
            </li>
          );
        } else if (line.trim()) {
          elements.push(
            <p key={idx} className="text-slate-800 text-[14.5px] my-2 leading-relaxed">
              {renderFormattedInline(line)}
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
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-[#f8fafc] text-slate-900 relative">
      {/* 1. Thanh bên lịch sử đoạn chat trong 1 lần đăng nhập */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        isAuthenticated={isAuthenticated}
        remainingQuestions={remainingQuestions}
        userName={user?.fullName || user?.username || 'Sinh viên'}
        userRole={user?.role || 'student'}
      />

      {/* 2. Cột trò chuyện chính */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Floating Control Bar */}
        <div className="sticky top-0 z-20 bg-[#f8fafc]/90 backdrop-blur-md border-b border-slate-200/60 px-4 py-2.5 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {/* Nút Toggle mở/đóng thanh bên */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                title={isSidebarOpen ? 'Thu gọn thanh bên' : 'Mở lịch sử đoạn chat'}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shrink-0"
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-blue-600" />
                ) : (
                  <PanelLeft className="w-4 h-4 text-blue-600" />
                )}
                {!isSidebarOpen && (
                  <span className="hidden sm:inline">Lịch sử ({sessions.length})</span>
                )}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="gap-1.5 text-xs bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs rounded-lg shrink-0"
              >
                <SquarePen className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Đoạn chat mới</span>
              </Button>

              <span className="text-xs text-slate-400 hidden md:inline">•</span>
              <span className="text-xs text-slate-500 font-medium hidden md:inline truncate max-w-[240px]">
                {activeSessionId
                  ? sessions.find((s) => s.id === activeSessionId)?.title || 'Đoạn chat hiện tại'
                  : 'Đoạn chat mới'}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isAuthenticated && (
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Hạn mức:{' '}
                  <strong className={`font-bold ${remainingQuestions <= 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {remainingQuestions}
                  </strong>
                  /30 câu
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Conversation Stream */}
        <div className="flex-1 overflow-y-auto w-full px-4 py-6 space-y-6 pb-44">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Empty State: ChatGPT Greeting */}
            {messages.length === 0 && (
          <div className="py-12 md:py-16 text-center space-y-8 animate-fadeIn">
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
                <Scale className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Bạn muốn hỏi gì về Pháp luật đại cương? ⚖️
              </h2>
              <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                Nhập câu hỏi lý thuyết, nhận định đúng sai hoặc bài tập tình huống cần giải theo Barem chuẩn Bộ GD&ĐT nhé!
              </p>
            </div>

            {/* 5 Archetype Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left max-w-3xl mx-auto">
              {QUESTION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setActiveCategoryId(cat.id);
                    setIsDropdownOpen(true);
                  }}
                  className="group p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/60 hover:border-blue-300 transition-all text-left shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {renderCategoryIcon(cat.iconName, 'w-4 h-4')}
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                        {cat.badge}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-blue-600">
                    <span>{cat.questions.length} câu hỏi mẫu</span>
                    <span className="font-semibold">Chọn dạng ▾</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((msg, index) => (
          <div key={msg.id} className="space-y-4">
            {msg.role === 'user' ? (
              /* User Bubble (Right Aligned, ChatGPT Style) */
              <div className="flex justify-end w-full animate-fadeIn">
                <div className="max-w-[85%] sm:max-w-[75%] rounded-[24px] bg-[#f4f4f4] text-slate-900 px-5 py-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-2xs border border-slate-200/50">
                  {msg.content}
                </div>
              </div>
            ) : (
              /* Assistant Bubble (Left Aligned, ChatGPT Style) */
              <div className="flex gap-3 sm:gap-4 w-full animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-2xs">
                  <Scale className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  {/* Verified Citation Badges */}
                  {msg.data?.citations && msg.data.citations.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Đối soát {msg.data.guardrailMetrics?.verifiedCount}/{msg.data.guardrailMetrics?.totalFound} căn cứ điều luật thực định</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {msg.data.citations.map((c, i) => (
                          <CitationGuardrailBadge key={i} citation={c} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assistant Markdown Body */}
                  <div className="text-[15px] text-slate-800 leading-relaxed bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    {formatMarkdown(msg.content)}
                  </div>

                  {/* Collapsible Retrieved Law Articles */}
                  {msg.data?.retrievedArticles && msg.data.retrievedArticles.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenLawsMap((prev) => ({
                            ...prev,
                            [msg.id]: !prev[msg.id]
                          }))
                        }
                        className="flex items-center justify-between w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <BookMarked className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            Toàn văn {msg.data.retrievedArticles.length} Điều luật được trích dẫn (Bấm để xem chi tiết)
                          </span>
                        </span>
                        {openLawsMap[msg.id] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>

                      {openLawsMap[msg.id] && (
                        <div className="mt-2.5 space-y-2 pl-2 animate-fadeIn">
                          {msg.data.retrievedArticles.map((art, aIdx) => (
                            <div key={aIdx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                              <div className="font-bold text-slate-800 flex items-center justify-between">
                                <span>{art.lawCode} — Điều {art.articleNumber}: {art.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{art.articleId}</span>
                              </div>
                              {art.contentRaw && (
                                <p className="text-[11px] text-slate-600 font-mono whitespace-pre-line bg-white p-2 rounded border border-slate-200">
                                  {art.contentRaw}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ChatGPT-style Action Toolbar */}
                  <div className="flex items-center gap-1 text-slate-400 pt-1">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      title="Sao chép câu trả lời"
                      className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() =>
                        setFeedbackMap((prev) => ({
                          ...prev,
                          [msg.id]: prev[msg.id] === 'up' ? undefined! : 'up'
                        }))
                      }
                      title="Đánh giá tốt"
                      className={`p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer ${
                        feedbackMap[msg.id] === 'up' ? 'text-blue-600 bg-blue-50' : ''
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setFeedbackMap((prev) => ({
                          ...prev,
                          [msg.id]: prev[msg.id] === 'down' ? undefined! : 'down'
                        }))
                      }
                      title="Chưa hài lòng"
                      className={`p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer ${
                        feedbackMap[msg.id] === 'down' ? 'text-rose-600 bg-rose-50' : ''
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      title="Đọc phát âm"
                      className={`p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer ${
                        speakingId === msg.id ? 'text-blue-600 animate-pulse' : ''
                      }`}
                    >
                      {speakingId === msg.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleRegenerate(index)}
                      title="Tạo lại câu trả lời"
                      className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.print()}
                      title="In / Xuất PDF"
                      className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing / Thinking Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 w-full animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 animate-pulse">
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-2 py-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>Chatbot đang phân tích đề bài & đối soát căn cứ pháp luật...</span>
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Bottom Pill Input Bar (ChatGPT Style) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/95 to-transparent pt-4 pb-4 px-4 pointer-events-none">
          <div className="max-w-3xl sm:max-w-4xl mx-auto space-y-2 pointer-events-auto">
          {/* Unauthenticated Alert inside input */}
          {!isAuthenticated && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800 flex items-center justify-center gap-2 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Vui lòng đăng nhập để gửi câu hỏi và nhận bài giải chi tiết.</span>
              <button
                onClick={() => onOpenAuth?.('login')}
                className="underline font-bold text-blue-700 hover:text-blue-800 cursor-pointer ml-1"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* ChatGPT Pill-shaped Input Container */}
          <div className="relative rounded-[28px] border border-slate-300/80 bg-white shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-2 pl-3.5 pr-2 flex items-end gap-2">
            {/* Quick Prompts Menu (+) */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              title="Mở Lịch sử / Bộ đề thi"
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 mb-0.5 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Archetype / Category Dropdown Trigger (Dropdown Menu) */}
            <div className="relative shrink-0 mb-0.5" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  if (!isDropdownOpen && selectedCategoryId) {
                    setActiveCategoryId(selectedCategoryId);
                  }
                  setIsDropdownOpen((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none border ${
                  isDropdownOpen
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : selectedCategoryId
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/90'
                }`}
                title="Chọn dạng câu hỏi & chức năng (Nhận định, So sánh, Tình huống, Định nghĩa, Phân tích)"
              >
                {selectedCategory ? (
                  renderCategoryIcon(selectedCategory.iconName, 'w-3.5 h-3.5')
                ) : (
                  <Scale className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span className="max-w-[85px] sm:max-w-[130px] truncate">
                  {selectedCategory ? selectedCategory.shortName : 'Dạng bài'}
                </span>
                {isDropdownOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 opacity-80" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                )}
              </button>

              {/* Sleek Dark Dropdown Popover Menu (Matching screenshot 2) */}
              {isDropdownOpen && (
                <div
                  className="absolute bottom-full mb-3 -left-12 sm:left-0 w-[calc(100vw-36px)] sm:w-[620px] max-w-[94vw] sm:max-w-[620px] bg-[#1a1b1e] text-slate-200 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn backdrop-blur-md"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}
                >
                  {/* Top Bar / Header */}
                  <div className="px-3.5 py-2.5 border-b border-slate-800 bg-[#141517] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Dạng bài thi & Chức năng
                      </span>
                      {selectedCategoryId && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                          Đang chọn: {selectedCategory?.shortName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCategoryId && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryId(null)}
                          className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer underline-offset-2 hover:underline"
                        >
                          Bỏ chọn
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Đóng menu"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body: Left Categories + Right Question Templates */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 min-h-[310px]">
                    {/* Left Column: 5 Main Categories (Exact look of Screenshot 2) */}
                    <div className="sm:col-span-5 p-2 space-y-1 bg-[#161719] border-b sm:border-b-0 sm:border-r border-slate-800">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Danh mục câu hỏi (5 dạng)
                      </div>
                      {QUESTION_CATEGORIES.map((cat) => {
                        const isActive = activeCategory.id === cat.id;
                        const isSelected = selectedCategoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setActiveCategoryId(cat.id);
                            }}
                            className={`w-full text-left px-2.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                              isActive
                                ? 'bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-blue-400'
                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            } ${isSelected && !isActive ? 'border-l-2 border-blue-500' : ''}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : isSelected
                                    ? 'bg-blue-950 text-blue-400 border border-blue-700/60'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {renderCategoryIcon(cat.iconName, 'w-3.5 h-3.5')}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs truncate">{cat.name}</div>
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                isActive ? 'text-white translate-x-0.5' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column: Templates & Prompts */}
                    <div className="sm:col-span-7 p-3 bg-[#1a1b1e] flex flex-col justify-between space-y-2.5">
                      <div className="space-y-2.5">
                        {/* Header of Active Category */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/90">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {renderCategoryIcon(activeCategory.iconName, 'w-3.5 h-3.5 text-blue-400')}
                              <span>{activeCategory.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {activeCategory.description}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(activeCategory.id);
                              setIsDropdownOpen(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all shrink-0 cursor-pointer shadow-xs"
                          >
                            Chọn dạng này
                          </button>
                        </div>

                        {/* Quick Boilerplate Template Card */}
                        <button
                          type="button"
                          onClick={() => handleSelectQuestionOrTemplate(activeCategory.template, activeCategory.id)}
                          className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 hover:border-blue-400 hover:from-blue-900/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-blue-300 group-hover:text-blue-200">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Dùng khung sườn Barem (Template)
                            </span>
                            <span className="text-[10px] text-blue-400/80 group-hover:text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-700/40">
                              Điền mẫu ↵
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 font-mono italic leading-relaxed">
                            {activeCategory.template}
                          </p>
                        </button>

                        {/* Exam Sample Questions */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Đề thi & Câu hỏi mẫu tiêu biểu ({activeCategory.questions.length})</span>
                            <span className="text-[10px] text-slate-600 font-normal">Nhấn để điền</span>
                          </div>
                          <div className="max-h-[170px] overflow-y-auto space-y-1.5 pr-1">
                            {activeCategory.questions.map((q) => (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => handleSelectQuestionOrTemplate(q.prompt, activeCategory.id)}
                                className="w-full text-left p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-blue-500/40 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center justify-between text-xs text-slate-200 group-hover:text-white">
                                  <span className="font-medium line-clamp-1 flex-1 pr-2">{q.title}</span>
                                  {q.tag && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700/80 text-slate-300 font-mono shrink-0">
                                      {q.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                  {q.prompt}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Tip */}
                      <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between select-none">
                        <span>💡 Bấm vào câu hỏi để điền vào ô chat</span>
                        <span className="font-mono text-slate-600">Enter để gửi</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              value={query}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={!isAuthenticated || remainingQuestions <= 0}
              rows={1}
              placeholder={
                !isAuthenticated
                  ? 'Đăng nhập tài khoản để đặt câu hỏi...'
                  : 'Hỏi Chatbot Pháp Luật... (Nhấn Enter để gửi, Shift + Enter xuống dòng)'
              }
              className="flex-1 max-h-[160px] min-h-[36px] bg-transparent border-0 outline-none focus:ring-0 text-[15px] text-slate-900 placeholder:text-slate-400 py-1.5 resize-none leading-relaxed"
            />

            {/* Right Buttons inside Pill */}
            <div className="flex items-center gap-1 shrink-0 mb-0.5">
              {/* Voice Input */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title={isListening ? 'Đang lắng nghe giọng nói...' : 'Nhập bằng giọng nói'}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isListening
                    ? 'text-rose-600 bg-rose-50 animate-pulse'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button (Dark Circle Icon) */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!query.trim() || isLoading || !isAuthenticated}
                className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ChatGPT Disclaimer Footer */}
          <div className="text-center text-[11px] text-slate-400 tracking-wide select-none">
            Chatbot có thể mắc lỗi. Hãy kiểm tra các quy định điều luật quan trọng trong giáo trình Bộ GD&ĐT.
          </div>
        </div>
      </div>
    </div>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectQuery={(q) => {
          setIsHistoryOpen(false);
          setQuery(q);
          textareaRef.current?.focus();
        }}
        onClearHistory={async () => {
          await api.clearHistory();
          setHistory([]);
        }}
      />
    </div>
  );
};
