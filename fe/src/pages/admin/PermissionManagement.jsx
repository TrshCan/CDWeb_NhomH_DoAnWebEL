import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import {
  getPermissions,
  getRolePermissions,
  getUserPermissions,
  getUsersForPermission,
  updateRolePermissions,
  updateUserPermissions,
} from '../../api/graphql/permission';

export default function PermissionManagement() {
  const [mode, setMode] = useState('role'); // 'role' or 'user'
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'admin', label: 'Admin' },
  ];

  // Load permissions khi component mount
  useEffect(() => {
    loadPermissions();
    loadUsers();
  }, []);

  // Load permissions từ API
  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await getPermissions();
      setPermissionGroups(data);
    } catch (error) {
      const errorMessage = error.message || 'Không thể tải danh sách quyền';
      
      // Kiểm tra lỗi quyền truy cập
      if (errorMessage.includes('không có quyền') || errorMessage.includes('permission')) {
        showMessage('error', 'Bạn không có quyền truy cập chức năng này.');
        // Có thể redirect về dashboard sau vài giây
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 3000);
      } else {
        showMessage('error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load users từ API
  const loadUsers = async () => {
    try {
      const data = await getUsersForPermission();
      setUsers(data);
    } catch (error) {
      console.error('Lỗi khi load users:', error);
    }
  };

  // Load permissions khi chọn role/user
  useEffect(() => {
    if (mode === 'role' && selectedRole) {
      loadRolePermissions(selectedRole);
    } else if (mode === 'user' && selectedUserId) {
      loadUserPermissions(parseInt(selectedUserId));
    } else {
      setSelectedPermissions([]);
    }
  }, [mode, selectedRole, selectedUserId]);

  // Load quyền của role
  const loadRolePermissions = async (role) => {
    try {
      setLoading(true);
      const data = await getRolePermissions(role);
      setSelectedPermissions(data.permission_ids || []);
    } catch (error) {
      showMessage('error', error.message || 'Không thể tải quyền của role');
      setSelectedPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load quyền của user
  const loadUserPermissions = async (userId) => {
    try {
      setLoading(true);
      const data = await getUserPermissions(userId);
      setSelectedPermissions(data.permission_ids || []);
    } catch (error) {
      showMessage('error', error.message || 'Không thể tải quyền của user');
      setSelectedPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi mode
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setSelectedRole('');
    setSelectedUserId('');
    setSelectedPermissions([]);
    setMessage({ type: '', text: '' });
  };

  // Xử lý toggle permission
  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Xử lý lưu thay đổi
  const handleSave = async () => {
    // Validation
    if (mode === 'role' && !selectedRole) {
      showMessage('error', 'Vui lòng chọn Role cần phân quyền.');
      return;
    }

    if (mode === 'user' && !selectedUserId) {
      showMessage('error', 'Vui lòng chọn User cần phân quyền.');
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      if (mode === 'role') {
        await updateRolePermissions(selectedRole, selectedPermissions);
        showMessage('success', 'Cập nhật quyền cho Role thành công!');
      } else {
        await updateUserPermissions(parseInt(selectedUserId), selectedPermissions);
        showMessage('success', 'Cập nhật quyền cho User thành công!');
      }
    } catch (error) {
      let errorMessage = error.message || 'Có lỗi xảy ra khi cập nhật quyền';
      
      // Xử lý lỗi từ GraphQL response
      if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors[0]?.message || errorMessage;
      }
      
      // Kiểm tra lỗi quyền truy cập
      if (errorMessage.includes('không có quyền') || errorMessage.includes('permission')) {
        errorMessage = 'Bạn không có quyền truy cập chức năng này.';
      }
      
      showMessage('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Hiển thị message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  // Kiểm tra permission đã được chọn
  const isPermissionSelected = (permissionId) => {
    return selectedPermissions.includes(permissionId);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Phân Quyền Người Dùng</h1>
          <p className="text-gray-600">Quản lý quyền hạn chi tiết cho Role hoặc User</p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Chế độ lựa chọn:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="role"
                  checked={mode === 'role'}
                  onChange={() => handleModeChange('role')}
                  className="mr-2"
                />
                <span className="text-gray-700">Theo Role</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="user"
                  checked={mode === 'user'}
                  onChange={() => handleModeChange('user')}
                  className="mr-2"
                />
                <span className="text-gray-700">Theo User</span>
              </label>
            </div>
          </div>

          {/* Role/User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {mode === 'role' ? 'Chọn Role:' : 'Chọn User:'}
            </label>
            {mode === 'role' ? (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">-- Chọn Role --</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">-- Chọn User --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Permissions List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
          ) : permissionGroups.length > 0 ? (
            <div className="space-y-6 mb-6">
              {permissionGroups.map((group) => (
                <div key={group.name} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    {group.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200 hover:border-cyan-400 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isPermissionSelected(parseInt(permission.id))}
                          onChange={() => handlePermissionToggle(parseInt(permission.id))}
                          className="mr-3 w-4 h-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                        />
                        <div>
                          <div className="font-medium text-gray-800">{permission.name}</div>
                          {permission.description && (
                            <div className="text-sm text-gray-500">{permission.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Không có quyền nào được định nghĩa
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || loading || (mode === 'role' && !selectedRole) || (mode === 'user' && !selectedUserId)}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Lưu Thay Đổi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

