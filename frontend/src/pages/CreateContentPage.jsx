import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { contentAPI, aiAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, Sparkles, X, Image, Video, Loader2, Send, Clock } from 'lucide-react';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2', icon: '📘' },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', icon: '▶️' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', color: '#000', icon: '🎵' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', icon: '💼' },
  { id: 'telegram', label: 'Telegram', color: '#26A5E4', icon: '✈️' },
  { id: 'website', label: 'Website', color: '#21759B', icon: '🌐' },
];

export default function CreateContentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'instagram']);
  const [captions, setCaptions] = useState({});
  const [activeCaption, setActiveCaption] = useState('facebook');
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scheduledAt, setScheduledAt] = useState('');
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  const onDrop = useCallback(async (accepted) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadAPI.upload(accepted, setUploadProgress);
      setMedia(prev => [...prev, ...result.files]);
      toast.success(`${result.files.length} file(s) uploaded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxSize: 500 * 1024 * 1024,
  });

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const generateCaptions = async () => {
    if (!aiTopic && !title) return toast.error('Enter a topic first');
    setGeneratingCaptions(true);
    try {
      const result = await aiAPI.captions({
        topic: aiTopic || title,
        platforms: selectedPlatforms,
        mediaDescription: media.length ? `${media[0].type} content` : 'text post',
      });
      setCaptions(prev => ({ ...prev, ...result.captions }));
      toast.success('Captions generated!');
    } catch {
      toast.error('Caption generation failed');
    } finally {
      setGeneratingCaptions(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => contentAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['content-recent']);
      toast.success('Content created!');
      navigate('/content');
    },
  });

  const handleSubmit = (publishNow = false) => {
    if (!title.trim()) return toast.error('Title is required');
    if (!selectedPlatforms.length) return toast.error('Select at least one platform');
    createMutation.mutate({
      title,
      platforms: selectedPlatforms,
      captions,
      media,
      scheduledAt: scheduledAt || undefined,
      publishNow,
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create content</h1>
          <p className="text-sm text-gray-500 mt-0.5">Publish across multiple platforms at once</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSubmit(false)} className="btn-secondary" disabled={createMutation.isPending}>
            Save draft
          </button>
          <button onClick={() => handleSubmit(true)} className="btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publish now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Left - content */}
        <div className="col-span-3 space-y-4">
          {/* Title */}
          <div className="card p-4">
            <label className="label">Post title</label>
            <input className="input" placeholder="Enter a descriptive title..." value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Media upload */}
          <div className="card p-4">
            <div className="section-title">Media</div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto text-gray-300 mb-2" size={28} />
              <p className="text-sm text-gray-500">Drop images or videos here, or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Supports JPEG, PNG, GIF, MP4, MOV — up to 500MB</p>
            </div>

            {uploading && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading...</span><span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {media.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {media.map((m, i) => (
                  <div key={i} className="relative group">
                    {m.type === 'image' ? (
                      <img src={m.url} className="w-20 h-20 object-cover rounded-lg border border-gray-200" alt="" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <Video size={20} className="text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => setMedia(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Captions per platform */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="section-title mb-0">Captions</div>
              <div className="flex items-center gap-2">
                <input
                  className="input text-xs py-1 w-44"
                  placeholder="Topic for AI..."
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                />
                <button onClick={generateCaptions} className="btn-secondary text-xs py-1.5 whitespace-nowrap" disabled={generatingCaptions}>
                  {generatingCaptions ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI generate
                </button>
              </div>
            </div>

            {/* Tab per platform */}
            <div className="flex gap-1 mb-3 flex-wrap">
              {selectedPlatforms.map(p => {
                const platform = PLATFORMS.find(pl => pl.id === p);
                return (
                  <button
                    key={p}
                    onClick={() => setActiveCaption(p)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all ${activeCaption === p ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {platform?.icon} {platform?.label}
                  </button>
                );
              })}
            </div>

            <textarea
              className="textarea"
              rows={5}
              placeholder={`Caption for ${activeCaption}...`}
              value={captions[activeCaption] || ''}
              onChange={e => setCaptions(prev => ({ ...prev, [activeCaption]: e.target.value }))}
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {(captions[activeCaption] || '').length} chars
            </div>
          </div>

          {/* Schedule */}
          <div className="card p-4">
            <label className="label flex items-center gap-1.5"><Clock size={12} /> Schedule (optional)</label>
            <input type="datetime-local" className="input" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Leave empty to save as draft or publish immediately</p>
          </div>
        </div>

        {/* Right - platform selection */}
        <div className="col-span-2 space-y-4">
          <div className="card p-4">
            <div className="section-title">Publish to</div>
            <div className="space-y-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    selectedPlatforms.includes(p.id)
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="font-medium flex-1 text-left">{p.label}</span>
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedPlatforms.includes(p.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 bg-indigo-50 border-indigo-100">
            <div className="text-xs font-medium text-indigo-700 mb-2">Publishing to {selectedPlatforms.length} platforms</div>
            <div className="text-xs text-indigo-600">
              Your content will be automatically formatted for each platform's requirements.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
