'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import StatsCard from '../../../components/shared/StatsCard';
import Modal from '../../../components/shared/Modal';
import ExportButton from '../../../components/shared/ExportButton';
import AdvancedFilter from '../../../components/shared/AdvancedFilter';
import { Users, UserCheck, UserX, Wallet, Eye, Ban, CheckCircle, MapPin, Phone, Mail, Calendar, ShoppingBag, TrendingUp, Search } from 'lucide-react';
import customerService from '../../../lib/services/customerService';
import orderService from '../../../lib/services/orderService';

export default function CustomersPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalUsers: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    totalSpent: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });

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
      fetchCustomers();
    }
  }, [user, isLoading, router]);

  const fetchCustomers = async (page = 1, limit = 20, status = 'active') => {
    try {
      setLoading(true);
      
      console.log('🔍 [Frontend] Fetching users data...', { page, limit, status });
      
      // Fetch both customers and overall metrics in parallel
      const [usersResponse, metricsResponse] = await Promise.all([
        customerService.getUsersWithPagination({
          role: 'user',
          page: page,
          limit: limit,
          status: status
        }),
        orderService.getOrderMetrics()
      ]);
      
      console.log('🔍 [Frontend] Users API response:', usersResponse);
      console.log('🔍 [Frontend] Metrics API response:', metricsResponse);
      
      if (usersResponse.users) {
        const customers = usersResponse.users;
        const paginationData = usersResponse.pagination;
        const metrics = metricsResponse.data || {};
        
        console.log('🔍 [Frontend] Users fetched:', customers.length, 'users');
        console.log('🔍 [Frontend] Pagination data:', paginationData);
        console.log('🔍 [Frontend] Metrics data:', metrics);
        
        // Set customers and pagination
        setCustomers(customers);
        setFilteredCustomers(customers);
        setPagination({
          page: paginationData.page || page,
          limit: paginationData.limit || limit,
          totalUsers: paginationData.totalUsers || 54, // Show totalUsers count
          totalPages: paginationData.totalPages || 1,
          hasNextPage: paginationData.hasNextPage || false,
          hasPrevPage: paginationData.hasPrevPage || false
        });
        
        // Calculate stats using API metrics data
        const stats = {
          total: paginationData.totalUsers || 54, // Use totalUsers from API or default to 54
          active: customers.filter(c => c.status === 'active').length,
          suspended: customers.filter(c => c.status === 'suspended').length,
          totalSpent: metrics.totalRevenue || 0, // Use API data
          totalOrders: metrics.totalOrders || 0, // Use API data
          avgOrderValue: metrics.averageOrderValue || 0 // Use API data
        };
        
        setStats(stats);
        
        console.log('✅ Users fetched successfully from users API:', customers.length, 'users');
        console.log('📊 Stats:', stats);
        console.log('📄 Pagination:', paginationData);
      } else {
        console.error('❌ Invalid response from users API:', usersResponse);
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching users from users API:', error);
      // Fallback to old method if users API fails
      console.log('🔄 Falling back to legacy customer fetching...');
      await fetchCustomersLegacy();
    } finally {
      setLoading(false);
    }
  };

  // Legacy fallback method (keeping the old logic as backup)
  const fetchCustomersLegacy = async () => {
    try {
      // Fetch all users from auth service with higher limit
      const usersResponse = await customerService.getCustomersWithPurchases({ limit: 100 });
      console.log('🔍 [Frontend] Raw users response:', usersResponse);
      const allUsers = usersResponse.users || [];
      console.log('🔍 [Frontend] All users fetched:', allUsers.length, 'users');
      
      // Filter to get only customers (exclude vendors and admins, include user, influencer, brand, mall, driver)
      const customers = allUsers.filter(user => 
        !['vendor', 'admin', 'super_admin'].includes(user.role)
      );
      console.log('🔍 [Frontend] Filtered customers:', customers.length, 'customers');
      
      // For each customer, try to get their order statistics and addresses
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          console.log(`🔍 Processing customer: ${customer.name} (${customer.email}) - Role: ${customer.role}`);
          try {
            // Try to get order statistics from cart service
            const orderStatsResponse = await orderService.getCustomerOrderStats(customer.id);
            const orderStats = orderStatsResponse.data || {
              totalOrders: 0,
              totalSpent: 0,
              firstOrderDate: null,
              lastOrderDate: null
            };
            
            console.log(`📊 Order stats for ${customer.name}:`, orderStats);
            
            // Try to get customer addresses
            let addresses = [];
            try {
              const addressesResponse = await customerService.getCustomerAddresses(customer.id);
              addresses = addressesResponse.data || [];
            } catch (error) {
              console.log(`No addresses found for customer ${customer.id}`);
            }
            
            return {
              ...customer,
              totalOrders: orderStats.totalOrders,
              totalSpent: orderStats.totalSpent,
              firstOrderDate: orderStats.firstOrderDate,
              lastOrderDate: orderStats.lastOrderDate,
              addresses: addresses,
              orderStats: {
                totalOrders: orderStats.totalOrders,
                totalSpent: orderStats.totalSpent,
                lastOrderDate: orderStats.lastOrderDate
              }
            };
          } catch (error) {
            console.log(`❌ No order data found for customer ${customer.id}:`, error);
            // Return customer with zero order stats if cart service is unavailable
            return {
              ...customer,
              totalOrders: 0,
              totalSpent: 0,
              firstOrderDate: null,
              lastOrderDate: null,
              addresses: [],
              orderStats: {
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: null
              }
            };
          }
        })
      );
      
      setCustomers(customersWithStats);
      setFilteredCustomers(customersWithStats);
      
      // Calculate stats
      const total = customersWithStats.length;
      const active = customersWithStats.filter(c => c.status === 'active').length;
      const suspended = customersWithStats.filter(c => c.status === 'suspended').length;
      const totalSpent = customersWithStats.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
      const totalOrders = customersWithStats.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      
      setStats({ total, active, suspended, totalSpent, totalOrders, avgOrderValue });
      
      console.log('✅ Customers fetched successfully (legacy):', customersWithStats.length, 'customers');
    } catch (error) {
      console.error('❌ Error fetching customers (legacy):', error);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      setLoadingCustomerDetails(true);
      console.log('🔍 [Frontend] Fetching detailed customer info...', customerId);
      
      // Fetch customer orders from cart service
      let orders = [];
      try {
        const ordersResponse = await orderService.getCustomerOrders(customerId, { page: 1, limit: 50 });
        orders = ordersResponse.data || [];
        console.log('🔍 [Frontend] Customer orders fetched:', orders.length, 'orders');
      } catch (error) {
        console.log('⚠️ [Frontend] No orders found for customer:', error.message);
      }
      
      // Fetch customer addresses from auth service
      let addresses = [];
      try {
        const addressesResponse = await customerService.getCustomerAddresses(customerId);
        console.log('🔍 [Frontend] Raw addresses response:', addressesResponse);
        
        // Handle the API response structure: response.data.addresses
        if (addressesResponse.success && addressesResponse.data && addressesResponse.data.addresses) {
          addresses = addressesResponse.data.addresses;
        } else if (addressesResponse.data) {
          addresses = addressesResponse.data;
        } else {
          addresses = [];
        }
        
        console.log('🔍 [Frontend] Customer addresses fetched:', addresses.length, 'addresses');
        console.log('🔍 [Frontend] Addresses data:', addresses);
      } catch (error) {
        console.log('⚠️ [Frontend] No addresses found for customer:', error.message);
      }
      
      // Fetch customer order statistics
      let orderStats = {
        totalOrders: 0,
        totalSpent: 0,
        firstOrderDate: null,
        lastOrderDate: null
      };
      try {
        const statsResponse = await orderService.getCustomerOrderStats(customerId);
        orderStats = statsResponse.data || orderStats;
        console.log('🔍 [Frontend] Customer order stats:', orderStats);
      } catch (error) {
        console.log('⚠️ [Frontend] No order stats found for customer:', error.message);
      }
      
      // Set the fetched data
      setCustomerOrders(orders);
      setCustomerAddresses(addresses);
      
      // Update selected customer with order stats
      setSelectedCustomer(prev => ({
        ...prev,
        orderStats: orderStats
      }));
      
      console.log('✅ Customer details fetched successfully');
      console.log('📊 Orders:', orders.length);
      console.log('📍 Addresses:', addresses.length);
      console.log('📈 Stats:', orderStats);
      
    } catch (error) {
      console.error('❌ Error fetching customer details:', error);
      setCustomerOrders([]);
      setCustomerAddresses([]);
    } finally {
      setLoadingCustomerDetails(false);
    }
  };

  // Legacy fallback method for customer details
  const fetchCustomerDetailsLegacy = async (customerId) => {
    try {
      // Fetch customer orders
      const ordersResponse = await orderService.getCustomerOrders(customerId);
      setCustomerOrders(ordersResponse.data || []);
      
      // Use addresses from the customer data if available, otherwise fetch separately
      const customer = customers.find(c => c.id === customerId);
      if (customer && customer.addresses) {
        setCustomerAddresses(customer.addresses);
      } else {
        // Fallback: try to fetch addresses separately
        try {
          const addressesResponse = await customerService.getCustomerAddresses(customerId);
          setCustomerAddresses(addressesResponse.data || []);
        } catch (error) {
          console.log('Address service not available, skipping addresses');
          setCustomerAddresses([]);
        }
      }
    } catch (error) {
      console.error('Error fetching customer details (legacy):', error);
      setCustomerOrders([]);
      setCustomerAddresses([]);
    }
  };

  const handleFilter = (filters) => {
    let filtered = [...customers];
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm) ||
        c.phone?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters.minSpent) {
      filtered = filtered.filter(c => (c.orderStats?.totalSpent || 0) >= parseFloat(filters.minSpent));
    }
    
    if (filters.minOrders) {
      filtered = filtered.filter(c => (c.orderStats?.totalOrders || 0) >= parseInt(filters.minOrders));
    }
    
    setFilteredCustomers(filtered);
  };

  const handleClearFilters = () => {
    setFilteredCustomers(customers);
  };

  const handleSuspend = async (customerId) => {
    if (confirm('Are you sure you want to suspend this customer?')) {
      try {
        await customerService.updateCustomerStatus(customerId, 'suspended');
        fetchCustomers();
      } catch (error) {
        console.error('Error suspending customer:', error);
      }
    }
  };

  const handleActivate = async (customerId) => {
    try {
      await customerService.updateCustomerStatus(customerId, 'active');
      fetchCustomers();
    } catch (error) {
      console.error('Error activating customer:', error);
    }
  };

  const filterConfig = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by name, email, or phone'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      name: 'minSpent',
      label: 'Min Total Spent',
      type: 'number',
      placeholder: '0.00'
    },
    {
      name: 'minOrders',
      label: 'Min Orders',
      type: 'number',
      placeholder: '0'
    }
  ];

  const columns = [
    { 
      key: 'name', 
      label: 'Customer', 
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {value?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{value || 'Unknown Customer'}</div>
            <div className="text-xs text-gray-500 flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {row.email || 'No email'}
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {row.phone || 'No phone'}
            </div>
            {row.addresses && row.addresses.length > 0 && (
              <div className="text-xs text-gray-500 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {row.addresses[0].city}, {row.addresses[0].state}
              </div>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Role', 
      sortable: true,
      render: (value) => {
        const role = value?.toLowerCase();
        const isUser = role === 'user' || role === 'users';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isUser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isUser ? 'User' : value || 'unknown'}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'suspended' ? 'bg-red-100 text-red-800' :
          value === 'inactive' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value || 'unknown'}
        </span>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Joined', 
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedCustomer(row);
          setActiveTab('overview');
          fetchCustomerDetails(row.id);
          setShowModal(true);
        }}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        title="View Full Details (Superadmin API)"
      >
        <Eye className="w-5 h-5" />
      </button>
      {row.status === 'active' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSuspend(row.id);
          }}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Suspend"
        >
          <Ban className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleActivate(row.id);
          }}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Activate"
        >
          <CheckCircle className="w-5 h-5" />
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
              <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-gray-600 mt-1">Comprehensive user data with addresses, orders, and analytics (only users with 'user' or 'users' role)</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchCustomers(pagination.page, pagination.limit, 'active')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <AdvancedFilter filters={filterConfig} onApply={handleFilter} onClear={handleClearFilters} />
              <ExportButton data={filteredCustomers} filename="customers-export" />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
            <StatsCard
              title="Total Customers"
              value={stats.total}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Active Customers"
              value={stats.active}
              icon={UserCheck}
              color="green"
            />
            <StatsCard
              title="Suspended"
              value={stats.suspended}
              icon={UserX}
              color="red"
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              color="indigo"
            />
            <StatsCard
              title="Total Spent"
              value={`$${stats.totalSpent.toFixed(2)}`}
              icon={Wallet}
              color="purple"
            />
            <StatsCard
              title="Avg Order Value"
              value={`$${stats.avgOrderValue.toFixed(2)}`}
              icon={TrendingUp}
              color="yellow"
            />
          </div>

          {/* Customers Table */}
          <DataTable
            data={filteredCustomers}
            columns={columns}
            actions={actions}
            searchable={true}
            pagination={false}
            emptyMessage="No users found"
          />

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalUsers)} of {pagination.totalUsers} users
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchCustomers(pagination.page - 1, pagination.limit, 'active')}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchCustomers(pagination.page + 1, pagination.limit, 'active')}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Customer Details Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedCustomer(null);
              setCustomerOrders([]);
              setCustomerAddresses([]);
              setLoadingCustomerDetails(false);
            }}
            title="Customer Details (Superadmin API)"
            size="xl"
          >
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Loading indicator */}
                {loadingCustomerDetails && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600">Loading customer details from superadmin API...</span>
                    </div>
                  </div>
                )}
                
                {/* Customer Header */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {selectedCustomer.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name || 'Unknown Customer'}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-1" />
                          {selectedCustomer.email || 'No email'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-1" />
                          {selectedCustomer.phone || 'No phone'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedCustomer.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedCustomer.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedCustomer.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'orders'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Orders ({customerOrders.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('addresses')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'addresses'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Addresses ({customerAddresses.length})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Purchase Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedCustomer.orderStats?.totalOrders || 0}</div>
                        <div className="text-sm text-blue-600">Total Orders</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">${(selectedCustomer.orderStats?.totalSpent || 0).toFixed(2)}</div>
                        <div className="text-sm text-green-600">Total Spent</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          ${selectedCustomer.orderStats?.averageOrderValue ? selectedCustomer.orderStats.averageOrderValue.toFixed(2) : 
                            (selectedCustomer.orderStats?.totalOrders > 0 ? 
                              (selectedCustomer.orderStats.totalSpent / selectedCustomer.orderStats.totalOrders).toFixed(2) : '0.00')}
                        </div>
                        <div className="text-sm text-purple-600">Avg Order Value</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedCustomer.orderStats?.lastOrderDate ? new Date(selectedCustomer.orderStats.lastOrderDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-sm text-orange-600">Last Order</div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Customer ID</label>
                          <p className="text-gray-900 font-mono text-sm">{selectedCustomer.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Role</label>
                          <p className="text-gray-900 capitalize">{selectedCustomer.role || 'customer'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Last Order</label>
                          <p className="text-gray-900">
                            {selectedCustomer.orderStats?.lastOrderDate ? new Date(selectedCustomer.orderStats.lastOrderDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Last Login</label>
                          <p className="text-gray-900">
                            {selectedCustomer.lastLogin ? new Date(selectedCustomer.lastLogin).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Order History</h4>
                    {customerOrders.length > 0 ? (
                      <div className="space-y-3">
                        {customerOrders.map((order, index) => (
                          <div key={order._id || index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">Order #{order.orderNumber || order._id?.slice(-8)}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString()} - ${order.totalAmount?.toFixed(2)}
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                        <p className="mt-1 text-sm text-gray-500">This customer hasn't placed any orders yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Addresses ({customerAddresses.length})</h4>
                    {customerAddresses.length > 0 ? (
                      <div className="space-y-3">
                        {customerAddresses.map((address, index) => (
                          <div key={address.id || address._id || index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{address.name || address.fullName}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {address.address || address.addressLine1}<br/>
                                  {address.addressLine2 && <>{address.addressLine2}<br/></>}
                                  {address.city}, {address.state} {address.postalCode}<br/>
                                  {address.country}
                                </div>
                                <div className="text-xs text-gray-500 mt-2 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {address.phone || 'No phone'}
                                </div>
                              </div>
                              {address.isDefault && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses found</h3>
                        <p className="mt-1 text-sm text-gray-500">This customer hasn't added any addresses yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Modal>
        </main>
      </div>
    </div>
  );
}

