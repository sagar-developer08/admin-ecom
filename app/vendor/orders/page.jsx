'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { orderService } from '../../../lib/services/orderService';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import StatsCard from '../../../components/MetricCard';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package,
  Search,
  Eye,
  Edit,
  Filter
} from 'lucide-react';

const VendorOrdersPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: 'all'
  });
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, isLoading, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching orders for vendor:', user?.vendorId || user?.id);
      
      const response = await orderService.getVendorOrders(user?.vendorId || user?.id);
      console.log('📊 Orders Response:', response);
      
      // Handle different response structures
      let ordersData = [];
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          ordersData = response.data;
        } else if (response.data.orders && Array.isArray(response.data.orders)) {
          ordersData = response.data.orders;
        }
      }
      
      console.log('📦 Processed Orders Data:', ordersData);
      setOrders(ordersData);
      
      // Calculate stats with null checks
      const total = ordersData.length;
      const pending = ordersData.filter(o => o && o.status === 'pending').length;
      const processing = ordersData.filter(o => o && o.status === 'processing').length;
      const shipped = ordersData.filter(o => o && o.status === 'shipped').length;
      const delivered = ordersData.filter(o => o && o.status === 'delivered').length;
      const cancelled = ordersData.filter(o => o && (o.status === 'cancelled' || o.status === 'refunded')).length;
      
      setStats({ total, pending, processing, shipped, delivered, cancelled });
      
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      setOrders([]);
      setStats({ total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      await orderService.updateOrderStatus(selectedOrder._id, newStatus);
      await fetchOrders(); // Refresh orders
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    
    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer?.email?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    { 
      key: 'orderNumber', 
      label: 'Order #',
      render: (order) => {
        if (!order) return <div className="text-gray-400">N/A</div>;
        return (
          <div className="font-medium text-gray-900">
            #{order.orderNumber || order._id?.slice(-8)}
          </div>
        );
      }
    },
    { 
      key: 'customer', 
      label: 'Customer',
      render: (order) => {
        if (!order) return <div className="text-gray-400">N/A</div>;
        return (
          <div>
            <div className="font-medium text-gray-900">{order.customer?.name || order.userId?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{order.customer?.email || order.userId?.email || 'N/A'}</div>
          </div>
        );
      }
    },
    { 
      key: 'total', 
      label: 'Total',
      render: (order) => {
        if (!order) return <span className="text-gray-400">N/A</span>;
        return (
          <span className="font-medium text-green-600">
            ${order.total?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (order) => {
        if (!order) return <span className="text-gray-400">N/A</span>;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
          </span>
        );
      }
    },
    { 
      key: 'createdAt', 
      label: 'Order Date',
      render: (order) => {
        if (!order) return <span className="text-gray-400">N/A</span>;
        return (
          <span className="text-gray-600">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        );
      }
    }
  ];

  const actions = (order) => (
    <div className="flex space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/vendor/orders/${order._id}`);
        }}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedOrder(order);
          setNewStatus(order.status);
          setShowStatusModal(true);
        }}
        className="p-2 text-green-600 hover:bg-green-50 rounded"
        title="Update Status"
      >
        <Edit className="w-4 h-4" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="vendor"
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 mt-1">Manage your customer orders and track their status</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
              <StatsCard
                title="Total Orders"
                value={stats.total}
                icon={ShoppingCart}
                color="blue"
              />
              <StatsCard
                title="Pending"
                value={stats.pending}
                icon={Clock}
                color="yellow"
              />
              <StatsCard
                title="Confirmed"
                value={stats.confirmed}
                icon={CheckCircle}
                color="blue"
              />
              <StatsCard
                title="Shipped"
                value={stats.shipped}
                icon={Package}
                color="purple"
              />
              <StatsCard
                title="Delivered"
                value={stats.delivered}
                icon={CheckCircle}
                color="green"
              />
              <StatsCard
                title="Cancelled"
                value={stats.cancelled}
                icon={XCircle}
                color="red"
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Orders
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by order #, customer name..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ status: 'all', search: '', dateRange: 'all' })}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
                <span className="text-sm text-gray-500">
                  {getFilteredOrders().length} orders found
                </span>
              </div>
              <DataTable
                data={getFilteredOrders()}
                columns={columns}
                actions={actions}
                searchable={false}
                pagination={true}
                emptyMessage="No orders found for your vendor account"
              />
            </div>

            {/* Update Status Modal */}
            {showStatusModal && selectedOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order: #{selectedOrder.orderNumber || selectedOrder._id?.slice(-8)}
                    </label>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                      </span>
                    </label>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleStatusUpdate}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Status
                    </button>
                    <button
                      onClick={() => {
                        setShowStatusModal(false);
                        setSelectedOrder(null);
                        setNewStatus('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorOrdersPage;