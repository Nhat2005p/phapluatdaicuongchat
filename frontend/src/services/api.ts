import {
  QueryResponse,
  QueryHistoryItem,
  BenchmarkResult,
  LawArticle,
  TextbookPrinciple,
  User,
  UserRole,
  SystemQuotaConfig,
  TransactionItem,
  CrawlSourceItem,
  CrawlJobItem,
  KnowledgeChunkItem,
  SystemSettingsData,
  PartnerApiKeyItem
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('vietlaw_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // --- Auth ---
  async login(emailOrUsername: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password })
    });
    return res.json();
  },

  async googleLogin(data: { email: string; fullName?: string; googleId?: string; avatarUrl?: string }) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async register(data: { username: string; email: string; password: string; fullName: string; studentId?: string; role?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async sendForgotOtp(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async verifyOtpAndReset(email: string, otp: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password/verify-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    return res.json();
  },

  async updateProfile(data: { fullName?: string; email?: string; avatarUrl?: string }) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return res.json();
  },

  // --- Student Query & History ---
  async solveQuery(query: string, categoryId?: string | null, previousQuery?: string | null): Promise<QueryResponse> {
    const res = await fetch(`${API_BASE}/query/solve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query,
        categoryId: categoryId || null,
        previousQuery: previousQuery || null
      })
    });
    return res.json();
  },

  async reviewDocument(content: string, documentType?: string): Promise<{
    success: boolean;
    documentType: string;
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    totalIssues: number;
    issues: Array<{
      category: string;
      severity: 'critical' | 'warning' | 'info';
      clauseText: string;
      description: string;
      legalBasis: string;
      recommendation: string;
    }>;
    validPoints: string[];
    analysisTimestamp: string;
  }> {
    const res = await fetch(`${API_BASE}/query/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, documentType })
    });
    return res.json();
  },

  async getHistory(): Promise<{ success: boolean; history: QueryHistoryItem[] }> {
    const res = await fetch(`${API_BASE}/query/history`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async clearHistory(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/query/history`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getBookmarks(): Promise<{ success: boolean; bookmarks: QueryHistoryItem[] }> {
    const res = await fetch(`${API_BASE}/query/bookmarks`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async toggleBookmark(id: string, note?: string): Promise<{ success: boolean; message: string; item: QueryHistoryItem }> {
    const res = await fetch(`${API_BASE}/query/history/${id}/bookmark`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note })
    });
    return res.json();
  },

  // --- Transactions & Billing ---
  async getTransactions(): Promise<{ success: boolean; transactions: TransactionItem[] }> {
    const res = await fetch(`${API_BASE}/transactions`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async upgradePlan(planType: string, paymentMethod?: string): Promise<{
    success: boolean;
    message: string;
    transaction: TransactionItem;
    updatedQuota?: number;
  }> {
    const res = await fetch(`${API_BASE}/transactions/upgrade`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ planType, paymentMethod })
    });
    return res.json();
  },

  // --- Council / Evaluator Benchmark ---
  async compareTiers(query?: string): Promise<{ success: boolean; data: BenchmarkResult }> {
    const res = await fetch(`${API_BASE}/benchmark/compare-tiers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query })
    });
    return res.json();
  },

  // --- Admin ---
  async getUsers(): Promise<{ success: boolean; users: User[] }> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  async updateUserStatus(userId: string, status: 'active' | 'locked', lockReason?: string): Promise<{ success: boolean; message: string; user?: any }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, lockReason })
    });
    return res.json();
  },

  async updateUserQuota(
    userId: string,
    payload: { action: 'set' | 'add' | 'reset'; amount?: number; quota?: number }
  ): Promise<{ success: boolean; message: string; user?: any }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/quota`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getUserHistory(userId: string): Promise<{
    success: boolean;
    user: any;
    history: any[];
  }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/history`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getQuotaConfig(): Promise<{ success: boolean; config: SystemQuotaConfig }> {
    const res = await fetch(`${API_BASE}/admin/quota/config`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateQuotaConfig(data: Partial<SystemQuotaConfig>): Promise<{ success: boolean; message: string; config: SystemQuotaConfig }> {
    const res = await fetch(`${API_BASE}/admin/quota/config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getPipelineStatus(): Promise<{ success: boolean; pipeline: any }> {
    const res = await fetch(`${API_BASE}/admin/pipeline`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getDashboardAnalytics(): Promise<{ success: boolean; data: any }> {
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- Law Corpus ---
  async getLaws(search?: string, lawCode?: string): Promise<{ success: boolean; articles: LawArticle[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (lawCode) params.append('lawCode', lawCode);
    const res = await fetch(`${API_BASE}/laws/articles?${params.toString()}`);
    return res.json();
  },

  async createLawArticle(data: Partial<LawArticle>): Promise<{ success: boolean; message: string; article: LawArticle }> {
    const res = await fetch(`${API_BASE}/laws/articles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getPrinciples(): Promise<{ success: boolean; principles: TextbookPrinciple[] }> {
    const res = await fetch(`${API_BASE}/laws/principles`);
    return res.json();
  },

  // --- Knowledge Base & Crawl Management ---
  async getCrawlSources(): Promise<{ success: boolean; sources: CrawlSourceItem[] }> {
    const res = await fetch(`${API_BASE}/admin/crawl/sources`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async createCrawlSource(data: Partial<CrawlSourceItem>): Promise<{ success: boolean; message: string; source: CrawlSourceItem }> {
    const res = await fetch(`${API_BASE}/admin/crawl/sources`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateCrawlSource(id: string, data: Partial<CrawlSourceItem>): Promise<{ success: boolean; message: string; source: CrawlSourceItem }> {
    const res = await fetch(`${API_BASE}/admin/crawl/sources/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteCrawlSource(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/crawl/sources/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async triggerCrawlSource(id: string): Promise<{ success: boolean; message: string; job: CrawlJobItem }> {
    const res = await fetch(`${API_BASE}/admin/crawl/sources/${id}/trigger`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getCrawlJobs(): Promise<{ success: boolean; jobs: CrawlJobItem[] }> {
    const res = await fetch(`${API_BASE}/admin/crawl/jobs`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getKnowledgeChunks(params?: { search?: string; lawCode?: string; status?: string }): Promise<{
    success: boolean;
    count: number;
    totalInVectorDb: number;
    chunks: KnowledgeChunkItem[];
  }> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.lawCode) q.append('lawCode', params.lawCode);
    if (params?.status) q.append('status', params.status);
    const res = await fetch(`${API_BASE}/admin/knowledge/chunks?${q.toString()}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async uploadNewLawDocument(data: {
    title: string;
    lawCode: string;
    documentType?: string;
    fullContent: string;
    articleNumber?: number;
  }): Promise<{ success: boolean; message: string; chunksCount: number; chunks: KnowledgeChunkItem[] }> {
    const res = await fetch(`${API_BASE}/admin/knowledge/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateKnowledgeChunk(
    id: string,
    data: { title?: string; content?: string; tags?: string[]; status?: string }
  ): Promise<{ success: boolean; message: string; chunk: KnowledgeChunkItem }> {
    const res = await fetch(`${API_BASE}/admin/knowledge/chunks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteKnowledgeChunk(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/knowledge/chunks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // --- System Settings & Services ---
  async getSystemSettings(): Promise<{ success: boolean; settings: SystemSettingsData }> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateSystemSettings(data: Partial<SystemSettingsData>): Promise<{
    success: boolean;
    message: string;
    settings: SystemSettingsData;
  }> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getAllTransactions(): Promise<{
    success: boolean;
    summary: {
      totalRevenue: number;
      completedCount: number;
      totalCount: number;
      successRate: number;
    };
    transactions: TransactionItem[];
  }> {
    const res = await fetch(`${API_BASE}/admin/transactions/all`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getPartnerApiKeys(): Promise<{ success: boolean; count: number; apiKeys: PartnerApiKeyItem[] }> {
    const res = await fetch(`${API_BASE}/admin/apikeys`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async createPartnerApiKey(data: {
    name: string;
    partnerType?: string;
    rateLimitRpm?: number;
    contactEmail: string;
    monthlyLimit?: number;
  }): Promise<{ success: boolean; message: string; apiKey: PartnerApiKeyItem }> {
    const res = await fetch(`${API_BASE}/admin/apikeys`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async togglePartnerApiKey(id: string): Promise<{ success: boolean; message: string; apiKey: PartnerApiKeyItem }> {
    const res = await fetch(`${API_BASE}/admin/apikeys/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
