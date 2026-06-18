import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, contentAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Eye, MousePointerClick, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  published: 'badge-green', scheduled: 'badge-yellow',
  draft: 'badge-gray', failed: 'badge-red', publishing: 'badge-blue'
};
const PLATFORM_COLORS = {
  facebook:'#1877F2', youtube:'#FF0000', instagram:'#E1306C',
  tiktok:'#555', linkedin:'#0A66C2', telegram:'#26A5E4', website:'#21759B'
};

// Demo data shown when no backend is connected
const DEMO_TIMELINE = Array.from({ length: 7 }, (_, i) => ({
  date: format(subDays(new Date(), 6 - i), 'MMM d'),
  reach: [28000,34000,29000,45000,51000,48000,60000][i],
}));
const DEMO_PLATFORM = [
  { name: 'Facebook', reach: 89 }, { name: 'YouTube', reach: 65 },
  { name: 'Instagram', reach: 43 }, { name: 'TikTok', reach: 28 },
  { name: 'LinkedIn', reach: 11 },
];
const DEMO_CONTENT = [
  { _id: '1', title: 'Product launch promo video', platforms: ['youtube','facebook','tiktok'], status: 'scheduled', scheduledAt: new Date(Date.now() + 3600000) },
  { _id: '2', title: 'Summer sale poster', platforms: ['instagram','facebook'], status: 'published' },
  { _id: '3', title: 'Weekly newsletter', platforms: ['linkedin','telegram','website'], status: 'draft' },
];

function StatCard({ icon: Icon, label, value, change, color = 'indigo' }) {
  const colors = { indigo:'bg-indigo-50 text-indigo-600', blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600', purple:'bg-purple-50 text-purple-600' };
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {change && <div className="text-xs text-green-600 mt-1">{change}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsAPI.overview({ days: 30 }),
    retry: false,
  });
  const { data: content } = useQuery({
    queryKey: ['content-recent'],
    queryFn: () => contentAPI.list({ limit: 6 }),
    retry: false,
  });

  const platformData = overview?.byPlatform?.length
    ? overview.byPlatform.map(p => ({ name: p._id, reach: Math.round(p.totalReach / 1000) }))
    : DEMO_PLATFORM;

  const timelineData = DEMO_TIMELINE;
  const contentItems = content?.items?.length ? content.items : DEMO_CONTENT;
  const isDemo = !content?.items?.length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isDemo
              ? <span className="text-amber-600">⚡ Demo data — connect your backend to see live metrics</span>
              : 'Last 30 days performance'}
          </p>
        </div>
        <Link to="/content/new" className="btn-primary text-sm">+ New post</Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Eye} label="Total reach" value={overview?.summary?.totalReach ? `${(overview.summary.totalReach/1000).toFixed(0)}K` : '2.4M'} change="↑ 18% vs last month" color="indigo" />
        <StatCard icon={TrendingUp} label="Impressions" value={overview?.summary?.totalImpressions ? `${(overview.summary.totalImpressions/1000000).toFixed(1)}M` : '8.1M'} change="↑ 22%" color="blue" />
        <StatCard icon={MousePointerClick} label="Engagement rate" value={overview?.summary?.avgEngagementRate ? `${overview.summary.avgEngagementRate}%` : '6.2%'} change="↑ 0.8%" color="green" />
        <StatCard icon={FileText} label="Posts published" value={content?.total ?? '147'} change="This month" color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <div className="section-title">Daily reach (7 days)</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={timelineData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [`${(v/1000).toFixed(0)}K`, 'Reach']} />
              <Line type="monotone" dataKey="reach" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="section-title">Reach by platform</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={platformData} barSize={20}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}K`} />
              <Tooltip formatter={v => [`${v}K`, 'Reach']} />
              <Bar dataKey="reach" fill="#6366f1" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title mb-0">Recent content</div>
          <Link to="/content" className="text-xs text-indigo-600 hover:text-indigo-800">View all →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {contentItems.map(item => (
            <div key={item._id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {item.platforms?.map(p => (
                    <span key={p} className="platform-chip">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PLATFORM_COLORS[p] || '#888' }} />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.scheduledAt && (
                  <span className="text-xs text-gray-400">{format(new Date(item.scheduledAt), 'MMM d, h:mm a')}</span>
                )}
                <span className={`badge ${STATUS_COLORS[item.status] || 'badge-gray'}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
