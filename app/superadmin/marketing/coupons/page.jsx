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
import { Tag, Plus, Edit, Trash2, BadgePercent } from 'lucide-react';
import promotionService from '../../../../lib/services/promotionService';

export default function CouponsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    expiryDate: '',
    usageLimit: ''
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
      fetchCoupons();
    }
  }, [user, isLoading, router]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAllCoupons();
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await promotionService.updateCoupon(editingCoupon._id, formData);
      } else {
        await promotionService.createCoupon(formData);
      }
      setShowModal(false);
      setEditingCoupon(null);
      setFormData({ code: '', type: 'percentage', value: '', minPurchase: '', maxDiscount: '', expiryDate: '', usageLimit: '' });
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      type: coupon.type || 'percentage',
      value: coupon.value || '',
      minPurchase: coupon.minPurchase || '',
      maxDiscount: coupon.maxDiscount || '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (couponId) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await promotionService.deleteCoupon(couponId);
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
    }
  };

  const columns = [
    { 
      key: 'code', 
      label: 'Coupon Code', 
      sortable: true,
      render: (value) => (
        <span className="font-mono font-bold text-blue-600">{value}</span>
      )
    },
    { 
      key: 'type', 
      label: 'Type', 
      sortable: true,
      render: (value) => (
        <span className="capitalize">{value}</span>
      )
    },
    { 
      key: 'value', 
      label: 'Discount', 
      sortable: true,
      render: (value, row) => row.type === 'percentage' ? `${value}%` : `$${value}`
    },
    { 
      key: 'minPurchase', 
      label: 'Min Purchase', 
      sortable: true,
      render: (value) => value ? `$${value}` : 'None'
    },
    { 
      key: 'usageCount', 
      label: 'Used', 
      sortable: true,
      render: (value, row) => `${value || 0}/${row.usageLimit || '∞'}`
    },
    { 
      key: 'expiryDate', 
      label: 'Expires', 
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value, row) => {
        const isExpired = row.expiryDate && new Date(row.expiryDate) < new Date();
        const isLimitReached = row.usageLimit && row.usageCount >= row.usageLimit;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isExpired || isLimitReached ? 'bg-red-100 text-red-800' :
            value === 'active' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {isExpired ? 'Expired' : isLimitReached ? 'Limit Reached' : value || 'active'}
          </span>
        );
      }
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
              <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
              <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
            </div>
            <button
              onClick={() => {
                setEditingCoupon(null);
                setFormData({ code: '', type: 'percentage', value: '', minPurchase: '', maxDiscount: '', expiryDate: '', usageLimit: '' });
                setShowModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Add Coupon</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Coupons"
              value={coupons.length}
              icon={Tag}
              color="blue"
            />
            <StatsCard
              title="Active"
              value={coupons.filter(c => c.status === 'active').length}
              icon={BadgePercent}
              color="green"
            />
            <StatsCard
              title="Expired"
              value={coupons.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date()).length}
              icon={Tag}
              color="red"
            />
            <StatsCard
              title="Total Usage"
              value={coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
              icon={BadgePercent}
              color="purple"
            />
          </div>

          {/* Coupons Table */}
          <DataTable
            data={coupons}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={true}
            emptyMessage="No coupons found"
          />

          {/* Add/Edit Coupon Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingCoupon(null);
            }}
            title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
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
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
              </>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Coupon Code"
                name="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2025"
                required
              />
              <FormSelect
                label="Discount Type"
                name="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed Amount' }
                ]}
              />
              <FormInput
                label="Discount Value"
                name="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'percentage' ? '10' : '50'}
                required
              />
              <FormInput
                label="Minimum Purchase"
                name="minPurchase"
                type="number"
                value={formData.minPurchase}
                onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                placeholder="100"
              />
              {formData.type === 'percentage' && (
                <FormInput
                  label="Maximum Discount"
                  name="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="50"
                />
              )}
              <FormInput
                label="Expiry Date"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
              <FormInput
                label="Usage Limit"
                name="usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                placeholder="100"
              />
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}

