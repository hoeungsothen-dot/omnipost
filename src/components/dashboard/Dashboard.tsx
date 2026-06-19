import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, Eye, Activity, FileCheck, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../../store';
import { formatNumber, platformConfig } from '../../utils/platforms';

const StatCard: React.FC<{
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, subtitle, icon, color }) => (
  <div style={{
    background: '#fff',
    borderRadius: 16,
    padding: '20px 24px',
    border: '1px solid #f3f4f6',
    flex: 1,
    minWidth: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{title}</span>
      <div style={{ color }}>{icon}</div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: '#111', lineHeight: 1 }}>{value}</div>
    {change !== undefined && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <ArrowUpRight size={14} color="#16a34a" />
        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>↑ {change}%</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{subtitle}</span>
      </div>
    )}
    {!change && subtitle && (
      <div style={{ fontSize: 12, color: '#16a34a', marginTop: 8, fontWeight: 500 }}>{subtitle}</div>
    )}
  </div>
);

export const Dashboard: React.FC = () => {
  const { dashboardStats, posts } = useAppStore();

  const recentPosts = posts.slice(0, 3);

  const platformChartData = dashboardStats.reachByPlatform.map(({ platform, reach }) => ({
    name: platformConfig[platform].label,
    reach,
    color: platformConfig[platform].color,
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#111' }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#f59e0b', fontWeight: 500 }}>
            ⚡ Live data — connected to all your platforms
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard
          title="Total reach"
          value={formatNumber(dashboardStats.totalReach)}
          change={dashboardStats.reachChange}
          subtitle="vs last month"
          icon={<Eye size={18} />}
          color="#6366f1"
        />
        <StatCard
          title="Impressions"
          value={formatNumber(dashboardStats.totalImpressions)}
          change={dashboardStats.impressionsChange}
          subtitle="vs last month"
          icon={<TrendingUp size={18} />}
          color="#8b5cf6"
        />
        <StatCard
          title="Engagement rate"
          value={`${dashboardStats.avgEngagementRate}%`}
          change={dashboardStats.engagementChange}
          subtitle="vs last month"
          icon={<Activity size={18} />}
          color="#10b981"
        />
        <StatCard
          title="Posts published"
          value={String(dashboardStats.postsPublished)}
          subtitle="This month"
          icon={<FileCheck size={18} />}
          color="#f59e0b"
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Daily Reach */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#111' }}>
            Daily reach (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dashboardStats.dailyReach}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(v: number) => [formatNumber(v), 'Reach']} />
              <Line type="monotone" dataKey="reach" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reach by Platform */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#111' }}>
            Reach by platform
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(v: number) => [formatNumber(v), 'Reach']} />
              <Bar dataKey="reach" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Posts */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>Recent posts</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentPosts.map((post) => {
            const statusColors: Record<string, string> = {
              published: '#16a34a', scheduled: '#2563eb', draft: '#6b7280', failed: '#dc2626',
            };
            return (
              <div key={post.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#f9fafb', borderRadius: 10,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 4 }}>{post.title}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {post.platforms.map((p) => (
                      <span key={p} style={{
                        fontSize: 10, fontWeight: 600,
                        background: platformConfig[p].bgColor,
                        color: platformConfig[p].color,
                        padding: '2px 7px', borderRadius: 4,
                      }}>
                        {platformConfig[p].label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: statusColors[post.status] + '20',
                    color: statusColors[post.status],
                  }}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                  {post.analytics && (
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {formatNumber(post.analytics.reach)} reach
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
