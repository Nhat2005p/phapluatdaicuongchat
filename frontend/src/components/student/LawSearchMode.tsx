import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Scale,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { LawArticle } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface LawSearchModeProps {
  onAskAi: (query: string) => void;
  onReviewAi: (content: string) => void;
}

export const LawSearchMode: React.FC<LawSearchModeProps> = ({ onAskAi, onReviewAi }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLawCode, setSelectedLawCode] = useState<string>('ALL');
  const [articles, setArticles] = useState<LawArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lawCategories = [
    { code: 'ALL', name: 'Tất cả văn bản' },
    { code: 'BLDS2015', name: 'Bộ luật Dân sự 2015' },
    { code: 'BLHS2015', name: 'Bộ luật Hình sự 2015' },
    { code: 'BLLD2019', name: 'Bộ luật Lao động 2019' },
    { code: 'HNGD2014', name: 'Luật Hôn nhân & Gia đình 2014' },
    { code: 'HP2013', name: 'Hiến pháp 2013' },
    { code: 'LDN2020', name: 'Luật Doanh nghiệp 2020' }
  ];

  // Default backup sample articles if database query is empty
  const defaultArticles: LawArticle[] = [
    {
      articleId: 'BLDS2015_D117',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 117,
      title: 'Điều kiện có hiệu lực của giao dịch dân sự',
      contentRaw: '1. Giao dịch dân sự có hiệu lực khi có đủ các điều kiện sau đây:\na) Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp với giao dịch dân sự được xác lập;\nb) Chủ thể tham gia giao dịch dân sự hoàn toàn tự nguyện;\nc) Mục đích và nội dung của giao dịch dân sự không vi phạm điều cấm của luật, không trái đạo đức xã hội.\n2. Hình thức của giao dịch dân sự là điều kiện có hiệu lực của giao dịch dân sự trong trường hợp luật có quy định.',
      keywords: ['hiệu lực giao dịch dân sự', 'năng lực hành vi', 'tự nguyện', 'điều cấm của luật', 'đạo đức xã hội', 'hình thức']
    },
    {
      articleId: 'BLDS2015_D125',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 125,
      title: 'Giao dịch dân sự vô hiệu do người chưa thành niên xác lập, thực hiện',
      contentRaw: '1. Khi giao dịch dân sự do người chưa thành niên, người mất năng lực hành vi dân sự, người có khó khăn trong nhận thức, làm chủ hành vi hoặc người bị hạn chế năng lực hành vi dân sự xác lập, thực hiện thì theo yêu cầu của người đại diện của người đó, Tòa án tuyên bố giao dịch đó vô hiệu nếu theo quy định của luật giao dịch này phải do người đại diện của họ xác lập, thực hiện hoặc đồng ý.',
      keywords: ['vô hiệu', 'người chưa thành niên', 'người đại diện', 'tuyên bố vô hiệu']
    },
    {
      articleId: 'BLDS2015_D651',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 651,
      title: 'Người thừa kế theo pháp luật',
      contentRaw: '1. Những người thừa kế theo pháp luật được quy định theo thứ tự sau đây:\na) Hàng thừa kế thứ nhất gồm: vợ, chồng, cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi, con đẻ, con nuôi của người chết;\nb) Hàng thừa kế thứ hai gồm: ông nội, bà nội, ông ngoại, bà ngoại, anh ruột, chị ruột, em ruột của người chết; cháu ruột của người chết mà người chết là ông nội, bà nội, ông ngoại, bà ngoại;\nc) Hàng thừa kế thứ ba gồm: cụ nội, cụ ngoại của người chết; bác ruột, chú ruột, cậu ruột, cô ruột, dì ruột của người chết; cháu ruột của người chết mà người chết là bác ruột, chú ruột, cậu ruột, cô ruột, dì ruột; chắt ruột của người chết mà người chết là cụ nội, cụ ngoại.\n2. Những người thừa kế cùng hàng được hưởng phần di sản bằng nhau.',
      keywords: ['thừa kế theo pháp luật', 'hàng thừa kế', 'chia di sản', 'hưởng phần bằng nhau']
    },
    {
      articleId: 'BLHS2015_D134',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 134,
      title: 'Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác',
      contentRaw: '1. Người nào cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác mà tỷ lệ tổn thương cơ thể từ 11% đến 30% hoặc dưới 11% nhưng thuộc một trong các trường hợp luật định thì bị phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm.\n2. Phạm tội thuộc một trong các trường hợp sau đây thì bị phạt tù từ 02 năm đến 06 năm:\na) Dẫn đến thương tích từ 11% đến 30% nhưng thuộc trường hợp dùng hung khí nguy hiểm...',
      keywords: ['cố ý gây thương tích', 'tổn hại sức khỏe', 'tỷ lệ thương tật', 'hung khí nguy hiểm']
    },
    {
      articleId: 'BLLD2019_D17',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động 2019',
      articleNumber: 17,
      title: 'Hành vi người sử dụng lao động không được làm khi giao kết, thực hiện hợp đồng lao động',
      contentRaw: '1. Giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động.\n2. Yêu cầu người lao động phải thực hiện biện pháp bảo đảm bằng tiền hoặc tài sản khác cho việc thực hiện hợp đồng lao động.\n3. Buộc người lao động thực hiện hợp đồng lao động để trả nợ cho người sử dụng lao động.',
      keywords: ['hành vi cấm', 'giữ bằng gốc', 'giữ cccd', 'đặt cọc tiền', 'bảo đảm hợp đồng']
    },
    {
      articleId: 'BLLD2019_D25',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động 2019',
      articleNumber: 25,
      title: 'Thời gian thử việc',
      contentRaw: 'Thời gian thử việc do hai bên thỏa thuận căn cứ vào tính chất và mức độ phức tạp của công việc nhưng chỉ được thử việc một lần đối với một công việc và bảo đảm điều kiện sau đây:\n1. Không quá 180 ngày đối với công việc của người quản lý doanh nghiệp;\n2. Không quá 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn kỹ thuật từ cao đẳng trở lên;\n3. Không quá 30 ngày đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn kỹ thuật trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ;\n4. Không quá 06 ngày làm việc đối với công việc khác.',
      keywords: ['thời gian thử việc', 'quản lý doanh nghiệp', '60 ngày', '30 ngày']
    }
  ];

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const codeParam = selectedLawCode === 'ALL' ? undefined : selectedLawCode;
      const res = await api.getLaws(searchTerm.trim() || undefined, codeParam);
      if (res.success && res.articles && res.articles.length > 0) {
        setArticles(res.articles);
      } else {
        // Lọc trong danh sách mặc định nếu chưa có DB hoặc trả về rỗng
        const filtered = defaultArticles.filter((a) => {
          const matchCode = selectedLawCode === 'ALL' || a.lawCode === selectedLawCode;
          const matchSearch =
            !searchTerm.trim() ||
            a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.contentRaw.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
          return matchCode && matchSearch;
        });
        setArticles(filtered);
      }
    } catch (err) {
      // Fallback filtering on default
      const filtered = defaultArticles.filter((a) => {
        const matchCode = selectedLawCode === 'ALL' || a.lawCode === selectedLawCode;
        const matchSearch =
          !searchTerm.trim() ||
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.contentRaw.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCode && matchSearch;
      });
      setArticles(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedLawCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  const handleCopy = (article: LawArticle) => {
    const text = `${article.title} - ${article.lawName}\n${article.contentRaw}`;
    navigator.clipboard.writeText(text);
    setCopiedId(article.articleId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-red-50 via-white to-slate-50 border border-slate-200 shadow-sm overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 text-[#ec2227] text-xs font-bold border border-red-200">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KHO VĂN BẢN QUY PHẠM PHÁP LUẬT ĐẠI CƯƠNG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tra cứu Điều luật & Căn cứ Pháp lý Hiện hành
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Hệ thống cơ sở dữ liệu luật thực định chuẩn hóa, phục vụ việc đối chiếu căn cứ giải bài tập tình huống và trích dẫn chuẩn barem Bộ GD&ĐT.
          </p>
        </div>
      </div>

      {/* Search Bar & Category Filter */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-slate-200 shadow-sm focus-within:border-[#ec2227] focus-within:ring-4 focus-within:ring-red-100 transition-all p-2">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập từ khóa tra cứu (VD: điều kiện có hiệu lực, chia thừa kế, thời gian thử việc, tội gây thương tích)..."
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <Button
              type="submit"
              variant="default"
              className="bg-[#ec2227] hover:bg-[#d01c21] text-white px-5 rounded-xl font-semibold text-xs sm:text-sm shrink-0"
            >
              Tìm kiếm
            </Button>
          </div>
        </form>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {lawCategories.map((cat) => (
            <button
              key={cat.code}
              type="button"
              onClick={() => setSelectedLawCode(cat.code)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedLawCode === cat.code
                  ? 'bg-[#ec2227] text-white border-[#ec2227] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Article Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Tìm thấy <strong>{articles.length}</strong> điều khoản liên quan</span>
          <span>Trạng thái: <strong>Hiệu lực thi hành</strong></span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Đang tìm kiếm trong cơ sở dữ liệu luật...
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">Không tìm thấy điều luật phù hợp với từ khóa</div>
            <p className="text-xs">Hãy thử tìm với các từ khóa phổ biến: thừa kế, hợp đồng, thử việc, hình sự, trách nhiệm pháp lý...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art) => (
              <div
                key={art.articleId}
                className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-red-50 text-[#ec2227] border border-red-200">
                          {art.lawCode}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Điều {art.articleNumber}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {art.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(art)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                      title="Sao chép điều luật"
                    >
                      {copiedId === art.articleId ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Law Name Subtitle */}
                  <div className="text-xs text-slate-500 italic mb-3">
                    {art.lawName}
                  </div>

                  {/* Raw Content Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line font-sans">
                    {art.contentRaw}
                  </div>

                  {/* Keywords Tagging */}
                  {art.keywords && art.keywords.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {art.keywords.map((k, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                        >
                          #{k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onAskAi(`Giải thích và cho ví dụ áp dụng thực tế của ${art.title} (${art.lawName})?`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#ec2227] hover:text-[#d01c21] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hỏi AI về điều này</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onReviewAi(art.contentRaw)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <span>Rà soát văn bản</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
