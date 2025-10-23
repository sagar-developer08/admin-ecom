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
import { DollarSign, TrendingUp, Percent, Calculator } from 'lucide-react';
import commissionService from '../../../../lib/services/commissionService';

export default function VendorCommissionPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({
    totalCommission: 0,
    averageRate: 0,
    totalOrders: 0,
    netEarnings: 0
  });

  // Sample commission trend data
  const commissionTrendData = [
    { name: 'Week 1', commission: 144, orders: 12 },
    { name: 'Week 2', commission: 216, orders: 18 },
    { name: 'Week 3', commission: 180, orders: 15 },
    { name: 'Week 4', commission: 264, orders: 22 },
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
      fetchCommissions();
    }
  }, [user, isLoading, router]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const response = await commissionService.getVendorTransactions(user?.vendorId || user?.id);
      console.log('📊 Commissions Response:', response);
      
      const commissionsData = response.data?.commissions || response.data || response || [];
      setCommissions(commissionsData);
      
      // Calculate stats
      const totalCommission = commissionsData.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
      const averageRate = commissionsData.length > 0 
        ? commissionsData.reduce((sum, c) => sum + (c.commissionRate || 0), 0) / commissionsData.length 
        : 0;
      const totalOrders = commissionsData.length;
      const netEarnings = commissionsData.reduce((sum, c) => sum + (c.orderAmount || 0) - (c.commissionAmount || 0), 0);
      
      setStats({ totalCommission, averageRate, totalOrders, netEarnings });
      
    } catch (error) {
      console.error('❌ Error fetching commissions:', error);
      setCommissions([]);
      setStats({ totalCommission: 0, averageRate: 0, totalOrders: 0, netEarnings: 0 });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      key: 'orderId', 
      label: 'Order #', 
      sortable: true,
      render: (value) => (
        <span className="font-mono text-blue-600">#{value?.slice(-8) || 'N/A'}</span>
      )
    },
    { 
      key: 'orderAmount', 
      label: 'Order Amount', 
      sortable: true,
      render: (value) => (
        <span className="font-medium">${value?.toFixed(2) || '0.00'}</span>
      )
    },
    { 
      key: 'commissionRate', 
      label: 'Commission Rate', 
      sortable: true,
      render: (value) => (
        <span className="text-orange-600 font-medium">{value?.toFixed(1) || '0.0'}%</span>
      )
    },
    { 
      key: 'commissionAmount', 
      label: 'Commission', 
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-red-600">-${value?.toFixed(2) || '0.00'}</span>
      )
    },
    { 
      key: 'netAmount', 
      label: 'Net Earnings', 
      sortable: true,
      render: (value, commission) => {
        const net = (commission.orderAmount || 0) - (commission.commissionAmount || 0);
        return (
          <span className="font-semibold text-green-600">${net.toFixed(2)}</span>
        );
      }
    },
    { 
      key: 'createdAt', 
      label: 'Date', 
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'calculated' ? 'bg-green-100 text-green-800' :
          value === 'paid' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value?.charAt(0).toUpperCase() + value?.slice(1) || 'Unknown'}
        </span>
      )
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Commission Details</h1>
              <p className="text-gray-600 mt-1">Track commission deductions and net earnings</p>
            </div>
            <ExportButton data={commissions} filename="commission-report" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Commission"
              value={`$${stats.totalCommission.toLocaleString()}`}
              icon={Calculator}
              color="red"
              trend="up"
              trendValue="+12.5%"
            />
            <StatsCard
              title="Average Rate"
              value={`${stats.averageRate.toFixed(1)}%`}
              icon={Percent}
              color="orange"
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={TrendingUp}
              color="blue"
            />
            <StatsCard
              title="Net Earnings"
              value={`$${stats.netEarnings.toLocaleString()}`}
              icon={DollarSign}
              color="green"
              trend="up"
              trendValue="+8.2%"
            />
          </div>

          {/* Commission Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Commission Trend</h3>
            <LineChart data={commissionTrendData} dataKeys={['commission', 'orders']} height={300} />
          </div>

          {/* Commission Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Commission Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Platform Commission (12%)</span>
                  <span className="font-semibold text-lg text-red-600">-${stats.totalCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Payment Processing (2.9%)</span>
                  <span className="font-semibold text-lg text-orange-600">-${(stats.totalCommission * 0.24).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Total Deductions</span>
                  <span className="font-semibold text-lg text-red-600">-${(stats.totalCommission * 1.24).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Net Earnings</span>
                  <span className="font-semibold text-lg text-green-600">${stats.netEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Commission Rate Info</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Current Commission Rate</h4>
                  <p className="text-2xl font-bold text-blue-600">{stats.averageRate.toFixed(1)}%</p>
                  <p className="text-sm text-blue-700 mt-1">Applied to all orders</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Performance Bonus</h4>
                  <p className="text-sm text-green-700">Earn lower commission rates by maintaining high performance metrics</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Rate Reduction</h4>
                  <p className="text-sm text-yellow-700">Reduce commission rate by 1% for every 100 positive reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Commissions Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Commission History</h3>
            <DataTable
              data={commissions}
              columns={columns}
              searchable={true}
              pagination={true}
              emptyMessage="No commission records found"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
