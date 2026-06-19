import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import { useAppStore } from '../../store';
import { formatNumber, platformConfig } from '../../utils/platforms';
import type { Platform } from '../../types';

const COLORS = ['#6366f1', '#8b5cf6', '#ef4444', '#000000', '#2AABEE', '#0A66C2', '#000000', '#10b981'];

export const Analytics: React.FC = () => {
  const { dashboardStats, posts } = useAppStore();
  const [period, setPeriod] = useState('7d');

  const publishedPosts = posts.filter((p) => p.status === 'published' && p.analytics);
  const totalLikes = publishedPosts.reduce((s, p) => s + (p.analytics?.likes || 0), 0);
  const totalComments = publishedPosts.reduce((s, p) => s + (p.analytics?.comments || 0), 0);
  const totalShares = publishedPosts.reduce((s, p) => s + (p.analytics?.shares || 0), 0);

  const platformPieData = dashboardStats.reachByPlatform.map(({ platform, reach }, i) => ({
    name: platformConfig[platform].label,
    value: reach,
    color: COLORS[i] || '#6366f1',
  }));

  const engagementData = [
    { name: 'Likes', value: totalLikes, color: '#ef4444' },
    { name: 'Comments', value: totalComments, color: '#6366f1' },
    { name: 'Shares', value: totalShares, color: '#10b981' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Analytics</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Track your performance across all platforms</p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none',
                background: period === p ? '#fff' : 'transparent',
                color: period === p ? '#6366f1' : '#6b7280',
                fontWeight: period === p ? 600 : 400,
                fontSize: 13, cursor: 'pointer',
                boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Likes', value: formatNumber(totalLikes), emoji: '❤️', color: '#ef4444' },
          { label: 'Total Comments', value: formatNumber(totalComments), emoji: '💬', color: '#6366f1' },
          { label: 'Total Shares', value: formatNumber(totalShares), emoji: '🔁', color: '#10b981' },
        ].map(({ label, value, emoji, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>Reach over time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dashboardStats.dailyReach}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
              <Tooltip formatter={(v: number) => [formatNumber(v), 'Reach']} />
              <Line type="monotone" dataKey="reach" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>Reach distribution by platform</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie data={platformPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" strokeWidth={0}>
                  {platformPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatNumber(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {platformPieData.map((entry) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#6b7280', flex: 1 }}>{entry.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{formatNumber(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Engagement breakdown */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>Engagement breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={engagementData} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: '#374151' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip formatter={(v: number) => formatNumber(v)} />
            {engagementData.map((entry, i) => (
              <Bar key={i} dataKey="value" fill={entry.color} radius={[0, 6, 6, 0]} barSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
