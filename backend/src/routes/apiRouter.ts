import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { QueryController } from '../controllers/queryController.js';
import { BenchmarkController } from '../controllers/benchmarkController.js';
import { AdminController } from '../controllers/adminController.js';
import { LawController } from '../controllers/lawController.js';
import { TransactionController } from '../controllers/transactionController.js';
import { KnowledgeCrawlController } from '../controllers/knowledgeCrawlController.js';
import { SystemSettingsController } from '../controllers/systemSettingsController.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

export const apiRouter = Router();

// --- Auth Routes ---
apiRouter.post('/auth/register', AuthController.register);
apiRouter.post('/auth/login', AuthController.login);
apiRouter.post('/auth/google', AuthController.googleLogin);
apiRouter.get('/auth/me', authenticate, AuthController.getMe);
apiRouter.post('/auth/forgot-password/send-otp', AuthController.sendForgotOtp);
apiRouter.post('/auth/forgot-password/verify-reset', AuthController.verifyOtpAndReset);
apiRouter.patch('/auth/profile', authenticate, AuthController.updateProfile);
apiRouter.post('/auth/change-password', authenticate, AuthController.changePassword);

// --- User / Student Problem Solver Routes ---
apiRouter.post('/query/solve', authenticate, QueryController.solveQuery);
apiRouter.post('/query/review', authenticate, QueryController.reviewDocument);
apiRouter.get('/query/history', authenticate, QueryController.getHistory);
apiRouter.delete('/query/history', authenticate, QueryController.clearHistory);
apiRouter.get('/query/bookmarks', authenticate, QueryController.getBookmarks);
apiRouter.patch('/query/history/:id/bookmark', authenticate, QueryController.toggleBookmark);

// --- Billing & Transaction Routes ---
apiRouter.get('/transactions', authenticate, TransactionController.getTransactions);
apiRouter.post('/transactions/upgrade', authenticate, TransactionController.createUpgradeTransaction);

// --- Council Evaluator / Benchmark Routes ---
apiRouter.post('/benchmark/compare-tiers', authenticate, requireRole(['admin']), BenchmarkController.compareTiers);

// --- Admin Management Routes ---
apiRouter.get('/admin/users', authenticate, requireRole(['admin']), AdminController.getUsers);
apiRouter.patch('/admin/users/:id/role', authenticate, requireRole(['admin']), AdminController.updateUserRole);
apiRouter.patch('/admin/users/:id/status', authenticate, requireRole(['admin']), AdminController.updateUserStatus);
apiRouter.patch('/admin/users/:id/quota', authenticate, requireRole(['admin']), AdminController.updateUserQuota);
apiRouter.get('/admin/users/:id/history', authenticate, requireRole(['admin']), AdminController.getUserHistory);
apiRouter.get('/admin/quota/config', authenticate, requireRole(['admin']), AdminController.getQuotaConfig);
apiRouter.put('/admin/quota/config', authenticate, requireRole(['admin']), AdminController.updateQuotaConfig);
apiRouter.get('/admin/pipeline', authenticate, requireRole(['admin']), AdminController.getPipelineStatus);
apiRouter.get('/admin/analytics', authenticate, requireRole(['admin']), AdminController.getDashboardAnalytics);

// --- Law Corpus & Textbook Routes ---
apiRouter.get('/laws/articles', LawController.getLawArticles);
apiRouter.get('/laws/principles', LawController.getTextbookPrinciples);
apiRouter.post('/laws/articles', authenticate, requireRole(['admin']), LawController.createLawArticle);

// --- Knowledge Base & Crawl Management Routes (Hình 17 & 19) ---
apiRouter.get('/admin/crawl/sources', authenticate, requireRole(['admin']), KnowledgeCrawlController.getSources);
apiRouter.post('/admin/crawl/sources', authenticate, requireRole(['admin']), KnowledgeCrawlController.createSource);
apiRouter.put('/admin/crawl/sources/:id', authenticate, requireRole(['admin']), KnowledgeCrawlController.updateSource);
apiRouter.delete('/admin/crawl/sources/:id', authenticate, requireRole(['admin']), KnowledgeCrawlController.deleteSource);
apiRouter.post('/admin/crawl/sources/:id/trigger', authenticate, requireRole(['admin']), KnowledgeCrawlController.triggerCrawlSource);

apiRouter.get('/admin/crawl/jobs', authenticate, requireRole(['admin']), KnowledgeCrawlController.getCrawlJobs);

apiRouter.get('/admin/knowledge/chunks', authenticate, requireRole(['admin']), KnowledgeCrawlController.getKnowledgeChunks);
apiRouter.post('/admin/knowledge/upload', authenticate, requireRole(['admin']), KnowledgeCrawlController.uploadNewLawDocument);
apiRouter.put('/admin/knowledge/chunks/:id', authenticate, requireRole(['admin']), KnowledgeCrawlController.updateKnowledgeChunk);
apiRouter.delete('/admin/knowledge/chunks/:id', authenticate, requireRole(['admin']), KnowledgeCrawlController.deleteKnowledgeChunk);

// --- System Settings & Services Routes (Hình 21) ---
apiRouter.get('/admin/settings', authenticate, requireRole(['admin']), SystemSettingsController.getSettings);
apiRouter.put('/admin/settings', authenticate, requireRole(['admin']), SystemSettingsController.updateSettings);
apiRouter.get('/admin/transactions/all', authenticate, requireRole(['admin']), SystemSettingsController.getAllTransactions);
apiRouter.get('/admin/apikeys', authenticate, requireRole(['admin']), SystemSettingsController.getPartnerApiKeys);
apiRouter.post('/admin/apikeys', authenticate, requireRole(['admin']), SystemSettingsController.createPartnerApiKey);
apiRouter.patch('/admin/apikeys/:id/toggle', authenticate, requireRole(['admin']), SystemSettingsController.togglePartnerApiKey);
