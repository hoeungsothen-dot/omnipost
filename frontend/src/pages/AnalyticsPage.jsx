import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#26A5E4', '#21759B'];

export default function AnalyticsPage() {
  const { data: overview } = useQuery({ queryKey: ['analytics-overview-90'], queryFn: () => analyticsAPI.overview({ days: 90 }) });
  const { data: topContent } = useQuery({ queryKey: ['top-content-10'], queryFn: () => analyticsAPI.topContent({ limit: 10 }) });

  const pieData = overview?.byPlatform?.map((p, i) => ({ name: p._id, value: p.totalReach, color: COLORS[i] })) || [];

  const mockDaily = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM d'),
    reach: Math.floor(Math.random() * 80000) + 30000,
    engagement: Math.floor(Math.random() * 5000) + 1000,
  }));

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-5">Analytics</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total reach (90d)', value: overview?.summary?.totalReach ? `${(overview.summary.totalReach/1000000).toFixed(1)}M` : '—' },
          { label: 'Total impressions', value: overview?.summary?.totalImpressions ? `${(overview.summary.totalImpressions/1000000).toFixed(1)}M` : '—' },
          { label: 'Avg engagement rate', value: overview?.summary?.avgEngagementRate ? `${overview.summary.avgEngagementRate}%` : '—' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className="text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4 col-span-2">
          <div className="section-title">Reach & engagement (30 days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mockDaily}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
              <Tooltip />
              <Line type="monotone" dataKey="reach" stroke="#6366f1" strokeWidth={2} dot={false} name="Reach" />
              <Line type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={2} dot={false} name="Engagement" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="section-title">Reach by platform</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => `${(v/1000).toFixed(0)}K`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {pieData.slice(0, 4).map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <span className="flex-1 capitalize">{p.name}</span>
                <span className="font-medium">{(p.value/1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="section-title">Top performing content</div>
        <div className="divide-y divide-gray-50">
          {topContent?.map((item, i) => (
            <div key={item._id} className="flex items-center gap-3 py-2.5">
              <span className="text-xs font-medium text-gray-400 w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.platforms?.join(', ')}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">{(item.analytics?.totalReach/1000||0).toFixed(0)}K reach</div>
                <div className="text-xs text-gray-400">{item.analytics?.totalEngagements||0} engagements</div>
              </div>
            </div>
          ))}
          {!topContent?.length && <div className="text-center py-8 text-sm text-gray-400">Publish content to see analytics</div>}
        </div>
      </div>
    </div>
  );
}
