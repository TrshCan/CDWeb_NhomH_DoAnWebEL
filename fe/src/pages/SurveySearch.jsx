import React, { useState, useMemo } from 'react';

// === DỮ LIỆU MẪU ===
const categories = [
    { id: 1, name: 'Đào tạo nội bộ' },
    { id: 2, name: 'Nhân sự & Phúc lợi' },
    { id: 3, name: 'Công nghệ thông tin' }
];

const creators = [
    { id: 101, name: 'Nguyễn Văn An' },
    { id: 102, name: 'Trần Thị Bình' },
    { id: 103, name: 'Lê Minh Cường' }
];

const allSurveys = [
    { id: 1, title: 'Đánh giá khóa học Lập trình Python', categoryId: 1, type: 'survey', creatorId: 101, status: 'Đang hoạt động', createdAt: '2025-10-01' },
    { id: 2, title: 'Quiz kiểm tra kiến thức an toàn mạng', categoryId: 3, type: 'quiz', creatorId: 102, status: 'Đã đóng', createdAt: '2025-09-15' },
    { id: 3, title: 'Khảo sát mức độ hài lòng về bữa trưa', categoryId: 2, type: 'survey', creatorId: 101, status: 'Đang hoạt động', createdAt: '2025-10-05' },
    { id: 4, title: 'Bài kiểm tra cuối khóa Marketing', categoryId: 1, type: 'quiz', creatorId: 103, status: 'Chưa bắt đầu', createdAt: '2025-10-08' },
    { id: 5, title: 'Góp ý về chính sách làm việc từ xa', categoryId: 2, type: 'survey', creatorId: 102, status: 'Đã đóng', createdAt: '2025-08-20' },
    // Thêm nhiều dữ liệu để test phân trang
    { id: 6, title: 'Kiểm tra năng lực Tiếng Anh đầu vào', categoryId: 1, type: 'quiz', creatorId: 101, status: 'Đang hoạt động', createdAt: '2025-10-02' },
    { id: 7, title: 'Khảo sát nhu cầu đào tạo 2026', categoryId: 1, type: 'survey', creatorId: 103, status: 'Chưa bắt đầu', createdAt: '2025-10-09' },
    { id: 8, title: 'Đánh giá hạ tầng IT', categoryId: 3, type: 'survey', creatorId: 102, status: 'Đang hoạt động', createdAt: '2025-09-28' },
    { id: 9, title: 'Quiz về quy trình phòng cháy chữa cháy', categoryId: 2, type: 'quiz', creatorId: 101, status: 'Đã đóng', createdAt: '2025-07-11' }
];

