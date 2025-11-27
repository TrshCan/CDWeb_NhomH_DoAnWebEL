import { useState, useEffect, useRef } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { graphqlRequest } from "../../api/graphql";

// GraphQL Queries & Mutations
const GET_CATEGORIES = `
  query {
    categories {
      id
      name
      created_at
      updated_at
      deleted_at
    }
  }
`;

const CREATE_CATEGORY = `
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      created_at
      updated_at
      deleted_at
    }
  }
`;

const UPDATE_CATEGORY = `
  mutation UpdateCategory($id: Int!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      created_at
      updated_at
      deleted_at
    }
  }
`;

const DELETE_CATEGORY = `
  mutation DeleteCategory($id: Int!, $allowIfReferenced: Boolean) {
    deleteCategory(id: $id, allowIfReferenced: $allowIfReferenced)
  }
`;

const RESTORE_CATEGORY = `
  mutation RestoreCategory($id: Int!) {
    restoreCategory(id: $id)
  }
`;

// SVG Icons
const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const broadcastChannelRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast({ message: "", type: "success", visible: false }), 3000);
  };

  // Load categories from API
  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Đồng bộ giữa các tab khi có thay đổi category
  useEffect(() => {
    // Tạo BroadcastChannel để đồng bộ giữa các tab
    const channel = new BroadcastChannel('category-sync');
    broadcastChannelRef.current = channel;

    // Lắng nghe thay đổi từ tab khác
    channel.onmessage = (event) => {
      const { type, data } = event.data;
      console.log('[Category Sync] Received:', type, data);

      if (type === 'CATEGORY_CREATED' || type === 'CATEGORY_UPDATED' || type === 'CATEGORY_DELETED') {
        // Tự động reload danh sách khi có thay đổi từ tab khác
        fetchCategories();
        
        // Hiển thị thông báo
        if (type === 'CATEGORY_CREATED') {
          showToast('Danh mục mới đã được thêm từ tab khác', 'success');
        } else if (type === 'CATEGORY_UPDATED') {
          showToast('Danh mục đã được cập nhật từ tab khác', 'success');
          // Nếu đang chỉnh sửa category bị cập nhật, đóng modal và reset form
          if (editingCategory && data.id === editingCategory.id) {
            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '' });
            setFormErrors({});
          }
        } else if (type === 'CATEGORY_DELETED') {
          showToast('Danh mục đã được xóa từ tab khác', 'success');
          // Nếu đang chỉnh sửa category bị xóa, đóng modal và reset form
          if (editingCategory && data.id === editingCategory.id) {
            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '' });
            setFormErrors({});
            showToast('Danh mục bạn đang chỉnh sửa đã bị xóa từ tab khác', 'error');
          }
          // Nếu đang xác nhận xóa category bị xóa, đóng modal xóa
          if (deleteId && data.id === parseInt(deleteId)) {
            setShowDelete(false);
            setDeleteId(null);
          }
        }

        // Đóng modal nếu đang mở (tránh conflict)
        // Sử dụng setTimeout để tránh conflict với state updates
        setTimeout(() => {
          setShowModal(false);
          setShowDelete(false);
        }, 100);
      }
    };

    // Cleanup khi component unmount
    return () => {
      if (channel) {
        channel.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gửi thông báo đến các tab khác
  const broadcastChange = (type, data = {}) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type, data });
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await graphqlRequest(GET_CATEGORIES);
      
      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        const errorMsg = result.errors[0]?.message || 'Lỗi tải danh mục';
        showToast(`Lỗi tải danh mục: ${errorMsg}`, 'error');
        setLoading(false);
        return;
      }
      
      const categoriesData = result.data?.categories || [];
      // Filter out deleted categories
      const activeCategories = categoriesData.filter(cat => !cat.deleted_at);
      setCategories(activeCategories);
      setLoading(false);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
      const errorMsg = err.message || 'Không thể kết nối đến server';
      showToast(`Lỗi tải danh mục: ${errorMsg}`, 'error');
      setLoading(false);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openForm = (cat = null) => {
    if (cat) {
      setFormData({ name: cat.name });
      setEditingCategory(cat);
    } else {
      setFormData({ name: "" });
      setEditingCategory(null);
    }
    setFormErrors({});
    setShowModal(true);
  };

  const saveCategory = async () => {
    // Validate form data
    const errors = {};
    const trimmedName = formData.name.trim();
    
    if (!trimmedName) {
      errors.name = "Tên danh mục không được để trống";
    } else if (trimmedName.length > 255) {
      errors.name = "Tên danh mục không được vượt quá 255 ký tự";
    } else if (trimmedName.length < 2) {
      errors.name = "Tên danh mục phải có ít nhất 2 ký tự";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (editingCategory) {
        // Update existing category
        const result = await graphqlRequest(UPDATE_CATEGORY, {
          id: parseInt(editingCategory.id),
          input: { name: trimmedName }
        });

        if (result.errors) {
          console.error('GraphQL Errors:', result.errors);
          const error = result.errors[0];
          
          // Xử lý lỗi validation chi tiết
          if (error.extensions?.validation) {
            const validationErrors = error.extensions.validation;
            const fieldErrors = {};
            
            if (validationErrors.name) {
              fieldErrors.name = Array.isArray(validationErrors.name) 
                ? validationErrors.name[0] 
                : validationErrors.name;
            }
            
            if (Object.keys(fieldErrors).length > 0) {
              setFormErrors(fieldErrors);
              showToast('Vui lòng kiểm tra lại thông tin nhập vào', 'error');
            } else {
              showToast(error.message || 'Lỗi cập nhật danh mục', 'error');
            }
          } else {
            // Kiểm tra các loại lỗi cụ thể
            const errorMsg = error.message || 'Lỗi cập nhật danh mục';
            
            if (errorMsg.includes('đã tồn tại') || errorMsg.includes('trùng')) {
              setFormErrors({ name: 'Tên danh mục này đã tồn tại' });
              showToast('Tên danh mục này đã tồn tại. Vui lòng chọn tên khác.', 'error');
            } else if (errorMsg.includes('không tìm thấy') || errorMsg.includes('not found')) {
              showToast('Danh mục không tồn tại hoặc đã bị xóa. Vui lòng tải lại trang.', 'error');
              fetchCategories();
            } else {
              showToast(`Lỗi cập nhật: ${errorMsg}`, 'error');
            }
          }
          
          setIsSubmitting(false);
          return;
        }

        showToast('Cập nhật danh mục thành công', 'success');
        
        // Gửi thông báo đến các tab khác
        broadcastChange('CATEGORY_UPDATED', { id: editingCategory.id, name: trimmedName });
      } else {
        // Create new category - get max ID and add 1
        const maxId = categories.length > 0 
          ? Math.max(...categories.map(c => parseInt(c.id))) 
          : 0;
        
        const result = await graphqlRequest(CREATE_CATEGORY, {
          input: { 
            id: maxId + 1,
            name: trimmedName 
          }
        });

        if (result.errors) {
          console.error('GraphQL Errors:', result.errors);
          const error = result.errors[0];
          
          // Xử lý lỗi validation chi tiết
          if (error.extensions?.validation) {
            const validationErrors = error.extensions.validation;
            const fieldErrors = {};
            
            if (validationErrors.name) {
              fieldErrors.name = Array.isArray(validationErrors.name) 
                ? validationErrors.name[0] 
                : validationErrors.name;
            }
            if (validationErrors.id) {
              fieldErrors.id = Array.isArray(validationErrors.id) 
                ? validationErrors.id[0] 
                : validationErrors.id;
            }
            
            if (Object.keys(fieldErrors).length > 0) {
              setFormErrors(fieldErrors);
              showToast('Vui lòng kiểm tra lại thông tin nhập vào', 'error');
            } else {
              showToast(error.message || 'Lỗi tạo danh mục', 'error');
            }
          } else {
            // Kiểm tra các loại lỗi cụ thể
            const errorMsg = error.message || 'Lỗi tạo danh mục';
            
            if (errorMsg.includes('đã tồn tại') || errorMsg.includes('trùng')) {
              if (errorMsg.includes('name')) {
                setFormErrors({ name: 'Tên danh mục này đã tồn tại' });
                showToast('Tên danh mục này đã tồn tại. Vui lòng chọn tên khác.', 'error');
              } else if (errorMsg.includes('id') || errorMsg.includes('ID')) {
                showToast('ID danh mục đã tồn tại. Vui lòng tải lại trang để lấy ID mới.', 'error');
                fetchCategories();
              } else {
                showToast(`Lỗi tạo: ${errorMsg}`, 'error');
              }
            } else if (errorMsg.includes('không thể kết nối') || errorMsg.includes('network')) {
              showToast('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.', 'error');
            } else {
              showToast(`Lỗi tạo: ${errorMsg}`, 'error');
            }
          }
          
          setIsSubmitting(false);
          return;
        }

        showToast('Tạo danh mục thành công', 'success');
        
        // Gửi thông báo đến các tab khác
        broadcastChange('CATEGORY_CREATED', { id: result.data?.createCategory?.id, name: trimmedName });
      }
      
      fetchCategories();
      setShowModal(false);
    } catch (err) {
      console.error('Lỗi lưu danh mục:', err);
      const errorMsg = err.message || 'Không xác định';
      
      if (errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('timeout')) {
        showToast('Lỗi kết nối: Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.', 'error');
      } else {
        showToast(`Lỗi lưu danh mục: ${errorMsg}`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDelete(true);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await graphqlRequest(DELETE_CATEGORY, {
        id: parseInt(deleteId),
        allowIfReferenced: false
      });

      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        const error = result.errors[0];
        const errorMessage = error.message || 'Lỗi xóa danh mục';
        
        // Kiểm tra các loại lỗi cụ thể
        if (errorMessage.includes('đang được sử dụng') || errorMessage.includes('referenced') || errorMessage.includes('surveys')) {
          showToast('Không thể xóa danh mục này vì đang được sử dụng bởi các khảo sát khác. Vui lòng xóa hoặc thay đổi danh mục của các khảo sát trước.', 'error');
        } else if (errorMessage.includes('không tìm thấy') || errorMessage.includes('not found')) {
          showToast('Danh mục không tồn tại hoặc đã bị xóa. Vui lòng tải lại trang.', 'error');
          fetchCategories();
        } else if (errorMessage.includes('không thể kết nối') || errorMessage.includes('network')) {
          showToast('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.', 'error');
        } else {
          showToast(`Lỗi xóa: ${errorMessage}`, 'error');
        }
        
        setIsSubmitting(false);
        setShowDelete(false);
        return;
      }

      showToast('Xóa danh mục thành công', 'success');
      
      // Gửi thông báo đến các tab khác
      broadcastChange('CATEGORY_DELETED', { id: deleteId });
      
      fetchCategories();
      setShowDelete(false);
    } catch (err) {
      console.error('Lỗi xóa danh mục:', err);
      const errorMsg = err.message || 'Không xác định';
      
      if (errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('timeout')) {
        showToast('Lỗi kết nối: Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.', 'error');
      } else {
        showToast(`Lỗi xóa danh mục: ${errorMsg}`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex">
      <AdminSidebar />
      <div className="flex-1 p-4 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast.visible && (
          <div className={`fixed top-6 right-6 z-[100] rounded-xl px-6 py-4 shadow-2xl max-w-md border-2 backdrop-blur-sm transform transition-all duration-300 ${
            toast.type === "success" 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-900 shadow-green-200/50" 
              : "bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-900 shadow-red-200/50"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 mt-0.5 ${toast.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {toast.type === "success" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-base font-medium whitespace-pre-line leading-relaxed">{toast.message}</div>
            </div>
          </div>
        )}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 shadow-lg">
              <FolderIcon />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Quản lý Danh mục</h1>
          </div>
          <p className="text-gray-600 mt-2 text-lg">Quản lý các danh mục khảo sát</p>
        </header>

        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl border-2 border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              maxLength={255}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm danh mục..."
              className="pl-10 pr-16 py-2.5 border-2 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md border-gray-300 bg-white hover:border-gray-400"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <span className={`text-xs font-medium ${searchQuery.length >= 250 ? 'text-orange-500' : searchQuery.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
                {searchQuery.length}/255
              </span>
            </div>
          </div>
          <button
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusIcon /> Thêm mới
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-4">
                <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-700">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gradient-to-r from-gray-50 via-purple-50 to-indigo-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Tên danh mục</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.length > 0 ? (
                filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 group">
                    <td className="px-6 py-4 font-semibold text-gray-900">#{cat.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(cat.createdAt)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openForm(cat)} className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110" title="Chỉnh sửa">
                          <EditIcon />
                        </button>
                        <button onClick={() => confirmDelete(cat.id)} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110" title="Xóa">
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-16">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                      <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-800 mb-2">Không có danh mục nào</p>
                    <p className="text-sm text-gray-500">Hãy thêm danh mục mới để bắt đầu</p>
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Add/Edit */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                    <FolderIcon />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900 hover:bg-white rounded-full p-2 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md">
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); saveCategory(); }} className="p-8 space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    maxLength={255}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      // Xóa lỗi khi người dùng bắt đầu nhập
                      if (formErrors.name) {
                        setFormErrors({ ...formErrors, name: '' });
                      }
                    }}
                    className={`border-2 ${formErrors.name ? "border-red-500 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"} rounded-xl w-full p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md`}
                    placeholder="Nhập tên danh mục (tối thiểu 2 ký tự, tối đa 255 ký tự)"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {formErrors.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
                    <p className={`text-xs ml-auto ${formData.name.length > 255 ? 'text-red-500' : 'text-gray-400'}`}>{formData.name.length}/255</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t-2 border-gray-200 pt-6 bg-gray-50 -mx-8 -mb-8 px-8 pb-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    {isSubmitting && (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isSubmitting ? "Đang xử lý..." : (editingCategory ? "Cập nhật" : "Tạo danh mục")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-rose-100 mb-4 shadow-lg ring-4 ring-red-50">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bạn có chắc chắn muốn xóa?</h3>
                <p className="text-sm text-gray-600 mb-6">Hành động này sẽ xóa danh mục khỏi hệ thống. Bạn có thể không thể hoàn tác.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowDelete(false)}
                    className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={doDelete}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    {isSubmitting && (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isSubmitting ? "Đang xóa..." : "Vâng, xóa"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
