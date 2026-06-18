import { useAuthStore } from '../store/auth.store';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, workspace } = useAuthStore();
  const [apiKeys, setApiKeys] = useState({ anthropic: '', cloudinary: '' });

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Workspace</h2>
          <div className="space-y-3">
            <div><label className="label">Workspace name</label><input className="input" defaultValue={workspace?.name} /></div>
            <div><label className="label">Timezone</label>
              <select className="input"><option>UTC</option><option>Asia/Phnom_Penh</option><option>Asia/Bangkok</option><option>America/New_York</option></select>
            </div>
          </div>
          <button className="btn-primary mt-4 text-sm" onClick={() => toast.success('Saved!')}>Save changes</button>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">API Keys</h2>
          <p className="text-xs text-gray-500 mb-4">Required to enable publishing and AI features</p>
          <div className="space-y-3">
            {[
              { key: 'anthropic', label: 'Anthropic API Key (AI captions)', placeholder: 'sk-ant-...' },
              { key: 'cloudinary', label: 'Cloudinary API Secret (media storage)', placeholder: 'cloudinary_secret' },
              { key: 'facebook', label: 'Facebook App Secret', placeholder: 'fb_app_secret' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input className="input font-mono text-xs" type="password" placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <button className="btn-primary mt-4 text-sm" onClick={() => toast.success('API keys saved securely!')}>Save API keys</button>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Account</h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
          </div>
        </div>

        <div className="card p-5 border-red-100">
          <h2 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h2>
          <p className="text-xs text-gray-500 mb-3">Permanently delete your workspace and all content. This cannot be undone.</p>
          <button className="btn-danger text-sm" onClick={() => toast.error('Please contact support to delete your account.')}>Delete workspace</button>
        </div>
      </div>
    </div>
  );
}
