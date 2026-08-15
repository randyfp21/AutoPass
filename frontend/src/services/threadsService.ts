import api from './api';
import type { Thread, ThreadComment, CreateThreadData, NotificationItem } from '../types';

export const threadsService = {
  getThreads: async (category?: string): Promise<Thread[]> => {
    const res = await api.get<Thread[]>('/threads', {
      params: category ? { category } : undefined,
    });
    return res.data || [];
  },

  createThread: async (data: CreateThreadData): Promise<Thread> => {
    const res = await api.post<Thread>('/threads', data);
    return res.data;
  },

  deleteThread: async (id: string): Promise<void> => {
    await api.delete(`/threads/${id}`);
  },

  toggleLikeThread: async (id: string): Promise<boolean> => {
    const res = await api.post<{ is_liked: boolean }>(`/threads/${id}/like`);
    return res.data.is_liked;
  },

  toggleBookmarkThread: async (id: string): Promise<boolean> => {
    const res = await api.post<{ is_bookmarked: boolean }>(`/threads/${id}/bookmark`);
    return res.data.is_bookmarked;
  },

  getBookmarkedThreads: async (): Promise<Thread[]> => {
    const res = await api.get<Thread[]>('/threads/bookmarks');
    return res.data || [];
  },

  getUserThreads: async (userId: string): Promise<Thread[]> => {
    const res = await api.get<Thread[]>(`/users/${userId}/threads`);
    return res.data || [];
  },

  getThreadComments: async (threadId: string): Promise<ThreadComment[]> => {
    const res = await api.get<ThreadComment[]>(`/threads/${threadId}/comments`);
    return res.data || [];
  },

  createComment: async (threadId: string, content: string): Promise<ThreadComment> => {
    const res = await api.post<ThreadComment>(`/threads/${threadId}/comments`, { content });
    return res.data;
  },

  toggleLikeComment: async (commentId: string): Promise<boolean> => {
    const res = await api.post<{ is_liked: boolean }>(`/comments/${commentId}/like`);
    return res.data.is_liked;
  },

  getActivities: async (): Promise<NotificationItem[]> => {
    const res = await api.get<NotificationItem[]>('/activities');
    return res.data || [];
  },
};
