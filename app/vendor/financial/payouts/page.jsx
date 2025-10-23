'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import StatsCard from '../../../../components/shared/StatsCard';
import DataTable from '../../../../components/shared/DataTable';
import ExportButton from '../../../../components/shared/ExportButton';
import { DollarSign, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import commissionService from '../../../../lib/services/commissionService';

export default function VendorPayoutsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState({
    totalPayouts: 0,
    pendingPayouts: 0,
    approvedPayouts: 0,
    totalAmount: 0
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
      return;
    }
    if (user) {
      fetchPayouts();
    }
  }, [user, isLoading, router]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await commissionService.getVendorPayouts(user?.vendorId || user?.id);
      console.log('📊 Payouts Response:', response);
      
      const payoutsData = response.data?.payouts || response.data || response || [];
      setPayouts(payoutsData);
      
      // Calculate stats
      const totalPayouts = payoutsData.length;
      const pendingPayouts = payoutsData.filter(p => p.status === 'pending').length;
      const approvedPayouts = payoutsData.filter(p => p.status === 'approved').length;
      const totalAmount = payoutsData.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      setStats({ totalPayouts, pendingPayouts, approvedPayouts, totalAmount });
      
    } catch (error) {
      console.error('❌ Error fetching payouts:', error);
      setPayouts([]);
      setStats({ totalPayouts: 0, pendingPayouts: 0, approvedPayouts: 0, totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    { 
      key: 'requestedAt', 
      label: 'Request Date', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-green-600">${value?.toFixed(2) || '0.00'}</span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value?.charAt(0).toUpperCase() + value?.slice(1) || 'Unknown'}
        </span>
      )
    },
    { 
      key: 'paymentMethod', 
      label: 'Payment Method', 
      render: (value) => value || 'Bank Transfer'
    },
    { 
      key: 'approvedAt', 
      label: 'Processed Date', 
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    { 
      key: 'rejectionReason', 
      label: 'Notes', 
      render: (value, payout) => {
        if (payout.status === 'rejected' && value) {
          return <span className="text-red-600 text-sm">{value}</span>;
        }
        return value || '-';
      }
    }
  ];

  const actions = (payout) => (
    <div className="flex space-x-2">
      {payout.status === 'pending' && (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to cancel this payout request?')) {
              // Handle cancel payout
              console.log('Cancel payout:', payout._id);
            }
          }}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
          title="Cancel Request"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
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
        userType="vendor"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
              <p className="text-gray-600 mt-1">Track your payout requests and history</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/vendor/financial/payouts/request')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request Payout
              </button>
              <ExportButton data={payouts} filename="payouts-report" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Payouts"
              value={stats.totalPayouts}
              icon={CreditCard}
              color="blue"
            />
            <StatsCard
              title="Pending"
              value={stats.pendingPayouts}
              icon={Clock}
              color="yellow"
            />
            <StatsCard
              title="Approved"
              value={stats.approvedPayouts}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title="Total Amount"
              value={`$${stats.totalAmount.toLocaleString()}`}
              icon={DollarSign}
              color="purple"
            />
          </div>

          {/* Payouts Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Payout History</h3>
            <DataTable
              data={payouts}
              columns={columns}
              actions={actions}
              searchable={true}
              pagination={true}
              emptyMessage="No payout requests found"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
