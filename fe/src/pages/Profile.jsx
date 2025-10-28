// src/components/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../api/graphql.js';

// --- QUERY GRAPHQL ---
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

// --- COMPONENT CON: MODAL XEM AVATAR ---
const AvatarModal = ({ avatarUrl, onClose }) => {
    if (!avatarUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={onClose} // Đóng modal khi click ra ngoài
        >
            <div className="max-w-3xl max-h-full overflow-hidden" onClick={e => e.stopPropagation()}>
                <img
                    src={avatarUrl}
                    alt="Ảnh đại diện đầy đủ"
                    className="object-contain w-[400px] h-[400px] rounded-lg shadow-2xl"
                />
            </div>
            {/* Nút đóng */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-3xl font-bold p-2 rounded-full hover:bg-gray-700 transition duration-200"
                aria-label="Đóng"
            >
                &times;
            </button>
        </div>
    );
};


// --- COMPONENT CON: HUY HIỆU (BADGE) ---
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
                <span className="text-white text-xs font-bold text-center truncate w-full px-1">{badge.name}</span>
            </div>

            {showTooltip && (
                <div
                    className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 p-3 w-60 rounded-lg shadow-xl bg-gray-700 text-white"
                >
                    <p className="font-bold text-sm mb-1">{badge.name}</p>
                    <p className="text-xs text-gray-300 italic">{badge.desc}</p>
                    <p className="text-xs mt-1 border-t border-gray-600 pt-1 text-gray-400">Cấp ngày: {badge.awardedDate}</p>
                </div>
            )}
        </div>
    );
};

// --- COMPONENT CON: VÙNG NỘI DUNG TAB ---
const ContentTab = ({ activeTab }) => {
    const contentMap = {
        'Bài viết': 'Đây là danh sách các Bài viết (Posts) của người dùng.',
        'Trả lời': 'Đây là danh sách các Trả lời (Replies) và bình luận của người dùng.',
        'Likes': 'Đây là danh sách các bài viết mà người dùng đã Likes.',
    };

    return (
        <div className="mt-4 p-4 text-gray-200 border border-gray-800 rounded-lg min-h-[300px] flex items-center justify-center bg-gray-900">
            <p className="text-lg font-light italic">{contentMap[activeTab] || 'Không có nội dung để hiển thị.'}</p>
        </div>
    );
};

// --- COMPONENT CHÍNH: PROFILE PAGE ---
function ProfilePage({ userId }) {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('Bài viết');
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false); // State mới
    const TABS = ['Bài viết', 'Trả lời', 'Likes'];
    const twitterBlue = '#1DA1F2';

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await graphqlRequest(PROFILE_QUERY, { id: userId });
                const profile = data.data.publicProfile;

                // Format avatar URL - nếu có avatar từ backend
                let avatarUrl = null;
                if (profile.avatar && profile.avatar !== 'default.png') {
                    // Giả sử avatar được lưu trong storage/public/avatars/
                    avatarUrl = `http://localhost:8000/storage/avatars/${profile.avatar}`;
                } else {
                    // Fallback avatar
                    avatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop';

                }

                // Format badges với icon emoji tùy theo tên
                const badgeIcons = {
                    'Tài Trợ Vàng': '🟡',
                    'Chuyên Gia KS': '⚙️',
                    'VIP Code Blue': '🔵',
                    'Người Chia Sẻ': '⭐',
                    'default': '🏅'
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
                            : 'N/A'
                }));

                setUser({
                    displayName: profile.name || 'Chưa có tên',
                    username: profile.name
                        ? profile.name.toLowerCase().replace(/\s/g, '')
                        : 'username',
                    bio: profile.address || 'Chưa cập nhật địa chỉ',
                    avatarUrl: avatarUrl,
                    stats: {
                        posts: profile.stats?.posts || 0,
                        followers: profile.stats?.followers || 0,
                        following: profile.stats?.following || 0,
                        joined: new Date(profile.created_at).toLocaleDateString('vi-VN'),
                    },
                    badges: formattedBadges,
                    isOwner: true, // TODO: Kiểm tra với user hiện tại đang đăng nhập
                });
            } catch (err) {
                console.error('Lỗi khi lấy profile:', err);
            }
        };
        fetchProfile();
    }, [userId]);

    if (!user) return <p className="text-white p-4">Loading...</p>;

    const renderStat = (value, label) => (
        <div className="text-center">
            <span className="block text-white text-xl font-extrabold">{value}</span>
            <span className="block text-gray-400 text-xs font-medium uppercase">{label}</span>
        </div>
    );

    return (
        <div className="min-h-screen flex justify-center p-4 sm:p-8 bg-gray-900">
            <div className="w-full max-w-4xl shadow-2xl rounded-xl overflow-hidden">

                {/* HEADER */}
                <div className="relative p-6" style={{ backgroundColor: '#15202B' }}>
                    <div className="h-40 bg-gray-700 rounded-lg mb-20 flex items-center justify-center text-gray-400"></div>

                    {/* AVATAR CẬP NHẬT */}
                    <div
                        className="absolute left-8 top-28 w-32 h-32 rounded-full border-4 border-gray-800 overflow-hidden cursor-pointer hover:opacity-80 transition duration-200"
                        onClick={() => setIsAvatarModalOpen(true)} // Mở modal khi click
                        style={{ backgroundColor: twitterBlue }}
                    >
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white">U</div>
                        )}
                    </div>
                    {/* END AVATAR CẬP NHẬT */}

                    {user.isOwner && (
                        <button
                            className="absolute right-6 top-52 mt-2 px-4 py-2 text-sm font-bold text-white border border-white rounded-full hover:bg-white hover:text-gray-800 transition duration-200 flex items-center"
                        >
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
                    {user.badges && user.badges.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-4">
                            {user.badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-4 italic">Chưa có huy hiệu nào</p>
                    )}
                </div>

                {/* TABS */}
                <div className="flex border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-center text-sm font-bold transition duration-200 ${activeTab === tab
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
                <div className="p-6 bg-gray-800">
                    <ContentTab activeTab={activeTab} />
                </div>

            </div>

            {/* RENDER MODAL */}
            {isAvatarModalOpen && (
                <AvatarModal
                    avatarUrl={user.avatarUrl}
                    onClose={() => setIsAvatarModalOpen(false)}
                />
            )}

        </div>
    );
}

// --- APP ---
function App() {
    return <ProfilePage userId={10} />;
}

export default App;