import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';
import { platformConfig } from '../../utils/platforms';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const Calendar: React.FC = () => {
  const { posts } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // June 2025

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const scheduledAndPublished = posts.filter((p) => p.scheduledAt || p.publishedAt);

  const getPostsForDay = (day: number) => {
    return scheduledAndPublished.filter((p) => {
      const d = new Date(p.scheduledAt || p.publishedAt || '');
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Calendar</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>View and manage your content schedule</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <button onClick={prevMonth} style={{ border: 'none', background: '#f3f4f6', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} style={{ border: 'none', background: '#f3f4f6', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 16px 0' }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9ca3af', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 16px 20px', gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dayPosts = getPostsForDay(day);
            const today_ = isToday(day);
            return (
              <div
                key={day}
                style={{
                  minHeight: 80, padding: '6px 8px',
                  borderRadius: 10,
                  background: today_ ? '#eef2ff' : '#fff',
                  border: `1.5px solid ${today_ ? '#6366f1' : '#f3f4f6'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  fontSize: 13, fontWeight: today_ ? 700 : 400,
                  color: today_ ? '#6366f1' : '#374151',
                  marginBottom: 4,
                }}>
                  {day}
                </div>
                {dayPosts.slice(0, 3).map((post) => (
                  <div key={post.id} style={{
                    fontSize: 10, fontWeight: 600,
                    padding: '1px 5px', borderRadius: 3,
                    background: post.status === 'published' ? '#dcfce7' : '#dbeafe',
                    color: post.status === 'published' ? '#16a34a' : '#2563eb',
                    marginBottom: 2,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>
                    {post.title}
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>+{dayPosts.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming scheduled */}
      <div style={{ marginTop: 24, background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Upcoming scheduled posts</h3>
        {posts.filter((p) => p.status === 'scheduled').length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No scheduled posts. Create a post and schedule it!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {posts.filter((p) => p.status === 'scheduled').map((post) => (
              <div key={post.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#f8f9fc', borderRadius: 10,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 4 }}>{post.title}</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {post.platforms.map((p) => (
                      <span key={p} style={{ fontSize: 10, fontWeight: 600, background: platformConfig[p].bgColor, color: platformConfig[p].color, padding: '1px 6px', borderRadius: 3 }}>
                        {platformConfig[p].label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
                  {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
