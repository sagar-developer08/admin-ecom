'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { orderService } from '../../../../lib/services/orderService';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import DataTable from '../../../../components/shared/DataTable';
import StatsCard from '../../../../components/MetricCard';
import { 
  Clock, 
  CheckCircle, 
  Package,
  Search,
  Eye,
  Edit
} from 'lucide-react';

const PendingOrdersPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    today: 0
  });
  
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all'
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchPendingOrders();
    }
  }, [user, isLoading, router]);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching pending orders for vendor:', user?.vendorId || user?.id);
      
      const response = await orderService.getVendorPendingOrders(user?.vendorId || user?.id);
      console.log('📊 Pending Orders Response:', response);
      
      const ordersData = response.data?.orders || response.data || response || [];
      const filteredPending = ordersData.filter(order => order.status === 'pending');
      setPendingOrders(filteredPending);
      
      // Calculate stats
      const total = filteredPending.length;
      const urgent = filteredPending.filter(o => {
        const orderDate = new Date(o.createdAt);
        const daysDiff = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
        return daysDiff >= 2; // Orders older than 2 days are urgent
      }).length;
      const today = filteredPending.filter(o => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      }).length;
      
      setStats({ total, urgent, today });
      
    } catch (error) {
      console.error('❌ Error fetching pending orders:', error);
      setPendingOrders([]);
      setStats({ total: 0, urgent: 0, today: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      await fetchPendingOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getFilteredOrders = () => {
    let filtered = pendingOrders;
    
    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    // Filter by priority
    if (filters.priority === 'urgent') {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const daysDiff = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
        return daysDiff >= 2;
      });
    } else if (filters.priority === 'today') {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      });
    }
    
    return filtered;
  };

  const getOrderPriority = (order) => {
    const orderDate = new Date(order.createdAt);
    const daysDiff = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff >= 3) {
      return { label: 'Critical', color: 'text-red-600 bg-red-100' };
    } else if (daysDiff >= 2) {
      return { label: 'Urgent', color: 'text-orange-600 bg-orange-100' };
    } else if (daysDiff >= 1) {
      return { label: 'High', color: 'text-yellow-600 bg-yellow-100' };
    } else {
      return { label: 'Normal', color: 'text-green-600 bg-green-100' };
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
      key: 'priority', 
      label: 'Priority',
      render: (order) => {
        if (!order) return <span className="text-gray-400">N/A</span>;
        const priority = getOrderPriority(order);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
            {priority.label}
          </span>
        );
      }
    },
    { 
      key: 'createdAt', 
      label: 'Order Date',
      render: (order) => {
        if (!order) return <span className="text-gray-400">N/A</span>;
        const orderDate = new Date(order.createdAt);
        const daysDiff = Math.floor((new Date() - orderDate) / (1000 * 60 * 60 * 24));
        return (
          <div>
            <div className="text-gray-600">{orderDate.toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">{daysDiff} days ago</div>
          </div>
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
          handleStatusUpdate(order._id, 'confirmed');
        }}
        className="p-2 text-green-600 hover:bg-green-50 rounded"
        title="Confirm Order"
      >
        <CheckCircle className="w-4 h-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {[1, 2, 3].map(i => (
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
              <h1 className="text-2xl font-bold text-gray-900">Pending Orders</h1>
              <p className="text-gray-600 mt-1">Orders waiting for your confirmation and processing</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatsCard
                title="Total Pending"
                value={stats.total}
                icon={Clock}
                color="yellow"
              />
              <StatsCard
                title="Urgent (2+ days)"
                value={stats.urgent}
                icon={Clock}
                color="red"
              />
              <StatsCard
                title="Today's Orders"
                value={stats.today}
                icon={CheckCircle}
                color="blue"
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
                    Filter by Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="urgent">Urgent (2+ days)</option>
                    <option value="today">Today's Orders</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ search: '', priority: 'all' })}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Pending Orders Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pending Orders</h2>
                <span className="text-sm text-gray-500">
                  {getFilteredOrders().length} orders need attention
                </span>
              </div>
              <DataTable
                data={getFilteredOrders()}
                columns={columns}
                actions={actions}
                searchable={false}
                pagination={true}
                emptyMessage="No pending orders found. All orders are up to date!"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PendingOrdersPage;
