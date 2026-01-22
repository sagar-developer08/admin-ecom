'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import DataTable from '../../../../components/shared/DataTable';
import StatsCard from '../../../../components/shared/StatsCard';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import vendorService from '../../../../lib/services/vendorService';

export default function PendingVendorsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

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
      fetchPendingVendors();
    }
  }, [user, isLoading, router]);

  const fetchPendingVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getPendingVendors();
      setVendors(response.data || []);
    } catch (error) {
      console.error('Error fetching pending vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    if (confirm('Are you sure you want to approve this vendor?')) {
      try {
        await vendorService.updateVendorStatus(vendorId, 'active');
        fetchPendingVendors();
      } catch (error) {
        console.error('Error approving vendor:', error);
      }
    }
  };

  const handleReject = async (vendorId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await vendorService.updateVendorStatus(vendorId, 'rejected');
        fetchPendingVendors();
      } catch (error) {
        console.error('Error rejecting vendor:', error);
      }
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Vendor Name', 
      sortable: true
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'businessName', label: 'Business Name', sortable: true },
    { 
      key: 'createdAt', 
      label: 'Requested Date', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleApprove(row.id);
        }}
        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
      >
        <CheckCircle className="w-4 h-4 inline mr-1" />
        Approve
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleReject(row.id);
        }}
        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
      >
        <XCircle className="w-4 h-4 inline mr-1" />
        Reject
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Pending Vendor Approvals</h1>
            <p className="text-gray-600 mt-1">Review and approve vendor registrations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatsCard
              title="Pending Approvals"
              value={vendors.length}
              icon={Clock}
              color="yellow"
            />
          </div>

          <DataTable
            data={vendors}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={true}
            emptyMessage="No pending vendor approvals"
          />
        </main>
      </div>
    </div>
  );
}

