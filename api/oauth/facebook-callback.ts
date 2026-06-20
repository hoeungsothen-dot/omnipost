import { supabaseAdmin } from '../_lib/supabaseAdmin';

// Vercel Serverless Function (Node runtime, zero-config under /api).
// Registered as the redirect_uri in the Meta App: see docs/facebook-instagram-setup.md.

const FB_API_VERSION = 'v19.0';

export default async function handler(req: any, res: any) {
  const { code, state, error: oauthError, error_description } = req.query;
  const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || `https://${req.headers.host}`).replace(/\/$/, '');

  function redirectWithStatus(kind: 'connected' | 'error', detail: string) {
    const url = new URL('/platforms', appUrl);
    url.searchParams.set(kind, detail);
    res.writeHead(302, { Location: url.toString() });
    res.end();
  }

  if (oauthError) {
    return redirectWithStatus('error', String(error_description || oauthError));
  }
  if (!code || !state) {
    return redirectWithStatus('error', 'Missing code or state from Facebook.');
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf8'));
    if (!decoded.userId) throw new Error('No userId in state');
    userId = decoded.userId;
  } catch {
    return redirectWithStatus('error', 'Invalid or expired connect link. Please try connecting again.');
  }

  const appId = process.env.FB_APP_ID || process.env.VITE_FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) {
    return redirectWithStatus('error', 'Facebook app credentials are not configured on the server yet.');
  }

  const redirectUri = `${appUrl}/api/oauth/facebook-callback`;

  try {
    // 1. Exchange the auth code for a short-lived user access token.
    const tokenRes = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?` +
        new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code: String(code) }).toString()
    );
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error?.message || 'Token exchange failed.');

    // 2. Exchange for a long-lived user token (~60 days).
    const longLivedRes = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: tokenData.access_token,
        }).toString()
    );
    const longLivedData: any = await longLivedRes.json();
    const userToken = longLivedData.access_token || tokenData.access_token;

    // 3. List the Pages this user manages. Each Page comes with its own
    //    Page access token, which stays valid as long as the user token does.
    const pagesRes = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/me/accounts?access_token=${encodeURIComponent(userToken)}`
    );
    const pagesData: any = await pagesRes.json();
    const pages: any[] = pagesData.data || [];
    if (!pages.length) {
      return redirectWithStatus('error', 'No Facebook Pages found. You need to be an admin of at least one Page to connect.');
    }

    // 4. v1: connect the first Page that has a linked Instagram Business
    //    account; otherwise fall back to the first Page (Facebook only).
    //    Multi-page selection is a known fast-follow, not built yet.
    let chosenPage = pages[0];
    let igAccount: { id: string; username?: string } | null = null;
    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/${FB_API_VERSION}/${page.id}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(page.access_token)}`
      );
      const igData: any = await igRes.json();
      if (igData.instagram_business_account) {
        chosenPage = page;
        igAccount = igData.instagram_business_account;
        break;
      }
    }

    await supabaseAdmin.from('platform_accounts').upsert(
      {
        user_id: userId,
        platform: 'facebook',
        name: chosenPage.name,
        handle: chosenPage.id,
        page_id: chosenPage.id,
        access_token: chosenPage.access_token,
        connected: true,
      },
      { onConflict: 'user_id,platform' }
    );

    if (igAccount) {
      await supabaseAdmin.from('platform_accounts').upsert(
        {
          user_id: userId,
          platform: 'instagram',
          name: igAccount.username || 'Instagram',
          handle: igAccount.username || igAccount.id,
          page_id: igAccount.id,
          access_token: chosenPage.access_token,
          connected: true,
        },
        { onConflict: 'user_id,platform' }
      );
    }

    return redirectWithStatus('connected', igAccount ? 'facebook,instagram' : 'facebook');
  } catch (err: any) {
    return redirectWithStatus('error', err.message || 'Facebook connection failed.');
  }
}
