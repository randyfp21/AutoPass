import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Sparkles, Plus, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/vehicleService';
import { threadsService } from '../services/threadsService';
import { ThreadCard } from '../components/threads/ThreadCard';
import { ThreadComposerModal } from '../components/threads/ThreadComposerModal';
import { CommentSheet } from '../components/threads/CommentSheet';
import type { Thread, Vehicle } from '../types';

export function ThreadsFeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showComposerModal, setShowComposerModal] = useState(false);
  const [selectedThreadForComment, setSelectedThreadForComment] = useState<Thread | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [threadList, vehicleList] = await Promise.all([
        threadsService.getThreads(activeCategory === 'all' ? undefined : activeCategory),
        vehicleService.getVehicles().catch(() => []),
      ]);

      setThreads(threadList);
      setVehicles(vehicleList);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat feed Odo Threads. Pastikan server terhubung.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCategory]);

  const handleThreadDeleted = (threadId: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
  };

  const categories = [
    { id: 'all', label: '🌟 Semua' },
    { id: 'subscribed', label: '⭐ Subscribed' },
    { id: 'diskusi', label: '💬 Diskusi' },
    { id: 'kendala', label: '🚨 Kendala' },
    { id: 'sharing', label: '✨ Sharing' },
    { id: 'trip', label: '🗺️ Trip' },
    { id: 'touring', label: '🏍️ Touring' },
    { id: 'modifikasi', label: '🛠️ Modifikasi' },
  ];

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header & New Post CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <MessageSquare size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-1.5">
                Odo Threads
              </h1>
              <p className="text-xs text-slate-500">Komunitas & Diskusi Otomotif Indonesia</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowComposerModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Buat Thread
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                activeCategory === cat.id
                  ? cat.id === 'subscribed'
                    ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md'
                    : 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-xs font-medium">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Threads List Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
            {activeCategory === 'subscribed' ? (
              <>
                <Users size={40} className="mx-auto text-amber-500 mb-2" />
                <h3 className="font-extrabold text-slate-800 text-base">Belum Ada Postingan Subscribed</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Kamu belum men-subscribe pengguna lain, atau pengguna yang kamu subscribe belum membuat postingan baru. Jelajahi profil pengguna dan klik tombol <strong>Subscribe</strong>!
                </p>
              </>
            ) : (
              <>
                <MessageSquare size={36} className="mx-auto text-slate-300 mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">Belum ada thread di kategori ini</h3>
                <p className="text-xs text-slate-400">
                  Jadilah pengguna pertama yang memulai postingan thread di kategori ini!
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                currentUserId={user?.id}
                onCommentClick={(targetThread) => setSelectedThreadForComment(targetThread)}
                onThreadDeleted={handleThreadDeleted}
              />
            ))}
          </div>
        )}
      </div>

      <ThreadComposerModal
        isOpen={showComposerModal}
        onClose={() => setShowComposerModal(false)}
        vehicles={vehicles}
        onThreadCreated={fetchData}
      />

      <CommentSheet
        isOpen={!!selectedThreadForComment}
        onClose={() => setSelectedThreadForComment(null)}
        thread={selectedThreadForComment}
        onCommentAdded={fetchData}
      />
    </div>
  );
}

export default ThreadsFeedPage;
