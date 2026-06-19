import React, { useState } from 'react';
import { Plus, Trash2, Shield, Edit2 } from 'lucide-react';
import { useAppStore } from '../../store';
import { generateId } from '../../utils/platforms';
import type { TeamMember } from '../../types';

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#fef3c7', text: '#d97706' },
  editor: { bg: '#dbeafe', text: '#2563eb' },
  viewer: { bg: '#f3f4f6', text: '#6b7280' },
};

export const Team: React.FC = () => {
  const { teamMembers, addTeamMember, removeTeamMember } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'editor' as TeamMember['role'] });

  const handleAdd = async () => {
    if (!form.name || !form.email) return;
    try {
      await addTeamMember(form.email, form.role);
      setForm({ name: '', email: '', role: 'editor' });
      setShowForm(false);
    } catch (err: any) {
      alert(`Failed to invite member: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Team</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>{teamMembers.length} members · Manage access and roles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          <Plus size={16} /> Invite member
        </button>
      </div>

      {/* Invite form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1.5px solid #6366f1', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Invite new member</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="john@company.com"
                type="email"
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as TeamMember['role'] }))}
                style={{ padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              style={{ padding: '9px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Send invite
            </button>
          </div>
        </div>
      )}

      {/* Role legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {Object.entries(roleColors).map(([role, { bg, text }]) => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: bg, color: text, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {role === 'admin' ? '— Full access' : role === 'editor' ? '— Create & edit' : '— View only'}
            </span>
          </div>
        ))}
      </div>

      {/* Members list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {teamMembers.map((member) => {
          const rc = roleColors[member.role];
          return (
            <div key={member.id} style={{
              background: '#fff', borderRadius: 14, padding: '16px 20px',
              border: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>
                {member.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>{member.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: rc.bg, color: rc.text }}>
                    {member.role}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>{member.email} · Joined {member.joinedAt}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Edit2 size={13} color="#6b7280" />
                </button>
                {member.role !== 'admin' && (
                  <button
                    onClick={() => removeTeamMember(member.id)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={13} color="#ef4444" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
