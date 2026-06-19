import React, { useState } from 'react';
import { Save, Bell, Shield, Palette, Globe } from 'lucide-react';
import { useAppStore } from '../../store';

export const Settings: React.FC = () => {
  const { user } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({
    publishSuccess: true,
    scheduledReminder: true,
    weeklyReport: false,
    teamActivity: true,
  });

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const ToggleSwitch: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? '#6366f1' : '#d1d5db',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: value ? 23 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Manage your account and preferences</p>
        </div>
        <button
          onClick={save}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: saved ? '#dcfce7' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: saved ? '#16a34a' : '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s' }}
        >
          <Save size={15} /> {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Globe size={18} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Business Profile</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Full Name', value: user.name, placeholder: 'Your name' },
              { label: 'Email', value: user.email, placeholder: 'your@email.com' },
              { label: 'Business Name', value: user.businessName, placeholder: 'Business name' },
              { label: 'Website', value: '', placeholder: 'https://yoursite.com' },
            ].map(({ label, value, placeholder }) => (
              <div key={label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
                <input
                  defaultValue={value}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Bell size={18} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Notifications</h3>
          </div>
          {[
            { key: 'publishSuccess', label: 'Post published successfully', desc: 'Notify when a post goes live' },
            { key: 'scheduledReminder', label: 'Scheduled post reminder', desc: 'Remind 1 hour before scheduled time' },
            { key: 'weeklyReport', label: 'Weekly analytics report', desc: 'Receive weekly performance summary' },
            { key: 'teamActivity', label: 'Team activity', desc: 'When team members create or edit posts' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{label}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{desc}</div>
              </div>
              <ToggleSwitch value={notifs[key as keyof typeof notifs]} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
            </div>
          ))}
        </div>

        {/* Plan */}
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 16, padding: 28, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.75, marginBottom: 4 }}>CURRENT PLAN</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Pro Plan</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>8 platforms · Unlimited posts · AI captions · Analytics</div>
            </div>
            <button style={{ background: '#fff', color: '#6366f1', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Upgrade to Enterprise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
