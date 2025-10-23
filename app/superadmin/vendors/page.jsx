'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import StatsCard from '../../../components/shared/StatsCard';
import Modal from '../../../components/shared/Modal';
import { Store, Users, DollarSign, CheckCircle, XCircle, Eye, Edit, Ban } from 'lucide-react';
import vendorService from '../../../lib/services/vendorService';

export default function VendorsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    verified: 0
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
      fetchVendors();
    }
  }, [user, isLoading, router]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getAllVendors();
      console.log('🔍 [Frontend] fetchVendors response:', response);
      console.log('🔍 [Frontend] vendors data:', response.data);
      
      if (response.data && response.data.length > 0) {
        console.log('🔍 [Frontend] First vendor data structure:', response.data[0]);
        console.log('🔍 [Frontend] First vendor ID:', response.data[0].id);
      }
      
      setVendors(response.data || []);
      
      // Calculate stats
      const total = response.data?.length || 0;
      const active = response.data?.filter(v => v.status === 'active').length || 0;
      const pending = response.data?.filter(v => v.status === 'pending').length || 0;
      const suspended = response.data?.filter(v => v.status === 'suspended').length || 0;
      const verified = response.data?.filter(v => v.verified === true || v.isVerified === true).length || 0;
      
      console.log('🔍 [Frontend] Calculated stats:', {
        total,
        active,
        pending,
        suspended,
        verified,
        vendors: response.data?.map(v => ({
          name: v.name,
          status: v.status,
          verified: v.verified,
          isVerified: v.isVerified
        }))
      });
      
      setStats({ total, active, pending, suspended, verified });
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    try {
      await vendorService.updateVendorStatus(vendorId, 'active');
      fetchVendors();
    } catch (error) {
      console.error('Error approving vendor:', error);
    }
  };

  const handleReject = async (vendorId) => {
    try {
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;
      await vendorService.verifyVendor(vendorId, { verified: false, rejectionReason: reason });
      fetchVendors();
    } catch (error) {
      console.error('Error rejecting vendor:', error);
    }
  };

  const handleSuspend = async (vendorId) => {
    try {
      const reason = prompt('Please provide a reason for suspension:');
      if (reason) {
        await vendorService.suspendVendor(vendorId, reason);
        fetchVendors();
        alert('Vendor suspended successfully!');
      }
    } catch (error) {
      console.error('Error suspending vendor:', error);
      alert('Error suspending vendor: ' + error.message);
    }
  };

  const handleActivate = async (vendorId) => {
    try {
      if (confirm('Are you sure you want to activate this vendor?')) {
        await vendorService.updateVendorStatus(vendorId, 'active');
        fetchVendors();
        alert('Vendor activated successfully!');
      }
    } catch (error) {
      console.error('Error activating vendor:', error);
      alert('Error activating vendor: ' + error.message);
    }
  };

  const handleStatusChange = async (vendorId, currentStatus, newStatus) => {
    try {
      console.log('🔍 [Frontend] Status change called with:', { vendorId, currentStatus, newStatus });
      
      if (!vendorId) {
        console.error('❌ [Frontend] Vendor ID is undefined!');
        alert('Error: Vendor ID is missing. Please refresh the page and try again.');
        return;
      }
      
      if (currentStatus === newStatus) {
        console.log('🔄 [Frontend] Status unchanged, no action needed');
        return;
      }
      
      const actionMap = {
        'active': 'activate',
        'inactive': 'deactivate',
        'suspended': 'suspend',
        'pending': 'set to pending'
      };
      
      const action = actionMap[newStatus] || 'update';
      
      if (confirm(`Are you sure you want to ${action} this vendor?`)) {
        console.log(`🔄 [Frontend] Updating vendor ${vendorId} from ${currentStatus} to ${newStatus}`);
        
        // Handle suspended status specially
        if (newStatus === 'suspended') {
          const reason = prompt('Please provide a reason for suspension:');
          if (!reason) {
            console.log('🔄 [Frontend] Suspension cancelled - no reason provided');
            return;
          }
          await vendorService.suspendVendor(vendorId, reason);
        } else {
          await vendorService.updateVendorStatus(vendorId, newStatus);
        }
        
        fetchVendors();
        alert(`Vendor ${action}d successfully!`);
      }
    } catch (error) {
      console.error(`Error updating vendor status:`, error);
      alert(`Error updating vendor status: ` + error.message);
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Vendor Name', 
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <Store className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'businessName', label: 'Business Name', sortable: true },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value, row) => {
        console.log('🔍 [Frontend] Status column render - row data:', row);
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === 'active' ? 'bg-green-100 text-green-800' :
              value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              value === 'suspended' ? 'bg-red-100 text-red-800' :
              value === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {value}
            </span>
            <select
              value={value}
              onChange={(e) => {
                e.stopPropagation();
                const newStatus = e.target.value;
                console.log('🔍 [Frontend] Status dropdown changed - row.id:', row.id, 'newStatus:', newStatus);
                handleStatusChange(row.id, value, newStatus);
              }}
              className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        );
      }
    },
    { 
      key: 'isVerified', 
      label: 'Verified', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Verified' : 'Not Verified'}
        </span>
      )
    },
    { 
      key: 'commissionRate', 
      label: 'Commission', 
      sortable: true,
      render: (value) => `${value || 0}%`
    },
    { 
      key: 'createdAt', 
      label: 'Joined', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedVendor(row);
          setShowModal(true);
        }}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        title="View Details"
      >
        <Eye className="w-5 h-5" />
      </button>
      {/* Status management is now handled by the dropdown in the status column */}
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all vendors</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <StatsCard
              title="Total Vendors"
              value={stats.total}
              icon={Store}
              color="blue"
            />
            <StatsCard
              title="Active Vendors"
              value={stats.active}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title="Verified Vendors"
              value={stats.verified}
              icon={DollarSign}
              color="blue"
            />
            <StatsCard
              title="Pending Approval"
              value={stats.pending}
              icon={Users}
              color="yellow"
            />
            <StatsCard
              title="Suspended"
              value={stats.suspended}
              icon={XCircle}
              color="red"
            />
          </div>

          {/* Vendors Table */}
          <DataTable
            data={vendors}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={true}
            emptyMessage="No vendors found"
          />

          {/* Vendor Details Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedVendor(null);
            }}
            title="Vendor Details"
            size="lg"
          >
            {selectedVendor && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor Name</label>
                    <p className="text-gray-900">{selectedVendor.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedVendor.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{selectedVendor.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Business Name</label>
                    <p className="text-gray-900">{selectedVendor.businessName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status (User Model)</label>
                    <p className={`font-medium ${
                      selectedVendor.status === 'active' ? 'text-green-600' :
                      selectedVendor.status === 'pending' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedVendor.status}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Verified (Commission Model)</label>
                    <p className={`font-medium ${
                      selectedVendor.isVerified ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {selectedVendor.isVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Commission Rate</label>
                    <p className="text-gray-900">{selectedVendor.commissionRate || 0}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Has Custom Commission</label>
                    <p className="text-gray-900">{selectedVendor.hasCustomCommission ? 'Yes' : 'No (Using Default)'}</p>
                  </div>
                </div>
              </div>
            )}
          </Modal>
        </main>
      </div>
    </div>
  );
}

