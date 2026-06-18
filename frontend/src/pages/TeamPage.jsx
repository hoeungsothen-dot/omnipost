import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Shield, Eye, Edit3, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

const teamAPI = {
  list: () => api.get('/team'),
  invite: (data) => api.post('/team/invite', data),
  updateRole: (userId, role) => api.patch(`/team/${userId}/role`, { role }),
  remove: (userId) => api.delete(`/team/${userId}`),
};

const ROLE_ICONS = {
  owner: { icon: Crown, color: 'text-yellow-500', label: 'Owner' },
  admin: { icon: Shield, color: 'text-indigo-500', label: 'Admin' },
  editor: { icon: Edit3, color: 'text-green-500', label: 'Editor' },
  viewer: { icon: Eye, color: 'text-gray-400', label: 'Viewer' },
};

const ROLE_DESCRIPTIONS = {
  admin: 'Can manage content, platforms, and team members',
  editor: 'Can create and publish content',
  viewer: 'Can view content and analytics only',
};

export default function TeamPage() {
  const qc = useQueryClient();
  const { user: currentUser, workspace } = useAuthStore();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [showInvite, setShowInvite] = useState(false);

  const { data: members = [], isLoading } = useQuery({ queryKey: ['team'], queryFn: teamAPI.list });

  const inviteMutation = useMutation({
    mutationFn: teamAPI.invite,
    onSuccess: () => {
      qc.invalidateQueries(['team']);
      setInviteEmail('');
      setShowInvite(false);
      toast.success('Member invited!');
    },
  });

  const removeMutation = useMutation({
    mutationFn: teamAPI.remove,
    onSuccess: () => { qc.invalidateQueries(['team']); toast.success('Member removed'); },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => teamAPI.updateRole(userId, role),
    onSuccess: () => qc.invalidateQueries(['team']),
  });

  const isOwner = workspace?.owner === currentUser?._id;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary">
          <UserPlus size={14} /> Invite member
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="card p-4 mb-4 border-indigo-100 bg-indigo-50/30">
          <div className="text-sm font-medium text-gray-800 mb-3">Invite a team member</div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
            <select className="input w-32" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              className="btn-primary"
              onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? '…' : 'Invite'}
            </button>
            <button className="btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{ROLE_DESCRIPTIONS[inviteRole]}</p>
        </div>
      )}

      {/* Members list */}
      <div className="card divide-y divide-gray-50">
        {isLoading && <div className="p-8 text-center text-sm text-gray-400">Loading…</div>}
        {members.map(({ user: member, role, joinedAt }) => {
          const roleDef = ROLE_ICONS[role] || ROLE_ICONS.viewer;
          const RoleIcon = roleDef.icon;
          const isMe = member?._id === currentUser?._id;
          const isWorkspaceOwner = workspace?.owner === member?._id;

          return (
            <div key={member?._id} className="flex items-center gap-3 p-4">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 flex-shrink-0">
                {member?.name?.[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{member?.name}</span>
                  {isMe && <span className="badge badge-gray text-[10px]">you</span>}
                  {isWorkspaceOwner && <Crown size={12} className="text-yellow-500" />}
                </div>
                <div className="text-xs text-gray-400">{member?.email}</div>
                {member?.lastLoginAt && (
                  <div className="text-[10px] text-gray-300 mt-0.5">
                    Last active {formatDistanceToNow(new Date(member.lastLoginAt), { addSuffix: true })}
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="flex items-center gap-1.5">
                <RoleIcon size={13} className={roleDef.color} />
                {isOwner && !isWorkspaceOwner && !isMe ? (
                  <select
                    value={role}
                    onChange={e => roleMutation.mutate({ userId: member._id, role: e.target.value })}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className="text-xs text-gray-500 font-medium">{roleDef.label}</span>
                )}
              </div>

              {/* Remove */}
              {isOwner && !isWorkspaceOwner && !isMe && (
                <button
                  onClick={() => { if (confirm(`Remove ${member?.name}?`)) removeMutation.mutate(member._id); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Role descriptions */}
      <div className="mt-5 card p-4">
        <div className="text-xs font-semibold text-gray-700 mb-3">Role permissions</div>
        <div className="space-y-2">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => {
            const def = ROLE_ICONS[role];
            const Icon = def.icon;
            return (
              <div key={role} className="flex items-start gap-2.5">
                <Icon size={13} className={`mt-0.5 flex-shrink-0 ${def.color}`} />
                <div>
                  <span className="text-xs font-medium text-gray-700">{def.label} — </span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
