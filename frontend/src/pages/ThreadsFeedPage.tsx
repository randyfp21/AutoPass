import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Sparkles, Plus, AlertCircle, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/vehicleService';
import { threadsService } from '../services/threadsService';
import { ThreadCard } from '../components/threads/ThreadCard';
import { ThreadComposerModal } from '../components/threads/ThreadComposerModal';
import { CommentSheet } from '../components/threads/CommentSheet';
import { ThreadsBottomNav } from '../components/threads/ThreadsBottomNav';
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

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Top Header Banner ── */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-purple-800/40 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500/30 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Sparkles size={18} className="text-purple-300 animate-pulse" />
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight font-[family-name:var(--font-family-tech)]">
                  Odo Threads
                </h1>
              </div>
              <p className="text-xs text-purple-200 mt-1 max-w-sm">
                Komunitas Otomotif Terintegrasi: Sharing kendala, keluhan sparepart, trip, touring, & modifikasi
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shrink-0 backdrop-blur-md"
            >
              🚗 Core Tracker
            </button>
          </div>
        </div>

        {/* ── Quick Create Post Bar ── */}
        <div
          onClick={() => setShowComposerModal(true)}
          className="bg-white border border-purple-200 hover:border-purple-400 p-3.5 rounded-2xl shadow-xs cursor-pointer transition-all flex items-center gap-3 group"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.full_name?.slice(0, 2).toUpperCase() || 'US'}
            </div>
          )}

          <div className="flex-1 bg-slate-50 group-hover:bg-purple-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-400 font-medium transition-colors">
            Ada kendala, cerita trip, touring, atau modifikasi? Ketik di sini...
          </div>

          <button
            type="button"
            className="w-8 h-8 bg-purple-600 group-hover:bg-purple-700 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* ── Category Filters Pills ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: '🔥 Semua Feed' },
            { id: 'kendala', label: '🚨 Kendala' },
            { id: 'pengalaman', label: '✨ Pengalaman' },
            { id: 'tips', label: '💡 Tips' },
            { id: 'trip', label: '🗺️ Trip' },
            { id: 'touring', label: '🏍️ Touring' },
            { id: 'modifikasi', label: '🛠️ Modifikasi' },
            { id: 'general', label: '💬 Diskusi Umum' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                'px-3.5 py-1.5 rounded-xl font-bold transition-all border whitespace-nowrap shrink-0',
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-700 rounded-2xl flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </span>
            <button onClick={fetchData} className="font-bold underline">
              Coba Lagi
            </button>
          </div>
        )}

        {/* ── Threads Feed List ── */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <MessageSquare size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Belum ada thread diposting</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Jadilah yang pertama memposting kendala, cerita trip, touring, atau modifikasi kamu!
            </p>
            <button
              onClick={() => setShowComposerModal(true)}
              className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 shadow-sm"
            >
              + Posting Thread Baru
            </button>
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

      {/* ── Floating Bottom Navigation ── */}
      <ThreadsBottomNav onOpenNewThreadModal={() => setShowComposerModal(true)} />

      {/* ── Modals ── */}
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
