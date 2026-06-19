import React, { useState, useCallback } from 'react';
import { Upload, Search, Trash2, Grid, List, Film, Image as ImageIcon, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../../store';
import { formatBytes, generateId } from '../../utils/platforms';

export const MediaLibrary: React.FC = () => {
  const { mediaFiles, addMediaFile, deleteMediaFile } = useAppStore();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState('all');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      addMediaFile(file).catch((err) => {
        console.error('Upload failed:', err);
        alert(`Failed to upload ${file.name}: ${err.message || 'Unknown error'}`);
      });
    });
  }, [addMediaFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
  });

  const filtered = mediaFiles.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || f.type === typeFilter;
    return matchSearch && matchType;
  });

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'video') return <Film size={16} color="#6366f1" />;
    if (type === 'image') return <ImageIcon size={16} color="#10b981" />;
    return <FileText size={16} color="#f59e0b" />;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Media Library</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>{mediaFiles.length} files · Upload images and videos for your posts</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            style={{ padding: '8px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' }}
          >
            {view === 'grid' ? <List size={15} /> : <Grid size={15} />}
            {view === 'grid' ? 'List' : 'Grid'}
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#6366f1' : '#d1d5db'}`,
          borderRadius: 16,
          padding: '32px',
          textAlign: 'center',
          background: isDragActive ? '#eef2ff' : '#fafafa',
          marginBottom: 24,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
        <Upload size={32} color={isDragActive ? '#6366f1' : '#9ca3af'} style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: isDragActive ? '#6366f1' : '#374151', marginBottom: 6 }}>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to upload'}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Supports: JPG, PNG, GIF, MP4, MOV, WebM</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {['all', 'image', 'video'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: '1.5px solid',
              borderColor: typeFilter === t ? '#6366f1' : '#e5e7eb',
              background: typeFilter === t ? '#eef2ff' : '#fff',
              color: typeFilter === t ? '#6366f1' : '#6b7280',
              fontWeight: typeFilter === t ? 600 : 400,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Files */}
      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {filtered.map((file) => (
            <div key={file.id} style={{
              background: '#fff', borderRadius: 12, overflow: 'hidden',
              border: '1px solid #f3f4f6', position: 'relative', cursor: 'pointer',
            }}>
              <div style={{ width: '100%', height: 120, background: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {file.thumbnailUrl ? (
                  <img src={file.thumbnailUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Film size={32} color="#9ca3af" />
                )}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{formatBytes(file.size)}</div>
              </div>
              <button
                onClick={() => deleteMediaFile(file.id)}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(255,255,255,0.9)', border: 'none',
                  borderRadius: 6, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}
              >
                <Trash2 size={12} color="#ef4444" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((file) => (
            <div key={file.id} style={{
              background: '#fff', borderRadius: 12, padding: '12px 16px',
              border: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {file.thumbnailUrl ? (
                  <img src={file.thumbnailUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : <TypeIcon type={file.type} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {file.type} · {formatBytes(file.size)} · {file.uploadedAt}
                </div>
              </div>
              <button
                onClick={() => deleteMediaFile(file.id)}
                style={{ padding: '6px 10px', border: '1.5px solid #fee2e2', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={13} color="#ef4444" />
              </button>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No files found</div>
          <div style={{ fontSize: 13 }}>Upload your first media file above</div>
        </div>
      )}
    </div>
  );
};
