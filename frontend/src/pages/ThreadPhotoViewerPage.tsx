import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Check,
  Car,
  Send,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { threadsService } from '../services/threadsService';
import { useAuth } from '../context/AuthContext';
import type { Thread, ThreadComment } from '../types';
import { timeAgo, formatDate } from '../utils/formatters';

export function ThreadPhotoViewerPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialIdx = Number(searchParams.get('index')) || 0;

  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(initialIdx);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const t = await threadsService.getThreadById(threadId);
        setThread(t);
        const c = await threadsService.getThreadComments(threadId).catch(() => []);
        setComments(c);
      } catch {
        setError('Gagal memuat postingan foto');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [threadId]);

  const handleLike = async () => {
    if (!thread) return;
    try {
      const isLiked = await threadsService.toggleLikeThread(thread.id);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              is_liked: isLiked,
              likes_count: isLiked ? prev.likes_count + 1 : Math.max(0, prev.likes_count - 1),
            }
          : null
      );
    } catch {
      // Fail silently
    }
  };

  const handleBookmark = async () => {
    if (!thread) return;
    try {
      const isBookmarked = await threadsService.toggleBookmarkThread(thread.id);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              is_bookmarked: isBookmarked,
              bookmarks_count: isBookmarked
                ? prev.bookmarks_count + 1
                : Math.max(0, prev.bookmarks_count - 1),
            }
          : null
      );
    } catch {
      // Fail silently
    }
  };

  const handleShare = async () => {
    if (!thread) return;
    const usernameTag = `@${thread.user_username || 'user'}`;
    const text = `💬 *Odo Threads by ${usernameTag}*\n"${thread.content.slice(0, 100)}..."\n\n_Diskusi Komunitas Otomotif Odomtr_`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Odo Threads', text });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } catch {
        // Fail silently
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await threadsService.createComment(thread.id, commentText);
      setComments((prev) => [newComment, ...prev]);
      setThread((prev) =>
        prev ? { ...prev, comments_count: prev.comments_count + 1 } : null
      );
      setCommentText('');
    } catch {
      // Fail silently
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 text-white min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-extrabold">Memuat Media Viewport...</p>
        </div>
      </div>
    );
  }

  if (error || !thread || !thread.photo_urls || thread.photo_urls.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-screen">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="font-extrabold text-slate-900 text-base mb-2">{error || 'Foto tidak ditemukan'}</h2>
          <button
            onClick={() => navigate(-1)}
            className="py-2.5 px-4 bg-slate-900 text-white rounded-full text-xs font-extrabold cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = thread.photo_urls[activePhotoIndex] || thread.photo_urls[0];
  const usernameDisplay = `@${thread.user_username || 'user'}`;

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 min-h-screen flex flex-col lg:flex-row overflow-hidden select-none">
      {/* ── Left Stage: 70% Width Main Photo Viewport & Controls ── */}
      <div className="lg:w-[72%] flex-1 flex flex-col justify-between bg-slate-950 relative border-r border-slate-800/80 min-h-[500px] lg:min-h-screen">
        {/* Top Header Navigation Overlay */}
        <div className="p-4 sm:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-slate-950/90 to-transparent">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ArrowLeft size={18} className="text-purple-400" />
            <span>Kembali ke Post</span>
          </button>

          <span className="text-xs font-mono font-extrabold text-slate-300 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-800 shadow-xl backdrop-blur-md">
            Foto {activePhotoIndex + 1} dari {thread.photo_urls.length}
          </span>
        </div>

        {/* 100% Dead-Center Image Viewport */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden my-auto">
          <img
            key={activePhotoIndex}
            src={currentPhoto}
            alt={`Post photo ${activePhotoIndex + 1}`}
            className="max-h-[78vh] max-w-[92%] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800/80 animate-in zoom-in-95 duration-200"
          />

          {/* Left Arrow Navigation */}
          {thread.photo_urls.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setActivePhotoIndex((prev) =>
                  prev === 0 ? thread.photo_urls.length - 1 : prev - 1
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white bg-slate-900/80 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
              title="Foto Sebelumnya"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Arrow Navigation */}
          {thread.photo_urls.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setActivePhotoIndex((prev) => (prev + 1) % thread.photo_urls.length)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white bg-slate-900/80 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
              title="Foto Selanjutnya"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip (If Multi-Photo) */}
        {thread.photo_urls.length > 1 && (
          <div className="p-4 flex items-center justify-center gap-2.5 bg-slate-950/80 border-t border-slate-900 overflow-x-auto z-20">
            {thread.photo_urls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIndex(idx)}
                className={[
                  'w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0',
                  idx === activePhotoIndex
                    ? 'border-purple-500 ring-2 ring-purple-500/50 scale-105'
                    : 'border-slate-800 opacity-60 hover:opacity-100',
                ].join(' ')}
              >
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right Panel: 28% Width Caption, Details & Comments ── */}
      <div className="lg:w-[28%] min-w-[340px] bg-slate-900 border-l border-slate-800/90 flex flex-col justify-between h-auto lg:h-screen overflow-y-auto">
        {/* User Profile Header */}
        <div className="p-5 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            {thread.user_avatar ? (
              <img
                src={thread.user_avatar}
                alt={usernameDisplay}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {(thread.user_username || thread.user_name).slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-white truncate">{usernameDisplay}</h4>
              <p className="text-[11px] text-slate-400">{timeAgo(thread.created_at)}</p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800/60">
            {thread.category}
          </span>
        </div>

        {/* Post Caption Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {thread.vehicle_name && (
            <div className="inline-flex items-center gap-1.5 bg-purple-950/60 border border-purple-800/50 px-3 py-1 rounded-xl text-xs text-purple-300 font-semibold">
              <Car size={13} className="text-purple-400" />
              <span>{thread.vehicle_name}</span>
            </div>
          )}

          <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">
            {thread.content}
          </p>

          {/* Social Stats Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/90 text-xs font-semibold">
            <button
              type="button"
              onClick={handleLike}
              className={[
                'flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer',
                thread.is_liked
                  ? 'bg-rose-950/80 text-rose-400 font-bold border border-rose-800/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              ].join(' ')}
            >
              <Heart size={16} fill={thread.is_liked ? 'currentColor' : 'none'} />
              <span>{thread.likes_count}</span>
            </button>

            <button
              type="button"
              onClick={handleBookmark}
              className={[
                'flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer',
                thread.is_bookmarked
                  ? 'bg-purple-950/80 text-purple-300 font-bold border border-purple-800/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              ].join(' ')}
            >
              <Bookmark size={16} fill={thread.is_bookmarked ? 'currentColor' : 'none'} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white py-1.5 px-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isCopied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              <span>{isCopied ? 'Disalin' : 'Share'}</span>
            </button>
          </div>

          {/* Comments List */}
          <div className="pt-4 border-t border-slate-800/90 space-y-3">
            <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} className="text-purple-400" /> Komentar ({comments.length})
            </h5>

            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center italic font-medium">
                Belum ada komentar. Jadilah yang pertama memberikan tanggapan!
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-300">
                        @{c.user_username || c.user_name}
                      </span>
                      <span className="text-[10px] text-slate-500">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-normal">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Comment Input Form */}
        <form onSubmit={handleSubmitComment} className="p-4 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 z-10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              placeholder="Tulis tanggapan..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-slate-950 text-white placeholder-slate-500 border border-slate-800 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full transition-transform active:scale-90 disabled:opacity-50 cursor-pointer shadow-md"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ThreadPhotoViewerPage;
