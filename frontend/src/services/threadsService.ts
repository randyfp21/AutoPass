import api from './api';
import type { Thread, CreateThreadData, ThreadComment, NotificationItem } from '../types';

export const threadsService = {
  getThreads: async (category?: string, limit: number = 5, offset: number = 0): Promise<Thread[]> => {
    const res = await api.get<Thread[]>('/threads', {
      params: {
        ...(category ? { category } : {}),
        limit,
        offset,
      },
    });
    return res.data || [];
  },

  getThreadById: async (threadId: string): Promise<Thread> => {
    const res = await api.get<Thread>(`/threads/${threadId}`);
    return res.data;
  },

  createThread: async (data: CreateThreadData): Promise<Thread> => {
    const res = await api.post<Thread>('/threads', data);
    return res.data;
  },

  deleteThread: async (threadId: string): Promise<void> => {
    await api.delete(`/threads/${threadId}`);
  },

  toggleLikeThread: async (threadId: string): Promise<boolean> => {
    const res = await api.post<{ is_liked: boolean }>(`/threads/${threadId}/like`);
    return res.data.is_liked;
  },

  toggleBookmarkThread: async (threadId: string): Promise<boolean> => {
    const res = await api.post<{ is_bookmarked: boolean }>(`/threads/${threadId}/bookmark`);
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

  createComment: async (threadId: string, content: string, parentId?: string): Promise<ThreadComment> => {
    const res = await api.post<ThreadComment>(`/threads/${threadId}/comments`, { content, parent_id: parentId });
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

export default threadsService;
