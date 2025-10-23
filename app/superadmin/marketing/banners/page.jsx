'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import DataTable from '../../../../components/shared/DataTable';
import Modal from '../../../../components/shared/Modal';
import FormInput from '../../../../components/shared/FormInput';
import FormSelect from '../../../../components/shared/FormSelect';
import { Image, Plus, Edit, Trash2 } from 'lucide-react';
import promotionService from '../../../../lib/services/promotionService';

export default function BannersPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    type: 'homepage',
    position: 0,
    status: 'active'
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'superadmin') {
      router.push('/vendor');
      return;
    }
    if (user) {
      fetchBanners();
    }
  }, [user, isLoading, router]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAllBanners();
      setBanners(response.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await promotionService.updateBanner(editingBanner._id, formData);
      } else {
        await promotionService.createBanner(formData);
      }
      setShowModal(false);
      setEditingBanner(null);
      setFormData({ title: '', description: '', imageUrl: '', linkUrl: '', type: 'homepage', position: 0, status: 'active' });
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const handleDelete = async (bannerId) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      try {
        await promotionService.deleteBanner(bannerId);
        fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
      }
    }
  };

  const columns = [
    { 
      key: 'imageUrl', 
      label: 'Banner', 
      render: (value) => (
        <img src={value} alt="Banner" className="w-20 h-12 object-cover rounded" />
      )
    },
    { key: 'title', label: 'Title', sortable: true },
    { 
      key: 'type', 
      label: 'Type', 
      sortable: true,
      render: (value) => <span className="capitalize">{value}</span>
    },
    { key: 'position', label: 'Position', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditingBanner(row);
          setFormData({
            title: row.title || '',
            description: row.description || '',
            imageUrl: row.imageUrl || '',
            linkUrl: row.linkUrl || '',
            type: row.type || 'homepage',
            position: row.position || 0,
            status: row.status || 'active'
          });
          setShowModal(true);
        }}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row._id);
        }}
        className="p-1 text-red-600 hover:bg-red-50 rounded"
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
              <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
              <p className="text-gray-600 mt-1">Manage homepage and promotional banners</p>
            </div>
            <button
              onClick={() => {
                setEditingBanner(null);
                setFormData({ title: '', description: '', imageUrl: '', linkUrl: '', type: 'homepage', position: 0, status: 'active' });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Add Banner</span>
            </button>
          </div>

          <DataTable
            data={banners}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={true}
            emptyMessage="No banners found"
          />

          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingBanner(null);
            }}
            title={editingBanner ? 'Edit Banner' : 'Add Banner'}
            size="lg"
            footer={
              <>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingBanner ? 'Update' : 'Create'}
                </button>
              </>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Banner Title"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Summer Sale"
                required
              />
              <FormInput
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Up to 50% off"
              />
              <FormInput
                label="Image URL"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                required
              />
              <FormInput
                label="Link URL"
                name="linkUrl"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://example.com/sale"
              />
              <FormSelect
                label="Banner Type"
                name="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'homepage', label: 'Homepage' },
                  { value: 'category', label: 'Category Page' },
                  { value: 'product', label: 'Product Page' },
                  { value: 'mobile', label: 'Mobile App' }
                ]}
              />
              <FormInput
                label="Position (Order)"
                name="position"
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="0"
              />
              <FormSelect
                label="Status"
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}

