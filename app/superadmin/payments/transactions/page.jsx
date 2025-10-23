'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import orderService from '../../../../lib/services/orderService';

const TransactionsPage = () => {
  const { user, isLoading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    todayTransactions: 0,
    todayAmount: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    dateRange: 'all',
    search: ''
  });

  useEffect(() => {
    if (!isLoading && user) {
      fetchTransactions();
    }
  }, [isLoading, user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch orders with payment information
      const ordersResponse = await orderService.getAllOrders({
        includePaymentDetails: true,
        limit: 1000
      });
      
      if (ordersResponse.success) {
        const ordersData = ordersResponse.data || [];
        
        // Transform orders into transaction format
        const transactionsData = ordersData.map(order => ({
          id: order._id,
          transactionId: order.paymentDetails?.transactionId || order._id,
          orderNumber: order.orderNumber || order._id?.slice(-8),
          customerId: order.userId,
          customerName: order.customerName || 'Unknown Customer',
          customerEmail: order.customerEmail || 'No Email',
          amount: order.totalAmount || 0,
          paymentMethod: order.paymentDetails?.method || 'Unknown',
          status: order.paymentDetails?.status || order.status,
          gateway: order.paymentDetails?.gateway || 'Unknown',
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          orderStatus: order.status,
          items: order.items?.length || 0,
          vendorIds: order.items?.map(item => item.vendorId) || []
        }));

        setTransactions(transactionsData);
        calculateStats(transactionsData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactionsData) => {
    const total = transactionsData.length;
    const totalAmount = transactionsData.reduce((sum, t) => sum + t.amount, 0);
    const successful = transactionsData.filter(t => t.status === 'completed' || t.status === 'paid').length;
    const failed = transactionsData.filter(t => t.status === 'failed' || t.status === 'cancelled').length;
    const pending = transactionsData.filter(t => t.status === 'pending' || t.status === 'processing').length;
    
    // Today's transactions
    const today = new Date().toDateString();
    const todayTransactions = transactionsData.filter(t => 
      new Date(t.createdAt).toDateString() === today
    );
    const todayAmount = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalTransactions: total,
      totalAmount,
      successfulTransactions: successful,
      failedTransactions: failed,
      pendingTransactions: pending,
      todayTransactions: todayTransactions.length,
      todayAmount
    });
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(t => t.paymentMethod === filters.paymentMethod);
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
      
      filtered = filtered.filter(t => new Date(t.createdAt) >= filterDate);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.transactionId?.toLowerCase().includes(searchTerm) ||
        t.orderNumber?.toLowerCase().includes(searchTerm) ||
        t.customerName?.toLowerCase().includes(searchTerm) ||
        t.customerEmail?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Transaction ID', 'Order Number', 'Customer', 'Amount', 'Payment Method', 'Status', 'Date'].join(','),
      ...filteredTransactions.map(t => [
        t.transactionId,
        t.orderNumber,
        t.customerName,
        t.amount,
        t.paymentMethod,
        t.status,
        new Date(t.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600 mt-1">All payment transactions on the website</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchTransactions}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowUpDown className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportTransactions}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successfulTransactions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.todayAmount.toFixed(2)}</p>
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
                  <option value="completed">Completed</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="cash_on_delivery">Cash on Delivery</option>
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
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.transactionId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Order: {transaction.orderNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.customerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${transaction.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {transaction.paymentMethod.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.gateway}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(transaction.status)}
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(transaction.createdAt).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
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

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.status !== 'all' || filters.paymentMethod !== 'all' || filters.dateRange !== 'all' || filters.search
                    ? 'Try adjusting your filters to see more results.'
                    : 'No transactions have been recorded yet.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TransactionsPage;
