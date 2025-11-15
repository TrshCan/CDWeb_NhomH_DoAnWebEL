import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
    getAdminUsers,
    getAdminUser,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    toggleAdminUserStatus,
} from "../../api/graphql/user";
import toast from "react-hot-toast";

export default function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 5,
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
    const [showBanModal, setShowBanModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [banReason, setBanReason] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "student",
        status_id: null,
    });
    const [errors, setErrors] = useState({});

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const result = await getAdminUsers(
                pagination.currentPage,
                pagination.perPage,
                sortBy,
                sortOrder
            );
            setUsers(result.data);
            setPagination(result.pagination);
        } catch (error) {
            toast.error(error.message || "Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
            email: "",
            password: "",
            role: "student",
            status_id: null,
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
            newErrors.name = "Họ tên không được để trống";
        } else if (formData.name.trim().length < 10) {
            newErrors.name = "Họ tên phải từ 10 ký tự trở lên";
        } else if (formData.name.trim().length > 50) {
            newErrors.name = "Họ tên không được quá 50 ký tự";
        }

        if (!formData.email || formData.email.trim() === "") {
            newErrors.email = "Email không được để trống";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (!formData.password || formData.password.length < 8) {
            newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
        } else {
            const hasUpperCase = /[A-Z]/.test(formData.password);
            const hasLowerCase = /[a-z]/.test(formData.password);
            const hasNumbers = /[0-9]/.test(formData.password);
            const hasSpecialChar = /[^A-Za-z0-9]/.test(formData.password);

            if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
                newErrors.password =
                    "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await createAdminUser(
                formData.name.trim(),
                formData.email.trim(),
                formData.password,
                formData.role,
                formData.status_id
            );
            toast.success("Tạo người dùng thành công");
            setShowCreateModal(false);
            fetchUsers();
        } catch (error) {
            const errorMessage = error.message || "Không thể tạo người dùng";
            if (errorMessage.includes("Email đã được đăng ký")) {
                setErrors({ email: "Email đã được đăng ký" });
            } else {
                toast.error(errorMessage);
            }
        }
    };

    // Handle edit
    const handleEdit = async (user) => {
        try {
            const userDetail = await getAdminUser(user.id);
            setFormData({
                name: userDetail.name || "",
                email: userDetail.email || "",
                password: "",
                role: userDetail.role || "student",
                status_id: userDetail.status_id || null,
            });
            setSelectedUser(userDetail);
            setErrors({});
            setShowEditModal(true);
        } catch (error) {
            toast.error(error.message || "Không thể tải thông tin người dùng");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        const newErrors = {};
        if (formData.name && formData.name.trim().length < 10) {
            newErrors.name = "Họ tên phải từ 10 ký tự trở lên";
        } else if (formData.name && formData.name.trim().length > 50) {
            newErrors.name = "Họ tên không được quá 50 ký tự";
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const updateData = {};
            if (formData.name) updateData.name = formData.name.trim();
            if (formData.email) updateData.email = formData.email.trim();
            if (formData.role) updateData.role = formData.role;
            if (formData.status_id !== null) updateData.status_id = formData.status_id;

            await updateAdminUser(selectedUser.id, updateData);
            toast.success("Cập nhật thông tin người dùng thành công");
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            const errorMessage = error.message || "Không thể cập nhật người dùng";
            if (errorMessage.includes("Email đã được đăng ký")) {
                setErrors({ email: "Email đã được đăng ký" });
            } else {
                toast.error(errorMessage);
            }
        }
    };

    // Handle view
    const handleView = async (user) => {
        try {
            const userDetail = await getAdminUser(user.id);
            setSelectedUser(userDetail);
            setShowViewModal(true);
        } catch (error) {
            toast.error(error.message || "Không tìm thấy người dùng");
        }
    };

    // Handle delete
    const handleDelete = async (user) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.name}"?`)) {
            return;
        }

        try {
            await deleteAdminUser(user.id);
            toast.success("Xóa người dùng thành công");
            fetchUsers();
        } catch (error) {
            toast.error(error.message || "Không thể xóa người dùng");
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (user) => {
        // Nếu đang ban user (từ active -> banned), cần hiển thị modal nhập lý do
        if (user.status?.name === "active") {
            setSelectedUser(user);
            setBanReason("");
            setShowBanModal(true);
        } else {
            // Nếu đang unban (từ banned -> active), không cần lý do
            try {
                await toggleAdminUserStatus(user.id, null);
                toast.success("Đã mở khóa người dùng thành công");
                fetchUsers();
            } catch (error) {
                toast.error(error.message || "Không thể mở khóa người dùng");
            }
        }
    };

    // Handle ban user với lý do
    const handleBanUser = async (e) => {
        e.preventDefault();
        if (!banReason || banReason.trim() === "") {
            toast.error("Vui lòng nhập lý do cấm tài khoản");
            return;
        }

        try {
            await toggleAdminUserStatus(selectedUser.id, banReason.trim());
            toast.success("Đã khóa người dùng thành công");
            setShowBanModal(false);
            setBanReason("");
            fetchUsers();
        } catch (error) {
            toast.error(error.message || "Không thể khóa người dùng");
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
                            Quản lý Người dùng
                        </h1>
                        <p className="text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
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
                        <span>Thêm người dùng</span>
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
                                            <span>ID</span>
                                            <span className="text-gray-400">{getSortIcon("id")}</span>
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort("name")}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Họ tên</span>
                                            <span className="text-gray-400">
                                                {getSortIcon("name")}
                                            </span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort("role")}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Vai trò</span>
                                            <span className="text-gray-400">
                                                {getSortIcon("role")}
                                            </span>
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort("status_id")}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Trạng thái</span>
                                            <span className="text-gray-400">
                                                {getSortIcon("status_id")}
                                            </span>
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort("created_at")}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Ngày tạo</span>
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
                                        <td colSpan="7" className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                                                <span className="ml-2 text-gray-600">
                                                    Đang tải...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            Không có người dùng nào
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        user.role === "admin"
                                                            ? "bg-red-100 text-red-800"
                                                            : user.role === "lecturer"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {user.role === "admin"
                                                        ? "Admin"
                                                        : user.role === "lecturer"
                                                        ? "Giảng viên"
                                                        : "Sinh viên"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        user.status?.name === "active"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {user.status?.name === "active"
                                                        ? "Active"
                                                        : "Banned"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleView(user)}
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
                                                        onClick={() => handleEdit(user)}
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
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`${
                                                            user.status?.name === "active"
                                                                ? "text-red-600 hover:text-red-900"
                                                                : "text-green-600 hover:text-green-900"
                                                        }`}
                                                        title={
                                                            user.status?.name === "active"
                                                                ? "Khóa"
                                                                : "Mở khóa"
                                                        }
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            {user.status?.name === "active" ? (
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                                />
                                                            ) : (
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            )}
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
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
                                người dùng
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
                        title="Thêm người dùng mới"
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
                        title="Cập nhật người dùng"
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
                {showViewModal && selectedUser && (
                    <Modal
                        title="Chi tiết người dùng"
                        onClose={() => setShowViewModal(false)}
                        showSubmit={false}
                    >
                        <ViewForm user={selectedUser} />
                    </Modal>
                )}

                {/* Ban User Modal */}
                {showBanModal && selectedUser && (
                    <Modal
                        title="Khóa tài khoản người dùng"
                        onClose={() => {
                            setShowBanModal(false);
                            setBanReason("");
                        }}
                        onSubmit={handleBanUser}
                        submitText="Xác nhận khóa"
                    >
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Bạn đang khóa tài khoản:</strong> {selectedUser.name} ({selectedUser.email})
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lý do cấm <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    placeholder="Nhập lý do cấm tài khoản này..."
                                    rows="4"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Lý do này sẽ được hiển thị cho người dùng khi họ cố gắng đăng nhập.
                                </p>
                            </div>
                        </div>
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
                    Họ tên <span className="text-red-500">*</span>
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
                    placeholder="Nguyễn Văn A"
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="nguyenvana@example.com"
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
            </div>

            {isCreate && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                            errors.password ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="••••••••"
                    />
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                    )}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò
                </label>
                <select
                    value={formData.role}
                    onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                    <option value="student">Sinh viên</option>
                    <option value="lecturer">Giảng viên</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
        </div>
    );
}

// View Form Component
function ViewForm({ user }) {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN");
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ID</label>
                    <p className="text-gray-900 font-semibold">{user.id}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Họ tên</label>
                    <p className="text-gray-900 font-semibold">{user.name}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Số điện thoại</label>
                    <p className="text-gray-900">{user.phone || "N/A"}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Địa chỉ</label>
                    <p className="text-gray-900">{user.address || "N/A"}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Vai trò</label>
                    <p className="text-gray-900">
                        {user.role === "admin"
                            ? "Admin"
                            : user.role === "lecturer"
                            ? "Giảng viên"
                            : "Sinh viên"}
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Trạng thái</label>
                    <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            user.status?.name === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                    >
                        {user.status?.name === "active" ? "Active" : "Banned"}
                    </span>
                </div>
                {user.status?.name === "banned" && user.ban_reason && (
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Lý do cấm</label>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">{user.ban_reason}</p>
                        </div>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày tạo</label>
                    <p className="text-gray-900">{formatDate(user.created_at)}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Ngày cập nhật</label>
                    <p className="text-gray-900">{formatDate(user.updated_at)}</p>
                </div>
            </div>
        </div>
    );
}

