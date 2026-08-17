import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  PORT: process.env.SOCIAL_SERVICE_PORT || 8005,
  LINKEDIN_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN || '',
  LINKEDIN_ORG_ID: process.env.LINKEDIN_ORGANIZATION_ID || '',
  TWITTER_BEARER: process.env.TWITTER_BEARER_TOKEN || '',
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
  INSTAGRAM_ACCOUNT_ID: process.env.INSTAGRAM_ACCOUNT_ID || '',
};
