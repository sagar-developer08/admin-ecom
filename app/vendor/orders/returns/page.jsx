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
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle,
  Package,
  Search,
  Eye,
  Edit
} from 'lucide-react';

const ReturnsPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    processed: 0
  });
  
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    reason: 'all'
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchReturns();
    }
  }, [user, isLoading, router]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching returns for vendor:', user?.vendorId || user?.id);
      
      const response = await orderService.getVendorReturns(user?.vendorId || user?.id);
      console.log('📊 Returns Response:', response);
      
      const returnsData = response.data?.returns || response.data || response || [];
      setReturns(returnsData);
      
      // Calculate stats
      const total = returnsData.length;
      const pending = returnsData.filter(r => r.status === 'pending').length;
      const approved = returnsData.filter(r => r.status === 'approved').length;
      const rejected = returnsData.filter(r => r.status === 'rejected').length;
      const processed = returnsData.filter(r => r.status === 'processed').length;
      
      setStats({ total, pending, approved, rejected, processed });
      
    } catch (error) {
      console.error('❌ Error fetching returns:', error);
      setReturns([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0, processed: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAction = async (returnId, action, reason = '') => {
    try {
      if (action === 'approve') {
        await orderService.updateReturnStatus(returnId, 'approved');
      } else if (action === 'reject') {
        await orderService.updateReturnStatus(returnId, 'rejected', reason);
      } else if (action === 'process') {
        await orderService.updateReturnStatus(returnId, 'processed');
      }
      await fetchReturns(); // Refresh returns
    } catch (error) {
      console.error('Error updating return status:', error);
    }
  };

  const getFilteredReturns = () => {
    let filtered = returns;
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(returnItem => returnItem.status === filters.status);
    }
    
    // Filter by reason
    if (filters.reason !== 'all') {
      filtered = filtered.filter(returnItem => returnItem.reason === filters.reason);
    }
    
    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(returnItem => 
        returnItem.orderNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        returnItem.customer?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        returnItem.product?.title?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'processed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'defective': return 'text-red-600 bg-red-100';
      case 'wrong_item': return 'text-orange-600 bg-orange-100';
      case 'not_as_described': return 'text-yellow-600 bg-yellow-100';
      case 'changed_mind': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    { 
      key: 'orderNumber', 
      label: 'Order #',
      render: (returnItem) => {
        if (!returnItem) return <div className="text-gray-400">N/A</div>;
        return (
          <div className="font-medium text-gray-900">
            #{returnItem.orderNumber || returnItem.orderId?.slice(-8)}
          </div>
        );
      }
    },
    { 
      key: 'customer', 
      label: 'Customer',
      render: (returnItem) => {
        if (!returnItem) return <div className="text-gray-400">N/A</div>;
        return (
          <div>
            <div className="font-medium text-gray-900">{returnItem.customer?.name || returnItem.userId?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{returnItem.customer?.email || returnItem.userId?.email || 'N/A'}</div>
          </div>
        );
      }
    },
    { 
      key: 'product', 
      label: 'Product',
      render: (returnItem) => {
        if (!returnItem) return <div className="text-gray-400">N/A</div>;
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              {returnItem.product?.image ? (
                <img 
                  src={returnItem.product.image} 
                  alt={returnItem.product.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">{returnItem.product?.title || 'N/A'}</div>
              <div className="text-sm text-gray-500">Qty: {returnItem.quantity || 1}</div>
            </div>
          </div>
        );
      }
    },
    { 
      key: 'reason', 
      label: 'Reason',
      render: (returnItem) => {
        if (!returnItem) return <span className="text-gray-400">N/A</span>;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(returnItem.reason)}`}>
            {returnItem.reason?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (returnItem) => {
        if (!returnItem) return <span className="text-gray-400">N/A</span>;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.status)}`}>
            {returnItem.status?.charAt(0).toUpperCase() + returnItem.status?.slice(1) || 'Unknown'}
          </span>
        );
      }
    },
    { 
      key: 'createdAt', 
      label: 'Return Date',
      render: (returnItem) => {
        if (!returnItem) return <span className="text-gray-400">N/A</span>;
        return (
          <span className="text-gray-600">
            {new Date(returnItem.createdAt).toLocaleDateString()}
          </span>
        );
      }
    }
  ];

  const actions = (returnItem) => (
    <div className="flex space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/vendor/orders/returns/${returnItem._id}`);
        }}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      {returnItem.status === 'pending' && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReturnAction(returnItem._id, 'approve');
            }}
            className="p-2 text-green-600 hover:bg-green-50 rounded"
            title="Approve Return"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const reason = prompt('Enter rejection reason:');
              if (reason) handleReturnAction(returnItem._id, 'reject', reason);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Reject Return"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </>
      )}
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                  {[1, 2, 3, 4, 5].map(i => (
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
              <h1 className="text-2xl font-bold text-gray-900">Returns & Refunds</h1>
              <p className="text-gray-600 mt-1">Manage customer returns and refund requests</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <StatsCard
                title="Total Returns"
                value={stats.total}
                icon={RotateCcw}
                color="blue"
              />
              <StatsCard
                title="Pending"
                value={stats.pending}
                icon={Clock}
                color="yellow"
              />
              <StatsCard
                title="Approved"
                value={stats.approved}
                icon={CheckCircle}
                color="green"
              />
              <StatsCard
                title="Rejected"
                value={stats.rejected}
                icon={XCircle}
                color="red"
              />
              <StatsCard
                title="Processed"
                value={stats.processed}
                icon={CheckCircle}
                color="blue"
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Returns
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by order #, customer, product..."
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
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="processed">Processed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Reason
                  </label>
                  <select
                    value={filters.reason}
                    onChange={(e) => setFilters(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Reasons</option>
                    <option value="defective">Defective</option>
                    <option value="wrong_item">Wrong Item</option>
                    <option value="not_as_described">Not as Described</option>
                    <option value="changed_mind">Changed Mind</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ status: 'all', search: '', reason: 'all' })}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Returns Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Returns & Refunds</h2>
                <span className="text-sm text-gray-500">
                  {getFilteredReturns().length} returns found
                </span>
              </div>
              <DataTable
                data={getFilteredReturns()}
                columns={columns}
                actions={actions}
                searchable={false}
                pagination={true}
                emptyMessage="No returns found for your vendor account"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReturnsPage;
