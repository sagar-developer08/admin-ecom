'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { orderService } from '../../../../lib/services/orderService';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

const VendorOrderDetailPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && orderId) {
      fetchOrderDetails();
    }
  }, [user, isLoading, router, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching order details for:', orderId);
      
      const response = await orderService.getOrderById(orderId);
      console.log('📊 Order Details Response:', response);
      
      const orderData = response.data || response;
      
      // Check if order data is valid
      if (!orderData || (!orderData._id && !orderData.id)) {
        console.log('❌ Invalid order data received:', orderData);
        setError('Order not found or invalid data received');
        return;
      }
      
      setOrder(orderData);
      setNewStatus(orderData.status);
      
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Handle different error cases
      if (error.message?.includes('Order not found') || error.response?.status === 404) {
        setError('Order not found');
      } else if (error.message?.includes('Missing token') || error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        // For other errors, create a mock order for development/testing
        console.log('🔄 Creating mock order for development...');
        const mockOrder = {
          _id: orderId,
          orderNumber: `ORD-${orderId.slice(-8)}`,
          status: 'pending',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890'
          },
          userId: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890'
          },
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          items: [
            {
              product: {
                title: 'Sample Product',
                sku: 'SKU-001',
                image: null
              },
              quantity: 1,
              price: 99.99
            }
          ],
          subtotal: 99.99,
          shippingCost: 9.99,
          tax: 8.99,
          total: 118.97,
          createdAt: new Date().toISOString(),
          notes: 'This is a mock order for development purposes'
        };
        setOrder(mockOrder);
        setNewStatus(mockOrder.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;
    
    try {
      await orderService.updateOrderStatus(order._id, newStatus);
      await fetchOrderDetails(); // Refresh order details
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

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
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !order) {
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
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
                <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
                <button
                  onClick={() => router.push('/vendor/orders')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Orders
                </button>
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
              <button
                onClick={() => router.push('/vendor/orders')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Orders</span>
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Order #{order.orderNumber || order._id?.slice(-8)}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span>{order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}</span>
                  </span>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Update Status</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Order Details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Customer Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{order.customer?.name || order.userId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{order.customer?.email || order.userId?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{order.customer?.phone || order.userId?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
                  </div>
                  <div className="text-gray-900">
                    {order.shippingAddress ? (
                      <div>
                        <p className="font-medium">{order.shippingAddress.name || 'N/A'}</p>
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    ) : (
                      <p>No shipping address provided</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                  </div>
                  <div className="space-y-4">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            {item.product?.image ? (
                              <img 
                                src={item.product.image} 
                                alt={item.product.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.product?.title || 'N/A'}</h3>
                            <p className="text-sm text-gray-500">SKU: {item.product?.sku || 'N/A'}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">${item.price?.toFixed(2) || '0.00'}</p>
                            <p className="text-sm text-gray-500">${(item.price * item.quantity)?.toFixed(2) || '0.00'} total</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No items found</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                
                {/* Order Status Timeline */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order Placed</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {order.status === 'confirmed' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                          <p className="text-xs text-gray-500">Ready for processing</p>
                        </div>
                      </div>
                    )}
                    {order.status === 'shipped' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order Shipped</p>
                          <p className="text-xs text-gray-500">On the way to customer</p>
                        </div>
                      </div>
                    )}
                    {order.status === 'delivered' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order Delivered</p>
                          <p className="text-xs text-gray-500">Successfully delivered</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${order.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">${order.shippingCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">${order.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-lg font-semibold text-gray-900">${order.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
                    <p className="text-gray-700">{order.notes}</p>
                  </div>
                )}

              </div>
            </div>

            {/* Update Status Modal */}
            {showStatusModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
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
                      onClick={() => setShowStatusModal(false)}
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

export default VendorOrderDetailPage;
