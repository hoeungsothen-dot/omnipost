import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAPI } from '../services/api';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const PLATFORM_DEFS = [
  { id: 'facebook', label: 'Facebook Pages', icon: '📘', color: '#1877F2', docs: 'https://developers.facebook.com/docs/pages-api', fields: ['accessToken', 'pageId'] },
  { id: 'youtube', label: 'YouTube Channel', icon: '▶️', color: '#FF0000', docs: 'https://developers.google.com/youtube/v3', fields: ['accessToken', 'channelId'] },
  { id: 'instagram', label: 'Instagram Business', icon: '📸', color: '#E1306C', docs: 'https://developers.facebook.com/docs/instagram-api', fields: ['accessToken', 'accountId'] },
  { id: 'tiktok', label: 'TikTok for Business', icon: '🎵', color: '#000', docs: 'https://developers.tiktok.com', fields: ['accessToken'] },
  { id: 'linkedin', label: 'LinkedIn Page', icon: '💼', color: '#0A66C2', docs: 'https://learn.microsoft.com/en-us/linkedin', fields: ['accessToken', 'accountId'] },
  { id: 'telegram', label: 'Telegram Channel', icon: '✈️', color: '#26A5E4', docs: 'https://core.telegram.org/bots/api', fields: ['accessToken', 'channelId'] },
  { id: 'website', label: 'Website (WordPress)', icon: '🌐', color: '#21759B', docs: 'https://developer.wordpress.org/rest-api', fields: ['accessToken', 'siteUrl'] },
];

export default function PlatformsPage() {
  const qc = useQueryClient();
  const { data: platforms = [] } = useQuery({ queryKey: ['platforms'], queryFn: platformAPI.list });

  const disconnectMutation = useMutation({
    mutationFn: platformAPI.disconnect,
    onSuccess: () => { qc.invalidateQueries(['platforms']); toast.success('Disconnected'); },
  });

  const getConnection = (id) => platforms.find(p => p.platform === id);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Platform connections</h1>
      <p className="text-sm text-gray-500 mb-6">Connect your social media accounts to enable publishing</p>

      <div className="grid grid-cols-1 gap-3">
        {PLATFORM_DEFS.map(def => {
          const conn = getConnection(def.id);
          return (
            <div key={def.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${def.color}15` }}>
                {def.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{def.label}</span>
                  {conn?.connected
                    ? <span className="badge badge-green flex items-center gap-1"><CheckCircle size={10} /> Connected</span>
                    : <span className="badge badge-gray">Not connected</span>}
                </div>
                {conn?.connected && <div className="text-xs text-gray-400 mt-0.5">Account: {conn.accountName || conn.accountId}</div>}
                <div className="text-xs text-gray-400 mt-0.5">Required: {def.fields.join(', ')}</div>
              </div>
              <div className="flex items-center gap-2">
                <a href={def.docs} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1.5 px-2.5">
                  <ExternalLink size={12} /> Docs
                </a>
                {conn?.connected ? (
                  <button onClick={() => disconnectMutation.mutate(def.id)} className="btn-secondary text-xs py-1.5">Disconnect</button>
                ) : (
                  <button
                    className="btn-primary text-xs py-1.5"
                    onClick={() => toast('Enter credentials in Settings → API Keys, then use the Connect API', { icon: '💡', duration: 4000 })}
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 card p-4 bg-amber-50 border-amber-100">
        <p className="text-xs text-amber-800 font-medium mb-1">Security note</p>
        <p className="text-xs text-amber-700">Access tokens are stored encrypted. Never share your API credentials. All platform connections use official OAuth flows where available.</p>
      </div>
    </div>
  );
}
