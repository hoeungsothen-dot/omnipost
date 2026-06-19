import React from 'react';
import { CheckCircle, XCircle, Settings, ExternalLink, Users, Send, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store';
import { platformConfig, formatNumber } from '../../utils/platforms';
import { telegramService } from '../../services/platforms';
import type { Platform } from '../../types';

const platformInstructions: Record<Platform, string> = {
  facebook: 'Connect via Facebook Business Manager → Settings → Page Roles → Add access token.',
  instagram: 'Link via Facebook Business Suite. Requires Instagram Professional account.',
  youtube: 'Connect via Google Cloud Console → YouTube Data API v3 → OAuth 2.0 credentials.',
  tiktok: 'Use TikTok for Business → Developer Portal → Create App → Get API keys.',
  telegram: 'Create a bot via @BotFather → Get token → Add bot as admin to your channel.',
  linkedin: 'Connect via LinkedIn Developer Portal → Create App → Products → Share on LinkedIn.',
  twitter: 'Apply at developer.twitter.com → Create Project → Get API keys & Bearer Token.',
  website: 'Configure your WordPress/website plugin or use our REST API webhook integration.',
};

const TelegramConnectModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { connectTelegram } = useAppStore();
  const [channelId, setChannelId] = React.useState('');
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ ok: boolean; title?: string; error?: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const hasToken = Boolean(import.meta.env.VITE_TELEGRAM_BOT_TOKEN);

  const handleTest = async () => {
    if (!channelId.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const chat = await telegramService.testChannel(channelId.trim());
      setTestResult({ ok: true, title: chat.title || chat.username || channelId });
    } catch (err: any) {
      setTestResult({ ok: false, error: err.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!testResult?.ok) return;
    setSaving(true);
    try {
      await connectTelegram(channelId.trim(), testResult.title || channelId.trim());
      onClose();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: 480, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={20} color="#2AABEE" /> Connect Telegram
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        {!hasToken && (
          <div style={{ background: '#fef3c7', color: '#92400e', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            ⚠️ No bot token found. Add <code>VITE_TELEGRAM_BOT_TOKEN</code> in Vercel environment variables and redeploy first.
          </div>
        )}

        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
          Enter your channel's username (e.g. <code>@eescstore</code>) or numeric chat ID.
          Make sure your bot is added as an <strong>Administrator</strong> with post permissions.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Channel ID</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={channelId}
              onChange={(e) => { setChannelId(e.target.value); setTestResult(null); }}
              placeholder="@eescstore"
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={handleTest}
              disabled={testing || !channelId.trim() || !hasToken}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: testing ? '#e5e7eb' : '#2AABEE', color: '#fff',
                fontWeight: 600, fontSize: 13, cursor: testing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              {testing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              Test
            </button>
          </div>
        </div>

        {testResult && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            background: testResult.ok ? '#f0fdf4' : '#fef2f2',
            color: testResult.ok ? '#16a34a' : '#dc2626',
          }}>
            {testResult.ok ? `✅ Connected to "${testResult.title}"` : `❌ ${testResult.error}`}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!testResult?.ok || saving}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: testResult?.ok ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb',
            color: testResult?.ok ? '#fff' : '#9ca3af',
            fontWeight: 600, fontSize: 14, cursor: testResult?.ok ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving...' : 'Save Connection'}
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export const Platforms: React.FC = () => {
  const { platformAccounts, togglePlatformConnection } = useAppStore();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showTelegramModal, setShowTelegramModal] = React.useState(false);

  const connected = platformAccounts.filter((p) => p.connected);
  const disconnected = platformAccounts.filter((p) => !p.connected);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Platforms</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
          {connected.length} connected · {disconnected.length} available to connect
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 16, padding: '20px 24px', color: '#fff' }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{connected.length}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Connected platforms</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>
            {formatNumber(platformAccounts.filter(p => p.connected).reduce((s, p) => s + (p.followers || 0), 0))}
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Total followers</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{disconnected.length}</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Available to connect</div>
        </div>
      </div>

      {/* Platform cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {platformAccounts.map((account) => {
          const cfg = platformConfig[account.platform];
          const isExpanded = expandedId === account.id;

          return (
            <div key={account.id} style={{
              background: '#fff', borderRadius: 16,
              border: `1.5px solid ${account.connected ? cfg.color + '30' : '#f3f4f6'}`,
              overflow: 'hidden', transition: 'all 0.2s',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 16,
              }}>
                {/* Platform badge */}
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: cfg.bgColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: cfg.color, flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{cfg.label}</span>
                    {account.connected ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '2px 8px', borderRadius: 20 }}>
                        <CheckCircle size={10} /> Connected
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af', fontWeight: 600, background: '#f3f4f6', padding: '2px 8px', borderRadius: 20 }}>
                        <XCircle size={10} /> Not connected
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {account.connected ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span>{account.name}</span>
                        <span style={{ color: '#4b5563' }}>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={11} /> {formatNumber(account.followers || 0)} followers
                        </span>
                      </span>
                    ) : 'Click "Connect" to link this platform'}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : account.id)}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280' }}
                  >
                    <Settings size={13} /> How to
                  </button>
                  <button
                    onClick={() => {
                      if (account.platform === 'telegram' && !account.connected) {
                        setShowTelegramModal(true);
                      } else {
                        togglePlatformConnection(account.id);
                      }
                    }}
                    style={{
                      padding: '7px 16px', borderRadius: 8, border: 'none',
                      background: account.connected ? '#fee2e2' : `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)`,
                      color: account.connected ? '#dc2626' : '#fff',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    {account.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>

              {/* Expanded instructions */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 20px', background: '#fafafa' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    How to connect {cfg.label}:
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
                    {platformInstructions[account.platform]}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Supported content types:</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {cfg.supportedContent.map((t) => (
                        <span key={t} style={{ fontSize: 11, background: cfg.bgColor, color: cfg.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showTelegramModal && <TelegramConnectModal onClose={() => setShowTelegramModal(false)} />}
    </div>
  );
};
