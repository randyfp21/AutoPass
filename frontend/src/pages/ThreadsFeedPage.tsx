import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Sparkles, Plus, AlertCircle, Users, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/vehicleService';
import { threadsService } from '../services/threadsService';
import { ThreadCard } from '../components/threads/ThreadCard';
import { ThreadComposerModal } from '../components/threads/ThreadComposerModal';
import type { Thread, Vehicle } from '../types';

export function ThreadsFeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const PAGE_SIZE = 5;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Feed Architecture: Primary Switcher ('for_you' vs 'subscribed') & Topic Filter for 'for_you'
  const [feedTab, setFeedTab] = useState<'for_you' | 'subscribed'>('for_you');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const [showComposerModal, setShowComposerModal] = useState(false);

  // Initial Fetch (Batch 1: First 5 Threads)
  const fetchInitialData = async () => {
    setIsLoading(true);
    setError('');
    setHasMore(true);

    try {
      const activeCategory =
        feedTab === 'subscribed'
          ? 'subscribed'
          : topicFilter === 'all'
          ? undefined
          : topicFilter;

      const [threadList, vehicleList] = await Promise.all([
        threadsService.getThreads(activeCategory, PAGE_SIZE, 0),
        vehicleService.getVehicles(),
      ]);

      setThreads(threadList);
      setVehicles(vehicleList);
      setHasMore(threadList.length === PAGE_SIZE);
    } catch {
      setError('Gagal memuat postingan threads. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Infinite Scroll Batch Fetch (Next 5 Threads)
  const loadMoreThreads = async () => {
    if (isLoadingMore || !hasMore || isLoading) return;
    setIsLoadingMore(true);

    try {
      const activeCategory =
        feedTab === 'subscribed'
          ? 'subscribed'
          : topicFilter === 'all'
          ? undefined
          : topicFilter;

      const nextBatch = await threadsService.getThreads(activeCategory, PAGE_SIZE, threads.length);
      if (nextBatch.length > 0) {
        setThreads((prev) => [...prev, ...nextBatch]);
      }
      setHasMore(nextBatch.length === PAGE_SIZE);
    } catch {
      // Fail silently on pagination
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [feedTab, topicFilter]);

  // Window Scroll Listener for Infinite Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 350 &&
        hasMore &&
        !isLoading &&
        !isLoadingMore
      ) {
        loadMoreThreads();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threads.length, hasMore, isLoading, isLoadingMore, feedTab, topicFilter]);

  const handleThreadDeleted = (threadId: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
  };

  const topicCategories = [
    { id: 'all', label: '🌟 Semua Topik' },
    { id: 'ban', label: '🛞 Ban & Roda' },
    { id: 'ev', label: '⚡ Electric Vehicle (EV)' },
    { id: 'audio', label: '🔊 Audio Mobil' },
    { id: 'biled', label: '💡 Lampu & Biled' },
    { id: 'aksesoris', label: '🎀 Aksesoris' },
    { id: 'modifikasi', label: '🛠️ Modifikasi' },
    { id: 'kendala', label: '🚨 Kendala' },
    { id: 'diskusi', label: '💬 Diskusi' },
    { id: 'sharing', label: '✨ Sharing' },
    { id: 'trip', label: '🗺️ Trip' },
    { id: 'touring', label: '🏍️ Touring' },
  ];

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header Title & New Post CTA */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-tech tracking-tight flex items-center gap-2">
              <Sparkles size={22} className="text-purple-600" />
              Odo Threads Feed
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Komunitas Otomotif · Sharing Pengalaman, Tips & Modifikasi
            </p>
          </div>

          <button
            onClick={() => setShowComposerModal(true)}
            className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Posting</span>
          </button>
        </div>

        {/* Primary Feed Switcher (Segmented Glass Tabs) */}
        <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center gap-1 shadow-2xs backdrop-blur-md border border-slate-300/60">
          <button
            type="button"
            onClick={() => {
              setFeedTab('for_you');
            }}
            className={[
              'flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5',
              feedTab === 'for_you'
                ? 'bg-white text-purple-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50',
            ].join(' ')}
          >
            <span>Untuk Anda</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedTab('subscribed');
            }}
            className={[
              'flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5',
              feedTab === 'subscribed'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50',
            ].join(' ')}
          >
            <Users size={14} />
            <span>⭐ Subscribed</span>
          </button>
        </div>

        {/* Sub-Topic Horizontal Filter Pills (Only shown in 'Untuk Anda' tab) */}
        {feedTab === 'for_you' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {topicCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setTopicFilter(cat.id)}
                className={[
                  'px-3.5 py-1.5 rounded-full text-xs font-extrabold shrink-0 border transition-all cursor-pointer',
                  topicFilter === cat.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100',
                ].join(' ')}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-xs font-medium">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Threads Feed List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
            {feedTab === 'subscribed' ? (
              <>
                <Users size={40} className="mx-auto text-amber-500 mb-2" />
                <h3 className="font-extrabold text-slate-800 text-base">Belum Ada Postingan Subscribed</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                  Kamu belum men-subscribe pengguna lain, atau pengguna yang kamu subscribe belum membuat postingan baru. Buka profil pengguna otomotif dan tekan tombol <strong>Subscribe</strong>!
                </p>
              </>
            ) : (
              <>
                <MessageSquare size={36} className="mx-auto text-slate-300 mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">Belum ada thread di topik ini</h3>
                <p className="text-xs text-slate-400">
                  Jadilah pengguna pertama yang membuat postingan thread di topik ini!
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
                onThreadDeleted={handleThreadDeleted}
              />
            ))}

            {/* Bottom Infinite Scroll Loader / End of Feed Badge */}
            {isLoadingMore && (
              <div className="py-6 flex items-center justify-center gap-2 text-xs font-extrabold text-purple-700 bg-white/80 backdrop-blur-xs rounded-2xl border border-purple-100 shadow-2xs animate-pulse">
                <Loader2 size={16} className="animate-spin text-purple-600" />
                <span>Memuat postingan threads lainnya...</span>
              </div>
            )}

            {!hasMore && threads.length >= 5 && (
              <div className="py-6 text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-200/60 px-4 py-1.5 rounded-full border border-slate-300/60">
                  <CheckCircle2 size={14} className="text-purple-600" />
                  <span>Anda telah melihat semua postingan</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ThreadComposerModal
        isOpen={showComposerModal}
        onClose={() => setShowComposerModal(false)}
        vehicles={vehicles}
        onThreadCreated={fetchInitialData}
      />
    </div>
  );
}

export default ThreadsFeedPage;
