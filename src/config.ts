import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  PORT: parseInt(process.env.SOCIAL_SERVICE_PORT || '8005', 10),
  LINKEDIN_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN || '',
  LINKEDIN_ORG_ID: process.env.LINKEDIN_ORGANIZATION_ID || '',
  TWITTER_BEARER: process.env.TWITTER_BEARER_TOKEN || '',
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
  INSTAGRAM_ACCOUNT_ID: process.env.INSTAGRAM_ACCOUNT_ID || '',
  
  // Pluggable Adapter Mock Switches (defaulting to true)
  LINKEDIN_MOCK: process.env.LINKEDIN_MOCK !== 'false',
  TWITTER_MOCK: process.env.TWITTER_MOCK !== 'false',
  INSTAGRAM_MOCK: process.env.INSTAGRAM_MOCK !== 'false',
  FACEBOOK_MOCK: process.env.FACEBOOK_MOCK !== 'false'
};
