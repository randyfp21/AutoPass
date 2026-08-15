import React, { useState, useEffect } from 'react';
import { Bell, Heart, MessageSquare, AtSign, CheckCircle2 } from 'lucide-react';
import { threadsService } from '../services/threadsService';
import { ThreadComposerModal } from '../components/threads/ThreadComposerModal';
import type { NotificationItem } from '../types';
import { timeAgo } from '../utils/formatters';

export function ThreadsActivityPage() {
  const [activities, setActivities] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposerModal, setShowComposerModal] = useState(false);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const list = await threadsService.getActivities();
      setActivities(list);
    } catch {
      // Fail silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const notifIconMap = {
    like_thread: <Heart size={16} className="text-rose-500 fill-rose-500" />,
    comment_thread: <MessageSquare size={16} className="text-purple-600" />,
    like_comment: <Heart size={16} className="text-rose-500" />,
    mention: <AtSign size={16} className="text-blue-600" />,
  };

  const notifTextMap = {
    like_thread: 'menyukai thread Anda',
    comment_thread: 'membalas thread Anda',
    like_comment: 'menyukai balasan Anda',
    mention: 'menyebut Anda dalam diskusi',
  };

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Bell size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Aktivitas & Notifikasi</h1>
            <p className="text-xs text-slate-500">Notifikasi interaksi di Odo Threads</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <CheckCircle2 size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Belum ada aktivitas baru</h3>
            <p className="text-xs text-slate-400 mt-1">
              Setiap like atau komentar dari pengguna lain akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
            {activities.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    {notifIconMap[a.type] || <Bell size={16} />}
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="text-slate-800 font-medium">
                      <strong className="font-bold text-slate-900">{a.actor_name}</strong>{' '}
                      {notifTextMap[a.type] || 'melakukan interaksi'}
                    </p>
                    {a.thread_preview && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-md">
                        "{a.thread_preview}"
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ThreadComposerModal
        isOpen={showComposerModal}
        onClose={() => setShowComposerModal(false)}
        vehicles={[]}
        onThreadCreated={fetchActivities}
      />
    </div>
  );
}

export default ThreadsActivityPage;
