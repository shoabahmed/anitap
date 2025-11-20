import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// A helpful error for the user if they forget to set up the config file.
if (SUPABASE_URL.includes('your-project-id') || SUPABASE_ANON_KEY.includes('your-public-anon-key')) {
    // We are not throwing an error here to allow the app to load and show the login screen.
    // The error will be handled gracefully within the components that use Supabase.
    console.warn(`Supabase credentials are not set. Please update them in 'config.ts' to enable authentication and data persistence.`);
}

/*
 * =================================================================================
 * IMPORTANT: Supabase Authentication Configuration
 * =================================================================================
 * For authentication (Magic Link, Password Reset, etc.) to work correctly on both
 * local development and your deployed site, you MUST configure your Supabase project:
 * 
 * 1. Go to your Supabase Project Dashboard.
 * 2. Navigate to: Authentication -> URL Configuration.
 * 
 * 3. Set 'Site URL' to your PRODUCTION URL:
 *    -> https://anitap-seven.vercel.app
 * 
 * 4. Under 'Redirect URLs', you need to add BOTH your production and local URLs.
 *    Add these two patterns:
 *    -> https://anitap-seven.vercel.app/**
 *    -> http://localhost:3000/**
 * 
 * WHY IS THIS NEEDED?
 * Supabase needs to know which URLs are safe to redirect users to after they sign in
 * or reset their password. If your app's URL is not on this approved list, Supabase
 * will block the authentication attempt, causing errors like "invalid link".
 * =================================================================================
 */

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);