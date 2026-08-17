import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { SocialMediaService } from './social';

const app = express();
const port = config.PORT;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Initialize Social Service
const socialService = new SocialMediaService();

// ── GET /health ──────────────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'skyra-social-service', online: true });
});

// ── GET /status ──────────────────────────────────────────────────────────
app.get('/status', (req: Request, res: Response) => {
  res.json(socialService.getStatus());
});

// ── POST /linkedin/post ──────────────────────────────────────────────────
app.post('/linkedin/post', async (req: Request, res: Response) => {
  const { content, title } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, error: 'Missing required parameter: content' });
  }

  try {
    const result = await socialService.postToLinkedIn(content, title);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /twitter/post ───────────────────────────────────────────────────
app.post('/twitter/post', async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, error: 'Missing required parameter: content' });
  }

  try {
    const result = await socialService.postToTwitter(content);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /instagram/post ─────────────────────────────────────────────────
app.post('/instagram/post', async (req: Request, res: Response) => {
  const { imageUrl, caption } = req.body;

  if (!imageUrl || !caption) {
    return res.status(400).json({ success: false, error: 'Missing required parameters: imageUrl and caption' });
  }

  try {
    const result = await socialService.postToInstagram(imageUrl, caption);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /facebook/post ──────────────────────────────────────────────────
app.post('/facebook/post', async (req: Request, res: Response) => {
  const { content, pageId } = req.body;

  if (!content || !pageId) {
    return res.status(400).json({ success: false, error: 'Missing required parameters: content and pageId' });
  }

  try {
    const result = await socialService.postToFacebook(content, pageId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Express Server
app.listen(port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Skyra-Tech Social Media Service is live!`);
  console.log(`   Local Server URL: http://localhost:${port}`);
  console.log(`======================================================\n`);
});
