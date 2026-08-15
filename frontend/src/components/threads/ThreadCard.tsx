import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Bookmark, Trash2, Car, Share2, Check, AlertTriangle, Maximize2 } from 'lucide-react';
import type { Thread } from '../../types';
import { threadsService } from '../../services/threadsService';
import { timeAgo } from '../../utils/formatters';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface ThreadCardProps {
  thread: Thread;
  currentUserId?: string;
  onCommentClick?: (thread: Thread) => void;
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

  // Lightbox Modal state
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

        {/* Content Text */}
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line group-hover/card:text-slate-900">
          {thread.content}
        </p>

        {/* Adaptive Photo Grid & Aspect Ratio System */}
        {thread.photo_urls && thread.photo_urls.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-950">
            {/* Case 1: Single Image (Auto Aspect Ratio: Portrait / Landscape / Square) */}
            {thread.photo_urls.length === 1 && (
              <div
                className="relative w-full flex items-center justify-center bg-slate-950 p-1 sm:p-2 group cursor-pointer overflow-hidden"
                onClick={(e) => openLightbox(e, 0)}
              >
                <img
                  src={thread.photo_urls[0]}
                  alt="Post media"
                  className="w-auto max-w-full max-h-[580px] rounded-xl object-contain shadow-md group-hover:scale-[1.01] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-slate-900/90 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-slate-700/80 flex items-center gap-1.5 shadow-xl backdrop-blur-md">
                    <Maximize2 size={13} className="text-purple-400" /> Perbesar Foto
                  </span>
                </div>
              </div>
            )}

            {/* Case 2: 2 Images (Side-by-Side 50%-50%) */}
            {thread.photo_urls.length === 2 && (
              <div className="grid grid-cols-2 gap-1.5 aspect-[16/10] max-h-[380px]">
                {thread.photo_urls.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-full h-full group cursor-pointer overflow-hidden bg-slate-900"
                    onClick={(e) => openLightbox(e, idx)}
                  >
                    <img
                      src={photoUrl}
                      alt={`Media ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 size={18} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Case 3: 3 Images (1 Hero Left, 2 Stacked Right) */}
            {thread.photo_urls.length === 3 && (
              <div className="grid grid-cols-3 gap-1.5 max-h-[380px] aspect-[16/10]">
                <div
                  className="col-span-2 relative h-full group cursor-pointer overflow-hidden bg-slate-900"
                  onClick={(e) => openLightbox(e, 0)}
                >
                  <img
                    src={thread.photo_urls[0]}
                    alt="Media 1"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 size={18} className="text-white drop-shadow-md" />
                  </div>
                </div>

                <div className="col-span-1 grid grid-rows-2 gap-1.5 h-full">
                  {thread.photo_urls.slice(1, 3).map((photoUrl, idx) => (
                    <div
                      key={idx + 1}
                      className="relative w-full h-full group cursor-pointer overflow-hidden bg-slate-900"
                      onClick={(e) => openLightbox(e, idx + 1)}
                    >
                      <img
                        src={photoUrl}
                        alt={`Media ${idx + 2}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case 4+: 4 or More Images (2x2 Quad Grid with +N Badge on 4th Photo) */}
            {thread.photo_urls.length >= 4 && (
              <div className="grid grid-cols-2 gap-1.5 max-h-[400px] aspect-video">
                {thread.photo_urls.slice(0, 4).map((photoUrl, idx) => {
                  const isFourthAndHasMore = idx === 3 && thread.photo_urls.length > 4;
                  const remainingCount = thread.photo_urls.length - 4;

                  return (
                    <div
                      key={idx}
                      className="relative w-full h-full group cursor-pointer overflow-hidden bg-slate-900"
                      onClick={(e) => openLightbox(e, idx)}
                    >
                      <img
                        src={photoUrl}
                        alt={`Media ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isFourthAndHasMore ? (
                        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center font-extrabold text-white text-base">
                          +{remainingCount} Foto Lainnya
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 size={16} className="text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
