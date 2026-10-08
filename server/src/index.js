import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scanRoutes from './routes/scan.routes.js';
import fixRoutes from './routes/fix.routes.js';
import reportRoutes from './routes/report.routes.js';
import { apiRateLimiter } from './security/security.js';
import { logger } from './utils/logger.js';
import { suggestAltText, suggestLinkName } from './llm/suggest.js';

import { requireAuth } from './security/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(apiRateLimiter);

// Health check (publicly accessible)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'WCAGuard',
    tagline: 'Find it. Fix it. Prove it.',
    version: '1.0.0'
  });
});

// Protect all /api routes with Supabase JWT verification (rejects unauthenticated requests with 401)
app.use('/api', requireAuth);

// Mount authenticated API routes under /api
app.use('/api', scanRoutes);
app.use('/api', fixRoutes);
app.use('/api', reportRoutes);

// Optional LLM suggestion endpoint (authenticated under /api)
app.post('/api/suggest/alt', async (req, res) => {
  const { src, context, enableAi = false } = req.body;
  const result = await suggestAltText({ src, context }, { enableAi });
  res.json(result);
});

app.post('/api/suggest/link', async (req, res) => {
  const { href, context, enableAi = false } = req.body;
  const result = await suggestLinkName({ href, context }, { enableAi });
  res.json(result);
});

// Central error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info(`WCAGuard Server listening on port ${PORT}`);
});

export default app;
