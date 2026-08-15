import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Edit3, UserPlus, UserCheck, Users, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { threadsService } from '../services/threadsService';
import { authService } from '../services/authService';
import { ThreadCard } from '../components/threads/ThreadCard';
import { ThreadComposerModal } from '../components/threads/ThreadComposerModal';
import { EditProfileModal } from '../components/common/EditProfileModal';
import type { Thread } from '../types';

export function UserProfilePage() {
  const params = useParams<{ id?: string; identifier?: string; '*': string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, setUser: setCurrentUser } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposerModal, setShowComposerModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Subscription State
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);

  // Safely extract & decode identifier (e.g., %40dnazrl -> @dnazrl)
  const pathParts = location.pathname.split('/');
  const rawTargetId = params.id || params.identifier || params['*'] || pathParts[pathParts.length - 1] || '';
  const decodedTargetId = decodeURIComponent(rawTargetId);

  // Determine target userId/username to fetch
  const targetUserIdentifier = decodedTargetId || currentUser?.username || currentUser?.id || '';
  const isOwnProfile =
    !decodedTargetId ||
    decodedTargetId === currentUser?.id ||
    decodedTargetId === `@${currentUser?.username}` ||
    decodedTargetId === currentUser?.username;

  const fetchUserThreadsAndStats = async () => {
    if (!targetUserIdentifier) return;
    setIsLoading(true);
    try {
      const [userThreadList, statsData] = await Promise.all([
        threadsService.getUserThreads(targetUserIdentifier),
        authService.getUserProfile(targetUserIdentifier),
      ]);

      setThreads(userThreadList);
      if (statsData) {
        setSubscribersCount(statsData.subscribers_count || 0);
        setIsSubscribed(!!statsData.is_subscribed);
      }
    } catch {
      // Fail silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserThreadsAndStats();
  }, [targetUserIdentifier]);

  const handleToggleSubscribe = async () => {
    if (isOwnProfile || !targetUserIdentifier) return;
    setIsSubscribing(true);
    try {
      const res = await authService.toggleSubscription(targetUserIdentifier);
      setIsSubscribed(res.is_subscribed);
      setSubscribersCount(res.subscribers_count);
    } catch {
      // Fail silently
    } finally {
      setIsSubscribing(false);
    }
  };

  const firstThread = threads[0];
  const profileUser = isOwnProfile ? currentUser : null;

  const avatarUrl = profileUser?.avatar_url || firstThread?.user_avatar;
  const displayName = profileUser?.full_name || firstThread?.user_name || 'Vehicle Owner';
  const usernameDisplay = `@${profileUser?.username || firstThread?.user_username || 'user'}`;
  const userBio = profileUser?.bio || firstThread?.user_bio;
  const userRole = profileUser?.role || firstThread?.user_role || 'user';

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {isOwnProfile ? 'Profil Saya' : 'Profil Pengguna'}
          </span>
        </div>

        {/* Highlighted Profile Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-purple-500/20 shadow-md shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white font-black flex items-center justify-center text-2xl shadow-md shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Edit Profil</span>
                </button>
              ) : (
                <button
                  onClick={handleToggleSubscribe}
                  disabled={isSubscribing}
                  className={[
                    'py-2 px-5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50',
                    isSubscribed
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white',
                  ].join(' ')}
                >
                  {isSubscribing ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <UserCheck size={15} className="text-emerald-600" />
                      <span>Subscribed</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Subscribe</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User Name & Handle */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {usernameDisplay}
              </h2>
              <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                {userRole === 'workshop_owner' ? '🔧 Bengkel Partner' : ' Verified Owner'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {displayName}
            </p>

            {/* Bio Section - Clean Muted Text */}
            <p className="text-xs text-slate-500 font-normal leading-relaxed mt-2">
              {userBio || 'Pecinta otomotif & pengguna setia Odomtr.'}
            </p>
          </div>

          {/* Highlighted Profile Metrics Grid Bar (3 Metric Cards) */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Metric 1: Subscribers (HERO HIGHLIGHTED CARD) */}
            <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white rounded-2xl p-3.5 text-center shadow-md relative overflow-hidden group">
              <div className="absolute -right-2 -bottom-2 text-white/10 group-hover:scale-110 transition-transform">
                <Users size={54} />
              </div>
              <div className="relative z-10 space-y-0.5">
                <div className="text-xl sm:text-2xl font-black tracking-tight font-mono">
                  {subscribersCount.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] font-extrabold text-purple-100 flex items-center justify-center gap-1">
                  <Users size={12} className="text-pink-200" />
                  <span>Subscribers</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Thread Posts */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                {threads.length}
              </div>
              <div className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1">
                <MessageSquare size={12} className="text-purple-600" />
                <span>Thread Post</span>
              </div>
            </div>

            {/* Metric 3: Status */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
              <div className="text-sm font-extrabold text-emerald-600 mt-1 flex items-center justify-center gap-1">
                <ShieldCheck size={16} />
                <span>Aktif</span>
              </div>
              <div className="text-[11px] font-bold text-slate-500">
                Komunitas
              </div>
            </div>
          </div>
        </div>

        {/* User Threads List Section */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-purple-600" />
            Thread Diposting ({threads.length})
          </h3>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-44 rounded-2xl" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <MessageSquare size={32} className="mx-auto text-slate-300 mb-1" />
              <h4 className="font-bold text-slate-800 text-sm">Belum ada thread yang diposting</h4>
              <p className="text-xs text-slate-400 mt-1">
                Posting thread pertama kamu untuk memulai diskusi di komunitas Odomtr!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {threads.map((t) => (
                <ThreadCard
                  key={t.id}
                  thread={t}
                  currentUserId={currentUser?.id}
                  onThreadDeleted={(deletedId) => setThreads((prev) => prev.filter((item) => item.id !== deletedId))}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ThreadComposerModal
        isOpen={showComposerModal}
        onClose={() => setShowComposerModal(false)}
        vehicles={[]}
        onThreadCreated={fetchUserThreadsAndStats}
      />

      {currentUser && (
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          user={currentUser}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            fetchUserThreadsAndStats();
          }}
        />
      )}
    </div>
  );
}

export default UserProfilePage;
