'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import StatsCard from '../../../../components/shared/StatsCard';
import LineChart from '../../../../components/shared/LineChart';
import BarChart from '../../../../components/shared/BarChart';
import PieChart from '../../../../components/shared/PieChart';
import DataTable from '../../../../components/shared/DataTable';
import ExportButton from '../../../../components/shared/ExportButton';
import { Users, DollarSign, ShoppingCart, Package, TrendingUp, Calendar, CheckCircle, Clock, Ban, Store } from 'lucide-react';

export default function VendorReportsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [groupBy, setGroupBy] = useState('day');
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    pendingVendors: 0,
    suspendedVendors: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalStores: 0
  });
  const [vendors, setVendors] = useState([]);
  const [registrationTrend, setRegistrationTrend] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedTokens = localStorage.getItem('qliq-admin-tokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          return tokens.accessToken;
        }
      } catch (err) {
        console.error('Error getting token:', err);
      }
    }
    return null;
  };

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
      fetchAllReports();
    }
  }, [user, isLoading, router, period, groupBy]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const cartServiceUrl = process.env.NEXT_PUBLIC_CART_API_URL || 'http://localhost:8084/api';

      // Fetch all reports in parallel
      const [summaryRes, trendRes, statusRes] = await Promise.all([
        fetch(`${cartServiceUrl}/reports/vendors/summary?period=${period}`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/reports/vendors/registration-trend?period=${period}&groupBy=${groupBy}`, { headers, credentials: 'include' }),
        fetch(`${cartServiceUrl}/reports/vendors/status-distribution`, { headers, credentials: 'include' })
      ]);

      // Check if responses are ok
      if (!summaryRes.ok) {
        throw new Error(`Summary API error: ${summaryRes.status}`);
      }

      const [summaryData, trendData, statusData] = await Promise.all([
        summaryRes.json(),
        trendRes.ok ? trendRes.json() : { success: true, data: { trend: [] } },
        statusRes.ok ? statusRes.json() : { success: true, data: { distribution: [] } }
      ]);

      if (summaryData.success) {
        setStats(summaryData.data.summary);
        setVendors(summaryData.data.vendors || []);
        
        // Calculate total stores from vendors
        const totalStores = (summaryData.data.vendors || []).reduce((sum, v) => sum + (v.stores?.total || 0), 0);
        setStats(prev => ({ ...prev, totalStores }));
        
        // Set top 10 vendors by revenue
        const top10 = (summaryData.data.vendors || []).slice(0, 10).map(v => ({
          name: v.name,
          revenue: v.totalRevenue,
          orders: v.totalOrders
        }));
        setTopVendors(top10);
      }

      if (trendData.success && trendData.data.trend) {
        const formattedTrend = trendData.data.trend.map(item => ({
          name: item.label,
          vendors: item.count
        }));
        setRegistrationTrend(formattedTrend);
      }

      if (statusData.success && statusData.data.distribution) {
        const formattedStatus = statusData.data.distribution.map(item => ({
          name: item.status,
          value: item.count,
          percentage: item.percentage
        }));
        setStatusDistribution(formattedStatus);
      }

    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleVendorClick = (vendor) => {
    router.push(`/superadmin/reports/vendors/${vendor.vendorId}`);
  };

  const columns = [
    {
      label: 'Vendor',
      key: 'name',
      accessor: 'name',
      render: (value, row) => {
        if (!row) return null;
        return (
          <div className="flex items-center space-x-3">
            {row.profileImage ? (
              <img src={row.profileImage} alt={row.name || 'Vendor'} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">{row.name || 'Unknown'}</div>
              <div className="text-sm text-gray-500">{row.email || ''}</div>
            </div>
          </div>
        );
      }
    },
    {
      label: 'Status',
      key: 'status',
      accessor: 'status',
      render: (value, row) => {
        if (!row) return null;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'active' ? 'bg-green-100 text-green-800' :
            row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            row.status === 'suspended' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {row.status || 'inactive'}
          </span>
        );
      }
    },
    {
      label: 'Revenue',
      key: 'totalRevenue',
      accessor: 'totalRevenue',
      render: (value, row) => {
        if (!row) return formatCurrency(0);
        return formatCurrency(row.totalRevenue || 0);
      }
    },
    {
      label: 'Orders',
      key: 'totalOrders',
      accessor: 'totalOrders',
      render: (value, row) => {
        if (!row) return '0';
        return (row.totalOrders || 0).toLocaleString();
      }
    },
    {
      label: 'Products',
      key: 'products',
      accessor: 'products',
      render: (value, row) => {
        if (!row) return null;
        return (
          <div className="text-sm">
            <div className="font-medium">{row.products?.total || 0}</div>
            <div className="text-gray-500">
              {row.products?.active || 0} active, {row.products?.pending || 0} pending
            </div>
          </div>
        );
      }
    },
    {
      label: 'Stores',
      key: 'stores',
      accessor: 'stores',
      render: (value, row) => {
        if (!row) return '0';
        return (
          <div className="text-sm font-medium">
            {row.stores?.total || 0}
          </div>
        );
      }
    },
    {
      label: 'Avg Order Value',
      key: 'avgOrderValue',
      accessor: 'avgOrderValue',
      render: (value, row) => {
        if (!row) return formatCurrency(0);
        return formatCurrency(row.avgOrderValue || 0);
      }
    },
    {
      label: 'Actions',
      key: 'actions',
      accessor: 'actions',
      render: (value, row) => {
        if (!row) return null;
        return (
          <button
            onClick={() => handleVendorClick(row)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </button>
        );
      }
    }
  ];

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor reports...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Vendor Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Comprehensive vendor performance analysis</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              {period !== 'today' && (
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="day">By Day</option>
                  <option value="week">By Week</option>
                  <option value="month">By Month</option>
                </select>
              )}
              <ExportButton data={vendors} filename="vendor-report" />
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p>Error loading reports: {error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Vendors"
              value={stats.totalVendors.toLocaleString()}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Active Vendors"
              value={stats.activeVendors.toLocaleString()}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={DollarSign}
              color="purple"
            />
            <StatsCard
              title="Total Products"
              value={stats.totalProducts.toLocaleString()}
              icon={Package}
              color="indigo"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Pending Vendors"
              value={stats.pendingVendors.toLocaleString()}
              icon={Clock}
              color="yellow"
            />
            <StatsCard
              title="Suspended Vendors"
              value={stats.suspendedVendors.toLocaleString()}
              icon={Ban}
              color="red"
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              icon={ShoppingCart}
              color="blue"
            />
            <StatsCard
              title="Total Stores"
              value={stats.totalStores.toLocaleString()}
              icon={Store}
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Registration Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Vendor Registration Trend</h3>
              {registrationTrend.length > 0 ? (
                <LineChart 
                  data={registrationTrend} 
                  dataKeys={['vendors']} 
                  height={300}
                />
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No registration data available for selected period
                </div>
              )}
            </div>

            {/* Status Distribution Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Vendor Status Distribution</h3>
              {statusDistribution.length > 0 ? (
                <>
                  <PieChart data={statusDistribution} height={250} />
                  <div className="mt-4 space-y-2">
                    {statusDistribution.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                            }}
                          />
                          <span className="text-sm text-gray-700 capitalize">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-250 flex items-center justify-center text-gray-500">
                  No status data available
                </div>
              )}
            </div>
          </div>

          {/* Top Vendors Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Top Vendors by Revenue</h3>
            {topVendors.length > 0 ? (
              <BarChart 
                data={topVendors} 
                dataKeys={['revenue']} 
                height={300}
              />
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No vendor data available
              </div>
            )}
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">All Vendors</h3>
            <DataTable
              data={vendors}
              columns={columns}
              pagination={true}
              pageSize={10}
              searchable={true}
              searchPlaceholder="Search vendors..."
            />
          </div>

        </main>
      </div>
    </div>
  );
}

