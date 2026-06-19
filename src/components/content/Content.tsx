import React, { useState } from 'react';
import { Plus, Search, Filter, Trash2, Edit2, Send } from 'lucide-react';
import { useAppStore } from '../../store';
import { platformConfig, getStatusColor, generateId } from '../../utils/platforms';
import type { Post, Platform, ContentType } from '../../types';

const PLATFORMS: Platform[] = ['facebook', 'instagram', 'youtube', 'tiktok', 'telegram', 'linkedin', 'twitter', 'website'];

const NewPostModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addPost } = useAppStore();
  const [form, setForm] = useState({
    title: '',
    caption: '',
    hashtags: '',
    contentType: 'image' as ContentType,
    platforms: [] as Platform[],
    scheduleDate: '',
    scheduleTime: '',
  });

  const togglePlatform = (p: Platform) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));
  };

  const handleSubmit = (status: 'draft' | 'scheduled' | 'published') => {
    if (!form.title || form.platforms.length === 0) {
      alert('Please fill in the title and select at least one platform.');
      return;
    }
    const now = new Date().toISOString();
    const newPost: Post = {
      id: generateId(),
      title: form.title,
      caption: form.caption,
      hashtags: form.hashtags.split(' ').filter(Boolean),
      contentType: form.contentType,
      media: [],
      platforms: form.platforms,
      status,
      scheduledAt: form.scheduleDate && form.scheduleTime
        ? new Date(`${form.scheduleDate}T${form.scheduleTime}`).toISOString()
        : undefined,
      createdAt: now,
      updatedAt: now,
    };
    addPost(newPost);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: 620, maxHeight: '85vh',
        overflowY: 'auto', padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Create New Post</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Post Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Summer Sale Campaign"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Caption</label>
            <textarea
              value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              placeholder="Write your caption here..."
              rows={4}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Hashtags</label>
            <input
              value={form.hashtags}
              onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))}
              placeholder="#hashtag1 #hashtag2 #hashtag3"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Content Type</label>
            <select
              value={form.contentType}
              onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value as ContentType }))}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff' }}
            >
              <option value="image">📷 Image</option>
              <option value="video">🎥 Video</option>
              <option value="carousel">🎠 Carousel</option>
              <option value="text">📝 Text Only</option>
              <option value="story">📱 Story</option>
              <option value="reel">🎬 Reel</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>
              Platforms * <span style={{ fontWeight: 400, color: '#9ca3af' }}>({form.platforms.length} selected)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLATFORMS.map((p) => {
                const cfg = platformConfig[p];
                const selected = form.platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: `1.5px solid ${selected ? cfg.color : '#e5e7eb'}`,
                      background: selected ? cfg.bgColor : '#fff',
                      color: selected ? cfg.color : '#6b7280',
                      fontSize: 13,
                      fontWeight: selected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Schedule Date</label>
              <input
                type="date"
                value={form.scheduleDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduleDate: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Schedule Time</label>
              <input
                type="time"
                value={form.scheduleTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduleTime: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              onClick={() => handleSubmit('draft')}
              style={{ flex: 1, padding: '11px', border: '1.5px solid #e5e7eb', borderRadius: 10, background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' }}
            >
              Save Draft
            </button>
            {form.scheduleDate && (
              <button
                onClick={() => handleSubmit('scheduled')}
                style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 10, background: '#dbeafe', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#2563eb' }}
              >
                Schedule
              </button>
            )}
            <button
              onClick={() => handleSubmit('published')}
              style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Send size={14} /> Publish Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Content: React.FC = () => {
  const { posts, deletePost } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {showModal && <NewPostModal onClose={() => setShowModal(false)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Content</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Manage and schedule your posts across all platforms</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer' }}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Posts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No posts found</div>
            <div style={{ fontSize: 13 }}>Create your first post to get started</div>
          </div>
        ) : (
          filtered.map((post) => {
            const sc = getStatusColor(post.status);
            return (
              <div key={post.id} style={{
                background: '#fff', borderRadius: 14, padding: '16px 20px',
                border: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>{post.title}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                      background: sc.bg, color: sc.text,
                    }}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    <span style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, color: '#6b7280' }}>
                      {post.contentType}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {post.caption || 'No caption'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {post.platforms.map((p) => (
                      <span key={p} style={{
                        fontSize: 10, fontWeight: 600,
                        background: platformConfig[p].bgColor,
                        color: platformConfig[p].color,
                        padding: '2px 7px', borderRadius: 4,
                      }}>
                        {platformConfig[p].label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  {post.scheduledAt && (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {new Date(post.scheduledAt).toLocaleDateString()}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Edit2 size={13} color="#6b7280" />
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
