import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/auth.store';
import { io } from 'socket.io-client';
import api from '../../services/api';

const notifAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

const TYPE_ICON = {
  publish_success: { icon: CheckCircle2, className: 'text-green-500' },
  publish_failed: { icon: AlertCircle, className: 'text-red-500' },
  publish_partial: { icon: AlertTriangle, className: 'text-yellow-500' },
  team_invite: { icon: Bell, className: 'text-blue-500' },
  analytics_milestone: { icon: CheckCircle2, className: 'text-indigo-500' },
  platform_disconnected: { icon: AlertCircle, className: 'text-orange-500' },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { token, workspace } = useAuthStore();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: notifAPI.list,
    refetchInterval: 60000,
  });

  const markReadMutation = useMutation({
    mutationFn: notifAPI.markRead,
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const markAllMutation = useMutation({
    mutationFn: notifAPI.markAllRead,
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  // Real-time socket connection
  useEffect(() => {
    if (!token || !workspace?._id) return;
    const socket = io({ auth: { token } });
    socket.emit('join:workspace', workspace._id);
    socket.on('notification:new', () => qc.invalidateQueries(['notifications']));
    return () => socket.disconnect();
  }, [token, workspace?._id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (!panelRef.current?.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = data?.unread || 0;
  const items = data?.items || [];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
      >
        <Bell size={16} className="text-gray-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={() => markAllMutation.mutate()} className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded flex items-center gap-1">
                  <CheckCheck size={11} /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">
                <X size={13} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-400">
                <Bell size={24} className="mx-auto mb-2 text-gray-200" />
                No notifications yet
              </div>
            )}
            {items.map(n => {
              const def = TYPE_ICON[n.type] || TYPE_ICON.publish_success;
              const Icon = def.icon;
              return (
                <div
                  key={n._id}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${!n.read ? 'bg-indigo-50/40' : ''}`}
                  onClick={() => !n.read && markReadMutation.mutate(n._id)}
                >
                  <Icon size={15} className={`flex-shrink-0 mt-0.5 ${def.className}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800">{n.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
