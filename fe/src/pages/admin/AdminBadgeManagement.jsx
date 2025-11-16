import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
    getAdminBadges,
    getAdminBadge,
    createAdminBadge,
    updateAdminBadge,
    deleteAdminBadge,
    assignAdminBadge,
    revokeAdminBadge,
} from "../../api/graphql/badge";
import { getAdminUsers } from "../../api/graphql/user";
import toast from "react-hot-toast";

export default function AdminBadgeManagement() {
    const [badges, setBadges] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [sortBy, setSortBy] = useState("id");
    const [sortOrder, setSortOrder] = useState("asc");
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });
    const [assignFormData, setAssignFormData] = useState({
        userId: "",
    });
    const [users, setUsers] = useState([]);
    const [errors, setErrors] = useState({});

    // Fetch badges
    const fetchBadges = async () => {
        setLoading(true);
        try {
            const result = await getAdminBadges(
                pagination.currentPage,
                pagination.perPage,
                sortBy,
                sortOrder
            );
            setBadges(result.data);
            setPagination(result.pagination);
        } catch (error) {
            toast.error(error.message || "Không thể tải danh sách badge");
        } finally {
            setLoading(false);
        }
    };

    // Fetch users for assign dropdown
    const fetchUsers = async () => {
        try {
            const result = await getAdminUsers(1, 1000, "id", "asc");
            setUsers(result.data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    useEffect(() => {
        fetchBadges();
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.currentPage, sortBy, sortOrder]);

    // Handle pagination
    const handlePageChange = (newPage) => {
        setPagination((prev) => ({ ...prev, currentPage: newPage }));
    };

    // Handle sorting
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    // Handle create
    const handleCreate = () => {
        setFormData({
            name: "",
            description: "",
        });
        setErrors({});
        setShowCreateModal(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        const newErrors = {};
        if (!formData.name || formData.name.trim() === "") {
            newErrors.name = "Tên và mô tả không được để trống";
        } else if (formData.name.trim().length > 255) {
            newErrors.name = "Vui lòng nhập tên ít hơn 255 kí tự";
        }

        if (formData.description && formData.description.trim().length > 255) {
            newErrors.description = "Vui lòng nhập mô tả ít hơn 255 kí tự";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await createAdminBadge(
                formData.name.trim(),
                formData.description.trim() || null
            );
            toast.success("Tạo Badge thành công");
            setShowCreateModal(false);
            fetchBadges();
        } catch (error) {
            const errorMessage = error.message || "Không thể tạo Badge";
            if (errorMessage.includes("Tên Badge đã tồn tại")) {
                setErrors({ name: "Tên Badge đã tồn tại" });
            } else if (errorMessage.includes("Tên và mô tả không được để trống")) {
                setErrors({ name: "Tên và mô tả không được để trống" });
            } else if (errorMessage.includes("Vui lòng nhập tên ít hơn 255 kí tự")) {
                setErrors({ name: "Vui lòng nhập tên ít hơn 255 kí tự" });
            } else {
                toast.error(errorMessage);
            }
        }
    };

    // Handle edit
    const handleEdit = async (badge) => {
        try {
            const badgeDetail = await getAdminBadge(badge.id);
            setFormData({
                name: badgeDetail.name || "",
                description: badgeDetail.description || "",
            });
            setSelectedBadge(badgeDetail);
            setErrors({});
            setShowEditModal(true);
        } catch (error) {
            toast.error(error.message || "Không thể tải thông tin badge");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        const newErrors = {};
        if (formData.name && formData.name.trim().length > 255) {
            newErrors.name = "Vui lòng nhập tên ít hơn 255 kí tự";
        }

        if (formData.description && formData.description.trim().length > 255) {
            newErrors.description = "Vui lòng nhập mô tả ít hơn 255 kí tự";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await updateAdminBadge(
                selectedBadge.id,
                formData.name.trim() || null,
                formData.description.trim() || null
            );
            toast.success("Cập nhật Badge thành công");
            setShowEditModal(false);
            fetchBadges();
        } catch (error) {
            const errorMessage = error.message || "Không thể cập nhật Badge";
            if (errorMessage.includes("Tên Badge đã tồn tại")) {
                setErrors({ name: "Tên Badge đã tồn tại" });
            } else if (errorMessage.includes("Vui lòng nhập tên ít hơn 255 kí tự")) {
                setErrors({ name: "Vui lòng nhập tên ít hơn 255 kí tự" });
            } else {
                toast.error(errorMessage);
            }
        }
    };

    // Handle view
    const handleView = async (badge) => {
        try {
            const badgeDetail = await getAdminBadge(badge.id);
            setSelectedBadge(badgeDetail);
            setShowViewModal(true);
        } catch (error) {
            toast.error(error.message || "Không tìm thấy Badge");
        }
    };

    // Handle delete
    const handleDelete = async (badge) => {
        try {
            const badgeDetail = await getAdminBadge(badge.id);
            setSelectedBadge(badgeDetail);
            setShowDeleteModal(true);
        } catch (error) {
            toast.error(error.message || "Không thể tải thông tin badge");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedBadge) return;

        try {
            await deleteAdminBadge(selectedBadge.id);
            toast.success("Xóa Badge thành công");
            setShowDeleteModal(false);
            fetchBadges();
        } catch (error) {
            toast.error(error.message || "Không thể xóa Badge");
        }
    };

    // Handle assign
    const handleAssign = async (badge) => {
        setAssignFormData({ userId: "" });
        setSelectedBadge(badge);
        setShowAssignModal(true);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!assignFormData.userId) {
            toast.error("Vui lòng chọn người dùng");
            return;
        }

        try {
            await assignAdminBadge(selectedBadge.id, assignFormData.userId);
            toast.success("Cấp Badge thành công");
            setShowAssignModal(false);
            fetchBadges();
            // Refresh badge detail if viewing
            if (showViewModal && selectedBadge) {
                const badgeDetail = await getAdminBadge(selectedBadge.id);
                setSelectedBadge(badgeDetail);
            }
        } catch (error) {
            const errorMessage = error.message || "Không thể cấp Badge";
            if (errorMessage.includes("User đã có Badge này")) {
                toast.error("User đã có Badge này");
            } else {
                toast.error(errorMessage);
            }
        }
    };

    // Handle revoke
    const handleRevoke = async (badgeId, userId) => {
        if (!window.confirm("Bạn có chắc chắn muốn thu hồi Badge này từ user?")) {
            return;
        }

        try {
            await revokeAdminBadge(badgeId, userId);
            toast.success("Thu hồi Badge thành công");
            fetchBadges();
            // Refresh badge detail if viewing
            if (showViewModal && selectedBadge) {
                const badgeDetail = await getAdminBadge(selectedBadge.id);
                setSelectedBadge(badgeDetail);
            }
        } catch (error) {
            const errorMessage = error.message || "Không thể thu hồi Badge";
            if (errorMessage.includes("User chưa nhận Badge này")) {
                toast.error("User chưa nhận Badge này");
            } else {
                toast.error(errorMessage);
            }
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN");
    };

    // Get sort icon
    const getSortIcon = (field) => {
        if (sortBy !== field) return "⇅";
        return sortOrder === "asc" ? "↑" : "↓";
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Quản lý Badge
                        </h1>
                        <p className="text-gray-600">Quản lý tất cả Badge trong hệ thống</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        <span>Thêm Badge</span>
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort("id")}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>ID Badge</span>
                                            <span className="text-gray-400">{getSortIcon("id")}</span>
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort("name")}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Tên Badge</span>
                                            <span className="text-gray-400">
                                                {getSortIcon("name")}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mô tả Badge
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số User đã nhận
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort("created_at")}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Ngày cấp Badge</span>
                                            <span className="text-gray-400">
                                                {getSortIcon("created_at")}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                                                <span className="ml-2 text-gray-600">
                                                    Đang tải...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : badges.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            Không có Badge nào
                                        </td>
                                    </tr>
                                ) : (
                                    badges.map((badge) => (
                                        <tr key={badge.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {badge.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {badge.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {badge.description || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                    {badge.user_count || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(badge.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleView(badge)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Xem chi tiết"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(badge)}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Sửa"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleAssign(badge)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Cấp Badge"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M12 4v16m8-8H4"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(badge)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Xóa"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Hiển thị{" "}
                                <span className="font-medium">
                                    {(pagination.currentPage - 1) * pagination.perPage + 1}
                                </span>{" "}
                                đến{" "}
                                <span className="font-medium">
                                    {Math.min(
                                        pagination.currentPage * pagination.perPage,
                                        pagination.total
                                    )}
                                </span>{" "}
                                trong tổng số <span className="font-medium">{pagination.total}</span>{" "}
                                badge
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        pagination.hasPrevPage
                                            ? "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    « Trang trước
                                </button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter((page) => {
                                        if (pagination.totalPages <= 7) return true;
                                        return (
                                            page === 1 ||
                                            page === pagination.totalPages ||
                                            (page >= pagination.currentPage - 1 &&
                                                page <= pagination.currentPage + 1)
                                        );
                                    })
                                    .map((page, index, array) => {
                                        if (
                                            index > 0 &&
                                            array[index - 1] !== page - 1 &&
                                            pagination.totalPages > 7
                                        ) {
                                            return (
                                                <React.Fragment key={`ellipsis-${page}`}>
                                                    <span className="px-2 py-2 text-gray-500">
                                                        ...
                                                    </span>
                                                    <button
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                            page === pagination.currentPage
                                                                ? "bg-cyan-600 text-white"
                                                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                    page === pagination.currentPage
                                                        ? "bg-cyan-600 text-white"
                                                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        pagination.hasNextPage
                                            ? "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    Trang sau »
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <Modal
                        title="Thêm Badge mới"
                        onClose={() => setShowCreateModal(false)}
                        onSubmit={handleCreateSubmit}
                        submitText="Tạo"
                    >
                        <CreateEditForm
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            isCreate={true}
                        />
                    </Modal>
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <Modal
                        title="Cập nhật Badge"
                        onClose={() => setShowEditModal(false)}
                        onSubmit={handleEditSubmit}
                        submitText="Cập nhật"
                    >
                        <CreateEditForm
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            isCreate={false}
                        />
                    </Modal>
                )}

                {/* View Modal */}
                {showViewModal && selectedBadge && (
                    <Modal
                        title="Chi tiết Badge"
                        onClose={() => setShowViewModal(false)}
                        showSubmit={false}
                    >
                        <ViewForm
                            badge={selectedBadge}
                            onRevoke={handleRevoke}
                        />
                    </Modal>
                )}

                {/* Assign Modal */}
                {showAssignModal && selectedBadge && (
                    <Modal
                        title="Cấp Badge cho User"
                        onClose={() => {
                            setShowAssignModal(false);
                            setAssignFormData({ userId: "" });
                        }}
                        onSubmit={handleAssignSubmit}
                        submitText="Cấp Badge"
                    >
                        <AssignForm
                            formData={assignFormData}
                            setFormData={setAssignFormData}
                            users={users}
                            badgeName={selectedBadge.name}
                        />
                    </Modal>
                )}

                {/* Delete Modal */}
                {showDeleteModal && selectedBadge && (
                    <Modal
                        title="Xóa Badge"
                        onClose={() => setShowDeleteModal(false)}
                        onSubmit={handleDeleteConfirm}
                        submitText="Xác nhận xóa"
                        showSubmit={true}
                    >
                        <DeleteConfirmForm badge={selectedBadge} />
                    </Modal>
                )}
            </main>
        </div>
    );
}

// Modal Component
function Modal({ title, onClose, onSubmit, submitText, showSubmit = true, children }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="p-6">{children}</div>
                    {showSubmit && (
                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium"
                            >
                                {submitText}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

// Create/Edit Form Component
function CreateEditForm({ formData, setFormData, errors, isCreate }) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Badge <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nhập tên badge"
                    maxLength={255}
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả Badge
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Nhập mô tả badge (tùy chọn)"
                    rows="4"
                    maxLength={255}
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
            </div>
        </div>
    );
}

// View Form Component
function ViewForm({ badge, onRevoke }) {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN");
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ID Badge</label>
                    <p className="text-gray-900 font-semibold">{badge.id}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Tên Badge</label>
                    <p className="text-gray-900 font-semibold">{badge.name}</p>
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Mô tả</label>
                    <p className="text-gray-900">{badge.description || "N/A"}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Số User đã nhận</label>
                    <p className="text-gray-900 font-semibold">{badge.user_count || 0}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày tạo</label>
                    <p className="text-gray-900">{formatDate(badge.created_at)}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày cập nhật</label>
                    <p className="text-gray-900">{formatDate(badge.updated_at)}</p>
                </div>
            </div>

            {/* Users List */}
            {badge.users && badge.users.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Danh sách User đã nhận Badge
                    </label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        User ID
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tên
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Email
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Ngày cấp
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Cấp bởi
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {badge.users.map((user, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {user.user_id}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {user.user_name}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                            {user.user_email}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                            {formatDate(user.assigned_at)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                            {user.assigned_by_name || "N/A"}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm">
                                            <button
                                                onClick={() => onRevoke(badge.id, user.user_id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Thu hồi Badge"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Assign Form Component
function AssignForm({ formData, setFormData, users, badgeName }) {
    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Badge:</strong> {badgeName}
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn User <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.userId}
                    onChange={(e) =>
                        setFormData({ ...formData, userId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                >
                    <option value="">-- Chọn User --</option>
                    {users
                        .filter((user) => user.status?.name === "active")
                        .map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                </select>
            </div>
        </div>
    );
}

// Delete Confirm Form Component
function DeleteConfirmForm({ badge }) {
    return (
        <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-semibold mb-2">
                    Cảnh báo: Bạn đang xóa Badge "{badge.name}"
                </p>
                {badge.user_count > 0 && (
                    <p className="text-sm text-red-700">
                        Badge này đang được <strong>{badge.user_count}</strong> user sử dụng. 
                        Tất cả dữ liệu liên quan sẽ bị xóa.
                    </p>
                )}
            </div>
            <div>
                <p className="text-gray-700">
                    Bạn có chắc chắn muốn xóa Badge này? Hành động này không thể hoàn tác.
                </p>
            </div>
        </div>
    );
}

