'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import ServerSideDataTable from '../../../components/shared/ServerSideDataTable';
import StatsCard from '../../../components/shared/StatsCard';
import Modal from '../../../components/shared/Modal';
import FormInput from '../../../components/shared/FormInput';
import FormSelect from '../../../components/shared/FormSelect';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Calendar, 
  User,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';
import productService from '../../../lib/services/productService';

export default function BrandsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    level1: '',
    level2: '',
    level3: '',
    level4: '',
    isTopBrand: false,
    isActive: true
  });
  const [categories, setCategories] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

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
      fetchBrands();
      fetchCategories();
    }
  }, [user, isLoading, router]);

  const fetchBrands = async (page = pagination.page, limit = pagination.limit, search = searchTerm) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching brands with params:', { page, limit, search });
      
      const params = {
        page,
        limit,
        ...(search && { search })
      };
      
      console.log('📡 Calling productService.getBrands with params:', params);
      const response = await productService.getBrands(params);
      
      console.log('📊 Brands API response:', response);
      
      if (response.success) {
        // Handle the nested data structure from the API
        const brandsData = response.data?.data?.brands || response.data?.brands || response.data || [];
        const paginationData = response.data?.data?.pagination || response.data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };
        
        console.log('✅ Brands fetched successfully:', brandsData.length, 'brands');
        console.log('📊 Brands data:', brandsData);
        console.log('📊 Pagination data:', paginationData);
        
        setBrands(brandsData);
        setPagination(paginationData);
      } else {
        console.error('❌ Failed to fetch brands:', response.message);
        setBrands([]);
        setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('❌ Error fetching brands:', error);
      setBrands([]);
      setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        logo: formData.logo || null,
        level1: formData.level1 || null,
        level2: formData.level2 || null,
        level3: formData.level3 || null,
        level4: formData.level4 || null,
        isTopBrand: formData.isTopBrand,
        isActive: formData.isActive
      };

      if (editingBrand) {
        await productService.updateBrand(editingBrand._id, payload);
      } else {
        await productService.createBrand(payload);
      }

      setShowModal(false);
      setEditingBrand(null);
      setFormData({ name: '', description: '', logo: '', level1: '', level2: '', level3: '', level4: '', isTopBrand: false, isActive: true });
      setLogoFile(null);
      fetchBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
      alert(error.message || 'Failed to save brand');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      description: brand.description || '',
      logo: brand.logo || '',
      level1: brand.level1?._id || '',
      level2: brand.level2?._id || '',
      level3: brand.level3?._id || '',
      level4: brand.level4?._id || '',
      isTopBrand: brand.isTopBrand || false,
      isActive: brand.isActive !== undefined ? brand.isActive : true
    });
    setShowModal(true);
  };

  const handleDelete = async (brandId) => {
    if (confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      try {
        await productService.deleteBrand(brandId);
        fetchBrands();
      } catch (error) {
        console.error('Error deleting brand:', error);
        alert(error.message || 'Failed to delete brand');
      }
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    fetchBrands(newPage, pagination.limit, searchTerm);
  };

  const handleItemsPerPageChange = (newLimit) => {
    fetchBrands(1, newLimit, searchTerm); // Reset to page 1 when changing items per page
  };

  // Search handler
  const handleSearch = (search) => {
    setSearchTerm(search);
    fetchBrands(1, pagination.limit, search); // Reset to page 1 when searching
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
      label: 'Brand Name', 
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          {row.logo ? (
            <img src={row.logo} alt={value} className="w-10 h-10 rounded object-cover" />
          ) : (
            <Building2 className="w-10 h-10 text-blue-600" />
          )}
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.slug}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'description', 
      label: 'Description', 
      render: (value) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {value || 'No description'}
        </div>
      )
    },
    { 
      key: 'categories', 
      label: 'Categories', 
      render: (value, row) => {
        const categories = [];
        if (row.level1) categories.push(`L1: ${row.level1.name}`);
        if (row.level2) categories.push(`L2: ${row.level2.name}`);
        if (row.level3) categories.push(`L3: ${row.level3.name}`);
        if (row.level4) categories.push(`L4: ${row.level4.name}`);
        
        return (
          <div className="text-xs text-gray-600">
            {categories.length > 0 ? categories.join(', ') : 'No categories'}
          </div>
        );
      }
    },
    { 
      key: 'isTopBrand', 
      label: 'Top Brand', 
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
      render: (value) => (
        <div className="text-xs text-gray-600">
          {formatDate(value)}
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
              <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
              <p className="text-gray-600 mt-1">Manage product brands and their information</p>
            </div>
            <button
              onClick={() => {
                setEditingBrand(null);
                setFormData({ name: '', description: '', logo: '', level1: '', level2: '', level3: '', level4: '', isTopBrand: false, isActive: true });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Add Brand</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Brands"
              value={pagination.total}
              icon={Building2}
              color="blue"
            />
            <StatsCard
              title="Active Brands"
              value={brands.filter(b => b.isActive).length}
              icon={Eye}
              color="green"
            />
            <StatsCard
              title="Top Brands"
              value={brands.filter(b => b.isTopBrand).length}
              icon={Star}
              color="yellow"
            />
            <StatsCard
              title="Inactive Brands"
              value={brands.filter(b => !b.isActive).length}
              icon={EyeOff}
              color="red"
            />
          </div>

          {/* Brands Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
            <ServerSideDataTable
              data={brands}
              columns={columns}
              actions={actions}
              pagination={pagination}
              searchable={true}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              onSearch={handleSearch}
              emptyMessage="No brands found. Add your first brand to get started."
              itemsPerPageOptions={[5, 10, 25, 50, 100]}
              loading={loading}
            />
          </div>

          {/* Add/Edit Brand Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingBrand(null);
              setFormData({ name: '', description: '', logo: '', level1: '', level2: '', level3: '', level4: '', isTopBrand: false, isActive: true });
              setLogoFile(null);
            }}
            title={editingBrand ? 'Edit Brand' : 'Add New Brand'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                label="Brand Name *"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter brand name"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter brand description"
                />
              </div>

              {/* Category Selection */}
              {/* <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Category Association (Optional)</h3>
                <p className="text-xs text-gray-500">Select which category levels this brand belongs to</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormSelect
                    label="Level 1 Category"
                    name="level1"
                    value={formData.level1}
                    onChange={(e) => setFormData({ ...formData, level1: e.target.value })}
                    options={[
                      { value: '', label: 'None' },
                      ...categories.filter(cat => cat.level === 1).map(cat => ({
                        value: cat._id,
                        label: cat.name
                      }))
                    ]}
                  />
                  
                  <FormSelect
                    label="Level 2 Category"
                    name="level2"
                    value={formData.level2}
                    onChange={(e) => setFormData({ ...formData, level2: e.target.value })}
                    options={[
                      { value: '', label: 'None' },
                      ...categories.filter(cat => cat.level === 2).map(cat => ({
                        value: cat._id,
                        label: cat.name
                      }))
                    ]}
                  />
                  
                  <FormSelect
                    label="Level 3 Category"
                    name="level3"
                    value={formData.level3}
                    onChange={(e) => setFormData({ ...formData, level3: e.target.value })}
                    options={[
                      { value: '', label: 'None' },
                      ...categories.filter(cat => cat.level === 3).map(cat => ({
                        value: cat._id,
                        label: cat.name
                      }))
                    ]}
                  />
                  
                  <FormSelect
                    label="Level 4 Category"
                    name="level4"
                    value={formData.level4}
                    onChange={(e) => setFormData({ ...formData, level4: e.target.value })}
                    options={[
                      { value: '', label: 'None' },
                      ...categories.filter(cat => cat.level === 4).map(cat => ({
                        value: cat._id,
                        label: cat.name
                      }))
                    ]}
                  />
                </div>
              </div> */}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Brand Logo
                </label>
                
                {/* File Upload Option */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setLogoFile(file);
                        // Create preview URL
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, logo: reader.result });
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
                  name="logoUrl"
                  value={!logoFile ? formData.logo : ''}
                  onChange={(e) => {
                    setFormData({ ...formData, logo: e.target.value });
                    setLogoFile(null);
                  }}
                  placeholder="https://example.com/logo.png"
                  disabled={!!logoFile}
                />

                {/* Preview */}
                {formData.logo && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Preview:</span>
                    <img 
                      src={formData.logo} 
                      alt="Logo preview" 
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        e.target.src = '';
                        e.target.alt = 'Invalid URL';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isTopBrand}
                    onChange={(e) => setFormData({ ...formData, isTopBrand: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Top Brand</span>
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

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBrand(null);
                    setFormData({ name: '', description: '', logo: '', level1: '', level2: '', level3: '', level4: '', isTopBrand: false, isActive: true });
                    setLogoFile(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Saving...' : (editingBrand ? 'Update Brand' : 'Add Brand')}
                </button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
