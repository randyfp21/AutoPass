import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, MessageSquare, Send, Heart, CornerDownRight, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { threadsService } from '../services/threadsService';
import { ThreadCard } from '../components/threads/ThreadCard';
import { timeAgo } from '../utils/formatters';
import type { Thread, ThreadComment } from '../types';

export function ThreadDetailPage() {
  const { id: threadId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Reply state
  const [replyToComment, setReplyToComment] = useState<ThreadComment | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const fetchThreadAndComments = async () => {
    if (!threadId) return;
    setIsLoading(true);
    setError('');

    try {
      const [threadData, commentList] = await Promise.all([
        threadsService.getThreadById(threadId),
        threadsService.getThreadComments(threadId),
      ]);
      setThread(threadData);
      setComments(commentList);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat detail thread. Thread mungkin telah dihapus.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadAndComments();
  }, [threadId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !newCommentText.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await threadsService.createComment(
        thread.id,
        newCommentText.trim(),
        replyToComment ? replyToComment.id : undefined
      );

      setComments((prev) => [...prev, created]);
      setThread((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : null));
      setNewCommentText('');
      setReplyToComment(null);
    } catch (err) {
      console.error(err);
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

  const handleReplyClick = (comment: ThreadComment) => {
    setReplyToComment(comment);
    setNewCommentText(`@${comment.user_username || comment.user_name} `);
    inputRef.current?.focus();
  };

  // Group comments into root comments and nested replies map
  const rootComments = comments.filter((c) => !c.parent_id);
  const repliesMap: Record<string, ThreadComment[]> = {};

  comments.forEach((c) => {
    if (c.parent_id) {
      if (!repliesMap[c.parent_id]) {
        repliesMap[c.parent_id] = [];
      }
      repliesMap[c.parent_id].push(c);
    }
  });

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer bg-white hover:bg-slate-100 px-3.5 py-2 rounded-full border border-slate-200 shadow-2xs active:scale-95"
            >
              <ArrowLeft size={16} />
              <span>Kembali</span>
            </button>

            <button
              onClick={() => navigate('/threads')}
              className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-all cursor-pointer bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-full border border-purple-200 shadow-2xs active:scale-95"
            >
              <Home size={15} />
              <span>Beranda Threads</span>
            </button>
          </div>

          <span className="text-[11px] font-mono font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 hidden sm:inline-block">
            Detail Discussion
          </span>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="skeleton h-60 rounded-3xl" />
            <div className="skeleton h-32 rounded-3xl" />
          </div>
        ) : error || !thread ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <AlertCircle size={40} className="mx-auto text-red-500 mb-1" />
            <h3 className="font-extrabold text-slate-800 text-base">Thread Tidak Ditemukan</h3>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={() => navigate('/threads')}
              className="mt-2 text-xs font-bold text-purple-600 hover:underline cursor-pointer"
            >
              Kembali ke Beranda Threads
            </button>
          </div>
        ) : (
          <>
            {/* Main Thread Card Display */}
            <ThreadCard
              thread={thread}
              currentUserId={currentUser?.id}
              onCommentClick={() => inputRef.current?.focus()}
              onThreadDeleted={() => navigate('/threads')}
            />

            {/* Discussion & Comments Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <MessageSquare size={18} className="text-purple-600" />
                  Diskusi & Komentar ({comments.length})
                </h3>
              </div>

              {/* Input Form for New Comment / Reply */}
              <form onSubmit={handleSubmitComment} className="space-y-2">
                {replyToComment && (
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs">
                    <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                      <CornerDownRight size={14} className="text-purple-600" />
                      Membalas komentar @{replyToComment.user_username || replyToComment.user_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyToComment(null);
                        setNewCommentText('');
                      }}
                      className="p-1 text-purple-700 hover:text-purple-950 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={
                      replyToComment
                        ? `Tulis balasan untuk @${replyToComment.user_username || replyToComment.user_name}...`
                        : 'Tulis tanggapan atau diskusi kamu...'
                    }
                    className="flex-1 py-3 px-4 text-xs bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-full outline-none shadow-xs"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !newCommentText.trim()}
                    className="py-3 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Send size={14} />
                    <span>Kirim</span>
                  </button>
                </div>
              </form>

              {/* Comments & Reply Tree */}
              {comments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-1">
                  <MessageSquare size={36} className="mx-auto text-slate-300 mb-2" />
                  <h4 className="font-extrabold text-slate-700 text-xs">Belum Ada Komentar</h4>
                  <p className="text-[11px]">Beri komentar pertama untuk memulai percakapan!</p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {rootComments.map((comment) => (
                    <div key={comment.id} className="space-y-3">
                      {/* Parent Root Comment Item */}
                      <div className="flex gap-3 text-xs">
                        {comment.user_avatar ? (
                          <img
                            src={comment.user_avatar}
                            alt={comment.user_name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                            {(comment.user_username || comment.user_name).slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900">
                              @{comment.user_username || comment.user_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {timeAgo(comment.created_at)}
                            </span>
                          </div>

                          <p className="text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                            {comment.content}
                          </p>

                          <div className="pt-1 flex items-center gap-4 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleLikeComment(comment.id)}
                              className={[
                                'flex items-center gap-1 font-semibold transition-colors cursor-pointer',
                                comment.is_liked ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900',
                              ].join(' ')}
                            >
                              <Heart size={13} fill={comment.is_liked ? 'currentColor' : 'none'} />
                              <span>{comment.likes_count}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReplyClick(comment)}
                              className="text-purple-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <CornerDownRight size={13} />
                              <span>Balas</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nested Replies List (Indented under parent) */}
                      {repliesMap[comment.id] && repliesMap[comment.id].length > 0 && (
                        <div className="pl-6 sm:pl-10 border-l-2 border-purple-200/80 space-y-3 ml-4">
                          {repliesMap[comment.id].map((reply) => (
                            <div key={reply.id} className="flex gap-2.5 text-xs">
                              {reply.user_avatar ? (
                                <img
                                  src={reply.user_avatar}
                                  alt={reply.user_name}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                  {(reply.user_username || reply.user_name).slice(0, 2).toUpperCase()}
                                </div>
                              )}

                              <div className="flex-1 space-y-1 bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-900">
                                    @{reply.user_username || reply.user_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {timeAgo(reply.created_at)}
                                  </span>
                                </div>

                                <p className="text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                                  {reply.content}
                                </p>

                                <div className="pt-1 flex items-center gap-4 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => handleLikeComment(reply.id)}
                                    className={[
                                      'flex items-center gap-1 font-semibold transition-colors cursor-pointer',
                                      reply.is_liked ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900',
                                    ].join(' ')}
                                  >
                                    <Heart size={12} fill={reply.is_liked ? 'currentColor' : 'none'} />
                                    <span>{reply.likes_count}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleReplyClick(reply)}
                                    className="text-purple-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <CornerDownRight size={12} />
                                    <span>Balas</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ThreadDetailPage;
