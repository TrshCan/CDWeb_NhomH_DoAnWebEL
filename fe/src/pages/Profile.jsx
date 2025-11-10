// src/components/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../api/graphql.js';
import PostCard from '../components/PostCard.jsx';

// --- GRAPHQL QUERIES ---
const PROFILE_QUERY = `
  query getProfileQueries($id: Int!) {
    publicProfile(id: $id) {
      id
      name
      email
      phone
      address
      avatar
      role
      created_at
      stats {
        posts
        followers
        following
      }
      badges {
        name
        description
        created_at
        assigned_at
      }
    }
  }
`;

const USER_POSTS_QUERY = `
  query getUserPosts($user_id: ID!) {
    postsByUser(user_id: $user_id) {
      id
      content
      type
      created_at
      user {
        id
        name
      }
      media {
        id
        url
      }
    }
  }
`;

// --- AVATAR MODAL ---
const AvatarModal = ({ avatarUrl, onClose }) => {
  if (!avatarUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="max-w-3xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold p-2 rounded-full hover:bg-gray-700"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

// --- BADGE CARD ---
const BadgeCard = ({ badge }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const darkCardColor = '#1e2732';

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="w-[120px] h-[60px] rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition duration-200 hover:scale-[1.05] shadow-lg"
        style={{ backgroundColor: darkCardColor }}
      >
        <span className="text-xl">{badge.icon}</span>
        <span className="text-white text-xs font-bold text-center truncate w-full px-1">
          {badge.name}
        </span>
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 p-3 w-60 rounded-lg shadow-xl bg-gray-700 text-white">
          <p className="font-bold text-sm mb-1">{badge.name}</p>
          <p className="text-xs text-gray-300 italic">{badge.desc}</p>
          <p className="text-xs mt-1 border-t border-gray-600 pt-1 text-gray-400">
            Cấp ngày: {badge.awardedDate}
          </p>
        </div>
      )}
    </div>
  );
};

// --- TIME AGO HELPER ---
function timeAgo(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay >= 1) return `${diffDay} ngày trước`;
  if (diffHr >= 1) return `${diffHr} giờ trước`;
  if (diffMin >= 1) return `${diffMin} phút trước`;
  return "Vừa xong";
}

