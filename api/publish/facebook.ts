import { getUserFromRequest } from '../_lib/supabaseUser';

const FB_API_VERSION = 'v19.0';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { user, client } = await getUserFromRequest(req.headers.authorization);
  if (!user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const { caption = '', hashtags = [], mediaUrls = [], contentType = 'text' } = req.body || {};

  const { data: account, error } = await client
    .from('platform_accounts')
    .select('page_id, access_token')
    .eq('user_id', user.id)
    .eq('platform', 'facebook')
    .single();

  if (error || !account?.access_token || !account?.page_id) {
    res.status(400).json({ message: 'Facebook is not connected. Connect it from the Platforms page first.' });
    return;
  }

  const message = [caption, (hashtags as string[]).map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')]
    .filter(Boolean)
    .join('\n\n');

  try {
    let result: any;

    if (!mediaUrls.length) {
      const r = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${account.page_id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: account.access_token }),
      });
      result = await r.json();
    } else if (contentType === 'video') {
      const r = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${account.page_id}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: mediaUrls[0], description: message, access_token: account.access_token }),
      });
      result = await r.json();
    } else {
      // Single image. Multi-photo album posts are a fast-follow.
      const r = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${account.page_id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mediaUrls[0], caption: message, access_token: account.access_token }),
      });
      result = await r.json();
    }

    if (result.error) throw new Error(result.error.message || 'Facebook API error');
    res.status(200).json({ platform: 'facebook', postId: result.post_id || result.id, success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to publish to Facebook' });
  }
}
