'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { orderService } from '../../../../../lib/services/orderService';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import { 
  ArrowLeft, 
  Package, 
  User, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Edit,
  Phone,
  Mail,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const VendorReturnDetailPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const returnId = params.id;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [returnItem, setReturnItem] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && returnId) {
      fetchReturnDetails();
    }
  }, [user, isLoading, router, returnId]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching return details for:', returnId);
      
      // For now, we'll create a mock return item since we don't have a specific API endpoint
      // In a real implementation, you would call: const response = await orderService.getReturnById(returnId);
      const mockReturn = {
        _id: returnId,
        orderNumber: 'ORD-12345',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        product: {
          title: 'Sample Product',
          sku: 'SKU-001',
          image: null
        },
        reason: 'defective',
        status: 'pending',
        quantity: 1,
        returnAmount: 99.99,
        createdAt: new Date().toISOString(),
        description: 'Product arrived damaged and not working properly',
        images: []
      };
      
      setReturnItem(mockReturn);
      
    } catch (error) {
      console.error('❌ Error fetching return details:', error);
      setError('Failed to load return details');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAction = async (action) => {
    if (!returnItem) return;
    
    try {
      if (action === 'approve') {
        await orderService.updateReturnStatus(returnItem._id, 'approved');
      } else if (action === 'reject') {
        await orderService.updateReturnStatus(returnItem._id, 'rejected', rejectionReason);
      }
      
      await fetchReturnDetails(); // Refresh return details
      setShowActionModal(false);
      setActionType('');
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating return status:', error);
    }
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

  if (error || !returnItem) {
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
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Return Not Found</h1>
                <p className="text-gray-600 mb-6">The return you're looking for doesn't exist or you don't have permission to view it.</p>
                <button
                  onClick={() => router.push('/vendor/orders/returns')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Returns
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
                onClick={() => router.push('/vendor/orders/returns')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Returns</span>
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Return Request #{returnItem._id?.slice(-8)}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Requested on {new Date(returnItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(returnItem.status)}`}>
                    <RotateCcw className="w-4 h-4" />
                    <span>{returnItem.status?.charAt(0).toUpperCase() + returnItem.status?.slice(1)}</span>
                  </span>
                  {returnItem.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setActionType('approve');
                          setShowActionModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          setActionType('reject');
                          setShowActionModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Return Details */}
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
                      <p className="text-gray-900">{returnItem.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{returnItem.customer?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{returnItem.customer?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      {returnItem.product?.image ? (
                        <img 
                          src={returnItem.product.image} 
                          alt={returnItem.product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{returnItem.product?.title || 'N/A'}</h3>
                      <p className="text-sm text-gray-500">SKU: {returnItem.product?.sku || 'N/A'}</p>
                      <p className="text-sm text-gray-500">Quantity: {returnItem.quantity}</p>
                      <p className="text-sm text-gray-500">Return Amount: ${returnItem.returnAmount?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>

                {/* Return Details */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <RotateCcw className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Return Details</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(returnItem.reason)}`}>
                        {returnItem.reason?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-gray-900">{returnItem.description || 'No description provided'}</p>
                    </div>
                    {returnItem.images && returnItem.images.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Return Images</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {returnItem.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Return image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Return Summary */}
              <div className="space-y-6">
                
                {/* Return Status */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Status</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Return Requested</p>
                        <p className="text-xs text-gray-500">{new Date(returnItem.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {returnItem.status === 'approved' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Return Approved</p>
                          <p className="text-xs text-gray-500">Ready for processing</p>
                        </div>
                      </div>
                    )}
                    {returnItem.status === 'rejected' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Return Rejected</p>
                          <p className="text-xs text-gray-500">Request denied</p>
                        </div>
                      </div>
                    )}
                    {returnItem.status === 'processed' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Return Processed</p>
                          <p className="text-xs text-gray-500">Refund completed</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Information</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium">#{returnItem.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Return Amount:</span>
                      <span className="font-medium">${returnItem.returnAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{returnItem.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request Date:</span>
                      <span className="font-medium">{new Date(returnItem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Required */}
                {returnItem.status === 'pending' && (
                  <div className="bgroyellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <h3 className="text-sm font-medium text-yellow-800">Action Required</h3>
                    </div>
                    <p className="text-sm text-yellow-700">
                      This return request is waiting for your approval or rejection. Please review the details and take appropriate action.
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Action Modal */}
            {showActionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">
                    {actionType === 'approve' ? 'Approve Return' : 'Reject Return'}
                  </h3>
                  
                  {actionType === 'reject' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Enter reason for rejection..."
                      />
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleReturnAction(actionType)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        actionType === 'approve' 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {actionType === 'approve' ? 'Approve Return' : 'Reject Return'}
                    </button>
                    <button
                      onClick={() => {
                        setShowActionModal(false);
                        setActionType('');
                        setRejectionReason('');
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

export default VendorReturnDetailPage;
