import { config } from './config';

export interface SocialResponse {
  success: boolean;
  platform: string;
  postId?: string;
  mocked: boolean;
  mock?: boolean;
  timestamp: string;
  error?: string;
}

export interface BroadcastPayload {
  content: string;
  title?: string;
  imageUrl?: string;
  pageId?: string;
  platforms: string[];
}

export class SocialMediaService {
  private isLinkedinMock = config.LINKEDIN_MOCK;
  private isTwitterMock = config.TWITTER_MOCK;
  private isInstagramMock = config.INSTAGRAM_MOCK;
  private isFacebookMock = config.FACEBOOK_MOCK;

  constructor() {
    console.log('📢 Social Media Service Initialized');
    console.log(`   LinkedIn Integration: ${this.isLinkedinMock ? 'DRY-RUN/MOCK' : 'LIVE'}`);
    console.log(`   Twitter Integration: ${this.isTwitterMock ? 'DRY-RUN/MOCK' : 'LIVE'}`);
    console.log(`   Instagram Integration: ${this.isInstagramMock ? 'DRY-RUN/MOCK' : 'LIVE'}`);
    console.log(`   Facebook Integration: ${this.isFacebookMock ? 'DRY-RUN/MOCK' : 'LIVE'}`);
  }

  public getStatus() {
    return {
      linkedin: this.isLinkedinMock ? 'mock' : 'live',
      twitter: this.isTwitterMock ? 'mock' : 'live',
      instagram: this.isInstagramMock ? 'mock' : 'live',
      facebook: this.isFacebookMock ? 'mock' : 'live',
    };
  }

  public getHealthStatus() {
    return {
      status: 'OK',
      adapters: {
        linkedin: { configured: !!config.LINKEDIN_TOKEN || this.isLinkedinMock, mock: this.isLinkedinMock },
        twitter: { configured: !!config.TWITTER_BEARER || this.isTwitterMock, mock: this.isTwitterMock },
        instagram: { configured: (!!config.META_ACCESS_TOKEN && !!config.INSTAGRAM_ACCOUNT_ID) || this.isInstagramMock, mock: this.isInstagramMock },
        facebook: { configured: !!config.META_ACCESS_TOKEN || this.isFacebookMock, mock: this.isFacebookMock }
      }
    };
  }

