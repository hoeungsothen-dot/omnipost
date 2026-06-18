import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAPI } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { CheckCircle, ExternalLink, Loader2, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PLATFORM_DEFS = [
  { id: 'facebook', label: 'Facebook Pages', icon: '📘', color: '#1877F2', bg: '#E7F0FD', authType: 'oauth', oauthPath: '/api/oauth/facebook', description: 'Publish posts, photos, and videos to your Facebook Page.', docs: 'https://developers.facebook.com/docs/pages-api' },
  { id: 'instagram', label: 'Instagram Business', icon: '📸', color: '#E1306C', bg: '#FDE8F0', authType: 'oauth', oauthPath: '/api/oauth/facebook', description: 'Post images and Reels to your Instagram Business account.', docs: 'https://developers.facebook.com/docs/instagram-api', note: 'Connected automatically via Facebook OAuth.' },
  { id: 'youtube', label: 'YouTube Channel', icon: '▶️', color: '#FF0000', bg: '#FFE8E8', authType: 'oauth', oauthPath: '/api/oauth/google', description: 'Upload videos directly to your YouTube channel.', docs: 'https://developers.google.com/youtube/v3' },
  { id: 'tiktok', label: 'TikTok for Business', icon: '🎵', color: '#010101', bg: '#F0F0F0', authType: 'oauth', oauthPath: '/api/oauth/tiktok', description: 'Post short-form videos to TikTok.', docs: 'https://developers.tiktok.com' },
  { id: 'linkedin', label: 'LinkedIn Page', icon: '💼', color: '#0A66C2', bg: '#E8F0FB', authType: 'oauth', oauthPath: '/api/oauth/linkedin', description: 'Publish professional posts and articles to LinkedIn.', docs: 'https://learn.microsoft.com/en-us/linkedin' },
  { id: 'telegram', label: 'Telegram Channel', icon: '✈️', color: '#26A5E4', bg: '#E4F4FD', authType: 'manual', fields: [{ key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF...', type: 'password' }, { key: 'channelId', label: 'Channel ID / Username', placeholder: '@mychannel', type: 'text' }], description: 'Send messages and media to your Telegram channel via a bot.', docs: 'https://core.telegram.org/bots' },
  { id: 'website', label: 'Website (WordPress)', icon: '🌐', color: '#21759B', bg: '#E8F3F8', authType: 'manual', fields: [{ key: 'siteUrl', label: 'Site URL', placeholder: 'https://yoursite.com', type: 'url' }, { key: 'username', label: 'WordPress Username', placeholder: 'admin', type: 'text' }, { key: 'appPassword', label: 'Application Password', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password' }], description: 'Publish blog posts to your WordPress site via REST API.', docs: 'https://developer.wordpress.org/rest-api' },
];

function ManualConnectModal({ platform, onClose, onConnect }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try { await onConnect(form); onClose(); }
    catch (e) { toast.error(e.message || 'Connection failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{platform.icon}</span>
            <div>
              <div className="text-sm font-semibold text-gray-900">Connect {platform.label}</div>
              <div className="text-xs text-gray-400">{platform.description}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"><X size={14} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {platform.fields.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input className="input" type={f.type} placeholder={f.placeholder} value={form[f.key] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
            </div>
          ))}
          <a href={platform.docs} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"><ExternalLink size={11} /> View setup docs</a>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={submit} className="btn-primary flex-1 justify-center" disabled={loading}>{loading ? <Loader2 size={13} className="animate-spin" /> : 'Connect'}</button>
        </div>
      </div>
    </div>
  );
}

export default function PlatformsPage() {
  const qc = useQueryClient();
  const { workspace } = useAuthStore();
  const [modal, setModal] = useState(null);
  const { data: platforms = [] } = useQuery({ queryKey: ['platforms'], queryFn: platformAPI.list });
  const disconnectMutation = useMutation({ mutationFn: platformAPI.disconnect, onSuccess: () => { qc.invalidateQueries(['platforms']); toast.success('Disconnected'); } });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected) { toast.success(`Connected: ${connected}`); qc.invalidateQueries(['platforms']); window.history.replaceState({}, '', '/platforms'); }
    if (error) { toast.error(`OAuth error: ${error}`); window.history.replaceState({}, '', '/platforms'); }
  }, []);

  const getConn = (id) => platforms.find(p => p.platform === id);

  const handleManualConnect = async (def, form) => {
    if (def.id === 'telegram') await api.post('/oauth/telegram', { workspaceId: workspace._id, ...form });
    else if (def.id === 'website') await api.post('/oauth/website', { workspaceId: workspace._id, ...form });
    qc.invalidateQueries(['platforms']);
    toast.success(`${def.label} connected!`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Platform connections</h1>
        <p className="text-sm text-gray-500 mt-0.5">{platforms.filter(p => p.connected).length} of {PLATFORM_DEFS.length} platforms connected</p>
      </div>
      <div className="card p-4 mb-5 flex items-center gap-4">
        <div className="flex gap-2 flex-wrap flex-1">
          {PLATFORM_DEFS.map(def => { const conn = getConn(def.id); return (<div key={def.id} title={def.label} className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${conn?.connected ? 'opacity-100 shadow' : 'opacity-20 grayscale'}`} style={{ background: def.bg }}>{def.icon}</div>); })}
        </div>
        <div className="text-xs text-gray-500 flex-shrink-0"><span className="text-2xl font-semibold text-gray-900">{platforms.filter(p => p.connected).length}</span>/{PLATFORM_DEFS.length} connected</div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {PLATFORM_DEFS.map(def => {
          const conn = getConn(def.id);
          const isConnected = conn?.connected;
          return (
            <div key={def.id} className={`card p-4 flex items-center gap-4 ${isConnected ? 'border-l-4' : ''}`} style={isConnected ? { borderLeftColor: def.color } : {}}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: def.bg }}>{def.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-800">{def.label}</span>
                  {isConnected ? <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle size={9} /> Connected</span> : <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not connected</span>}
                </div>
                <div className="text-xs text-gray-400">{def.description}</div>
                {isConnected && conn.accountName && <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>{conn.accountName}</div>}
                {def.note && !isConnected && <div className="text-xs text-blue-500 mt-1 flex items-center gap-1"><AlertCircle size={10} />{def.note}</div>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={def.docs} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1.5 px-2 text-gray-400"><ExternalLink size={12} /></a>
                {isConnected ? (<button onClick={() => disconnectMutation.mutate(def.id)} className="btn-secondary text-xs py-1.5">Disconnect</button>)
                : def.id === 'instagram' ? (<span className="text-xs text-gray-400 italic">Via Facebook</span>)
                : def.authType === 'oauth' ? (<button onClick={() => window.location.href = `${def.oauthPath}?workspaceId=${workspace._id}`} className="btn-primary text-xs py-1.5">Connect with OAuth</button>)
                : (<button onClick={() => setModal(def)} className="btn-primary text-xs py-1.5">Connect</button>)}
              </div>
            </div>
          );
        })}
      </div>
      {modal && <ManualConnectModal platform={modal} onClose={() => setModal(null)} onConnect={(form) => handleManualConnect(modal, form)} />}
    </div>
  );
}
