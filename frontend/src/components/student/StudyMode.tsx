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
  isDarkMode?: boolean;
}

export const StudyMode: React.FC<StudyModeProps> = ({ initialQuery, onClearInitialQuery, onOpenAuth, isDarkMode }) => {
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

  // Khóa lưu trữ cục bộ vĩnh viễn theo email / tên đăng nhập của tài khoản
  const userIdentifier = (user?.email || user?.username || user?.id || 'guest').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const storageKey = `vietlaw_chat_sessions_${userIdentifier}`;

  // 1. Tải và phục hồi toàn bộ các phiên chat đã lưu từ localStorage
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
      // Đọc từ key chuẩn của người dùng
      const raw = localStorage.getItem(storageKey);
      let loadedSessions: ChatSession[] = [];
      if (raw) {
        const parsed: ChatSession[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedSessions = parsed;
        }
      }

      // Quét và khôi phục các session từ các key cũ (do đổi id sau khi backend reboot)
      const seenTitles = new Set<string>(loadedSessions.map((s) => s.title.toLowerCase().trim()));
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('vietlaw_chat_sessions_')) {
          try {
            const oldRaw = localStorage.getItem(k);
            if (oldRaw) {
              const oldList: ChatSession[] = JSON.parse(oldRaw);
              if (Array.isArray(oldList)) {
                for (const oldSess of oldList) {
                  const tKey = (oldSess.title || '').toLowerCase().trim();
                  if (tKey && !seenTitles.has(tKey)) {
                    seenTitles.add(tKey);
                    loadedSessions.push(oldSess);
                  }
                }
              }
            }
          } catch {}
        }
      }

      if (loadedSessions.length > 0) {
        loadedSessions.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
        setSessions(loadedSessions);
        setActiveSessionId(loadedSessions[0].id);
        setMessages(loadedSessions[0].messages);
        try {
          localStorage.setItem(storageKey, JSON.stringify(loadedSessions));
        } catch {}
      }
    } catch (e) {
      console.warn('Lỗi đọc chat sessions từ localStorage:', e);
    }
  }, [isAuthenticated, userIdentifier]);

  // 2. Tự động đồng bộ và gộp toàn bộ lịch sử từ Server vào danh sách đoạn chat
  useEffect(() => {
    if (!isAuthenticated || history.length === 0) return;

    setSessions((prevSessions) => {
      const merged = [...prevSessions];

      for (const h of history) {
        const title = h.query.slice(0, 36) + (h.query.length > 36 ? '...' : '');
        const titleKey = title.toLowerCase().trim();
        const shortQKey = h.query.slice(0, 25).toLowerCase().trim();

        // Kiểm tra xem câu hỏi này đã có trong danh sách session chưa
        const alreadyExists = merged.some(
          (s) =>
            s.id === 'sess_' + h._id ||
            s.title.toLowerCase().trim() === titleKey ||
            (s.messages && s.messages.some((m) => m.role === 'user' && m.content.toLowerCase().trim().startsWith(shortQKey)))
        );

        if (!alreadyExists) {
          const newSess: ChatSession = {
            id: 'sess_' + h._id,
            title,
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
                timestamp: new Date(h.createdAt).getTime() + 400,
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
          };
          merged.push(newSess);
        }
      }

      // Sắp xếp các đoạn chat theo thời gian mới nhất lên đầu
      merged.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch {}

      return merged;
    });
  }, [history, isAuthenticated, storageKey]);

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
      const res = await api.solveQuery(textToSend, selectedCategoryId);
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

  // Enhanced Inline Markdown Parser for bold, code, and line breaks with Vietnamese typography
  const renderFormattedInline = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
      const renderedParts = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-[#111827] dark:text-amber-200">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <em key={i} className="italic text-[#374151] dark:text-[#cbd5e1]">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      return (
        <React.Fragment key={lineIdx}>
          {lineIdx > 0 && <br />}
          {renderedParts}
        </React.Fragment>
      );
    });
  };

  // Markdown Formatter for Assistant Response with Rich Editorial Legal Typography
  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableRows: string[] = [];
    let inTable = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('|')) {
        inTable = true;
        tableRows.push(line);
      } else {
        if (inTable) {
          elements.push(renderTable(tableRows, `table-${idx}`));
          tableRows = [];
          inTable = false;
        }

        if (!trimmed) {
          return;
        }

        // 1. Standard Markdown H3
        if (trimmed.startsWith('### ')) {
          elements.push(
            <h3 key={idx} className="font-display text-base font-bold text-indigo-600 dark:text-indigo-400 mt-5 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-blue-500 rounded-full inline-block shadow-2xs"></span>
              {renderFormattedInline(trimmed.replace('### ', ''))}
            </h3>
          );
          return;
        }

        // 2. Standard Markdown H2
        if (trimmed.startsWith('## ')) {
          elements.push(
            <h2 key={idx} className="font-display text-lg font-bold text-[#111827] dark:text-white mt-6 mb-3 border-b border-black/[0.08] dark:border-white/10 pb-2 flex items-center gap-2">
              <span className="w-2 h-4.5 bg-indigo-600 dark:bg-indigo-400 rounded-full inline-block shadow-2xs"></span>
              {renderFormattedInline(trimmed.replace('## ', ''))}
            </h2>
          );
          return;
        }

        // 3. Roman Numeral Major Section Headings (e.g. "I. KẾT LUẬN SƠ BỘ:", "II. BẢNG PHÂN TÍCH 4 YẾU TỐ CẤU THÀNH VI PHẠM PHÁP LUẬT:")
        const romanMatch = trimmed.match(/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s*(.*)$/i);
        if (romanMatch) {
          const roman = romanMatch[1].toUpperCase();
          const title = romanMatch[2];
          elements.push(
            <div key={idx} className="pt-3.5 pb-1.5 border-b border-black/[0.08] dark:border-white/10 mt-5 first:mt-1 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white font-bold text-xs font-mono tracking-wider shadow-xs shrink-0">
                  MỤC {roman}
                </span>
                <h3 className="font-display font-bold text-[15.5px] sm:text-[16.5px] text-[#111827] dark:text-white tracking-tight uppercase">
                  {renderFormattedInline(title)}
                </h3>
              </div>
            </div>
          );
          return;
        }

        // 4. Numbered Sub-Sections in All-Caps / Colon (e.g. "1. MẶT KHÁCH QUAN:", "2. MẶT CHỦ QUAN:", "3. CHỦ THỂ:", "4. KHÁCH THỂ:")
        const numSectionMatch = trimmed.match(/^(\d+)\.\s+([A-ZÀ-Ỹ0-9\s/_\-()]{3,}):?\s*(.*)$/);
        if (numSectionMatch) {
          const num = numSectionMatch[1];
          const subTitle = numSectionMatch[2];
          const extraText = numSectionMatch[3];
          elements.push(
            <div key={idx} className="flex items-start gap-2.5 mt-4 mb-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800 shadow-2xs font-mono mt-0.5">
                {num}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-display font-bold text-[14.5px] sm:text-[15px] text-[#1f2937] dark:text-amber-100 tracking-wide uppercase">
                  {subTitle}{subTitle.endsWith(':') ? '' : ':'}
                </span>
                {extraText && (
                  <span className="ml-1.5 text-[#374151] dark:text-[#cbd5e1] font-chat text-[15px]">
                    {renderFormattedInline(extraText)}
                  </span>
                )}
              </div>
            </div>
          );
          return;
        }

        // 5. Divider
        if (trimmed === '---') {
          elements.push(<hr key={idx} className="my-4 border-black/[0.08] dark:border-white/10" />);
          return;
        }

        // 6. Bullet lists with smart key-value highlighting
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const rawBullet = trimmed.replace(/^[-•*]\s*/, '');
          const colonIdx = rawBullet.indexOf(':');
          if (colonIdx > 0 && colonIdx <= 45) {
            const label = rawBullet.substring(0, colonIdx);
            const rest = rawBullet.substring(colonIdx + 1).trim();
            elements.push(
              <div key={idx} className="flex items-start gap-2.5 my-2 pl-1 group">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-2.5 ring-4 ring-indigo-500/15 group-hover:scale-125 transition-transform duration-200"></span>
                <div className="flex-1 text-[15px] leading-[1.78] font-chat text-[#374151] dark:text-[#d1d5db]">
                  <strong className="font-semibold text-[#111827] dark:text-amber-200 mr-1.5">
                    {renderFormattedInline(label)}:
                  </strong>
                  {renderFormattedInline(rest)}
                </div>
              </div>
            );
          } else {
            elements.push(
              <div key={idx} className="flex items-start gap-2.5 my-2 pl-1 group">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-2.5 ring-4 ring-indigo-500/15 group-hover:scale-125 transition-transform duration-200"></span>
                <div className="flex-1 text-[15px] leading-[1.78] font-chat text-[#374151] dark:text-[#d1d5db]">
                  {renderFormattedInline(rawBullet)}
                </div>
              </div>
            );
          }
          return;
        }

        // 7. Indented sub-bullets (starting with +)
        if (trimmed.startsWith('+ ')) {
          const rawSubBullet = trimmed.replace(/^\+\s*/, '');
          const colonIdx = rawSubBullet.indexOf(':');
          if (colonIdx > 0 && colonIdx <= 45) {
            const label = rawSubBullet.substring(0, colonIdx);
            const rest = rawSubBullet.substring(colonIdx + 1).trim();
            elements.push(
              <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-6 group">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 shrink-0 mt-2.5"></span>
                <div className="flex-1 text-[14.5px] leading-[1.7] font-chat text-[#4b5563] dark:text-[#cbd5e1]">
                  <strong className="font-medium text-[#1f2937] dark:text-slate-200 mr-1.5">
                    {renderFormattedInline(label)}:
                  </strong>
                  {renderFormattedInline(rest)}
                </div>
              </div>
            );
          } else {
            elements.push(
              <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-6 group">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 shrink-0 mt-2.5"></span>
                <div className="flex-1 text-[14.5px] leading-[1.7] font-chat text-[#4b5563] dark:text-[#cbd5e1]">
                  {renderFormattedInline(rawSubBullet)}
                </div>
              </div>
            );
          }
          return;
        }

        // 7. Regular paragraph with beautiful Vietnamese font legibility
        elements.push(
          <p key={idx} className="text-[#2c3038] dark:text-[#e2e8f0] text-[15px] sm:text-[15.5px] my-2.5 leading-[1.78] font-chat">
            {renderFormattedInline(trimmed)}
          </p>
        );
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
      <div key={key} className="overflow-x-auto my-5 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#121319] shadow-sm font-chat">
        <table className="w-full text-left text-xs sm:text-sm text-[#27251e] dark:text-slate-200">
          <thead className="bg-[#faf8f5] dark:bg-[#181818] text-[#111827] dark:text-white border-b border-black/[0.08] dark:border-white/10 text-[12.5px] font-bold font-display">
            <tr>
              {headerRow.map((col, i) => (
                <th key={i} className="px-4 py-3.5 border-r border-black/[0.06] dark:border-white/10 last:border-r-0">
                  <span className="font-bold text-[#111827] dark:text-white">
                    {renderFormattedInline(col)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
            {bodyRows.map((row, rIdx) => (
              <tr 
                key={rIdx} 
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors odd:bg-white dark:odd:bg-[#121319] even:bg-[#faf8f5]/60 dark:even:bg-[#181818]/60"
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-3.5 align-top border-r border-black/[0.05] dark:border-white/[0.06] last:border-r-0 leading-relaxed text-xs sm:text-sm">
                    {renderFormattedInline(cell.replace(/<br\s*\/?>/gi, '\n'))}
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
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 relative">
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
        {/* Top Floating Control Bar - Modern Glassmorphism & Magic UI Badges */}
        <div className="sticky top-0 z-20 bg-[#f8fafc]/85 dark:bg-[#0b0f19]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 shrink-0 transition-colors">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {/* Nút Toggle mở/đóng thanh bên */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                title={isSidebarOpen ? 'Thu gọn thanh bên' : 'Mở lịch sử đoạn chat'}
                className="p-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 text-[#72706b] hover:text-[#27251e] dark:hover:text-white hover:border-indigo-500/50 shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shrink-0"
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <PanelLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
                {!isSidebarOpen && (
                  <span className="hidden sm:inline">Lịch sử ({sessions.length})</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-black/10 dark:border-white/10 hover:border-indigo-500/50 text-[#27251e] dark:text-[#f8fafc] shadow-xs hover:shadow-sm transition-all shrink-0 cursor-pointer"
              >
                <SquarePen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Đoạn chat mới</span>
              </button>

              <span className="text-xs text-black/20 dark:text-white/20 hidden md:inline">•</span>
              
              {/* Active session title indicator */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-[#72706b] dark:text-[#94a3b8] font-medium truncate max-w-[280px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="truncate">
                  {activeSessionId
                    ? sessions.find((s) => s.id === activeSessionId)?.title || 'Đoạn chat hiện tại'
                    : 'Đoạn chat mới'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isAuthenticated && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs">
                  <span className="text-[#72706b] dark:text-[#94a3b8] hidden sm:inline">Hạn mức:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {remainingQuestions}
                  </span>
                  <span className="text-[#92918b] dark:text-[#64748b]">/30 câu</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Conversation Stream */}
        <div className="flex-1 overflow-y-auto w-full px-4 py-6 space-y-6 pb-44">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Empty State: Modern Glass Hero with Category Cards & Ambient Orbs */}
            {messages.length === 0 && (
              <div className="relative py-8 md:py-12 text-center space-y-8 animate-fadeIn overflow-hidden">
                {/* Magic UI Ambient Background Glow Mesh */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-500/15 via-blue-500/10 to-transparent blur-3xl pointer-events-none animate-float-orb"></div>
                <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-float-orb-slow"></div>

                <div className="relative z-10 space-y-3">
                  <div className="relative w-16 h-16 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-slate-900/20 dark:shadow-indigo-500/30 transition-all duration-300 hover:scale-110 hover:rotate-3 cursor-pointer group">
                    <Scale className="w-8 h-8 transition-transform group-hover:scale-110" />
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-600"></span>
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#27251e] dark:text-white">
                    Hỏi đáp cùng <span className="animate-text-shimmer font-extrabold">Trợ lý Pháp Luật Đại Cương</span> ⚖️
                  </h2>
                  <p className="text-sm text-[#72706b] dark:text-[#94a3b8] max-w-lg mx-auto leading-relaxed">
                    Nhập câu hỏi lý thuyết, nhận định đúng sai hoặc bài tập tình huống cần giải theo Barem chuẩn Bộ GD&ĐT nhé!
                  </p>
                </div>

                {/* 5 Archetype Category Cards - Modern Interactive Glass Cards */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-left max-w-3xl mx-auto">
                  {QUESTION_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setActiveCategoryId(cat.id);
                        setIsDropdownOpen(true);
                      }}
                      className="group relative p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-sm transition-all duration-300 text-left shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden card-spotlight"
                    >
                      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-500/10 via-blue-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-indigo-500/20 transition-all duration-500"></div>
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#faf8f5] to-[#f0ede6] dark:from-white/10 dark:to-white/5 border border-black/5 dark:border-white/10 text-[#27251e] dark:text-white flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 shadow-2xs group-hover:rotate-6">
                            {renderCategoryIcon(cat.iconName, 'w-4 h-4')}
                          </div>
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                            {cat.badge}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-[#27251e] dark:text-white group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                          {cat.name}
                        </h4>
                        <p className="text-[11px] text-[#72706b] dark:text-[#94a3b8] line-clamp-2 mt-1 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                      <div className="pt-2 mt-2 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#92918b] dark:text-[#64748b] group-hover:text-indigo-600 dark:text-indigo-400">
                        <span>{cat.questions.length} câu hỏi mẫu</span>
                        <span className="font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                          Chọn dạng →
                        </span>
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
                  /* User Bubble (Modern Charcoal & Crisp Slate) */
                  <div className="flex justify-end w-full animate-fadeIn group">
                    <div className="font-chat relative max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-br-md bg-gradient-to-br from-[#27251e] to-[#1a1915] text-[#faf8f5] px-5 py-3.5 text-[15px] sm:text-[15.5px] leading-[1.75] break-words whitespace-pre-wrap shadow-md shadow-black/5 border border-white/10 dark:from-[#232530] dark:to-[#171821] dark:border-white/15 transition-all">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  /* Assistant Bubble (Modern Glassmorphic Card & Verified Shield) */
                  <div className="flex gap-3 sm:gap-4 w-full animate-fadeIn">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
                      <Scale className="w-4 h-4" />
                    </div>

                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Verified Citation Badges */}
                      {msg.data?.citations && msg.data.citations.length > 0 && (
                        <div className="relative overflow-hidden p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:to-transparent border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 shadow-xs backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Đối soát {msg.data.guardrailMetrics?.verifiedCount}/{msg.data.guardrailMetrics?.totalFound} căn cứ điều luật thực định</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {msg.data.citations.map((c, i) => (
                              <CitationGuardrailBadge key={i} citation={c} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assistant Markdown Body */}
                      <div className="font-chat text-[15px] sm:text-[15.5px] text-[#24272f] dark:text-[#f3f4f6] leading-[1.78] bg-white/98 dark:bg-[#181a22]/98 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] space-y-3.5">
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
                                ...{ [msg.id]: !prev[msg.id] }
                              }))
                            }
                            className="flex items-center justify-between w-full p-3 rounded-2xl bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-black/[0.07] dark:border-white/[0.08] text-xs font-medium text-[#27251e] dark:text-[#e2e8f0] transition-all shadow-xs hover:border-indigo-500/40 cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <span>
                                Toàn văn {msg.data.retrievedArticles.length} Điều luật được trích dẫn (Bấm để xem chi tiết)
                              </span>
                            </span>
                            {openLawsMap[msg.id] ? (
                              <ChevronUp className="w-4 h-4 text-[#72706b]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#72706b]" />
                            )}
                          </button>

                          {openLawsMap[msg.id] && (
                            <div className="mt-2.5 space-y-2 pl-2 animate-fadeIn">
                              {msg.data.retrievedArticles.map((art, aIdx) => (
                                <div key={aIdx} className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.08] text-xs space-y-1.5 shadow-xs">
                                  <div className="font-semibold text-[#27251e] dark:text-white flex items-center justify-between">
                                    <span className="text-indigo-600 dark:text-indigo-400">{art.lawCode} — Điều {art.articleNumber}: {art.title}</span>
                                    <span className="text-[10px] text-[#92918b] font-mono px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06]">{art.articleId}</span>
                                  </div>
                                  {art.contentRaw && (
                                    <p className="text-[11px] text-[#72706b] dark:text-[#94a3b8] font-mono whitespace-pre-line bg-[#faf8f5] dark:bg-black/30 p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.05] leading-relaxed">
                                      {art.contentRaw}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Toolbar */}
                      <div className="flex items-center gap-1 text-[#92918b] pt-1">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Sao chép câu trả lời"
                          className="p-1.5 hover:bg-white dark:hover:bg-white/10 hover:text-[#27251e] dark:hover:text-white rounded-lg border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-all cursor-pointer hover:shadow-xs active:scale-95"
                        >
                          {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() =>
                            setFeedbackMap((prev) => ({
                              ...prev,
                              [msg.id]: prev[msg.id] === 'up' ? undefined! : 'up'
                            }))
                          }
                          title="Đánh giá tốt"
                          className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer active:scale-95 ${
                            feedbackMap[msg.id] === 'up'
                              ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30 shadow-xs'
                              : 'hover:bg-white dark:hover:bg-white/10 hover:text-[#27251e] dark:hover:text-white hover:border-black/10 dark:hover:border-white/10'
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
                          className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer active:scale-95 ${
                            feedbackMap[msg.id] === 'down'
                              ? 'text-rose-600 bg-rose-500/10 border-rose-500/30 shadow-xs'
                              : 'hover:bg-white dark:hover:bg-white/10 hover:text-[#27251e] dark:hover:text-white hover:border-black/10 dark:hover:border-white/10'
                          }`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSpeak(msg.id, msg.content)}
                          title="Đọc phát âm"
                          className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer active:scale-95 ${
                            speakingId === msg.id
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-600/15 border-indigo-500/30 animate-pulse'
                              : 'hover:bg-white dark:hover:bg-white/10 hover:text-[#27251e] dark:hover:text-white hover:border-black/10 dark:hover:border-white/10'
                          }`}
                        >
                          {speakingId === msg.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleRegenerate(index)}
                          title="Tạo lại câu trả lời"
                          className="p-1.5 hover:bg-white dark:hover:bg-white/10 hover:text-[#27251e] dark:hover:text-white rounded-lg border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-all cursor-pointer active:scale-95"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.print()}
                          title="In / Xuất PDF"
                          className="p-1.5 hover:bg-white dark:hover:bg-white/10 hover:text-[#27251e] dark:hover:text-white rounded-lg border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-all cursor-pointer active:scale-95"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing / Thinking Indicator - Modern Magic Pulse */}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 w-full animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 animate-pulse">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="flex items-center gap-2 text-xs text-[#72706b] dark:text-[#94a3b8] font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    <span>Chatbot đang phân tích đề bài & đối soát căn cứ pháp luật...</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 shadow-xs backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Bottom Hero Input Bar - Magic UI / 21st.dev Floating Glass Island */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#f8fafc] dark:from-[#0b0f19] via-[#f8fafc]/90 dark:via-[#0b0f19]/90 to-transparent pt-6 pb-4 px-4 pointer-events-none">
          <div className="max-w-3xl sm:max-w-4xl mx-auto space-y-2 pointer-events-auto">
            {/* Unauthenticated Alert inside input */}
            {!isAuthenticated && (
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#181922]/90 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] text-center text-xs text-[#72706b] dark:text-[#94a3b8] flex items-center justify-center gap-2 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Vui lòng đăng nhập để gửi câu hỏi và nhận bài giải chi tiết.</span>
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            {/* 21st.dev Style Floating Island Input Container */}
            <div className="relative rounded-2xl sm:rounded-3xl border border-black/[0.1] dark:border-white/[0.12] bg-white/95 dark:bg-[#181922]/95 backdrop-blur-2xl p-2 pl-3 sm:pl-3.5 pr-2 flex items-end gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 focus-within:shadow-[0_16px_48px_rgba(99,102,241,0.15)] transition-all duration-300">
              {/* Quick Prompts Menu (+) */}
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                title="Mở Lịch sử / Bộ đề thi"
                className="p-2 rounded-xl text-[#92918b] hover:text-[#27251e] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 mb-0.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Archetype / Category Pill Chip Trigger */}
              <div className="relative shrink-0 mb-0.5" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDropdownOpen && selectedCategoryId) {
                      setActiveCategoryId(selectedCategoryId);
                    }
                    setIsDropdownOpen((prev) => !prev);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none border active:scale-95 ${
                    isDropdownOpen
                      ? 'bg-[#27251e] text-[#faf8f5] border-[#27251e] shadow-md dark:bg-white dark:text-[#121319]'
                      : selectedCategoryId
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white border-transparent shadow-sm shadow-indigo-500/25'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#27251e] dark:text-white border-transparent hover:bg-black/[0.08] dark:hover:bg-white/10'
                  }`}
                  title={selectedCategory ? `Đang chọn: ${selectedCategory.name} (Bắt buộc trả lời theo dạng này)` : 'Phần chung: Tự động trả lời mọi dạng bài'}
                >
                  {selectedCategory ? (
                    renderCategoryIcon(selectedCategory.iconName, 'w-3.5 h-3.5')
                  ) : (
                    <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                  <span className="max-w-[85px] sm:max-w-[130px] truncate">
                    {selectedCategory ? selectedCategory.shortName : 'Phần chung'}
                  </span>
                  {isDropdownOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 opacity-80" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                {/* Dropdown Menu - Clean Synchronized White Theme with Magic UI Accents */}
                {isDropdownOpen && (
                  <div
                    className="absolute bottom-full mb-3.5 left-0 sm:left-0 w-[calc(100vw-32px)] sm:w-[680px] max-w-[95vw] sm:max-w-[680px] z-50 animate-fadeIn"
                    style={{ filter: 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.12))' }}
                  >
                    {/* Glowing Magic UI Rotating Border Beam */}
                    <div className="relative rounded-[28px] p-[1.5px] magic-border-beam overflow-hidden shadow-2xl">
                      {/* Inner Glassmorphism Modal Body - Clean Synchronized White Theme */}
                      <div className="relative bg-white/98 dark:bg-[#121319]/96 backdrop-blur-2xl text-[#1e2029] dark:text-[#faf8f5] rounded-[27px] overflow-hidden flex flex-col max-h-[min(510px,calc(100vh-140px))] border border-black/[0.07] dark:border-white/10 shadow-lg">
                        {/* Ambient Glow Orbs inside Modal */}
                        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-indigo-600/10 dark:bg-indigo-600/25 blur-3xl pointer-events-none animate-float-orb"></div>
                        <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-3xl pointer-events-none animate-float-orb-slow"></div>

                        {/* Header: Title, Live Status Badge, Selected Pill & Close */}
                        <div className="relative z-10 px-4 py-3 border-b border-black/[0.06] dark:border-white/10 bg-[#faf8f5]/90 dark:bg-white/[0.03] flex items-center justify-between text-xs shrink-0">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 animate-pulse">
                              <Scale className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold tracking-wide text-[#1e2029] dark:text-white">
                                Barem & Dạng Đề Thi
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Bộ GD&ĐT
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedCategoryId && (
                              <div className="flex items-center gap-1.5 bg-indigo-600/10 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-medium shadow-xs">
                                <span>Đang chọn: <strong>{selectedCategory?.shortName}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCategoryId(null)}
                                  className="text-[11px] text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white transition-colors cursor-pointer ml-0.5"
                                  title="Bỏ chọn dạng này"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsDropdownOpen(false)}
                              className="p-1.5 rounded-xl text-[#72706b] hover:text-[#1e2029] dark:text-white/60 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer hover:rotate-90 duration-300"
                              title="Đóng bảng chọn"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Content Grid: 2 Columns */}
                        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 flex-1 min-h-0 overflow-hidden">
                          {/* Left Column: 5 Main Categories (Clean Synchronized Light Tabs) */}
                          <div className="sm:col-span-5 p-2.5 space-y-1.5 bg-[#f7f5f1] dark:bg-black/30 border-b sm:border-b-0 sm:border-r border-black/[0.06] dark:border-white/10 overflow-y-auto">
                            <div className="px-2 py-1 text-[10px] font-semibold text-[#72706b] dark:text-[#94a3b8] uppercase tracking-wider flex items-center justify-between">
                              <span>Danh mục dạng bài</span>
                              <span className="text-[10px] font-mono text-[#9ca3af]">5 dạng + Phần chung</span>
                            </div>

                            {/* Nút 0: Phần chung (Tự động nhận diện mọi dạng đề) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategoryId(null);
                                setIsDropdownOpen(false);
                              }}
                              className={`relative overflow-hidden w-full text-left px-3 py-2.5 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer group ${
                                selectedCategoryId === null
                                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-semibold shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300/50'
                                  : 'text-[#4b5563] dark:text-[#cbd5e1] hover:bg-white dark:hover:bg-white/[0.07] hover:text-[#111827] dark:hover:text-white hover:shadow-2xs hover:translate-x-1'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                                    selectedCategoryId === null
                                      ? 'bg-white/25 text-white shadow-xs'
                                      : 'bg-white dark:bg-white/5 text-emerald-600 border border-black/[0.06] dark:border-white/10 shadow-2xs'
                                  }`}
                                >
                                  <Scale className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                    <span>0. Phần chung (Tự do)</span>
                                    {selectedCategoryId === null && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-ping"></span>
                                    )}
                                  </div>
                                  <div className={`text-[10px] truncate ${selectedCategoryId === null ? 'text-white/90' : 'text-[#72706b] dark:text-[#94a3b8]'}`}>
                                    Trả lời linh hoạt mọi dạng đề
                                  </div>
                                </div>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                selectedCategoryId === null ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-[#6b7280] dark:text-[#94a3b8]'
                              }`}>
                                Đa năng
                              </span>
                            </button>
                            {QUESTION_CATEGORIES.map((cat, idx) => {
                              const isActive = activeCategory.id === cat.id;
                              const isSelected = selectedCategoryId === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveCategoryId(cat.id);
                                  }}
                                  className={`relative overflow-hidden w-full text-left px-3 py-2.5 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer group ${
                                    isActive
                                      ? 'bg-slate-900 dark:bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                                      : 'text-[#4b5563] dark:text-[#cbd5e1] hover:bg-white dark:hover:bg-white/[0.07] hover:text-[#111827] dark:hover:text-white hover:shadow-2xs hover:translate-x-1'
                                  } ${isSelected && !isActive ? 'border-l-3 border-indigo-600' : ''}`}
                                >
                                  {isActive && (
                                    <span className="absolute inset-0 -translate-x-full animate-shimmer-sweep pointer-events-none"></span>
                                  )}
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                                        isActive
                                          ? 'bg-white/25 text-white shadow-xs'
                                          : isSelected
                                          ? 'bg-indigo-600/15 text-[#d97706] border border-indigo-500/40'
                                          : 'bg-white dark:bg-white/5 text-[#6b7280] dark:text-[#94a3b8] border border-black/[0.06] dark:border-white/10 shadow-2xs'
                                      }`}
                                    >
                                      {renderCategoryIcon(cat.iconName, 'w-3.5 h-3.5')}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                        <span>{idx + 1}. {cat.shortName}</span>
                                        {isSelected && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
                                        )}
                                      </div>
                                      <div className={`text-[10px] truncate ${isActive ? 'text-white/90 font-normal' : 'text-[#72706b] dark:text-[#94a3b8]'}`}>
                                        {cat.badge} • {cat.questions.length} câu
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                                      isActive ? 'text-white translate-x-0.5' : 'text-[#9ca3af] group-hover:text-[#111827] dark:group-hover:text-white group-hover:translate-x-1'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>

                          {/* Right Column: Active Category Header + Template Card + Questions (Clean White) */}
                          <div className="sm:col-span-7 p-3.5 bg-white dark:bg-[#121319]/80 flex flex-col justify-between overflow-y-auto space-y-3">
                            <div className="space-y-3">
                              {/* Header of Active Category */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/10">
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                                    <span className="text-indigo-600 dark:text-indigo-400">{renderCategoryIcon(activeCategory.iconName, 'w-3.5 h-3.5')}</span>
                                    <span className="truncate">{activeCategory.name}</span>
                                  </div>
                                  <div className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5 line-clamp-1 leading-relaxed">
                                    {activeCategory.description}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategoryId(activeCategory.id);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="relative group overflow-hidden px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
                                >
                                  <span>Chọn dạng này</span>
                                  <Check className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700"></span>
                                </button>
                              </div>

                              {/* Quick Boilerplate Template Card (Clean Synchronized Style) */}
                              <button
                                type="button"
                                onClick={() => handleSelectQuestionOrTemplate(activeCategory.template, activeCategory.id)}
                                className="relative overflow-hidden w-full text-left p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer group card-spotlight"
                              >
                                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 pointer-events-none"></span>
                                <div className="flex items-center justify-between text-xs font-bold text-[#1e2029] dark:text-[#faf8f5]">
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
                                    <span>Khung sườn chuẩn Barem GD&ĐT</span>
                                  </span>
                                  <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-600/15 dark:bg-indigo-600/20 px-2 py-0.5 rounded-full border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                                    Điền mẫu ↵
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1] mt-1.5 line-clamp-2 font-mono italic leading-relaxed group-hover:text-[#111827] dark:group-hover:text-white transition-colors">
                                  {activeCategory.template}
                                </p>
                              </button>

                              {/* Exam Sample Questions (Clean White Cards) */}
                              <div>
                                <div className="text-[10px] font-semibold text-[#72706b] dark:text-[#94a3b8] uppercase tracking-wider mb-2 flex items-center justify-between">
                                  <span>Đề thi & Câu hỏi mẫu ({activeCategory.questions.length})</span>
                                  <span className="text-[10px] font-normal text-[#9ca3af]">Nhấp để điền nhanh</span>
                                </div>
                                <div className="max-h-[175px] overflow-y-auto space-y-1.5 pr-1">
                                  {activeCategory.questions.map((q) => (
                                    <button
                                      key={q.id}
                                      type="button"
                                      onClick={() => handleSelectQuestionOrTemplate(q.prompt, activeCategory.id)}
                                      className="relative w-full text-left p-2.5 rounded-xl bg-[#faf8f5] hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-black/[0.06] hover:border-indigo-500/50 dark:border-white/5 dark:hover:border-indigo-500/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer group card-spotlight"
                                    >
                                      <div className="flex items-center justify-between text-xs text-[#111827] dark:text-[#faf8f5]">
                                        <span className="font-semibold line-clamp-1 flex-1 pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                          {q.title}
                                        </span>
                                        {q.tag && (
                                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-white/5 text-[#6b7280] dark:text-[#94a3b8] group-hover:text-[#d97706] dark:group-hover:text-white group-hover:bg-indigo-600/10 font-mono shrink-0 border border-black/[0.08] dark:border-white/10 transition-colors">
                                            {q.tag}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] group-hover:text-[#374151] dark:group-hover:text-[#cbd5e1] mt-0.5 line-clamp-2 leading-relaxed transition-colors">
                                        {q.prompt}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Footer Tip */}
                            <div className="pt-2.5 border-t border-black/[0.06] dark:border-white/10 text-[10px] text-[#72706b] dark:text-[#94a3b8] flex items-center justify-between select-none">
                              <span className="flex items-center gap-1.5">
                                <span>💡 Bấm vào câu hỏi để tự động điền vào ô chat</span>
                              </span>
                              <span className="font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-600/10 px-1.5 py-0.5 rounded border border-indigo-500/25 font-semibold">
                                Enter để gửi
                              </span>
                            </div>
                          </div>
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
                className="flex-1 max-h-[160px] min-h-[36px] bg-transparent border-0 outline-none focus:ring-0 text-[15px] text-[#27251e] dark:text-[#f8fafc] placeholder:text-[#92918b] dark:placeholder:text-[#64748b] py-1.5 resize-none leading-relaxed font-normal"
              />

              {/* Right Buttons inside Island */}
              <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
                {/* Voice Input with Siri-style Animated Wave Equalizer */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  title={isListening ? 'Đang lắng nghe giọng nói...' : 'Nhập bằng giọng nói'}
                  className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                    isListening
                      ? 'text-rose-600 bg-rose-500/15 ring-2 ring-rose-500/30'
                      : 'text-[#92918b] hover:text-[#27251e] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {isListening ? (
                    <div className="flex items-center gap-0.5 h-4 px-0.5">
                      <span className="w-0.5 bg-rose-500 rounded-full voice-wave-1"></span>
                      <span className="w-0.5 bg-rose-500 rounded-full voice-wave-2"></span>
                      <span className="w-0.5 bg-rose-500 rounded-full voice-wave-3"></span>
                      <span className="w-0.5 bg-rose-500 rounded-full voice-wave-4"></span>
                    </div>
                  ) : (
                    <Mic className="w-4 h-4 transition-transform hover:scale-110" />
                  )}
                </button>

                {/* 21st.dev Style Gradient Action Button with Radiant Glow */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!query.trim() || isLoading || !isAuthenticated}
                  className="relative overflow-hidden w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm cursor-pointer group"
                >
                  <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" />
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 pointer-events-none"></span>
                </button>
              </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="text-center text-[11px] text-[#92918b] dark:text-[#64748b] tracking-wide select-none">
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
