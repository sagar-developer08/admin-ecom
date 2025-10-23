'use client';

import { useState, useEffect } from 'react';
import { productService } from '../../lib/services/productService';

export default function ProductApproval() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { approval_status: filter };
      const response = await productService.getAllProducts(params);
      
      if (response.success) {
        setProducts(response.data || []);
        setStats(response.stats || {});
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      const response = await productService.approveProduct(productId);
      if (response.success) {
        // Optimistically update UI to avoid stale cache showing pending
        setProducts(prev => prev.filter(p => p._id !== productId));
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, (prev.pending || 0) - 1),
          approved: (prev.approved || 0) + 1,
          total: Math.max(0, (prev.total || 0) - 1)
        }));
      }
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product');
    }
  };

  const handleRejectProduct = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const response = await productService.rejectProduct(
        selectedProduct._id,
        rejectionReason
      );
      
      if (response.success) {
        // Optimistically update UI to avoid stale cache showing pending
        const removedId = selectedProduct._id;
        setProducts(prev => prev.filter(p => p._id !== removedId));
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, (prev.pending || 0) - 1),
          rejected: (prev.rejected || 0) + 1,
          total: Math.max(0, (prev.total || 0) - 1)
        }));
        setShowRejectModal(false);
        setSelectedProduct(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Failed to reject product');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to approve');
      return;
    }

    try {
      const response = await productService.bulkApproveProducts(selectedProducts);
      if (response.success) {
        // Optimistically update UI
        const approvedCount = selectedProducts.length;
        setProducts(prev => prev.filter(p => !selectedProducts.includes(p._id)));
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, (prev.pending || 0) - approvedCount),
          approved: (prev.approved || 0) + approvedCount,
          total: Math.max(0, (prev.total || 0) - approvedCount)
        }));
        setSelectedProducts([]);
      }
    } catch (error) {
      console.error('Error bulk approving products:', error);
      alert('Failed to approve products');
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Approval</h1>
        <p className="text-gray-600 mt-1">Review and approve vendor products</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-sm text-yellow-600">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-600">Approved</div>
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-sm text-red-600">Rejected</div>
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Rejected
          </button>
        </div>

        {selectedProducts.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Approve Selected ({selectedProducts.length})
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
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
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => toggleSelectProduct(product._id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {product.images && product.images[0] && (
                      <img
                        src={product.images[0].url}
                        alt={product.title}
                        className="h-12 w-12 rounded object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.store_id?.name || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${product.price?.toFixed(2)}
                  </div>
                  {product.discount_price && (
                    <div className="text-xs text-green-600">
                      Sale: ${product.discount_price.toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.stock_quantity}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.approval_status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : product.approval_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.approval_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {product.approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveProduct(product._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowRejectModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Product</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide a reason for rejecting "{selectedProduct?.title}"
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="4"
                placeholder="Enter reason for rejection"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedProduct(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectProduct}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column - Images & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Product Images */}
              <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h4>
                    <div className="space-y-3">
                      {selectedProduct.images?.length > 0 ? (
                        selectedProduct.images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                      src={img.url}
                      alt={img.alt_text || selectedProduct.title}
                              className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            />
                            {img.is_primary && (
                              <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                Primary
                              </span>
                            )}
                </div>
                        ))
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">No images available</span>
              </div>
                      )}
                </div>
                  </div>

                  {/* Quick Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Quick Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approval Status:</span>
                  <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedProduct.approval_status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : selectedProduct.approval_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedProduct.approval_status}
                  </span>
                </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedProduct.status === 'active' ? 'bg-green-100 text-green-800' :
                          selectedProduct.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          selectedProduct.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedProduct.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-medium ${
                          selectedProduct.stock_quantity > 10 ? 'text-green-600' :
                          selectedProduct.stock_quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {selectedProduct.stock_quantity} units
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Basic Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Product Title</label>
                        <p className="text-gray-900 font-medium">{selectedProduct.title}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">SKU</label>
                        <p className="text-gray-900 font-mono text-sm">{selectedProduct.sku || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                        <p className="text-gray-900 text-sm leading-relaxed">{selectedProduct.description}</p>
                      </div>
                      {selectedProduct.short_description && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Short Description</label>
                          <p className="text-gray-700 text-sm">{selectedProduct.short_description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Inventory */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Regular Price</label>
                        <p className="text-gray-900 font-semibold text-lg">${selectedProduct.price?.toFixed(2)}</p>
                      </div>
                      {selectedProduct.discount_price && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Discount Price</label>
                          <p className="text-green-600 font-semibold text-lg">${selectedProduct.discount_price.toFixed(2)}</p>
                        </div>
                      )}
                      {selectedProduct.cost_price && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Cost Price</label>
                          <p className="text-gray-700 font-medium">${selectedProduct.cost_price.toFixed(2)}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Stock Quantity</label>
                        <p className="text-gray-900 font-medium">{selectedProduct.stock_quantity}</p>
                      </div>
                      {selectedProduct.min_stock_level && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Min Stock Level</label>
                          <p className="text-gray-700">{selectedProduct.min_stock_level}</p>
                        </div>
                      )}
                      {selectedProduct.barcode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Barcode</label>
                          <p className="text-gray-700 font-mono text-sm">{selectedProduct.barcode}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Store & Vendor Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Store & Vendor Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Store Name</label>
                        <p className="text-gray-900 font-medium">{selectedProduct.store_id?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Vendor ID</label>
                        <p className="text-gray-700 font-mono text-sm">{selectedProduct.vendor_id || 'N/A'}</p>
                      </div>
                      {selectedProduct.store_id?.email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Store Email</label>
                          <p className="text-gray-700 text-sm">{selectedProduct.store_id.email}</p>
                        </div>
                      )}
                      {selectedProduct.store_id?.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Store Phone</label>
                          <p className="text-gray-700 text-sm">{selectedProduct.store_id.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category & Brand Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Category & Brand</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Brand</label>
                        <p className="text-gray-900 font-medium">{selectedProduct.brand_id?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Category Level 1</label>
                        <p className="text-gray-700">{selectedProduct.level1?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Category Level 2</label>
                        <p className="text-gray-700">{selectedProduct.level2?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Category Level 3</label>
                        <p className="text-gray-700">{selectedProduct.level3?.name || 'N/A'}</p>
                      </div>
                  <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Category Level 4</label>
                        <p className="text-gray-700">{selectedProduct.level4?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Product Flags & Marketing */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Flags & Marketing</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={selectedProduct.is_featured} readOnly className="rounded" />
                        <label className="text-sm text-gray-700">Featured</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={selectedProduct.is_best_seller} readOnly className="rounded" />
                        <label className="text-sm text-gray-700">Best Seller</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={selectedProduct.is_new_seller} readOnly className="rounded" />
                        <label className="text-sm text-gray-700">New Seller</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={selectedProduct.is_offer} readOnly className="rounded" />
                        <label className="text-sm text-gray-700">On Offer</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={selectedProduct.is_digital} readOnly className="rounded" />
                        <label className="text-sm text-gray-700">Digital Product</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={selectedProduct.special_deals_for_qliq_plus} readOnly className="rounded" />
                        <label className="text-sm text-gray-700">Qliq Plus Deal</label>
                      </div>
                    </div>
                  </div>

                  {/* Physical Properties */}
                  {(selectedProduct.weight || selectedProduct.dimensions) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Physical Properties</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProduct.weight && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Weight</label>
                            <p className="text-gray-900">{selectedProduct.weight} kg</p>
                          </div>
                        )}
                        {selectedProduct.dimensions && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Dimensions</label>
                            <p className="text-gray-900">
                              {selectedProduct.dimensions.length || 0} × {selectedProduct.dimensions.width || 0} × {selectedProduct.dimensions.height || 0} cm
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warranty Information */}
                  {(selectedProduct.warranty_period || selectedProduct.warranty_type) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Warranty Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProduct.warranty_period && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Warranty Period</label>
                            <p className="text-gray-900">{selectedProduct.warranty_period} months</p>
                          </div>
                        )}
                        {selectedProduct.warranty_type && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Warranty Type</label>
                            <p className="text-gray-900">{selectedProduct.warranty_type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reviews & Ratings */}
                  {(selectedProduct.average_rating || selectedProduct.total_reviews) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Reviews & Ratings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProduct.average_rating && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Average Rating</label>
                            <div className="flex items-center space-x-2">
                              <span className="text-yellow-400 text-lg">★</span>
                              <p className="text-gray-900 font-medium">{selectedProduct.average_rating.toFixed(1)}/5.0</p>
                            </div>
                          </div>
                        )}
                        {selectedProduct.total_reviews && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Total Reviews</label>
                            <p className="text-gray-900 font-medium">{selectedProduct.total_reviews}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Specifications & Attributes */}
                  {(selectedProduct.specifications || selectedProduct.attributes) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Specifications & Attributes</h4>
                      <div className="space-y-4">
                        {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Specifications</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                                <div key={key} className="flex justify-between py-1">
                                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span className="text-gray-900 font-medium">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Attributes</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                                <div key={key} className="flex justify-between py-1">
                                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span className="text-gray-900 font-medium">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SEO Information */}
                  {(selectedProduct.meta_title || selectedProduct.meta_description || selectedProduct.tags) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">SEO Information</h4>
                      <div className="space-y-4">
                        {selectedProduct.meta_title && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Meta Title</label>
                            <p className="text-gray-900 text-sm">{selectedProduct.meta_title}</p>
                          </div>
                        )}
                        {selectedProduct.meta_description && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Meta Description</label>
                            <p className="text-gray-900 text-sm">{selectedProduct.meta_description}</p>
                          </div>
                        )}
                        {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tags</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedProduct.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Approval Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Approval Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Approval Date</label>
                        <p className="text-gray-900">
                          {selectedProduct.approval_date ? new Date(selectedProduct.approval_date).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Approved By</label>
                        <p className="text-gray-900">
                          {selectedProduct.approved_by ? (
                            typeof selectedProduct.approved_by === 'object' ? 
                              `${selectedProduct.approved_by.name || 'Unknown'} (${selectedProduct.approved_by.email || 'No email'})` :
                              selectedProduct.approved_by
                          ) : 'N/A'}
                        </p>
                      </div>
                      {selectedProduct.rejection_reason && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Rejection Reason</label>
                          <p className="text-red-600 bg-red-50 p-3 rounded-lg">{selectedProduct.rejection_reason}</p>
                  </div>
                )}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Created At</label>
                        <p className="text-gray-900">{selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Updated At</label>
                        <p className="text-gray-900">{selectedProduct.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* Actions */}
            {selectedProduct.approval_status === 'pending' && (
                <div className="mt-8 flex gap-3 justify-end border-t border-gray-200 pt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowRejectModal(true);
                  }}
                    className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Reject Product
                </button>
                <button
                  onClick={() => {
                    handleApproveProduct(selectedProduct._id);
                    setShowDetailsModal(false);
                  }}
                    className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                    Approve Product
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

