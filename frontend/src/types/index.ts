export type UserRole = 'student' | 'moderator' | 'admin';

export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  studentId?: string;
  avatarUrl?: string;
  status?: 'active' | 'locked';
  lockReason?: string;
  lockedAt?: string;
  questionsQuota?: number;
  questionsUsed?: number;
  remainingQuestions?: number;
  quotaResetDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemQuotaConfig {
  defaultNewUserQuota: number;
  monthlyAutoReset: boolean;
  warningThresholdPercent: number;
}

export interface Citation {
  rawText: string;
  lawCode: string;
  articleNumber: number;
  clauseNumber?: number;
  verified: boolean;
  lawTitle?: string;
}

export interface QueryResponse {
  success: boolean;
  intentCode: string;
  response: string;
  citations: Citation[];
  guardrailMetrics: {
    verifiedCount: number;
    totalFound: number;
    precisionRate: number;
  };
  retrievedArticles: Array<{
    articleId: string;
    lawCode: string;
    articleNumber: number;
    title: string;
    contentRaw?: string;
  }>;
  textbookFramework?: string;
  theoryContent?: string;
  latencyMs: number;
  remainingQuestions?: number;
  message?: string;
}

export interface QueryHistoryItem {
  _id: string;
  query: string;
  intentCode: string;
  response: string;
  activityType?: 'solver' | 'review' | 'search';
  isBookmarked?: boolean;
  bookmarkNote?: string;
  bookmarkedAt?: string;
  reviewMetadata?: {
    score: number;
    riskLevel: string;
    totalIssues: number;
    documentType: string;
  };
  citations: Citation[];
  verifiedCitationsCount: number;
  tier: string;
  latencyMs: number;
  createdAt: string;
}

export interface TransactionItem {
  _id: string;
  userId: string;
  userEmail: string;
  transactionCode: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  billingCycle: string;
  questionsAdded: number;
  createdAt: string;
}

export interface TierOutput {
  tierNumber: number;
  tierName: string;
  technology: string;
  response: string;
  latencyMs: number;
  baremAdherenceScore: number;
  hallucinationRate: number;
  citationPrecision: number;
  strengths: string[];
  weaknesses: string[];
}

export interface BenchmarkResult {
  query: string;
  intentCode: string;
  tiers: TierOutput[];
  evaluationSummary: {
    bestTier: string;
    baremImprovement: string;
    citationAccuracyImprovement: string;
  };
}

export interface LawArticle {
  _id?: string;
  articleId: string;
  lawCode: string;
  lawName: string;
  articleNumber: number;
  clauseNumber?: number;
  title: string;
  contentRaw: string;
  keywords: string[];
}

export interface TextbookPrinciple {
  _id?: string;
  principleId: string;
  chapter: string;
  topicCode: string;
  frameworkTitle: string;
  theoryContent: string;
}

export interface CrawlSourceItem {
  _id: string;
  id?: string;
  name: string;
  url: string;
  category: 'Luật & Bộ luật' | 'Nghị định & Thông tư' | 'Giáo trình & Barem PLDC' | 'Án lệ & Giải đáp';
  crawlFrequency: 'Hàng ngày' | 'Hàng tuần' | 'Thủ công';
  status: 'active' | 'paused' | 'error';
  lastCrawlAt?: string;
  extractedDocsCount: number;
  selectorRules?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrawlJobItem {
  _id: string;
  id?: string;
  jobCode: string;
  sourceName: string;
  sourceUrl: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  status: 'completed' | 'in_progress' | 'failed';
  docsExtracted: number;
  chunksGenerated: number;
  errorLog?: string;
  triggeredBy: string;
}

export interface KnowledgeChunkItem {
  _id: string;
  id?: string;
  chunkId: string;
  sourceDoc: string;
  lawCode: string;
  articleNumber?: number;
  clauseNumber?: number;
  title: string;
  content: string;
  embeddingModel: string;
  vectorDimensions: number;
  status: 'indexed' | 'pending' | 'updated';
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingPlanItem {
  id: string;
  name: string;
  price: number;
  questionsLimit: number;
  durationDays: number;
  status: 'active' | 'paused';
  description: string;
  badge?: string;
}

export interface SystemSettingsData {
  autoCrawl: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    executionTime: string;
    maxDocsPerCrawl: number;
    retryAttempts: number;
  };
  pricingPlans: PricingPlanItem[];
  contactSupport: {
    hotline: string;
    email: string;
    workHours: string;
    copyright: string;
    disclaimer: string;
  };
}

export interface PartnerApiKeyItem {
  _id: string;
  id?: string;
  name: string;
  key: string;
  partnerType: string;
  rateLimitRpm: number;
  status: 'active' | 'revoked';
  requestsUsed: number;
  monthlyLimit: number;
  lastUsedAt?: string;
  contactEmail: string;
  createdAt?: string;
}