  // ── LINKEDIN POSTING ───────────────────────────────────────────────────
  public async postToLinkedIn(content: string, title?: string): Promise<SocialResponse> {
    // 1. Validation Constraints
    if (!content) {
      throw new Error('Content is required for LinkedIn post.');
    }
    if (content.length > 3000) {
      throw new Error('LinkedIn post exceeds maximum limit of 3,000 characters.');
    }

    if (this.isLinkedinMock) {
      console.log(`[DRY-RUN] LinkedIn organization post: '${title || "Post"}' | ${content.slice(0, 100)}...`);
      return { success: true, platform: 'linkedin', mock: true, postId: `mock-li-${Date.now()}`, mocked: true, timestamp: new Date().toISOString() };
    }

    try {
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.LINKEDIN_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: `urn:li:organization:${config.LINKEDIN_ORG_ID}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: content },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.message || 'LinkedIn posting failed');

      return { success: true, platform: 'linkedin', postId: data.id, mocked: false, timestamp: new Date().toISOString() };
    } catch (error: any) {
      console.error(`LinkedIn API Error: ${error.message}`);
      throw error;
    }
  }

  // ── TWITTER POSTING ────────────────────────────────────────────────────
  public async postToTwitter(content: string): Promise<SocialResponse> {
    // 1. Validation Constraints
    if (!content) {
      throw new Error('Content is required for Twitter post.');
    }
    if (content.length > 280) {
      throw new Error(`Twitter post exceeds limit of 280 characters (current: ${content.length} chars).`);
    }

    if (this.isTwitterMock) {
      console.log(`[DRY-RUN] Twitter post: ${content.slice(0, 100)}...`);
      return { success: true, platform: 'twitter', mock: true, postId: `mock-tw-${Date.now()}`, mocked: true, timestamp: new Date().toISOString() };
    }

    try {
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.TWITTER_BEARER}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: content })
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Twitter posting failed');

      return { success: true, platform: 'twitter', postId: data.data.id, mocked: false, timestamp: new Date().toISOString() };
    } catch (error: any) {
      console.error(`Twitter API Error: ${error.message}`);
      throw error;
    }
  }

  // ── INSTAGRAM POSTING ──────────────────────────────────────────────────
  public async postToInstagram(imageUrl: string, caption: string): Promise<SocialResponse> {
    // 1. Validation Constraints
    if (!imageUrl) {
      throw new Error('Image URL is required for Instagram posts.');
    }
    if (caption && caption.length > 2200) {
      throw new Error('Instagram caption exceeds maximum limit of 2,200 characters.');
    }

    if (this.isInstagramMock) {
      console.log(`[DRY-RUN] Instagram upload: Image: ${imageUrl} | Caption: ${caption.slice(0, 50)}...`);
      return { success: true, platform: 'instagram', mock: true, postId: `mock-ig-${Date.now()}`, mocked: true, timestamp: new Date().toISOString() };
    }

    try {
      // 1. Create Media Container
      const containerUrl = `https://graph.facebook.com/v19.0/${config.INSTAGRAM_ACCOUNT_ID}/media`;
      const containerRes = await fetch(containerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: config.META_ACCESS_TOKEN
        })
      });

      const containerData: any = await containerRes.json();
      if (!containerRes.ok) throw new Error(containerData.error?.message || 'IG Container creation failed');
      const creationId = containerData.id;

      // 2. Publish Media Container
      const publishUrl = `https://graph.facebook.com/v19.0/${config.INSTAGRAM_ACCOUNT_ID}/media_publish`;
      const publishRes = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: config.META_ACCESS_TOKEN
        })
      });

      const publishData: any = await publishRes.json();
      if (!publishRes.ok) throw new Error(publishData.error?.message || 'IG Media Publish failed');

      return { success: true, platform: 'instagram', postId: publishData.id, mocked: false, timestamp: new Date().toISOString() };
    } catch (error: any) {
      console.error(`Instagram API Error: ${error.message}`);
      throw error;
    }
  }

  // ── FACEBOOK POSTING ───────────────────────────────────────────────────
  public async postToFacebook(content: string, pageId: string, link?: string, imageUrl?: string): Promise<SocialResponse> {
    // 1. Validation Constraints
    if (!content) {
      throw new Error('Content is required for Facebook post.');
    }
    if (!pageId) {
      throw new Error('Page ID is required for Facebook post.');
    }

    if (this.isFacebookMock) {
      console.log(`[DRY-RUN] Facebook post to Page ${pageId}: ${content.slice(0, 100)}...`);
      return { success: true, platform: 'facebook', mock: true, postId: `mock-fb-${Date.now()}`, mocked: true, timestamp: new Date().toISOString() };
    }

    try {
      const payload: any = {
        message: content,
        access_token: config.META_ACCESS_TOKEN
      };
      if (link) payload.link = link;
      if (imageUrl) payload.picture = imageUrl;

      const response = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Facebook posting failed');

      return { success: true, platform: 'facebook', postId: data.id, mocked: false, timestamp: new Date().toISOString() };
    } catch (error: any) {
      console.error(`Facebook API Error: ${error.message}`);
      throw error;
    }
  }

  // ── UNIFIED BROADCAST ──────────────────────────────────────────────────
  public async broadcast(payload: BroadcastPayload): Promise<{ success: boolean; results: SocialResponse[] }> {
    const { content, title, imageUrl, pageId, platforms } = payload;

    const tasks = platforms.map(async (platform): Promise<SocialResponse> => {
      try {
        let res: SocialResponse;
        if (platform === 'linkedin') {
          res = await this.postToLinkedIn(content, title);
        } else if (platform === 'twitter') {
          res = await this.postToTwitter(content);
        } else if (platform === 'instagram') {
          res = await this.postToInstagram(imageUrl || '', content);
        } else if (platform === 'facebook') {
          res = await this.postToFacebook(content, pageId || 'mock-page-id', undefined, imageUrl);
        } else {
          throw new Error(`Unsupported broadcast platform: ${platform}`);
        }
        return res;
      } catch (err: any) {
        return {
          success: false,
          platform,
          mocked: platform === 'linkedin' ? this.isLinkedinMock : (platform === 'twitter' ? this.isTwitterMock : (platform === 'instagram' ? this.isInstagramMock : this.isFacebookMock)),
          timestamp: new Date().toISOString(),
          error: err.message
        };
      }
    });

    const settled = await Promise.allSettled(tasks);
    const results: SocialResponse[] = settled.map((item, idx) => {
      if (item.status === 'fulfilled') {
        return item.value;
      } else {
        return {
          success: false,
          platform: platforms[idx],
          mocked: false,
          timestamp: new Date().toISOString(),
          error: 'Promise rejected: ' + String(item.reason)
        };
      }
    });

    const overallSuccess = results.every(r => r.success);
    return { success: overallSuccess, results };
  }
}
