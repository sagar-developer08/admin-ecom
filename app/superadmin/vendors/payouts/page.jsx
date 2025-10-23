'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import DataTable from '../../../../components/shared/DataTable';
import StatsCard from '../../../../components/shared/StatsCard';
import { Wallet, Clock, CheckCircle, XCircle } from 'lucide-react';
import commissionService from '../../../../lib/services/commissionService';

export default function VendorPayoutsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payouts, setPayouts] = useState([]);
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
      fetchPayouts();
    }
  }, [user, isLoading, router]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await commissionService.getAllPayouts();
      setPayouts(response.data || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payoutId) => {
    if (confirm('Approve this payout?')) {
      try {
        await commissionService.approvePayout(payoutId);
        fetchPayouts();
      } catch (error) {
        console.error('Error approving payout:', error);
      }
    }
  };

  const handleReject = async (payoutId) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      try {
        await commissionService.rejectPayout(payoutId, reason);
        fetchPayouts();
      } catch (error) {
        console.error('Error rejecting payout:', error);
      }
    }
  };

  const columns = [
    { key: 'vendorId', label: 'Vendor ID', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (value) => `$${value?.toFixed(2)}`
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'approved' ? 'bg-blue-100 text-blue-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'requestedAt', 
      label: 'Requested', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      {row.status === 'pending' && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApprove(row.id);
            }}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded"
          >
            Approve
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReject(row.id);
            }}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded"
          >
            Reject
          </button>
        </>
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
            <h1 className="text-2xl font-bold text-gray-900">Vendor Payouts</h1>
            <p className="text-gray-600 mt-1">
              Manage vendor payout requests. Payout calculation: <strong>Total Sales - Commission - Processing Fees = Amount to Pay Vendor</strong>
            </p>
            <div className="mt-3 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Payout Calculation Example:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Vendor sells 4 products worth $100 each = $400 total sales</p>
                <p>• Commission rate: 10% = $40 commission</p>
                <p>• Processing fee: 2.5% = $10 processing fee</p>
                <p>• <strong>Amount to pay vendor: $400 - $40 - $10 = $350</strong></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatsCard title="Total Payouts" value={payouts.length} icon={Wallet} color="blue" />
            <StatsCard title="Pending" value={payouts.filter(p => p.status === 'pending').length} icon={Clock} color="yellow" />
            <StatsCard title="Approved" value={payouts.filter(p => p.status === 'approved').length} icon={CheckCircle} color="green" />
            <StatsCard title="Rejected" value={payouts.filter(p => p.status === 'rejected').length} icon={XCircle} color="red" />
          </div>

          <DataTable
            data={payouts}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={true}
            emptyMessage="No payouts found"
          />
        </main>
      </div>
    </div>
  );
}

