import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { apiRouter } from './routes/apiRouter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { runSeed } from './scripts/seed.js';

import { LlamaManager } from './services/llamaManager.js';

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'VietLawAssist-NodeJS' });
});

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    await runSeed();

    app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 VietLawAssist Node.js Backend is LIVE on port ${config.port}`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api/v1`);
      console.log(`👥 Roles configured: student (User) & admin (Council/Admin)`);
      console.log(`=======================================================`);
    });

    // Start LLM model in background so Auth & API routes respond instantly
    LlamaManager.ensureRunning().catch((err) => {
      console.warn('⚠️ [Llama-Server] Khởi động mô hình trong nền gặp sự cố:', err);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
