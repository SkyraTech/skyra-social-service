import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { SocialMediaService } from './social';

const app = express();
const port = config.PORT;

// Standardized error formatter helper
const formatError = (message: string, code = 'INTERNAL_ERROR') => ({
  success: false,
  error: {
    code,
    message
  }
});

// Configure CORS strictly allowed for Jarvis UI Dashboard
const allowedOrigins = ['http://127.0.0.1:8000', 'http://localhost:8000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: Origin not allowed'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Initialize Social Service
const socialService = new SocialMediaService();

// ── GET /health ──────────────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  try {
    res.json(socialService.getHealthStatus());
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'HEALTH_CHECK_ERROR'));
  }
});

// ── GET /status ──────────────────────────────────────────────────────────
app.get('/status', (req: Request, res: Response) => {
  try {
    res.json(socialService.getStatus());
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'STATUS_CHECK_ERROR'));
  }
});

// ── POST /linkedin/post ──────────────────────────────────────────────────
app.post('/linkedin/post', async (req: Request, res: Response) => {
  const { content, title } = req.body;

  if (!content) {
    return res.status(400).json(formatError('Missing required parameter: content', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await socialService.postToLinkedIn(content, title);
    res.json(result);
  } catch (error: any) {
    res.status(400).json(formatError(error.message, 'LINKEDIN_POST_ERROR'));
  }
});

// ── POST /twitter/post ───────────────────────────────────────────────────
app.post('/twitter/post', async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json(formatError('Missing required parameter: content', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await socialService.postToTwitter(content);
    res.json(result);
  } catch (error: any) {
    res.status(400).json(formatError(error.message, 'TWITTER_POST_ERROR'));
  }
});

// ── POST /instagram/post ─────────────────────────────────────────────────
app.post('/instagram/post', async (req: Request, res: Response) => {
  const { imageUrl, caption } = req.body;

  if (!imageUrl || !caption) {
    return res.status(400).json(formatError('Missing required parameters: imageUrl and caption', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await socialService.postToInstagram(imageUrl, caption);
    res.json(result);
  } catch (error: any) {
    res.status(400).json(formatError(error.message, 'INSTAGRAM_POST_ERROR'));
  }
});

// ── POST /facebook/post ──────────────────────────────────────────────────
app.post('/facebook/post', async (req: Request, res: Response) => {
  const { content, pageId, link, imageUrl } = req.body;

  if (!content || !pageId) {
    return res.status(400).json(formatError('Missing required parameters: content and pageId', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await socialService.postToFacebook(content, pageId, link, imageUrl);
    res.json(result);
  } catch (error: any) {
    res.status(400).json(formatError(error.message, 'FACEBOOK_POST_ERROR'));
  }
});

// ── POST /broadcast ──────────────────────────────────────────────────────
app.post('/broadcast', async (req: Request, res: Response) => {
  const { content, title, imageUrl, pageId, platforms } = req.body;

  if (!content || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json(formatError('Missing required parameters: content and platforms (array)', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await socialService.broadcast({ content, title, imageUrl, pageId, platforms });
    res.json(result);
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'BROADCAST_ERROR'));
  }
});

// Global Error Handler Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`Express error: ${err.message}`);
  res.status(500).json(formatError(err.message, 'UNHANDLED_EXCEPTION'));
});

// Start Express Server strictly listening on loopback interface
app.listen(port, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Skyra-Tech Social Media Service is live!`);
  console.log(`   Local Server URL: http://127.0.0.1:${port}`);
  console.log(`======================================================\n`);
});
