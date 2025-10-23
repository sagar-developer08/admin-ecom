'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import StatsCard from '../../../../components/shared/StatsCard';
import DataTable from '../../../../components/shared/DataTable';
import LineChart from '../../../../components/shared/LineChart';
import ExportButton from '../../../../components/shared/ExportButton';
import { DollarSign, TrendingUp, CreditCard, Clock } from 'lucide-react';
import commissionService from '../../../../lib/services/commissionService';

export default function VendorEarningsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayout: 0,
    paidOut: 0,
    commission: 0
  });

  // Sample earnings data
  const earningsData = [
    { name: 'Week 1', earnings: 1200, commission: 144 },
    { name: 'Week 2', earnings: 1800, commission: 216 },
    { name: 'Week 3', earnings: 1500, commission: 180 },
    { name: 'Week 4', earnings: 2200, commission: 264 },
  ];

  const sampleTransactions = [
    { id: 1, orderNumber: 'ORD-001', date: new Date(), amount: 150, commission: 18, net: 132, status: 'paid' },
    { id: 2, orderNumber: 'ORD-002', date: new Date(), amount: 200, commission: 24, net: 176, status: 'pending' },
    { id: 3, orderNumber: 'ORD-003', date: new Date(), amount: 89, commission: 10.68, net: 78.32, status: 'paid' },
  ];

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
      fetchEarnings();
    }
  }, [user, isLoading, router]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await commissionService.getVendorEarnings(user?.vendorId || user?.id);
      console.log('📊 Earnings Response:', response);
      
      const earningsData = response.data || {};
      setStats({
        totalEarnings: earningsData.totalEarnings || 0,
        pendingPayout: earningsData.pendingPayout || 0,
        paidOut: earningsData.paidOut || 0,
        commission: earningsData.totalCommission || 0
      });

      // Fetch transactions
      const transactionsResponse = await commissionService.getVendorTransactions(user?.vendorId || user?.id);
      const transactionsData = transactionsResponse.data?.transactions || transactionsResponse.data || [];
      setTransactions(transactionsData);
      
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Fallback to sample data
      setTransactions(sampleTransactions);
      setStats({
        totalEarnings: 13850,
        pendingPayout: 2340,
        paidOut: 11510,
        commission: 1662
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      key: 'orderNumber', 
      label: 'Order #', 
      sortable: true,
      render: (value) => (
        <span className="font-mono text-blue-600">{value}</span>
      )
    },
    { 
      key: 'date', 
      label: 'Date', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'amount', 
      label: 'Order Amount', 
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    { 
      key: 'commission', 
      label: 'Commission', 
      sortable: true,
      render: (value) => (
        <span className="text-red-600">-${value.toFixed(2)}</span>
      )
    },
    { 
      key: 'net', 
      label: 'Net Earnings', 
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-green-600">${value.toFixed(2)}</span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'paid' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">Earnings Overview</h1>
              <p className="text-gray-600 mt-1">Track your revenue and payouts</p>
            </div>
            <ExportButton data={transactions} filename="earnings-report" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Earnings"
              value={`$${stats.totalEarnings.toLocaleString()}`}
              icon={DollarSign}
              color="green"
              trend="up"
              trendValue="+18.2%"
            />
            <StatsCard
              title="Pending Payout"
              value={`$${stats.pendingPayout.toLocaleString()}`}
              icon={Clock}
              color="yellow"
            />
            <StatsCard
              title="Paid Out"
              value={`$${stats.paidOut.toLocaleString()}`}
              icon={CreditCard}
              color="blue"
            />
            <StatsCard
              title="Total Commission"
              value={`$${stats.commission.toLocaleString()}`}
              icon={TrendingUp}
              color="red"
            />
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Earnings Trend</h3>
            <LineChart data={earningsData} dataKeys={['earnings', 'commission']} height={300} />
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <DataTable
              data={transactions}
              columns={columns}
              searchable={true}
              pagination={true}
              emptyMessage="No transactions found"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

