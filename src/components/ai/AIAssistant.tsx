import React, { useState } from 'react';
import { Sparkles, Send, Copy, RefreshCw } from 'lucide-react';
import { platformConfig } from '../../utils/platforms';
import type { Platform } from '../../types';

const PLATFORMS: Platform[] = ['facebook', 'instagram', 'youtube', 'tiktok', 'telegram', 'linkedin', 'twitter'];

const toneOptions = ['Professional', 'Casual', 'Humorous', 'Inspirational', 'Urgent', 'Friendly'];

const generateCaption = (topic: string, platform: Platform, tone: string): string => {
  const toneMap: Record<string, string[]> = {
    Professional: ['We are pleased to announce', 'We invite you to explore', 'Discover our latest'],
    Casual: ["Hey everyone! 👋", "Check this out!", "You're going to love this 🔥"],
    Humorous: ['Plot twist:', 'Nobody asked, but here it is anyway 😄', 'Warning: may cause excitement 😂'],
    Inspirational: ['Every great journey starts with a single step.', 'Dream big, act bigger. ✨', 'The best time to start is NOW. 🚀'],
    Urgent: ['⏰ LIMITED TIME:', 'Act now —', '🔥 Don\'t miss out!'],
    Friendly: ['Hi friends! 😊', 'We\'d love to share something special with you.', 'Just wanted to brighten your day! ☀️'],
  };
  const starts = toneMap[tone] || toneMap.Casual;
  const start = starts[Math.floor(Math.random() * starts.length)];
  
  const platformSuffix: Record<Platform, string> = {
    instagram: '\n\n#trending #viral #instagram #explore',
    tiktok: '\n\n#fyp #foryoupage #viral #tiktok',
    linkedin: '\n\nLet me know your thoughts in the comments below. 👇',
    youtube: '\n\n⬇️ Subscribe for more content like this!',
    facebook: '\n\n❤️ Like and share if you found this helpful!',
    telegram: '\n\n📲 Forward to your friends!',
    twitter: '\n\n🔁 RT if you agree!',
    website: '\n\nRead more on our website.',
  };

  return `${start} ${topic}\n\nWe're excited to bring you this amazing content about ${topic.toLowerCase()}. Stay tuned for more updates!${platformSuffix[platform] || ''}`;
};

const generateHashtags = (topic: string, platform: Platform): string[] => {
  const base = topic.toLowerCase().replace(/\s+/g, '');
  const platformTags: Record<Platform, string[]> = {
    instagram: ['#instagram', '#explore', '#trending', '#viral', '#instagood'],
    tiktok: ['#fyp', '#foryou', '#tiktok', '#viral', '#trending'],
    linkedin: ['#business', '#professional', '#networking', '#growth', '#leadership'],
    youtube: ['#youtube', '#subscribe', '#video', '#content', '#creator'],
    facebook: ['#facebook', '#community', '#social', '#share', '#connect'],
    telegram: ['#telegram', '#channel', '#update', '#news'],
    twitter: ['#twitter', '#trending', '#news', '#update'],
    website: ['#blog', '#content', '#web', '#digital'],
  };
  return [`#${base}`, ...(platformTags[platform] || []).slice(0, 4)];
};

export const AIAssistant: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram', 'facebook']);
  const [tone, setTone] = useState('Casual');
  const [results, setResults] = useState<{ platform: Platform; caption: string; hashtags: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((ps) =>
      ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p]
    );
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const generated = selectedPlatforms.map((platform) => ({
      platform,
      caption: generateCaption(topic, platform, tone),
      hashtags: generateHashtags(topic, platform),
    }));
    setResults(generated);
    setLoading(false);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={26} color="#6366f1" /> AI Assistant
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Generate captions, hashtags, and content ideas powered by AI</p>
      </div>

      {/* Input panel */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #f3f4f6', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              What's your post about?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe your post topic, product, event, or message..."
              rows={3}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>
              Platforms
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLATFORMS.map((p) => {
                const cfg = platformConfig[p];
                const sel = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    style={{
                      padding: '6px 14px', borderRadius: 20,
                      border: `1.5px solid ${sel ? cfg.color : '#e5e7eb'}`,
                      background: sel ? cfg.bgColor : '#fff',
                      color: sel ? cfg.color : '#6b7280',
                      fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>
              Tone of voice
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {toneOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  style={{
                    padding: '6px 14px', borderRadius: 20,
                    border: `1.5px solid ${tone === t ? '#6366f1' : '#e5e7eb'}`,
                    background: tone === t ? '#eef2ff' : '#fff',
                    color: tone === t ? '#6366f1' : '#6b7280',
                    fontSize: 13, fontWeight: tone === t ? 600 : 400, cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !topic.trim() || selectedPlatforms.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: loading ? '#9ca3af' : '#fff',
              border: 'none', borderRadius: 12, padding: '12px 24px',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            {loading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Sparkles size={16} /> Generate Captions</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111' }}>
            Generated captions for {results.length} platform{results.length > 1 ? 's' : ''}
          </h3>
          {results.map(({ platform, caption, hashtags }) => {
            const cfg = platformConfig[platform];
            const fullText = `${caption}\n\n${hashtags.join(' ')}`;
            return (
              <div key={platform} style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${cfg.color}30`, overflow: 'hidden' }}>
                <div style={{ background: cfg.bgColor, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>{cfg.label}</span>
                  <button
                    onClick={() => copyText(fullText, platform)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: 'none', background: cfg.color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Copy size={12} /> {copied === platform ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {caption}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {hashtags.map((h) => (
                      <span key={h} style={{ fontSize: 12, background: cfg.bgColor, color: cfg.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <Sparkles size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Ready to generate content</div>
          <div style={{ fontSize: 13 }}>Enter your topic above and click Generate to get AI-crafted captions</div>
        </div>
      )}
    </div>
  );
};
