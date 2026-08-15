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
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 text-slate-800 min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-extrabold">Memuat Panggung Foto...</p>
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
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen flex flex-col lg:flex-row overflow-hidden select-none">
      {/* ── Left Stage: Main Photo Viewport & Navigation (AutoPass Light Theme Harmonized) ── */}
      <div className="lg:w-[68%] flex-1 flex flex-col justify-between bg-slate-100/70 relative border-r border-slate-200/90 min-h-[500px] lg:min-h-screen">
        {/* Glassmorphism Top Header Bar */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between shadow-2xs z-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm px-4 py-2 rounded-full border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} className="text-purple-600" />
            <span>Kembali ke Post</span>
          </button>

          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600" />
            <span className="text-xs font-mono font-extrabold text-purple-700 bg-purple-50 px-3.5 py-1.5 rounded-full border border-purple-200 shadow-2xs">
              Foto {activePhotoIndex + 1} dari {thread.photo_urls.length}
            </span>
          </div>
        </div>

        {/* Dark Glass Canvas Stage for High Contrast Photo Viewport */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden my-auto w-full">
          <div className="relative bg-slate-950 rounded-3xl p-4 border border-slate-800 shadow-2xl flex items-center justify-center max-w-5xl w-full h-[76vh] overflow-hidden">
            <img
              key={activePhotoIndex}
              src={currentPhoto}
              alt={`Post photo ${activePhotoIndex + 1}`}
              className="max-h-[70vh] max-w-[95%] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800/80 animate-in zoom-in-95 duration-200"
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
                <ChevronLeft size={22} />
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
                <ChevronRight size={22} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Thumbnail Strip (If Multi-Photo) */}
        {thread.photo_urls.length > 1 && (
          <div className="p-3 bg-white border-t border-slate-200/80 flex items-center justify-center gap-2 overflow-x-auto z-20 shadow-2xs">
            {thread.photo_urls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIndex(idx)}
                className={[
                  'w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0',
                  idx === activePhotoIndex
                    ? 'border-purple-600 ring-2 ring-purple-500/40 scale-105 shadow-md'
                    : 'border-slate-200 opacity-60 hover:opacity-100',
                ].join(' ')}
              >
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right Side Panel: Caption, Details & Comments (AutoPass Harmonized Light Card) ── */}
      <div className="lg:w-[32%] min-w-[340px] bg-white border-l border-slate-200/90 flex flex-col justify-between h-auto lg:h-screen shadow-xs">
        {/* User Profile Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/95 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            {thread.user_avatar ? (
              <img
                src={thread.user_avatar}
                alt={usernameDisplay}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                {(thread.user_username || thread.user_name).slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-slate-900 truncate">{usernameDisplay}</h4>
              <p className="text-[11px] text-slate-400 font-medium">{timeAgo(thread.created_at)}</p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {thread.category}
          </span>
        </div>

        {/* Post Caption Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {thread.vehicle_name && (
            <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl text-xs text-purple-900 font-bold shadow-2xs">
              <Car size={14} className="text-purple-600" />
              <span>{thread.vehicle_name}</span>
            </div>
          )}

          <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
            {thread.content}
          </p>

          {/* Social Stats Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
            <button
              type="button"
              onClick={handleLike}
              className={[
                'flex items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer',
                thread.is_liked
                  ? 'bg-rose-50 text-rose-600 font-bold border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80',
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
                  ? 'bg-purple-50 text-purple-600 font-bold border border-purple-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80',
              ].join(' ')}
            >
              <Bookmark size={16} fill={thread.is_bookmarked ? 'currentColor' : 'none'} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            >
              {isCopied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{isCopied ? 'Disalin' : 'Share'}</span>
            </button>
          </div>

          {/* Comments List */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} className="text-purple-600" /> Komentar ({comments.length})
            </h5>

            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center italic font-medium">
                Belum ada komentar. Jadilah yang pertama memberikan tanggapan!
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-900">
                        @{c.user_username || c.user_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-normal">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Comment Input Form */}
        <form onSubmit={handleSubmitComment} className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 shadow-xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              placeholder="Tulis tanggapan..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="input-field text-xs rounded-full py-2 px-4"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full transition-transform active:scale-90 disabled:opacity-50 cursor-pointer shadow-md shrink-0"
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
