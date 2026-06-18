import { X, AlertTriangle, Loader2 } from 'lucide-react';

// ─── Modal ────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${widths[size]} shadow-xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true, loading = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5">
        <div className="flex gap-3 mb-4">
          {danger && <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} className="text-red-500" /></div>}
          <div>
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            <div className="text-xs text-gray-500 mt-1 leading-relaxed">{message}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 justify-center btn ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Icon size={26} className="text-gray-300" /></div>}
      <div className="text-sm font-medium text-gray-700 mb-1">{title}</div>
      {description && <div className="text-xs text-gray-400 max-w-xs leading-relaxed">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────
const STATUS_MAP = {
  published:  { cls: 'badge-green',  label: 'Published' },
  scheduled:  { cls: 'badge-yellow', label: 'Scheduled' },
  draft:      { cls: 'badge-gray',   label: 'Draft' },
  failed:     { cls: 'badge-red',    label: 'Failed' },
  publishing: { cls: 'badge-blue',   label: 'Publishing…' },
  archived:   { cls: 'badge-gray',   label: 'Archived' },
};

export function StatusBadge({ status }) {
  const def = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span className={`badge ${def.cls} flex items-center gap-1`}>
      {status === 'publishing' && <Loader2 size={9} className="animate-spin" />}
      {def.label}
    </span>
  );
}

// ─── PlatformChip ─────────────────────────────────────────────────────────
const PLATFORM_COLORS = {
  facebook: '#1877F2', youtube: '#FF0000', instagram: '#E1306C',
  tiktok: '#010101', linkedin: '#0A66C2', telegram: '#26A5E4', website: '#21759B',
};

export function PlatformChip({ platform }) {
  return (
    <span className="platform-chip">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PLATFORM_COLORS[platform] || '#888' }} />
      {platform}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────
export function Avatar({ name, src, size = 'sm' }) {
  const sizes = { xs: 'w-5 h-5 text-[9px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  return (
    <div className={`${sizes[size]} rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}
