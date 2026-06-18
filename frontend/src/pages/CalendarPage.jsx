import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PLATFORM_COLORS = { facebook: '#1877F2', youtube: '#FF0000', instagram: '#E1306C', tiktok: '#555', linkedin: '#0A66C2', telegram: '#26A5E4', website: '#21759B' };

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: items = [] } = useQuery({
    queryKey: ['calendar', weekStart],
    queryFn: () => contentAPI.calendar({ start: weekStart.toISOString(), end: addDays(weekStart, 7).toISOString() }),
  });

  const forDay = (day) => items.filter(i => i.scheduledAt && isSameDay(new Date(i.scheduledAt), day));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Content calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(d => addDays(d, -7))} className="btn-secondary py-1.5 px-2"><ChevronLeft size={14} /></button>
          <span className="text-sm font-medium text-gray-700">{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}</span>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} className="btn-secondary py-1.5 px-2"><ChevronRight size={14} /></button>
        </div>
        <Link to="/content/new" className="btn-primary text-sm">+ Schedule post</Link>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {days.map(day => (
            <div key={day} className={`p-3 text-center border-r border-gray-50 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-indigo-50' : ''}`}>
              <div className="text-xs text-gray-400 uppercase">{format(day, 'EEE')}</div>
              <div className={`text-lg font-semibold mt-0.5 ${isSameDay(day, new Date()) ? 'text-indigo-600' : 'text-gray-700'}`}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-64">
          {days.map(day => {
            const dayItems = forDay(day);
            return (
              <div key={day} className={`p-2 border-r border-gray-50 last:border-r-0 min-h-32 ${isSameDay(day, new Date()) ? 'bg-indigo-50/30' : ''}`}>
                {dayItems.map(item => (
                  <Link to={`/content/${item._id}/edit`} key={item._id} className="block mb-1.5">
                    <div className="text-xs rounded-md px-2 py-1.5 bg-white border border-gray-100 hover:border-indigo-200 transition truncate">
                      <div className="font-medium text-gray-700 truncate">{item.title}</div>
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {item.platforms?.slice(0, 3).map(p => (
                          <span key={p} className="w-1.5 h-1.5 rounded-full" style={{ background: PLATFORM_COLORS[p] }} />
                        ))}
                        <span className="text-gray-400 text-[9px] ml-0.5">{format(new Date(item.scheduledAt), 'h:mma')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {dayItems.length === 0 && (
                  <Link to="/content/new" className="block h-full min-h-8 flex items-center justify-center text-[11px] text-gray-300 hover:text-indigo-400 transition">
                    + Add
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
