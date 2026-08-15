import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Bookmark, Trash2, Car, Share2, Check, AlertTriangle, X } from 'lucide-react';
import type { Thread } from '../../types';
import { threadsService } from '../../services/threadsService';
import { timeAgo } from '../../utils/formatters';

interface ThreadCardProps {
  thread: Thread;
  currentUserId?: string;
  onCommentClick: (thread: Thread) => void;
  onThreadDeleted?: (threadId: string) => void;
}

export function ThreadCard({
  thread: initialThread,
  currentUserId,
  onCommentClick,
  onThreadDeleted,
}: ThreadCardProps) {
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread>(initialThread);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleLike = async () => {
    try {
      const isLiked = await threadsService.toggleLikeThread(thread.id);
      setThread((prev) => ({
        ...prev,
        is_liked: isLiked,
        likes_count: isLiked ? prev.likes_count + 1 : Math.max(0, prev.likes_count - 1),
      }));
    } catch {
      // Fail silently
    }
  };

  const handleBookmark = async () => {
    try {
      const isBookmarked = await threadsService.toggleBookmarkThread(thread.id);
      setThread((prev) => ({
        ...prev,
        is_bookmarked: isBookmarked,
        bookmarks_count: isBookmarked ? prev.bookmarks_count + 1 : Math.max(0, prev.bookmarks_count - 1),
      }));
    } catch {
      // Fail silently
    }
  };

  const confirmDeleteThread = async () => {
    setIsDeleting(true);
    try {
      await threadsService.deleteThread(thread.id);
      setShowDeleteModal(false);
      if (onThreadDeleted) onThreadDeleted(thread.id);
    } catch {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
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

  const navigateToUserProfile = () => {
    const target = thread.user_username ? `@${thread.user_username}` : thread.user_id;
    navigate(`/threads/user/${target}`);
  };

  const isAuthor = currentUserId === thread.user_id;

  const categoryBadgeMap: Record<string, { label: string; bg: string }> = {
    kendala: { label: '🚨 Kendala / Trouble', bg: 'bg-red-50 text-red-700 border-red-200' },
    pengalaman: { label: '✨ Sharing Pengalaman', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    tips: { label: '💡 Tips & Trick', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    trip: { label: '🗺️ Trip / Perjalanan', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    touring: { label: '🏍️ Touring / Sunmori', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    modifikasi: { label: '🛠️ Modifikasi', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    general: { label: '💬 Diskusi Umum', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const categoryBadge = categoryBadgeMap[thread.category] || categoryBadgeMap.general;
  const usernameDisplay = `@${thread.user_username || 'user'}`;

  return (
    <>
      <div className="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3.5">
        {/* Header Row: User Info + Category Badge + Delete */}
        <div className="flex items-start justify-between gap-3">
          <div
            onClick={navigateToUserProfile}
            className="flex items-center gap-3 min-w-0 cursor-pointer group"
          >
            {thread.user_avatar ? (
              <img
                src={thread.user_avatar}
                alt={usernameDisplay}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20 group-hover:ring-purple-500 shrink-0 transition-all"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {(thread.user_username || thread.user_name).slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-600 truncate transition-colors">
                  {usernameDisplay}
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold shrink-0">
                  {thread.user_role === 'workshop_owner' ? '🔧 Bengkel Official' : ' Verified Owner'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(thread.created_at)}</p>
            </div>
          </div>

          {/* Right Badges / Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${categoryBadge.bg}`}>
              {categoryBadge.label}
            </span>

            {isAuthor && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Hapus Thread"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Privacy Protected Vehicle Tag (Category, Brand, Model, Variant ONLY - NO License Plate) */}
        {thread.vehicle_name && (
          <div className="inline-flex items-center gap-2 bg-purple-50/70 border border-purple-200/60 px-3 py-1 rounded-xl text-xs text-purple-900 font-semibold shadow-2xs">
            <Car size={14} className="text-purple-600 shrink-0" />
            <span>{thread.vehicle_name}</span>
          </div>
        )}

        {/* Content Text */}
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
          {thread.content}
        </p>

        {/* Multi-Photo Carousel Grid (Up to 5 photos) */}
        {thread.photo_urls && thread.photo_urls.length > 0 && (
          <div
            className={[
              'grid gap-2 rounded-2xl overflow-hidden border border-slate-200',
              thread.photo_urls.length === 1
                ? 'grid-cols-1 max-h-80'
                : thread.photo_urls.length === 2
                ? 'grid-cols-2 max-h-64'
                : 'grid-cols-3 max-h-56',
            ].join(' ')}
          >
            {thread.photo_urls.map((photoUrl, idx) => (
              <div key={idx} className="relative overflow-hidden bg-slate-900 h-full min-h-[140px]">
                <img
                  src={photoUrl}
                  alt={`Media ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => window.open(photoUrl, '_blank')}
                />
              </div>
            ))}
          </div>
        )}

        {/* Action Footer Buttons: Like, Comment, Bookmark, Share */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleLike}
              className={[
                'flex items-center gap-1.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer',
                thread.is_liked
                  ? 'bg-rose-50 text-rose-600 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')}
            >
              <Heart size={16} fill={thread.is_liked ? 'currentColor' : 'none'} />
              <span>{thread.likes_count}</span>
            </button>

            {/* Comment / Reply Button */}
            <button
              type="button"
              onClick={() => onCommentClick(thread)}
              className="flex items-center gap-1.5 py-1 px-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>{thread.comments_count}</span>
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={handleBookmark}
              className={[
                'flex items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer',
                thread.is_bookmarked
                  ? 'bg-purple-50 text-purple-600 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')}
            >
              <Bookmark size={16} fill={thread.is_bookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-700 py-1 px-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isCopied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            <span className="text-[11px]">{isCopied ? 'Disalin' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* ── Modal Konfirmasi Hapus Thread ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Hapus Thread Ini?</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus thread ini secara permanen? Seluruh komentar dan interaksi di dalamnya juga akan terhapus.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteThread}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ThreadCard;
