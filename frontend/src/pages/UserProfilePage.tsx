import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Edit3, UserPlus, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { threadsService } from '../services/threadsService';
import { authService } from '../services/authService';
import { ThreadCard } from '../components/threads/ThreadCard';
import { ThreadComposerModal } from '../components/threads/ThreadComposerModal';
import { CommentSheet } from '../components/threads/CommentSheet';
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
  const [selectedThreadForComment, setSelectedThreadForComment] = useState<Thread | null>(null);

  // Subscription State
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);

  // Safely extract & decode identifier (e.g., %40dnazrl -> @dnazrl)
  const pathSegment = location.pathname.split('/threads/user/')[1] || '';
  const rawParam = params.identifier || params.id || params['*'] || pathSegment || currentUser?.username || currentUser?.id || '';
  let decodedIdentifier = '';
  try {
    decodedIdentifier = decodeURIComponent(rawParam).trim();
  } catch {
    decodedIdentifier = rawParam.trim();
  }

  const cleanUsername = decodedIdentifier.startsWith('@') ? decodedIdentifier.slice(1) : decodedIdentifier;

  const isOwnProfile =
    !cleanUsername ||
    cleanUsername === currentUser?.username ||
    cleanUsername === currentUser?.id ||
    decodedIdentifier === currentUser?.username ||
    decodedIdentifier === currentUser?.id;

  const fetchUserThreadsAndStats = async () => {
    const target = decodedIdentifier || currentUser?.username || currentUser?.id;
    if (!target) return;

    setIsLoading(true);
    try {
      const [list, profileStats] = await Promise.all([
        threadsService.getUserThreads(target),
        authService.getUserProfile(target).catch(() => null),
      ]);
      setThreads(list);
      if (profileStats) {
        setSubscribersCount(profileStats.subscribers_count);
        setIsSubscribed(profileStats.is_subscribed);
      }
    } catch (err) {
      console.error('Error fetching user threads & stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserThreadsAndStats();
  }, [decodedIdentifier]);

  const handleToggleSubscribe = async () => {
    const target = decodedIdentifier || currentUser?.username || currentUser?.id;
    if (!target || isOwnProfile) return;

    setIsSubscribing(true);
    try {
      const res = await authService.toggleSubscription(target);
      setIsSubscribed(res.is_subscribed);
      setSubscribersCount(res.subscribers_count);
    } catch (err) {
      console.error('Error toggling subscription:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Derived display details
  const threadUser = threads[0];
  const userUsername = isOwnProfile
    ? currentUser?.username || cleanUsername
    : threadUser?.user_username || cleanUsername;

  const displayUsername = userUsername ? `@${userUsername.replace(/^@/, '')}` : '@user';

  const displayName = isOwnProfile
    ? currentUser?.full_name
    : threadUser?.user_name || displayUsername;

  const userBio = isOwnProfile
    ? currentUser?.bio
    : threadUser?.user_bio;

  const userAvatar = isOwnProfile ? currentUser?.avatar_url : threadUser?.user_avatar;
  const userRole = isOwnProfile ? currentUser?.role : threadUser?.user_role;

  const avatarInitials = (userUsername || displayName || 'US')
    .replace(/^@/, '')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header Profile Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/threads')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Kembali ke Feed
            </button>

            <div className="flex items-center gap-2">
              {/* Button Edit Profil for own profile */}
              {isOwnProfile && currentUser && (
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Edit3 size={13} /> Edit Profil
                </button>
              )}

              {/* Button Subscribe / Unsubscribe for other user's profile */}
              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={handleToggleSubscribe}
                  disabled={isSubscribing}
                  className={[
                    'flex items-center gap-1.5 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50',
                    isSubscribed
                      ? 'bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-300 text-slate-700'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md',
                  ].join(' ')}
                >
                  {isSubscribed ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                </button>
              )}

              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
                Profil Komunitas
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={displayUsername}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-500/20 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {avatarInitials}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {displayUsername}
                </h2>
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {displayName}
              </p>

              {/* Bio Section - Minimal, Clean Muted Text with Vertical Spacing */}
              <p className="text-xs text-slate-500 font-normal leading-relaxed my-2.5">
                {userBio || 'Pecinta otomotif & pengguna setia Odomtr.'}
              </p>

              {/* Stats & Role Badges */}
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                  {userRole === 'workshop_owner' ? '🔧 Bengkel Official Partner' : ' Verified Vehicle Owner'}
                </span>
                <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {threads.length} Posting Thread
                </span>
                <span className="text-[11px] text-pink-600 font-bold bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 flex items-center gap-1">
                  <Users size={12} /> {subscribersCount} Subscribers
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thread History Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <MessageSquare size={18} className="text-purple-600" />
            {isOwnProfile ? 'Riwayat Thread Saya' : `Posting Thread ${displayUsername}`}
          </h3>
          <span className="text-xs text-slate-400 font-medium">{threads.length} posts</span>
        </div>

        {/* User Threads List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <MessageSquare size={36} className="mx-auto text-slate-300 mb-2" />
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
                onCommentClick={(targetThread) => setSelectedThreadForComment(targetThread)}
                onThreadDeleted={(deletedId) => setThreads((prev) => prev.filter((item) => item.id !== deletedId))}
              />
            ))}
          </div>
        )}
      </div>

      <ThreadComposerModal
        isOpen={showComposerModal}
        onClose={() => setShowComposerModal(false)}
        vehicles={[]}
        onThreadCreated={fetchUserThreadsAndStats}
      />

      <CommentSheet
        isOpen={!!selectedThreadForComment}
        onClose={() => setSelectedThreadForComment(null)}
        thread={selectedThreadForComment}
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
