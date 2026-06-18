// ContentPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2, Send, Edit, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE = { published: 'badge-green', scheduled: 'badge-yellow', draft: 'badge-gray', failed: 'badge-red', publishing: 'badge-blue' };

export function ContentPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['content'], queryFn: () => contentAPI.list({ limit: 50 }) });

  const deleteMutation = useMutation({
    mutationFn: contentAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['content']); toast.success('Deleted'); },
  });

  const publishMutation = useMutation({
    mutationFn: contentAPI.publish,
    onSuccess: () => { qc.invalidateQueries(['content']); toast.success('Publishing started'); },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Content library</h1>
        <Link to="/content/new" className="btn-primary"><Plus size={14} /> New post</Link>
      </div>
      <div className="card divide-y divide-gray-50">
        {isLoading && <div className="p-8 text-center text-sm text-gray-400">Loading...</div>}
        {data?.items?.map(item => (
          <div key={item._id} className="flex items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {item.platforms?.map(p => <span key={p} className="platform-chip">{p}</span>)}
                {item.scheduledAt && <span className="text-xs text-gray-400 ml-1">{format(new Date(item.scheduledAt), 'MMM d, h:mm a')}</span>}
              </div>
            </div>
            <span className={STATUS_BADGE[item.status] || 'badge-gray'}>{item.status}</span>
            <div className="flex gap-1">
              {item.status === 'draft' && (
                <button onClick={() => publishMutation.mutate(item._id)} className="btn-ghost py-1 px-2 text-xs text-indigo-600" title="Publish now">
                  <Send size={12} />
                </button>
              )}
              <Link to={`/content/${item._id}/edit`} className="btn-ghost py-1 px-2 text-xs"><Edit size={12} /></Link>
              <button onClick={() => deleteMutation.mutate(item._id)} className="btn-ghost py-1 px-2 text-xs text-red-500"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {!isLoading && !data?.items?.length && (
          <div className="p-10 text-center">
            <p className="text-gray-400 text-sm">No content yet.</p>
            <Link to="/content/new" className="btn-primary mt-3 inline-flex">Create your first post</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentPage;
