import React, { useState } from 'react';

const MOCK_USER = {
  id: 'user123',
  isOwner: true, // Đổi thành 'false' để ẩn nút Edit profile
  displayName: 'Nguyễn Văn TDC',
  username: 'tdcsocialsphere_user',
  bio: 'Chào mừng đến với SocialSphere! Sẵn sàng kết nối và chia sẻ. Đây là dòng giới thiệu bản thân.',
  stats: {
    posts: 42,
    following: 150,
    followers: 890,
    joined: 'Tháng 7, 2023',
  },
  badges: [
    { id: 1, name: 'Tài Trợ Vàng', icon: '🟡', desc: 'Người dùng đóng góp tài chính tích cực.', awardedDate: '01/01/2024' },
    { id: 2, name: 'Chuyên Gia KS', icon: '⚙️', desc: 'Đã hoàn thành 100+ khảo sát quan trọng.', awardedDate: '15/03/2024' },
    { id: 3, name: 'VIP Code Blue', icon: '🔵', desc: 'Thành viên đặc biệt cấp cao của hệ thống.', awardedDate: '20/05/2024' },
    { id: 4, name: 'Người Chia Sẻ', icon: '⭐', desc: 'Đã chia sẻ 50+ bài viết chất lượng.', awardedDate: '10/06/2024' },
  ],
};

// --- COMPONENT CON: HUY HIỆU (BADGE) ---
const BadgeCard = ({ badge }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const darkCardColor = '#1e2732'; // Màu xám đậm theo yêu cầu

  return (
    <div 
      className="relative flex-shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Badge Card */}
      <div 
        className="w-[120px] h-[60px] rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition duration-200 hover:scale-[1.05] shadow-lg"
        style={{ backgroundColor: darkCardColor }}
      >
        <span className="text-xl">{badge.icon}</span>
        <span className="text-white text-xs font-bold  text-center truncate">{badge.name}</span>
      </div>

      {/* Tooltip khi hover: Đã thay đổi vị trí hiển thị lên trên (bottom-full) thay vì dưới (top-full) 
          và tăng z-index để nó không bị che khuất.*/}
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


// --- COMPONENT CON: VÙNG NỘI DUNG DƯỚI TAB ---
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


// --- COMPONENT CHÍNH: TRANG CÁ NHÂN ---
function ProfilePage() {
  const user = MOCK_USER;
  const [activeTab, setActiveTab] = useState('Bài viết');
  const TABS = ['Bài viết', 'Trả lời', 'Likes'];
  const twitterBlue = '#1DA1F2'; // Màu xanh Twitter

  const renderStat = (value, label) => (
    <div className="text-center">
      <span className="block text-white text-xl font-extrabold">{value}</span>
      <span className="block text-gray-400 text-xs font-medium uppercase">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl shadow-2xl rounded-xl overflow-hidden">

        {/* VÙNG 1: HEADER & THÔNG TIN CƠ BẢN */}
        <div className="relative p-6" style={{ backgroundColor: '#15202B' }}>

          {/* Banner Placeholder */}
          <div className="h-40 bg-gray-700 rounded-lg mb-20 flex items-center justify-center text-gray-400">
            Ảnh Bìa
          </div>

          {/* Avatar (120x120px) */}
          <div
            className="absolute left-8 top-28 w-32 h-32 rounded-full border-4 border-gray-800 overflow-hidden"
            style={{ backgroundColor: twitterBlue }} // Mặc định nền xanh nếu không có ảnh
          >
            {/* Sử dụng SVG/Placeholder thay vì URL ảnh thực tế */}
            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white">U</div>
            {/* Nếu có ảnh: <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> */}
          </div>

          {/* Nút Edit Profile */}
          {user.isOwner && (
            <button
              className="absolute right-6 top-52 mt-2 px-4 py-2 text-sm font-bold text-white border border-white rounded-full hover:bg-white hover:text-gray-800 transition duration-200 flex items-center"
            >
              {/* Thay thế Edit icon bằng SVG inline */}
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Chỉnh sửa hồ sơ
            </button>
          )}

          {/* Thông tin Text */}
          <div className="mt-6 pt-4">
            <h1 className="text-3xl font-extrabold text-white">{user.displayName}</h1>
            <p className="text-lg text-gray-400 mt-1">@{user.username}</p>
            <p className="text-gray-300 mt-3">{user.bio}</p>

            {/* Ngày tham gia */}
            <div className="flex items-center text-gray-400 mt-3 text-sm">
              {/* Thay thế Calendar icon bằng SVG inline */}
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Tham gia {user.stats.joined}
            </div>

            {/* Thống kê ngang hàng */}
            <div className="flex space-x-6 mt-4">
              {renderStat(user.stats.followers, 'Theo dõi')}
              {renderStat(user.stats.following, 'Đang theo dõi')}
              {renderStat(user.stats.posts, 'Bài viết')}
            </div>
          </div>
        </div>

        {/* VÙNG 3: DANH SÁCH HUY HIỆU */}
        {/* Đã thêm min-h-[150px] và pb-8 để đảm bảo không gian cho tooltip hiển thị */}
        <div className="p-6 bg-gray-800 border-t border-gray-700 min-h-[150px] pb-8">
            <h3 className="text-xl font-extrabold text-white mb-4 flex items-center">
                {/* Thay thế Trophy icon bằng SVG inline */}
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H6.737a2 2 0 01-1.789-2.894l-3.5-7A2 2 0 014.764 10H10m-2 0V7a3 3 0 016 0v3m-3 7h.01"></path>
                </svg>
                Huy hiệu
            </h3>
            {/* Đã thay đổi từ overflow-x-auto sang flex-wrap để các Badge xuống dòng, 
                tránh trường hợp container bị cắt khi tooltip mở ra. */}
            <div className="flex flex-wrap justify-center  gap-4"> 
                {user.badges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
        </div>


        {/* VÙNG 2: TABS ĐIỀU HƯỚNG */}
        <div className="flex border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-3 text-center text-sm font-bold transition duration-200 
                ${activeTab === tab
                  ? 'text-white border-b-4'
                  : 'text-gray-400 hover:bg-gray-700'
                }
              `}
              style={activeTab === tab ? { borderColor: twitterBlue } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* VÙNG NỘI DUNG (4) */}
        <div className="p-6 bg-gray-800">
          <ContentTab activeTab={activeTab} />
        </div>

      </div>
    </div>
  );
}

// Thay thế component chính bằng ProfilePage
function App() {
  return <ProfilePage />;
}

export default App;