const SurveySearch = () => {
    // === TRẠNG THÁI ===
    const [category, setCategory] = useState('');
    const [type, setType] = useState('');
    const [creator, setCreator] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // === TÍNH TOÁN DỮ LIỆU ĐÃ LỌC ===
    const filteredSurveys = useMemo(() => {
        return allSurveys.filter(survey => {
            const matchCategory = !category || survey.categoryId == category;
            const matchType = !type || survey.type === type;
            const matchCreator = !creator || survey.creatorId == creator;
            return matchCategory && matchType && matchCreator;
        });
    }, [category, type, creator]);

    // === TÍNH TOÁN PHÂN TRANG ===
    const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = filteredSurveys.slice(start, end);
    const startItem = filteredSurveys.length > 0 ? start + 1 : 0;
    const endItem = Math.min(end, filteredSurveys.length);

    // === HÀM XỬ LÝ ===
    const handleSearch = () => {
        setCurrentPage(1);
    };

    const handleReset = () => {
        setCategory('');
        setType('');
        setCreator('');
        setCurrentPage(1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // === RENDER BẢNG KẾT QUẢ ===
    const renderTableRows = () => {
        return paginatedItems.map(survey => {
            const categoryName = categories.find(c => c.id === survey.categoryId)?.name || 'N/A';
            const creatorName = creators.find(c => c.id === survey.creatorId)?.name || 'N/A';
            const typeClass = survey.type === 'quiz' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

            return (
                <tr key={survey.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm">
                        <p className="text-gray-900">{survey.title}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                        <p className="text-gray-900">{categoryName}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                        <span className={`capitalize px-2 py-1 rounded-full text-xs font-semibold ${typeClass}`}>
                            {survey.type}
                        </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                        <p className="text-gray-900">{creatorName}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                        <p className="text-gray-900">{survey.status}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                        <p className="text-gray-900">{survey.createdAt}</p>
                    </td>
                </tr>
            );
        });
    };

    // === RENDER KHÔNG CÓ KẾT QUẢ ===
    const renderNoResults = () => {
        if (filteredSurveys.length === 0) {
            return (
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">Không tìm thấy kết quả</h3>
                    <p className="text-gray-500 mt-2">
                        Không tìm thấy khảo sát nào phù hợp với tiêu chí đã chọn. <br />
                        Vui lòng kiểm tra lại danh mục, loại khảo sát hoặc người tạo.
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-100 font-sans">
            <div className="container mx-auto p-4 md:p-8">
                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Tìm Kiếm Khảo Sát</h1>
                    <p className="text-gray-600 mt-1">Sử dụng các bộ lọc bên dưới để tìm kiếm khảo sát trong hệ thống.</p>
                </header>

                {/* Khung Tìm Kiếm */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Lọc theo Danh mục */}
                        <div>
                            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">
                                Danh mục
                            </label>
                            <select
                                id="category-filter"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Tất cả danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc theo Loại khảo sát */}
                        <div>
                            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
                                Loại khảo sát
                            </label>
                            <select
                                id="type-filter"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Tất cả các loại</option>
                                <option value="survey">Survey</option>
                                <option value="quiz">Quiz</option>
                            </select>
                        </div>

                        {/* Lọc theo Người tạo */}
                        <div>
                            <label htmlFor="creator-filter" className="block text-sm font-medium text-gray-700">
                                Người tạo
                            </label>
                            <select
                                id="creator-filter"
                                value={creator}
                                onChange={(e) => setCreator(e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Tất cả người tạo</option>
                                {creators.map(creatorItem => (
                                    <option key={creatorItem.id} value={creatorItem.id}>
                                        {creatorItem.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Các nút hành động */}
                        <div className="flex items-end space-x-3">
                            <button
                                onClick={handleSearch}
                                className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold py-2 px-4 rounded-lg transition duration-300"
                            >
                                Tìm kiếm
                            </button>
                            <button
                                onClick={handleReset}
                                className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold py-2 px-4 rounded-lg transition duration-300"
                            >
                                Đặt lại
                            </button>
                        </div>
                    </div>
                </div>

                {/* Khu Vực Kết Quả Tìm Kiếm */}
                <div>
                    {renderNoResults()}
                    {filteredSurveys.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Tiêu đề khảo sát
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Danh mục
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Loại
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Người tạo
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Ngày tạo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>{renderTableRows()}</tbody>
                            </table>

                            {/* Phân trang */}
                            <div className="px-5 py-5 bg-white border-t flex flex-col xs:flex-row items-center xs:justify-between">
                                <span className="text-xs xs:text-sm text-gray-900">
                                    Hiển thị {startItem} - {endItem} của {filteredSurveys.length} kết quả
                                </span>
                                <div className="inline-flex mt-2 xs:mt-0">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className={`text-sm font-semibold py-2 px-4 rounded-l ${
                                            currentPage === 1
                                                ? 'bg-gray-200 text-gray-800 opacity-50 cursor-not-allowed'
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                        }`}
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className={`text-sm font-semibold py-2 px-4 rounded-r ${
                                            currentPage === totalPages || totalPages === 0
                                                ? 'bg-gray-200 text-gray-800 opacity-50 cursor-not-allowed'
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SurveySearch;