// --- CONTENT TAB ---
const ContentTab = ({ activeTab, userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'Bài viết' && userId) {
      const fetchPosts = async () => {
        setLoading(true);
        try {
          const data = await graphqlRequest(USER_POSTS_QUERY, { user_id: userId });
          if (data?.data?.postsByUser) {
            const formattedPosts = data.data.postsByUser.map((p) => ({
              id: p.id,
              type: p.type,
              user: p.user?.name || "Unknown",
              time: timeAgo(p.created_at),
              content: p.content,
              media: p.media
                ? p.media.map((m) => ({ url: m.url })).filter((m) => m.url)
                : [],
            }));
            setPosts(formattedPosts);
          }
        } catch (err) {
          console.error('Lỗi khi lấy posts:', err);
          setPosts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchPosts();
    } else {
      setPosts([]);
    }
  }, [activeTab, userId]);

  if (activeTab === 'Bài viết') {
    return (
      <div className="mt-4 min-h-[300px] bg-gray-900 rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400 text-lg">Đang tải bài viết...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 text-lg italic">Chưa có bài viết nào.</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const contentMap = {
    'Trả lời': 'Đây là danh sách các Trả lời (Replies) và bình luận của người dùng.',
    'Likes': 'Đây là danh sách các bài viết mà người dùng đã Likes.',
  };

  return (
    <div className="mt-4 p-6 text-gray-200 border border-gray-800 rounded-lg min-h-[300px] flex items-center justify-center bg-gray-900">
      <p className="text-lg font-light italic">
        {contentMap[activeTab] || 'Không có nội dung để hiển thị.'}
      </p>
    </div>
  );
};

// --- MAIN PROFILE PAGE ---
function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Bài viết');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const TABS = ['Bài viết', 'Trả lời', 'Likes'];
  const twitterBlue = '#1DA1F2';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          navigate('/login');
          return;
        }

        const data = await graphqlRequest(PROFILE_QUERY, { id: parseInt(userId) });
        if (!data?.data?.publicProfile) {
          navigate('/login');
          return;
        }

        const profile = data.data.publicProfile;

        let avatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop';
        if (profile.avatar && profile.avatar !== 'default.png') {
          avatarUrl = `http://localhost:8000/storage/avatars/${profile.avatar}`;
        }

        const badgeIcons = {
          'Tài Trợ Vàng': 'Gold',
          'Chuyên Gia KS': 'Tools',
          'VIP Code Blue': 'Blue',
          'Người Chia Sẻ': 'Star',
          'default': 'Medal'
        };

        const formattedBadges = profile.badges.map((badge, index) => ({
          id: index + 1,
          name: badge.name,
          icon: badgeIcons[badge.name] || badgeIcons.default,
          desc: badge.description || 'Huy hiệu đặc biệt',
          awardedDate: badge.assigned_at
            ? new Date(badge.assigned_at).toLocaleDateString('vi-VN')
            : badge.created_at
            ? new Date(badge.created_at).toLocaleDateString('vi-VN')
            : 'N/A',
        }));

        setUser({
          id: profile.id,
          displayName: profile.name || 'Chưa có tên',
          username: profile.name
            ? profile.name.toLowerCase().replace(/\s/g, '')
            : 'username',
          bio: profile.address || 'Chưa cập nhật địa chỉ',
          avatarUrl,
          stats: {
            posts: profile.stats?.posts || 0,
            followers: profile.stats?.followers || 0,
            following: profile.stats?.following || 0,
            joined: new Date(profile.created_at).toLocaleDateString('vi-VN'),
          },
          badges: formattedBadges,
          isOwner: true,
        });
      } catch (err) {
        console.error('Lỗi khi lấy profile:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Đang tải thông tin profile...</div>
      </div>
    );
  }

  const renderStat = (value, label) => (
    <div className="text-center">
      <span className="block text-white text-xl font-extrabold">{value}</span>
      <span className="block text-gray-400 text-xs font-medium uppercase">{label}</span>
    </div>
  );

  return (
    <>
      {/* PROFILE CONTENT */}
      <div className="w-full bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col h-full">
        {/* HEADER */}
        <div className="relative p-6" style={{ backgroundColor: '#15202B' }}>
          <div className="h-40 bg-gray-700 rounded-lg mb-20 flex items-center justify-center text-gray-400"></div>

          {/* AVATAR */}
          <div
            className="absolute left-8 top-28 w-32 h-32 rounded-full border-4 border-gray-800 overflow-hidden cursor-pointer hover:opacity-80 transition duration-200"
            onClick={() => setIsAvatarModalOpen(true)}
            style={{ backgroundColor: twitterBlue }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white">
                U
              </div>
            )}
          </div>

          {user.isOwner && (
            <button className="absolute right-6 top-52 mt-2 px-4 py-2 text-sm font-bold text-white border border-white rounded-full hover:bg-white hover:text-gray-800 transition duration-200 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Chỉnh sửa hồ sơ
            </button>
          )}

          <div className="mt-6 pt-4">
            <h1 className="text-3xl font-extrabold text-white">{user.displayName}</h1>
            <p className="text-lg text-gray-400 mt-1">@{user.username}</p>
            <p className="text-gray-300 mt-3">{user.bio}</p>
            <div className="flex items-center text-gray-400 mt-3 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Tham gia {user.stats.joined}
            </div>

            <div className="flex space-x-6 mt-4">
              {renderStat(user.stats.followers, 'Theo dõi')}
              {renderStat(user.stats.following, 'Đang theo dõi')}
              {renderStat(user.stats.posts, 'Bài viết')}
            </div>
          </div>
        </div>

        {/* BADGES */}
        <div className="p-6 bg-gray-800 border-t border-gray-700 min-h-[150px] pb-8">
          <h3 className="text-xl font-extrabold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H6.737a2 2 0 01-1.789-2.894l-3.5-7A2 2 0 014.764 10H10m-2 0V7a3 3 0 016 0v3m-3 7h.01"></path>
            </svg>
            Huy hiệu
          </h3>
          {user.badges.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4">
              {user.badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4 italic">Chưa có huy hiệu nào</p>
          )}
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center text-sm font-bold transition duration-200 ${
                activeTab === tab
                  ? 'text-white border-b-4'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
              style={activeTab === tab ? { borderColor: twitterBlue } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 bg-gray-800 overflow-y-auto">
          <ContentTab
            activeTab={activeTab}
            userId={user.id.toString()}
          />
        </div>
      </div>

      {/* AVATAR MODAL */}
      {isAvatarModalOpen && (
        <AvatarModal
          avatarUrl={user.avatarUrl}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}
    </>
  );
}

export default ProfilePage;