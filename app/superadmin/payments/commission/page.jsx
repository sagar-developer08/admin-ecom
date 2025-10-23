'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package, 
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  ArrowUpDown,
  Percent,
  CreditCard,
  Clock,
  CheckCircle
} from 'lucide-react';
import orderService from '../../../../lib/services/orderService';
import vendorService from '../../../../lib/services/vendorService';

const CommissionPage = () => {
  const { user, isLoading } = useAuth();
  const [commissionData, setCommissionData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCommission: 0,
    totalOrders: 0,
    totalVendors: 0,
    pendingPayouts: 0,
    thisMonthCommission: 0,
    averageCommissionRate: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    vendor: 'all',
    dateRange: 'all',
    search: ''
  });
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    if (!isLoading && user) {
      fetchVendors();
      fetchCommissionData();
    }
  }, [isLoading, user]);

  useEffect(() => {
    applyFilters();
  }, [commissionData, filters]);

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAllVendors();
      if (response.success) {
        setVendors(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders with vendor information
      const ordersResponse = await orderService.getAllOrders({
        includeVendorDetails: true,
        limit: 1000
      });
      
      if (ordersResponse.success) {
        const ordersData = ordersResponse.data || [];
        
        // Calculate commission for each vendor
        const commissionMap = new Map();
        
        ordersData.forEach(order => {
          if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
              const vendorId = item.vendorId;
              if (!vendorId) return;
              
              // Get vendor info
              const vendor = vendors.find(v => v._id === vendorId || v.id === vendorId);
              const vendorName = vendor?.name || vendor?.businessName || 'Unknown Vendor';
              
              // Calculate commission (assuming 10% commission rate, can be made configurable)
              const itemTotal = item.price * item.quantity;
              const commissionRate = vendor?.commissionRate || 0.10; // 10% default
              const commission = itemTotal * commissionRate;
              
              if (!commissionMap.has(vendorId)) {
                commissionMap.set(vendorId, {
                  vendorId,
                  vendorName,
                  vendorEmail: vendor?.email || 'No Email',
                  totalOrders: 0,
                  totalSales: 0,
                  totalCommission: 0,
                  commissionRate: commissionRate,
                  pendingCommission: 0,
                  paidCommission: 0,
                  lastPayout: null,
                  orders: []
                });
              }
              
              const vendorData = commissionMap.get(vendorId);
              vendorData.totalOrders += 1;
              vendorData.totalSales += itemTotal;
              vendorData.totalCommission += commission;
              vendorData.orders.push({
                orderId: order._id,
                orderNumber: order.orderNumber,
                itemName: item.name,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal,
                commission: commission,
                orderDate: order.createdAt,
                orderStatus: order.status
              });
              
              // Determine if commission is pending or paid based on order status
              if (order.status === 'delivered' || order.status === 'completed') {
                vendorData.paidCommission += commission;
              } else {
                vendorData.pendingCommission += commission;
              }
            });
          }
        });
        
        const commissionArray = Array.from(commissionMap.values()).map(vendor => ({
          ...vendor,
          status: vendor.pendingCommission > 0 ? 'pending' : 'paid',
          lastOrderDate: vendor.orders.length > 0 ? 
            Math.max(...vendor.orders.map(o => new Date(o.orderDate).getTime())) : null
        }));
        
        setCommissionData(commissionArray);
        calculateStats(commissionArray);
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalCommission = data.reduce((sum, v) => sum + v.totalCommission, 0);
    const totalOrders = data.reduce((sum, v) => sum + v.totalOrders, 0);
    const totalVendors = data.length;
    const pendingPayouts = data.reduce((sum, v) => sum + v.pendingCommission, 0);
    
    // This month's commission
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthCommission = data.reduce((sum, v) => {
      const thisMonthOrders = v.orders.filter(o => new Date(o.orderDate) >= thisMonth);
      return sum + thisMonthOrders.reduce((orderSum, o) => orderSum + o.commission, 0);
    }, 0);
    
    const averageCommissionRate = totalVendors > 0 ? 
      data.reduce((sum, v) => sum + v.commissionRate, 0) / totalVendors : 0;

    setStats({
      totalCommission,
      totalOrders,
      totalVendors,
      pendingPayouts,
      thisMonthCommission,
      averageCommissionRate
    });
  };

  const applyFilters = () => {
    let filtered = [...commissionData];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(v => v.status === filters.status);
    }

    // Vendor filter
    if (filters.vendor !== 'all') {
      filtered = filtered.filter(v => v.vendorId === filters.vendor);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(v => 
        v.lastOrderDate && new Date(v.lastOrderDate) >= filterDate
      );
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(v => 
        v.vendorName?.toLowerCase().includes(searchTerm) ||
        v.vendorEmail?.toLowerCase().includes(searchTerm) ||
        v.vendorId?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportCommissionData = () => {
    const csvContent = [
      ['Vendor Name', 'Vendor Email', 'Total Orders', 'Total Sales', 'Commission Rate', 'Total Commission', 'Pending Commission', 'Paid Commission', 'Status'].join(','),
      ...filteredData.map(v => [
        v.vendorName,
        v.vendorEmail,
        v.totalOrders,
        v.totalSales.toFixed(2),
        (v.commissionRate * 100).toFixed(1) + '%',
        v.totalCommission.toFixed(2),
        v.pendingCommission.toFixed(2),
        v.paidCommission.toFixed(2),
        v.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading commission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar userType="superadmin" user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Commission Reports</h1>
              <p className="text-gray-600 mt-1">Vendor commission calculations and payouts</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchCommissionData}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowUpDown className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportCommissionData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalCommission.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.pendingPayouts.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVendors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.thisMonthCommission.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Percent className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Commission Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats.averageCommissionRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                <select
                  value={filters.vendor}
                  onChange={(e) => handleFilterChange('vendor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map(vendor => (
                    <option key={vendor._id || vendor.id} value={vendor._id || vendor.id}>
                      {vendor.name || vendor.businessName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Commission Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((vendor) => (
                    <tr key={vendor.vendorId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.vendorName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendor.vendorEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vendor.totalOrders}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${vendor.totalSales.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(vendor.commissionRate * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${vendor.totalCommission.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-yellow-600">
                          ${vendor.pendingCommission.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vendor.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No commission data found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.status !== 'all' || filters.vendor !== 'all' || filters.dateRange !== 'all' || filters.search
                    ? 'Try adjusting your filters to see more results.'
                    : 'No commission data has been calculated yet.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CommissionPage;
