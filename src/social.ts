import { config } from './config';

export class SocialMediaService {
  private isLinkedinMock = !config.LINKEDIN_TOKEN;
  private isTwitterMock = !config.TWITTER_BEARER;
  private isMetaMock = !config.META_ACCESS_TOKEN;

  constructor() {
    console.log('📢 Social Media Service Initialized');
    console.log(`   LinkedIn Integration: ${this.isLinkedinMock ? 'DRY-RUN/MOCK' : 'LIVE'}`);
    console.log(`   Twitter Integration: ${this.isTwitterMock ? 'DRY-RUN/MOCK' : 'LIVE'}`);
    console.log(`   Meta (IG/FB) Integration: ${this.isMetaMock ? 'DRY-RUN/MOCK' : 'LIVE'}`);
  }

  public getStatus() {
    return {
      linkedin: this.isLinkedinMock ? 'mock' : 'live',
      twitter: this.isTwitterMock ? 'mock' : 'live',
      meta: this.isMetaMock ? 'mock' : 'live',
    };
  }

  // ── LINKEDIN POSTING ───────────────────────────────────────────────────
  public async postToLinkedIn(content: string, title?: string): Promise<any> {
    if (this.isLinkedinMock) {
      console.log(`[DRY-RUN] LinkedIn organization post: '${title || "Post"}' | ${content.slice(0, 100)}...`);
      return { success: true, platform: 'linkedin', mock: true, postId: `mock-li-${Date.now()}` };
    }

    try {
      // API call to LinkedIn UGC Share API
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

      return { success: true, platform: 'linkedin', postId: data.id };
    } catch (error: any) {
      console.error(`LinkedIn API Error: ${error.message}`);
      throw error;
    }
  }

  // ── TWITTER POSTING ────────────────────────────────────────────────────
  public async postToTwitter(content: string): Promise<any> {
    if (this.isTwitterMock) {
      console.log(`[DRY-RUN] Twitter post: ${content.slice(0, 100)}...`);
      return { success: true, platform: 'twitter', mock: true, tweetId: `mock-tw-${Date.now()}` };
    }

    try {
      // API call to Twitter v2 Tweets API
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

      return { success: true, platform: 'twitter', tweetId: data.data.id };
    } catch (error: any) {
      console.error(`Twitter API Error: ${error.message}`);
      throw error;
    }
  }

  // ── INSTAGRAM POSTING ──────────────────────────────────────────────────
  public async postToInstagram(imageUrl: string, caption: string): Promise<any> {
    if (this.isMetaMock) {
      console.log(`[DRY-RUN] Instagram upload: Image: ${imageUrl} | Caption: ${caption.slice(0, 50)}...`);
      return { success: true, platform: 'instagram', mock: true, mediaId: `mock-ig-${Date.now()}` };
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

      return { success: true, platform: 'instagram', mediaId: publishData.id };
    } catch (error: any) {
      console.error(`Instagram API Error: ${error.message}`);
      throw error;
    }
  }

  // ── FACEBOOK POSTING ───────────────────────────────────────────────────
  public async postToFacebook(content: string, pageId: string): Promise<any> {
    if (this.isMetaMock) {
      console.log(`[DRY-RUN] Facebook post to Page ${pageId}: ${content.slice(0, 100)}...`);
      return { success: true, platform: 'facebook', mock: true, postId: `mock-fb-${Date.now()}` };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          access_token: config.META_ACCESS_TOKEN
        })
      });

      const data: any = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Facebook posting failed');

      return { success: true, platform: 'facebook', postId: data.id };
    } catch (error: any) {
      console.error(`Facebook API Error: ${error.message}`);
      throw error;
    }
  }
}
