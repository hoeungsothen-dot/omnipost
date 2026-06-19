import React from 'react';
import { CheckCircle, XCircle, Settings, ExternalLink, Users } from 'lucide-react';
import { useAppStore } from '../../store';
import { platformConfig, formatNumber } from '../../utils/platforms';
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

export const Platforms: React.FC = () => {
  const { platformAccounts, togglePlatformConnection } = useAppStore();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

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
                    onClick={() => togglePlatformConnection(account.id)}
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
    </div>
  );
};
