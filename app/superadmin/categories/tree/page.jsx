'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  FolderTree,
  Folder,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { productApi } from '../../../../lib/apiClient';

const CategoryTreePage = () => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [parentCategory, setParentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    isPopular: false,
    isActive: true
  });

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
      const result = await productApi.get('/categories');
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (categories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // Create a map of all categories
    categories.forEach(category => {
      categoryMap.set(category._id, { ...category, children: [] });
    });

    // Build the tree structure
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category._id);
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryNode);
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  };

  const toggleNode = (categoryId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddCategory = (parentCategory = null) => {
    setParentCategory(parentCategory);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      isPopular: false,
      isActive: true
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const categoryData = {
        ...formData,
        parentId: parentCategory?._id || null,
        level: parentCategory ? parentCategory.level + 1 : 1,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-')
      };

      const result = await productApi.post('/categories', categoryData);
      if (result.success) {
        await fetchCategories();
        setShowAddForm(false);
        setParentCategory(null);
        setFormData({
          name: '',
          slug: '',
          description: '',
          icon: '',
          isPopular: false,
          isActive: true
        });
      } else {
        alert('Error creating category: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const result = await productApi.delete(`/categories/${categoryId}`);
      if (result.success) {
        await fetchCategories();
      } else {
        alert('Error deleting category: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const renderTreeNode = (category, level = 0) => {
    const isExpanded = expandedNodes.has(category._id);
    const hasChildren = category.children && category.children.length > 0;
    const indentStyle = { paddingLeft: `${level * 24}px` };

    return (
      <div key={category._id} className="select-none">
        <div 
          className="flex items-center py-2 px-3 hover:bg-gray-50 border-b border-gray-100"
          style={indentStyle}
        >
          <div className="flex items-center flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(category._id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            
            <div className="flex items-center space-x-3 flex-1">
              {isExpanded ? (
                <FolderOpen className="w-5 h-5 text-blue-500" />
              ) : (
                <Folder className="w-5 h-5 text-blue-500" />
              )}
              
              <div className="flex-1">
                <div className="font-medium text-gray-900">{category.name}</div>
                <div className="text-sm text-gray-500">
                  Level {category.level} • {category.slug}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Level {category.level}
                </span>
                
                <button
                  onClick={() => handleAddCategory(category)}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title={`Add sub-category to ${category.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setSelectedCategory(category)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Edit category"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(category._id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {category.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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

  const treeData = buildTree(categories);

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/superadmin/categories"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Categories
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <FolderTree className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Category Tree</h1>
                  <p className="text-gray-600">Manage your category hierarchy</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleAddCategory()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Root Category
            </button>
          </div>
        </div>

        {/* Tree View */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Category Hierarchy</h2>
              <p className="text-sm text-gray-600">
                Click on the + button next to any category to add a sub-category. 
                Click the arrow to expand/collapse branches.
              </p>
            </div>
            
            {treeData.length === 0 ? (
              <div className="text-center py-12">
                <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                <p className="text-gray-600 mb-4">Start by adding your first root category</p>
                <button
                  onClick={() => handleAddCategory()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Root Category
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {treeData.map(category => renderTreeNode(category))}
              </div>
            )}
          </div>
        </div>

        {/* Add Category Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add {parentCategory ? `Sub-category to "${parentCategory.name}"` : 'Root Category'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="auto-generated from name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon URL
                    </label>
                    <input
                      type="url"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/icon.png"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPopular}
                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Popular</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FolderTree className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Level: {parentCategory ? parentCategory.level + 1 : 1}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {parentCategory ? 
                        `This will be a sub-category under "${parentCategory.name}"` :
                        'This will be a root-level category'
                      }
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default CategoryTreePage;
