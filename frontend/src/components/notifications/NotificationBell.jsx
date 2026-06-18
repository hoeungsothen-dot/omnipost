import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Safe — no live socket on static deploy, just shows empty state
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const items = [];
  const unread = 0;

  useEffect(() => {
    const handler = (e) => { if (!panelRef.current?.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

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
        <div className="absolute right-0 top-10 w-72 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100">
              <X size={13} className="text-gray-400" />
            </button>
          </div>
          <div className="py-10 text-center text-sm text-gray-400">
            <Bell size={24} className="mx-auto mb-2 text-gray-200" />
            No notifications yet
          </div>
        </div>
      )}
    </div>
  );
}
