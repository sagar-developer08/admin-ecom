'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import DataTable from '../../../../components/shared/DataTable';
import StatsCard from '../../../../components/shared/StatsCard';
import Modal from '../../../../components/shared/Modal';
import FormInput from '../../../../components/shared/FormInput';
import FormSelect from '../../../../components/shared/FormSelect';
import { Zap, Plus, Edit, Trash2 } from 'lucide-react';
import promotionService from '../../../../lib/services/promotionService';

export default function FlashSalesPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount: '',
    discountType: 'percentage',
    startDate: '',
    endDate: '',
    products: []
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
      fetchFlashSales();
    }
  }, [user, isLoading, router]);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAllFlashSales();
      setFlashSales(response.data || []);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFlashSale) {
        await promotionService.updateFlashSale(editingFlashSale._id, formData);
      } else {
        await promotionService.createFlashSale(formData);
      }
      setShowModal(false);
      setEditingFlashSale(null);
      setFormData({ name: '', description: '', discount: '', discountType: 'percentage', startDate: '', endDate: '', products: [] });
      fetchFlashSales();
    } catch (error) {
      console.error('Error saving flash sale:', error);
    }
  };

  const handleDelete = async (flashSaleId) => {
    if (confirm('Are you sure you want to delete this flash sale?')) {
      try {
        await promotionService.deleteFlashSale(flashSaleId);
        fetchFlashSales();
      } catch (error) {
        console.error('Error deleting flash sale:', error);
      }
    }
  };

  const columns = [
    { key: 'name', label: 'Flash Sale Name', sortable: true },
    { 
      key: 'discount', 
      label: 'Discount', 
      sortable: true,
      render: (value, row) => row.discountType === 'percentage' ? `${value}%` : `$${value}`
    },
    { 
      key: 'startDate', 
      label: 'Start Date', 
      sortable: true,
      render: (value) => new Date(value).toLocaleString()
    },
    { 
      key: 'endDate', 
      label: 'End Date', 
      sortable: true,
      render: (value) => new Date(value).toLocaleString()
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'scheduled' ? 'bg-blue-100 text-blue-800' :
          value === 'ended' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
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
          setEditingFlashSale(row);
          setFormData({
            name: row.name || '',
            description: row.description || '',
            discount: row.discount || '',
            discountType: row.discountType || 'percentage',
            startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0,16) : '',
            endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0,16) : '',
            products: row.products || []
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
              <h1 className="text-2xl font-bold text-gray-900">Flash Sales</h1>
              <p className="text-gray-600 mt-1">Manage time-limited sales events</p>
            </div>
            <button
              onClick={() => {
                setEditingFlashSale(null);
                setFormData({ name: '', description: '', discount: '', discountType: 'percentage', startDate: '', endDate: '', products: [] });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create Flash Sale</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Flash Sales"
              value={flashSales.length}
              icon={Zap}
              color="purple"
            />
            <StatsCard
              title="Active"
              value={flashSales.filter(f => f.status === 'active').length}
              icon={Zap}
              color="green"
            />
            <StatsCard
              title="Scheduled"
              value={flashSales.filter(f => f.status === 'scheduled').length}
              icon={Clock}
              color="blue"
            />
            <StatsCard
              title="Ended"
              value={flashSales.filter(f => f.status === 'ended').length}
              icon={Zap}
              color="gray"
            />
          </div>

          <DataTable
            data={flashSales}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={true}
            emptyMessage="No flash sales found"
          />

          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingFlashSale(null);
            }}
            title={editingFlashSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
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
                  {editingFlashSale ? 'Update' : 'Create'}
                </button>
              </>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Flash Sale Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Weekend Mega Sale"
                required
              />
              <FormInput
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Limited time offer"
              />
              <FormSelect
                label="Discount Type"
                name="discountType"
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed Amount' }
                ]}
              />
              <FormInput
                label="Discount Value"
                name="discount"
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="30"
                required
              />
              <FormInput
                label="Start Date & Time"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <FormInput
                label="End Date & Time"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}

