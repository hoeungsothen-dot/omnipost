import { getUserFromRequest } from '../_lib/supabaseUser';

const FB_API_VERSION = 'v19.0';

async function waitForContainer(creationId: string, accessToken: string, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const r = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${creationId}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`
    );
    const data: any = await r.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error('Instagram media processing failed.');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Timed out waiting for Instagram to finish processing the media.');
}

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

  const { caption = '', hashtags = [], mediaUrls = [], contentType = 'image' } = req.body || {};

  if (!mediaUrls.length) {
    res.status(400).json({ message: 'Instagram requires at least one image or video.' });
    return;
  }

  const { data: account, error } = await client
    .from('platform_accounts')
    .select('page_id, access_token')
    .eq('user_id', user.id)
    .eq('platform', 'instagram')
    .single();

  if (error || !account?.access_token || !account?.page_id) {
    res.status(400).json({ message: 'Instagram is not connected. Connect Facebook + Instagram from the Platforms page first.' });
    return;
  }

  const message = [caption, (hashtags as string[]).map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')]
    .filter(Boolean)
    .join('\n\n');

  try {
    const isVideo = contentType === 'video' || contentType === 'reel';
    const createParams: Record<string, string> = {
      caption: message,
      access_token: account.access_token,
      ...(isVideo
        ? { video_url: mediaUrls[0], media_type: contentType === 'reel' ? 'REELS' : 'VIDEO' }
        : { image_url: mediaUrls[0] }),
    };

    const createRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${account.page_id}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createParams),
    });
    const createData: any = await createRes.json();
    if (createData.error) throw new Error(createData.error.message || 'Instagram media creation failed.');

    if (isVideo) {
      await waitForContainer(createData.id, account.access_token);
    }

    const publishRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${account.page_id}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: createData.id, access_token: account.access_token }),
    });
    const publishData: any = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message || 'Instagram publish failed.');

    res.status(200).json({ platform: 'instagram', postId: publishData.id, success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to publish to Instagram' });
  }
}
