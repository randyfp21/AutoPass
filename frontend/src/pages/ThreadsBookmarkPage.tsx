import React, { useState, useEffect } from 'react';
import { Bookmark, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { threadsService } from '../services/threadsService';
import { ThreadCard } from '../components/threads/ThreadCard';
import { ThreadComposerModal } from '../components/threads/ThreadComposerModal';
import { CommentSheet } from '../components/threads/CommentSheet';
import { ThreadsBottomNav } from '../components/threads/ThreadsBottomNav';
import type { Thread } from '../types';

export function ThreadsBookmarkPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showComposerModal, setShowComposerModal] = useState(false);
  const [selectedThreadForComment, setSelectedThreadForComment] = useState<Thread | null>(null);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const list = await threadsService.getBookmarkedThreads();
      setThreads(list);
    } catch {
      setError('Gagal memuat bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Bookmark size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thread Disimpan</h1>
            <p className="text-xs text-slate-500">Kumpulan thread favorit & bookmark Anda</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Bookmark size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Belum ada thread yang disimpan</h3>
            <p className="text-xs text-slate-400 mt-1">
              Klik icon bookmark pada thread untuk menyimpannya di sini
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                currentUserId={user?.id}
                onCommentClick={(targetThread) => setSelectedThreadForComment(targetThread)}
                onThreadDeleted={(deletedId) => setThreads((prev) => prev.filter((item) => item.id !== deletedId))}
              />
            ))}
          </div>
        )}
      </div>

      <ThreadsBottomNav onOpenNewThreadModal={() => setShowComposerModal(true)} />

      <ThreadComposerModal
        isOpen={showComposerModal}
        onClose={() => setShowComposerModal(false)}
        vehicles={[]}
        onThreadCreated={fetchBookmarks}
      />

      <CommentSheet
        isOpen={!!selectedThreadForComment}
        onClose={() => setSelectedThreadForComment(null)}
        thread={selectedThreadForComment}
      />
    </div>
  );
}

export default ThreadsBookmarkPage;
