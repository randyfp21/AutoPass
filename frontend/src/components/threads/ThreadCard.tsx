import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Bookmark, Trash2, Car, Share2, Check, AlertTriangle, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Thread } from '../../types';
import { threadsService } from '../../services/threadsService';
import { timeAgo } from '../../utils/formatters';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface ThreadCardProps {
  thread: Thread;
  currentUserId?: string;
  onCommentClick?: (thread: Thread) => void;
  onThreadDeleted?: (threadId: string) => void;
  onHashtagClick?: (tag: string) => void;
}

function renderContentWithHashtags(
  content: string,
  onHashtagClick?: (tag: string) => void
) {
  const parts = content.split(/(#[\w\d_\-]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('#') && part.length > 1) {
      const tag = part.slice(1);
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            if (onHashtagClick) {
              onHashtagClick(tag);
            }
          }}
          className="text-purple-600 font-extrabold hover:underline hover:text-purple-700 cursor-pointer bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded-md border border-purple-200/80 inline-flex items-center gap-0.5 mx-0.5 transition-colors no-card-click"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function ThreadCard({
  thread: initialThread,
  currentUserId,
  onCommentClick,
  onThreadDeleted,
  onHashtagClick,
}: ThreadCardProps) {
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread>(initialThread);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // In-Card Photo Carousel & Lightbox Modal state
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Single image aspect-ratio detection (landscape, portrait, square)
  const [aspectType, setAspectType] = useState<'landscape' | 'portrait' | 'square'>('landscape');

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('img') ||
      target.closest('.no-card-click')
    ) {
      return;
    }
    navigate(`/threads/${thread.id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const openLightbox = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const navigateToUserProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    ban: { label: '🛞 Ban & Roda', bg: 'bg-stone-100 text-stone-800 border-stone-300' },
    ev: { label: '⚡ Electric Vehicle (EV)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    audio: { label: '🔊 Audio Mobil', bg: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
    biled: { label: '💡 Lampu & Biled', bg: 'bg-amber-50 text-amber-900 border-amber-300' },
    aksesoris: { label: '🎀 Aksesoris', bg: 'bg-pink-50 text-pink-800 border-pink-300' },
    general: { label: '💬 Diskusi Umum', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const categoryBadge = categoryBadgeMap[thread.category] || categoryBadgeMap.general;
  const usernameDisplay = `@${thread.user_username || 'user'}`;

  // Helper for single image container aspect ratio class
  const getSingleImageAspectClass = () => {
    if (aspectType === 'portrait') return 'aspect-[3/4] max-h-[440px]';
    if (aspectType === 'square') return 'aspect-square max-h-[380px]';
    return 'aspect-video max-h-[380px]'; // landscape
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="bg-white border border-slate-200 hover:border-purple-400/80 rounded-3xl p-4 sm:p-5 shadow-xs transition-all space-y-3.5 cursor-pointer group/card"
      >
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
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Hapus Thread"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Privacy Protected Vehicle Tag */}
        {thread.vehicle_name && (
          <div className="inline-flex items-center gap-2 bg-purple-50/70 border border-purple-200/60 px-3 py-1 rounded-xl text-xs text-purple-900 font-semibold shadow-2xs">
            <Car size={14} className="text-purple-600 shrink-0" />
            <span>{thread.vehicle_name}</span>
          </div>
        )}

        {/* Content Text with Interactive Hashtags */}
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line group-hover/card:text-slate-900">
          {renderContentWithHashtags(thread.content, onHashtagClick)}
        </p>

        {/* In-Card Interactive Single-Image Photo Carousel / Slider */}
        {thread.photo_urls && thread.photo_urls.length > 0 && (
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-950 flex items-center justify-center p-1 sm:p-2 group">
            {/* Active Single Photo Display */}
            <img
              src={thread.photo_urls[activePhotoIndex]}
              alt={`Post media ${activePhotoIndex + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/threads/${thread.id}/photo?index=${activePhotoIndex}`);
              }}
              className="w-auto max-w-full max-h-[580px] rounded-xl object-contain shadow-md cursor-pointer transition-all duration-300 group-hover:scale-[1.005]"
            />

            {/* Overlaid Hover Lightbox Trigger */}
            <div
              className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
            >
              <span className="bg-slate-900/90 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-slate-700/80 flex items-center gap-1.5 shadow-xl backdrop-blur-md">
                <Maximize2 size={13} className="text-purple-400" /> Perbesar Foto
              </span>
            </div>

            {/* Multi-Photo Carousel Controls (Only shown if > 1 photo) */}
            {thread.photo_urls.length > 1 && (
              <>
                {/* Photo Counter Badge (Top Right) */}
                <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-mono font-extrabold px-3 py-1 rounded-full border border-slate-700/80 shadow-md pointer-events-none">
                  {activePhotoIndex + 1} / {thread.photo_urls.length}
                </div>

                {/* Left Navigation Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) => (prev - 1 + thread.photo_urls.length) % thread.photo_urls.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border border-slate-700/80 shadow-lg transition-transform active:scale-90 cursor-pointer"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Right Navigation Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) => (prev + 1) % thread.photo_urls.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md border border-slate-700/80 shadow-lg transition-transform active:scale-90 cursor-pointer"
                  title="Foto Selanjutnya"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Bottom Pagination Dots */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                  {thread.photo_urls.map((_, idx) => (
                    <span
                      key={idx}
                      className={[
                        'h-2 rounded-full transition-all duration-300 shadow-sm',
                        idx === activePhotoIndex
                          ? 'w-6 bg-purple-500'
                          : 'w-2 bg-white/60',
                      ].join(' ')}
                    />
                  ))}
                </div>
              </>
            )}
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
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/threads/${thread.id}`);
              }}
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
        <div className="fixed inset-0 z-50 overflow-y-auto flex min-h-full items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 space-y-4 text-center my-auto">
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

      {/* ── Image Lightbox Popup Modal ── */}
      {thread.photo_urls && (
        <ImageLightboxModal
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          images={thread.photo_urls}
          initialIndex={lightboxIndex}
        />
      )}
    </>
  );
}

export default ThreadCard;
