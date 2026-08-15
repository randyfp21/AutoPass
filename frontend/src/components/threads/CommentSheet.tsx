import React, { useState, useEffect } from 'react';
import { X, Send, Heart, MessageSquare, AlertCircle } from 'lucide-react';
import type { Thread, ThreadComment } from '../../types';
import { threadsService } from '../../services/threadsService';
import { timeAgo } from '../../utils/formatters';

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread | null;
  onCommentAdded?: () => void;
}

export function CommentSheet({ isOpen, onClose, thread, onCommentAdded }: CommentSheetProps) {
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!thread) return;
    setIsLoading(true);
    try {
      const list = await threadsService.getThreadComments(thread.id);
      setComments(list);
    } catch {
      // Fail silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && thread) {
      fetchComments();
    }
  }, [isOpen, thread]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !thread) return null;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await threadsService.createComment(thread.id, newCommentText.trim());
      setComments((prev) => [...prev, created]);
      setNewCommentText('');
      if (onCommentAdded) onCommentAdded();
    } catch {
      // Fail silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const isLiked = await threadsService.toggleLikeComment(commentId);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              is_liked: isLiked,
              likes_count: isLiked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1),
            };
          }
          return c;
        })
      );
    } catch {
      // Fail silently
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Komentar Diskusi ({comments.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Original Thread Preview Snippet */}
        <div className="p-3.5 bg-purple-50/50 border-b border-purple-100 shrink-0 text-xs">
          <span className="font-extrabold text-purple-900">@{thread.user_username || 'user'}:</span>{' '}
          <span className="text-slate-700 line-clamp-2">{thread.content}</span>
        </div>

        {/* Comments Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-1">
              <MessageSquare size={32} className="mx-auto text-slate-300 mb-1" />
              <p className="text-xs font-bold text-slate-600">Belum ada komentar</p>
              <p className="text-[11px]">Jadilah yang pertama memberikan tanggapan!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-xs">
                {comment.user_avatar ? (
                  <img
                    src={comment.user_avatar}
                    alt={comment.user_name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {(comment.user_username || comment.user_name).slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">
                      @{comment.user_username || comment.user_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>

                  <p className="text-slate-800 leading-relaxed font-normal">
                    {comment.content}
                  </p>

                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLikeComment(comment.id)}
                      className={[
                        'flex items-center gap-1 text-[11px] font-semibold transition-colors',
                        comment.is_liked ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-slate-600',
                      ].join(' ')}
                    >
                      <Heart size={13} fill={comment.is_liked ? 'currentColor' : 'none'} />
                      <span>{comment.likes_count}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Input Area */}
        <form onSubmit={handleSubmitComment} className="p-3 border-t border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Tulis balasan komentar..."
              className="flex-1 py-2.5 px-4 text-xs bg-slate-50 border border-slate-200 rounded-full focus:border-purple-500 outline-none"
            />

            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-full transition-all shrink-0 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommentSheet;
