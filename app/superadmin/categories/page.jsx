'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import StatsCard from '../../../components/shared/StatsCard';
import Modal from '../../../components/shared/Modal';
import FormInput from '../../../components/shared/FormInput';
import FormSelect from '../../../components/shared/FormSelect';
import { FolderTree, Plus, Edit, Trash2, Folder, Image as ImageIcon, Calendar, User, TreePine } from 'lucide-react';
import Link from 'next/link';
import productService from '../../../lib/services/productService';

export default function CategoriesPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    icon: '',
    isActive: true,
    isPopular: false
  });
  const [parentCategories, setParentCategories] = useState([]);
  const [iconFile, setIconFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'super_admin' && user?.role !== 'superadmin') {
      router.push('/vendor');
      return;
    }
    if (user) {
      fetchCategories();
    }
  }, [user, isLoading, router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await productService.getCategories();
      const categoriesData = response.data || [];
      setCategories(categoriesData);
      
      // Set parent categories for dropdown (all categories can be parents for unlimited depth)
      setParentCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      const payload = {
        name: formData.name,
        parentId: formData.parentId || null,
        icon: formData.icon || null,
        isActive: formData.isActive,
        isPopular: formData.isPopular
      };

      let categoryId;

      if (editingCategory) {
        await productService.updateCategory(editingCategory._id, payload);
        categoryId = editingCategory._id;
      } else {
        const response = await productService.createCategory(payload);
        categoryId = response.data?._id || response._id;
      }

      // If a file was selected, upload it
      if (iconFile && categoryId) {
        try {
          const uploadResponse = await productService.uploadCategoryIcon(categoryId, iconFile);
          console.log('Icon uploaded:', uploadResponse);
        } catch (uploadError) {
          console.error('Error uploading icon:', uploadError);
          alert('Category saved but icon upload failed. You can try uploading again.');
        }
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', parentId: '', icon: '', isActive: true, isPopular: false });
      setIconFile(null);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.message || 'Failed to save category');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      parentId: category.parentId || '',
      icon: category.icon || '',
      isActive: category.isActive !== undefined ? category.isActive : true,
      isPopular: category.isPopular || false
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await productService.deleteCategory(categoryId);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(error.message || 'Failed to delete category');
      }
    }
  };

  // Build category tree for parent selection with better hierarchy display
  const getCategoryOptions = () => {
    return categories.map(cat => ({
      value: cat._id,
      label: `${'  '.repeat(cat.level - 1)}${cat.name} (Level ${cat.level})`
    }));
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Category Name', 
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          {row.icon ? (
            <img src={row.icon} alt={value} className="w-8 h-8 rounded object-cover" />
          ) : (
            <Folder className="w-8 h-8 text-blue-600" />
          )}
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.slug}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'level', 
      label: 'Level', 
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          Level {value}
        </span>
      )
    },
    { 
      key: 'path', 
      label: 'Path', 
      render: (value) => (
        <div className="text-xs text-gray-600">
          {value && value.length > 0 ? value.join(' > ') : 'Root'}
        </div>
      )
    },
    { 
      key: 'isPopular', 
      label: 'Popular', 
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    },
    { 
      key: 'isActive', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Created', 
      sortable: true,
      render: (value, row) => (
        <div className="text-xs">
          <div className="text-gray-700">{formatDate(value)}</div>
          {row.createdBy && (
            <div className="text-gray-500 flex items-center mt-1">
              <User className="w-3 h-3 mr-1" />
              {row.createdBy}
            </div>
          )}
        </div>
      )
    },
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row._id);
        }}
        className="p-1 text-red-600 hover:bg-red-50 rounded"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="superadmin"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="superadmin"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600 mt-1">Manage product categories with icons and hierarchy</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/superadmin/categories/tree"
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <TreePine className="w-4 h-4" />
                <span>Tree View</span>
              </Link>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setFormData({ name: '', parentId: '', icon: '', isActive: true, isPopular: false });
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <StatsCard
              title="Total Categories"
              value={categories.length}
              icon={FolderTree}
              color="blue"
            />
            <StatsCard
              title="Level 1"
              value={categories.filter(c => c.level === 1).length}
              icon={Folder}
              color="green"
            />
            <StatsCard
              title="Level 2"
              value={categories.filter(c => c.level === 2).length}
              icon={Folder}
              color="yellow"
            />
            <StatsCard
              title="Level 3+"
              value={categories.filter(c => c.level >= 3).length}
              icon={Folder}
              color="purple"
            />
            <StatsCard
              title="Popular"
              value={categories.filter(c => c.isPopular).length}
              icon={FolderTree}
              color="pink"
            />
          </div>

          {/* Categories Table */}
          <DataTable
            data={categories}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={true}
            emptyMessage="No categories found"
          />

          {/* Add/Edit Category Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingCategory(null);
            }}
            title={editingCategory ? 'Edit Category' : 'Add Category'}
            size="lg"
            footer={
              <>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {uploading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{uploading ? 'Uploading...' : (editingCategory ? 'Update' : 'Create')}</span>
                </button>
              </>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Category Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name (e.g., Electronics)"
                required
              />

              <FormSelect
                label="Parent Category (Optional)"
                name="parentId"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                options={[
                  { value: '', label: 'None (Root Level - Level 1)' },
                  ...getCategoryOptions()
                ]}
                helpText={`Select a parent to create a sub-category. This will create a Level ${formData.parentId ? (parentCategories.find(cat => cat._id === formData.parentId)?.level + 1 || 2) : 1} category.`}
              />

              {/* Level Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Category Level: {formData.parentId ? (parentCategories.find(cat => cat._id === formData.parentId)?.level + 1 || 2) : 1}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {formData.parentId ? 
                    `This will be a sub-category under "${parentCategories.find(cat => cat._id === formData.parentId)?.name}"` :
                    'This will be a root-level category'
                  }
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Category Icon
                </label>
                
                {/* File Upload Option */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setIconFile(file);
                        // Create preview URL
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, icon: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Upload an image file (max 5MB). It will be automatically uploaded to S3.
                  </p>
                </div>

                {/* Or URL Input */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or use URL</span>
                  </div>
                </div>

                <FormInput
                  label=""
                  name="iconUrl"
                  value={!iconFile ? formData.icon : ''}
                  onChange={(e) => {
                    setFormData({ ...formData, icon: e.target.value });
                    setIconFile(null);
                  }}
                  placeholder="https://example.com/icon.png"
                  disabled={!!iconFile}
                />

                {/* Preview */}
                {formData.icon && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Preview:</span>
                    <img 
                      src={formData.icon} 
                      alt="Icon preview" 
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        e.target.src = '';
                        e.target.alt = 'Invalid URL';
                      }}
                    />
                    {iconFile && (
                      <span className="text-xs text-blue-600 font-medium">
                        {iconFile.name}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                </label>
              </div>

              {editingCategory && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center text-gray-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{formatDate(editingCategory.createdAt)}</span>
                    </div>
                    {editingCategory.createdBy && (
                      <div className="flex items-center text-gray-700">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">Created By:</span>
                        <span className="ml-2">{editingCategory.createdBy}</span>
                      </div>
                    )}
                    {editingCategory.updatedAt && editingCategory.updatedAt !== editingCategory.createdAt && (
                      <>
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="font-medium">Last Updated:</span>
                          <span className="ml-2">{formatDate(editingCategory.updatedAt)}</span>
                        </div>
                        {editingCategory.updatedBy && (
                          <div className="flex items-center text-gray-700">
                            <User className="w-4 h-4 mr-2" />
                            <span className="font-medium">Updated By:</span>
                            <span className="ml-2">{editingCategory.updatedBy}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
