'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import StatsCard from '../../../../../components/shared/StatsCard';
import { ArrowLeft, Store, Package, ShoppingCart, DollarSign, Calendar, Phone, Mail, User, MapPin, Image as ImageIcon } from 'lucide-react';

export default function VendorDetailsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.vendorId;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stores');
  const [period, setPeriod] = useState('all');
  const [vendorData, setVendorData] = useState(null);
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
    if (user && vendorId) {
      fetchVendorDetails();
    }
  }, [user, isLoading, router, vendorId, period]);

  const fetchVendorDetails = async () => {
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
      const response = await fetch(`${cartServiceUrl}/reports/vendors/${vendorId}/details?period=${period}`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setVendorData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch vendor details');
      }
    } catch (err) {
      console.error('Error fetching vendor details:', err);
      setError(err?.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'active' || statusLower === 'delivered' || statusLower === 'paid') {
      return 'bg-green-100 text-green-800';
    }
    if (statusLower === 'pending' || statusLower === 'processing') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (statusLower === 'suspended' || statusLower === 'cancelled') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error || !vendorData) {
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
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-red-600">{error || 'Vendor not found'}</p>
              <button
                onClick={() => router.push('/superadmin/reports/vendors')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Back to Vendor Reports
              </button>
            </div>
          </div>
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
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/superadmin/reports/vendors')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Vendor Reports
            </button>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {vendorData.vendor?.profileImage ? (
                      <img 
                        src={vendorData.vendor.profileImage} 
                        alt={vendorData.vendor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{vendorData.vendor?.name}</h1>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{vendorData.vendor?.email}</span>
                      </div>
                      {vendorData.vendor?.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{vendorData.vendor?.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vendorData.vendor?.status)}`}>
                        {vendorData.vendor?.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(vendorData.summary?.totalRevenue || 0)}
              icon={DollarSign}
              trend={null}
            />
            <StatsCard
              title="Total Orders"
              value={(vendorData.summary?.totalOrders || 0).toLocaleString()}
              icon={ShoppingCart}
              trend={null}
            />
            <StatsCard
              title="Products Sold"
              value={(vendorData.summary?.totalProductsSold || 0).toLocaleString()}
              icon={Package}
              trend={null}
            />
            <StatsCard
              title="Total Products"
              value={(vendorData.summary?.totalProducts || 0).toLocaleString()}
              icon={Package}
              trend={null}
            />
            <StatsCard
              title="Total Stores"
              value={(vendorData.summary?.totalStores || 0).toLocaleString()}
              icon={Store}
              trend={null}
            />
            <StatsCard
              title="Avg Order Value"
              value={formatCurrency(vendorData.summary?.avgOrderValue || 0)}
              icon={DollarSign}
              trend={null}
            />
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('stores')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'stores'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Store className="w-4 h-4 inline-block mr-2" />
                  Stores ({vendorData.stores?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'products'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="w-4 h-4 inline-block mr-2" />
                  Products ({vendorData.products?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'orders'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline-block mr-2" />
                  Orders ({vendorData.orders?.length || 0})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Stores Tab */}
              {activeTab === 'stores' && (
                <div>
                  {vendorData.stores && vendorData.stores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vendorData.stores.map((store) => (
                        <div key={store.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3">
                              {store.logo ? (
                                <img src={store.logo} alt={store.name} className="w-12 h-12 rounded object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                                  <Store className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-gray-900">{store.name}</h3>
                                <p className="text-sm text-gray-500">{store.slug}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {store.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {store.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{store.description}</p>
                          )}
                          
                          <div className="space-y-2 text-sm">
                            {store.email && (
                              <div className="flex items-center text-gray-600">
                                <Mail className="w-4 h-4 mr-2" />
                                <span>{store.email}</span>
                              </div>
                            )}
                            {store.phone && (
                              <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                <span>{store.phone}</span>
                              </div>
                            )}
                            {store.address && (
                              <div className="flex items-start text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                                <span>
                                  {store.address.street}, {store.address.city}, {store.address.state}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>Created: {formatDate(store.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No stores found for this vendor</p>
                    </div>
                  )}
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div>
                  {vendorData.products && vendorData.products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {vendorData.products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {product.images && product.images.length > 0 ? (
                                    <img src={product.images[0]} alt={product.title} className="w-10 h-10 rounded object-cover mr-3" />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center mr-3">
                                      <ImageIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{product.title}</div>
                                    {product.discountPrice && (
                                      <div className="text-xs text-gray-500">Discount: {formatCurrency(product.discountPrice)}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(product.price || 0)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stockQuantity || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(product.status)}`}>
                                  {product.status || 'Unknown'}
                                </span>
                                {product.approvalStatus && product.approvalStatus !== 'approved' && (
                                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(product.approvalStatus)}`}>
                                    {product.approvalStatus}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(product.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No products found for this vendor</p>
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  {vendorData.orders && vendorData.orders.length > 0 ? (
                    <div className="space-y-4">
                      {vendorData.orders.map((order) => (
                        <div key={order.orderId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">Order #{order.orderNumber}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                              <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
                            </div>
                          </div>
                          
                          {order.shippingAddress && (
                            <div className="mb-3 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 inline-block mr-1" />
                              {order.shippingAddress.city}, {order.shippingAddress.state}
                            </div>
                          )}
                          
                          <div className="border-t border-gray-200 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-3 bg-gray-50 rounded p-2">
                                  {item.image ? (
                                    <img src={item.image} alt={item.productName} className="w-12 h-12 rounded object-cover" />
                                  ) : (
                                    <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{item.productName}</div>
                                    <div className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">{formatCurrency(item.total)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No orders found for this vendor</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

