import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Image, Video, Search, Grid, List, X, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';

const mediaAPI = {
  list: (p) => api.get('/media', { params: p }),
  upload: (files) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return api.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (id) => api.delete(`/media/${id}`),
  update: (id, data) => api.patch(`/media/${id}`, data),
  stats: () => api.get('/media/stats'),
};

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const qc = useQueryClient();
  const [view, setView] = useState('grid');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['media', typeFilter, search],
    queryFn: () => mediaAPI.list({ type: typeFilter || undefined, search: search || undefined, limit: 48 }),
  });

  const { data: stats } = useQuery({ queryKey: ['media-stats'], queryFn: mediaAPI.stats });

  const deleteMutation = useMutation({
    mutationFn: mediaAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['media']); setSelected(null); toast.success('Deleted'); },
  });

  const onDrop = useCallback(async (files) => {
    setUploading(true);
    try {
      await mediaAPI.upload(files);
      qc.invalidateQueries(['media']);
      qc.invalidateQueries(['media-stats']);
      toast.success(`${files.length} file(s) uploaded to library`);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxSize: 500 * 1024 * 1024,
  });

  const totalSize = stats?.reduce((s, i) => s + i.totalSize, 0) || 0;
  const items = data?.items || [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-white flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Media library</h1>
            <p className="text-xs text-gray-400 mt-0.5">{data?.total || 0} files · {formatBytes(totalSize)} used</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Type filter */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {['', 'image', 'video'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 text-xs rounded-md transition ${typeFilter === t ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500'}`}>
                  {t || 'All'}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-7 py-1.5 text-xs w-40" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* View toggle */}
            <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setView('grid')} className={`p-1.5 rounded-md ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}><Grid size={13} className="text-gray-500" /></button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded-md ${view === 'list' ? 'bg-white shadow-sm' : ''}`}><List size={13} className="text-gray-500" /></button>
            </div>
          </div>
        </div>

        {/* Upload zone */}
        <div {...getRootProps()} className={`mx-5 mt-4 mb-3 border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <input {...getInputProps()} />
          <Upload size={18} className="text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-600 font-medium">{uploading ? 'Uploading…' : isDragActive ? 'Drop files here' : 'Upload to library'}</p>
            <p className="text-xs text-gray-400">Images and videos up to 500 MB</p>
          </div>
        </div>

        {/* Media grid / list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {isLoading && <div className="text-center py-16 text-sm text-gray-400">Loading…</div>}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-16">
              <Image size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No media yet. Upload your first file above.</p>
            </div>
          )}

          {view === 'grid' && (
            <div className="grid grid-cols-6 gap-3">
              {items.map(item => (
                <div key={item._id} onClick={() => setSelected(item)}
                  className={`group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer border-2 transition-all ${selected?._id === item._id ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'}`}>
                  {item.type === 'video'
                    ? <div className="w-full h-full flex items-center justify-center bg-gray-800"><Video size={24} className="text-white/60" /></div>
                    : <img src={item.thumbnailUrl || item.url} alt={item.name} className="w-full h-full object-cover" />
                  }
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                  {item.type === 'video' && (
                    <span className="absolute top-1.5 left-1.5 badge badge-gray text-[9px]">VIDEO</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {view === 'list' && (
            <div className="card divide-y divide-gray-50">
              {items.map(item => (
                <div key={item._id} onClick={() => setSelected(item)}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selected?._id === item._id ? 'bg-indigo-50' : ''}`}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {item.type === 'video'
                      ? <Video size={16} className="text-gray-400" />
                      : <img src={item.thumbnailUrl || item.url} alt="" className="w-full h-full object-cover" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400">{formatBytes(item.size)} · {item.width && `${item.width}×${item.height}`}</div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-64 border-l border-gray-100 bg-white flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-800">Details</span>
            <button onClick={() => setSelected(null)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">
              <X size={13} className="text-gray-400" />
            </button>
          </div>

          {/* Preview */}
          <div className="aspect-square bg-gray-100 border-b border-gray-100 flex items-center justify-center overflow-hidden">
            {selected.type === 'video'
              ? <video src={selected.url} controls className="w-full h-full object-contain" />
              : <img src={selected.url} alt="" className="w-full h-full object-contain" />
            }
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-3">
              <div>
                <div className="label">Filename</div>
                <div className="text-xs text-gray-700 break-all">{selected.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-gray-400">Type</div><div className="font-medium capitalize">{selected.type}</div></div>
                <div><div className="text-gray-400">Size</div><div className="font-medium">{formatBytes(selected.size)}</div></div>
                {selected.width && <div><div className="text-gray-400">Dimensions</div><div className="font-medium">{selected.width}×{selected.height}</div></div>}
                {selected.duration && <div><div className="text-gray-400">Duration</div><div className="font-medium">{Math.round(selected.duration)}s</div></div>}
              </div>
              <div>
                <div className="label mb-2">Tags</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {selected.tags?.map(tag => (
                    <span key={tag} className="badge badge-gray flex items-center gap-1">
                      <Tag size={9} />{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <a href={selected.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs justify-center">Open original</a>
                <button onClick={() => deleteMutation.mutate(selected._id)} className="btn text-xs text-red-600 border-red-200 hover:bg-red-50 justify-center">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
