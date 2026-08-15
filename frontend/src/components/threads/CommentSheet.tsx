import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Heart, X, MessageSquare, AlertCircle, CornerDownRight } from 'lucide-react';
import type { Thread, ThreadComment } from '../../types';
import { threadsService } from '../../services/threadsService';
import { timeAgo } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface CommentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread | null;
  onCommentAdded?: () => void;
}

export function CommentSheet({ isOpen, onClose, thread, onCommentAdded }: CommentSheetProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  if (!isOpen || !thread) return null;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const created = await threadsService.createComment(thread.id, newCommentText.trim());
      setComments((prev) => [...prev, created]);
      setNewCommentText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim balasan';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLikeComment = async (commentId: string) => {
    try {
      const isLiked = await threadsService.toggleLikeComment(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                is_liked: isLiked,
                likes_count: isLiked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1),
              }
            : c
        )
      );
    } catch {
      // Fail silently
    }
  };

  const threadUsernameTag = `@${thread.user_username || 'user'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-[85vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Diskusi Balasan ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200/60"
          >
            <X size={18} />
          </button>
        </div>

        {/* Parent Thread Original Snippet */}
        <div className="p-3.5 bg-purple-50/50 border-b border-purple-100/60 text-xs flex items-start gap-3">
          <CornerDownRight size={15} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span
              onClick={() => {
                onClose();
                navigate(`/threads/user/@${thread.user_username || thread.user_id}`);
              }}
              className="font-extrabold text-purple-900 hover:underline cursor-pointer"
            >
              {threadUsernameTag}:
            </span>
            <p className="text-slate-700 line-clamp-2 mt-0.5 font-medium">{thread.content}</p>
          </div>
        </div>

        {/* Comments Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-2xl" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">Belum ada balasan di thread ini.</p>
              <p className="text-[11px] mt-0.5">Jadilah orang pertama yang membalas!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const commentUsernameTag = `@${comment.user_username || 'user'}`;
              return (
                <div key={comment.id} className="flex items-start gap-3 group">
                  {comment.user_avatar ? (
                    <img
                      src={comment.user_avatar}
                      alt={commentUsernameTag}
                      className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer"
                      onClick={() => {
                        onClose();
                        navigate(`/threads/user/@${comment.user_username || comment.user_id}`);
                      }}
                    />
                  ) : (
                    <div
                      onClick={() => {
                        onClose();
                        navigate(`/threads/user/@${comment.user_username || comment.user_id}`);
                      }}
                      className="w-8 h-8 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      {(comment.user_username || comment.user_name).slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        onClick={() => {
                          onClose();
                          navigate(`/threads/user/@${comment.user_username || comment.user_id}`);
                        }}
                        className="font-extrabold text-slate-900 hover:text-purple-600 cursor-pointer"
                      >
                        {commentUsernameTag}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeAgo(comment.created_at)}</span>
                    </div>

                    <p className="text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                      {comment.content}
                    </p>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleToggleLikeComment(comment.id)}
                        className={[
                          'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg transition-colors',
                          comment.is_liked
                            ? 'text-rose-600 font-bold bg-rose-50'
                            : 'text-slate-400 hover:text-slate-700',
                        ].join(' ')}
                      >
                        <Heart size={13} fill={comment.is_liked ? 'currentColor' : 'none'} />
                        <span>{comment.likes_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmitComment} className="p-3 border-t border-slate-200 bg-white">
          {error && (
            <div className="mb-2 p-2 bg-red-50 text-red-700 text-[11px] rounded-xl flex items-center gap-1">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={`Tulis balasan untuk ${threadUsernameTag}...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
              maxLength={800}
            />

            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2.5 rounded-2xl transition-all shadow-xs"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommentSheet;
