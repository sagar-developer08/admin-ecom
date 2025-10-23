'use client';

import { useState, useEffect } from 'react';
import { productService } from '../../lib/services/productService';
import { vendorService } from '../../lib/services/vendorService';
import {
  Users,
  Package,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Star,
  MessageSquare,
  Store,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function EnhancedProductManagement() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Pagination states
  const [vendorProductsPagination, setVendorProductsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [allProductsPagination, setAllProductsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Stats
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'all-products') {
      fetchAllProducts(1);
    }
  }, [activeTab, statusFilter, searchTerm]);

  // Debug: Monitor stats changes
  useEffect(() => {
    console.log('Stats state changed:', stats);
  }, [stats]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log('Starting fetchInitialData...');
      await fetchVendors();
      console.log('Vendors fetched, now fetching stats...');
      await fetchStats();
      console.log('Stats fetched, fetchInitialData complete');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      console.log('Fetching vendors...');
      const response = await vendorService.getAllVendors({ limit: 50 });
      console.log('Vendors response:', response);
      
      if (response.success) {
        // Ensure we always have an array
        const vendors = Array.isArray(response.data) ? response.data : 
                       Array.isArray(response.vendors) ? response.vendors : 
                       Array.isArray(response) ? response : [];
        console.log('Processed vendors:', vendors);
        
        // Fetch product counts for each vendor efficiently
        const vendorsWithCounts = await Promise.all(
          vendors.map(async (vendor) => {
            try {
              // Fetch with limit 1 to get pagination info without loading all products
              const vendorId = vendor.id || vendor._id;
              console.log(`Fetching products for vendor ${vendorId} (${vendor.email})`);
              const productResponse = await vendorService.getVendorProducts(vendorId, { limit: 1, page: 1 });
              console.log(`Product response for vendor ${vendorId}:`, productResponse);
              console.log(`🔍 DEBUG: Vendor ${vendorId} pagination total:`, productResponse?.data?.pagination?.total);
              let productCount = 0;
              
              if (productResponse.success) {
                // Use pagination total if available, otherwise count the products
                if (productResponse.data?.pagination?.total) {
                  productCount = productResponse.data.pagination.total;
                } else {
                  // Handle nested data structure: response.data.products
                  const products = Array.isArray(productResponse.data?.products) ? productResponse.data.products :
                                 Array.isArray(productResponse.data) ? productResponse.data : 
                                 Array.isArray(productResponse.products) ? productResponse.products : 
                                 Array.isArray(productResponse) ? productResponse : [];
                  productCount = products.length;
                }
              }
              
              console.log(`Vendor ${vendorId} has ${productCount} products`);
              return {
                ...vendor,
                product_count: productCount
              };
            } catch (error) {
              console.error(`Error fetching product count for vendor ${vendorId}:`, error);
              console.error('Product API might not be running at localhost:8080');
              return {
                ...vendor,
                product_count: 0
              };
            }
          })
        );
        
        setVendors(vendorsWithCounts);
      } else {
        console.log('Vendors response not successful:', response);
        setVendors([]);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      console.error('Error details:', error.message, error.stack);
      
      // If vendors API fails (e.g., authentication), set empty array
      // The stats will use the fallback vendor count from products
      setVendors([]);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats...');
      const [allProductsRes, pendingRes, approvedActiveRes, rejectedRes] = await Promise.all([
        productService.getAllProducts({ limit: 50 }),
        productService.getAllProducts({ approval_status: 'pending', limit: 1 }),
        productService.getAllProducts({ approval_status: 'approved', status: 'active', limit: 1 }),
        productService.getAllProducts({ approval_status: 'rejected', limit: 1 })
      ]);

      console.log('Stats responses:', { allProductsRes, pendingRes, approvedActiveRes, rejectedRes });

      const totalProducts = allProductsRes?.stats?.total || allProductsRes?.data?.pagination?.total || 0;
      const pendingProducts = pendingRes?.stats?.pending || pendingRes?.pagination?.total || 0;
      const approvedProducts = approvedActiveRes?.data?.pagination?.total || approvedActiveRes?.pagination?.total || 0;
      const rejectedProducts = rejectedRes?.stats?.rejected || rejectedRes?.pagination?.total || 0;

      // Get unique vendor count from products data
      let uniqueVendors = 0;
      if (allProductsRes?.data?.products && Array.isArray(allProductsRes.data.products)) {
        const vendorIds = new Set();
        allProductsRes.data.products.forEach(product => {
          if (product.vendor_id) {
            vendorIds.add(product.vendor_id);
          }
        });
        uniqueVendors = vendorIds.size;
      }

      // DEBUG: Log vendor distribution from the first 50 products
      if (allProductsRes?.data?.products && Array.isArray(allProductsRes.data.products)) {
        const vendorDistribution = {};
        allProductsRes.data.products.forEach(product => {
          const vendorId = product.vendor_id || 'NO_VENDOR_ID';
          vendorDistribution[vendorId] = (vendorDistribution[vendorId] || 0) + 1;
        });
        console.log('🔍 DEBUG: Vendor distribution in first 50 products:', vendorDistribution);
        console.log('🔍 DEBUG: Total products from stats:', allProductsRes?.stats?.total);
        console.log('🔍 DEBUG: Total products from pagination:', allProductsRes?.data?.pagination?.total);
        console.log('🔍 DEBUG: Using total products:', totalProducts);
        console.log('🔍 DEBUG: Unique vendors in first 50:', uniqueVendors);
      }

      console.log('Calculated stats:', { 
        totalProducts, 
        pendingProducts, 
        approvedProducts, 
        rejectedProducts, 
        totalVendors: uniqueVendors || vendors.length 
      });

      const newStats = {
        totalVendors: uniqueVendors || vendors.length,
        totalProducts,
        pendingProducts,
        approvedProducts,
        rejectedProducts
      };

      console.log('Setting stats to:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      console.error('Product API might not be running at localhost:8080');
      
      // Set fallback stats if product API is not available
      setStats({
        totalVendors: vendors.length,
        totalProducts: 0,
        pendingProducts: 0,
        approvedProducts: 0,
        rejectedProducts: 0
      });
    }
  };

  const fetchVendorProducts = async (vendorId, page = 1) => {
    setSelectedVendor(vendorId);
    setVendorLoading(true);
    try {
      console.log('Fetching products for vendor:', vendorId, 'page:', page);
      const response = await vendorService.getVendorProducts(vendorId, { 
        limit: vendorProductsPagination.limit, 
        page: page 
      });
      console.log('Vendor products response:', response);

      if (response.success) {
        // Handle nested data structure: response.data.products
        const products = Array.isArray(response.data?.products) ? response.data.products :
          Array.isArray(response.data) ? response.data :
            Array.isArray(response.products) ? response.products :
              Array.isArray(response) ? response : [];
        console.log('Processed products:', products);
        setVendorProducts(products);
        
        // Update pagination info
        const pagination = response.data?.pagination || response.pagination || {
          page: page,
          limit: vendorProductsPagination.limit,
          total: products.length,
          pages: 1
        };
        setVendorProductsPagination(pagination);
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        // Handle case where response.data.products exists but success is false
        console.log('Using response.data.products despite success=false:', response.data.products);
        setVendorProducts(response.data.products);
        setVendorProductsPagination(response.data.pagination || {
          page: page,
          limit: vendorProductsPagination.limit,
          total: response.data.products.length,
          pages: 1
        });
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where response.data exists but success is false
        console.log('Using response.data despite success=false:', response.data);
        setVendorProducts(response.data);
        setVendorProductsPagination({
          page: page,
          limit: vendorProductsPagination.limit,
          total: response.data.length,
          pages: 1
        });
      } else if (Array.isArray(response)) {
        // Handle case where response is directly an array
        console.log('Response is directly an array:', response);
        setVendorProducts(response);
        setVendorProductsPagination({
          page: page,
          limit: vendorProductsPagination.limit,
          total: response.length,
          pages: 1
        });
      } else {
        console.log('Response not successful and no valid data:', response);
        setVendorProducts([]);
        setVendorProductsPagination({
          page: 1,
          limit: vendorProductsPagination.limit,
          total: 0,
          pages: 0
        });
      }
    } catch (error) {
      console.error('Error fetching vendor products:', error);
      console.error('Error details:', error.message, error.stack);
      console.error('Product API might not be running at localhost:8080');
      setVendorProducts([]);
      setVendorProductsPagination({
        page: 1,
        limit: vendorProductsPagination.limit,
        total: 0,
        pages: 0
      });
    } finally {
      setVendorLoading(false);
    }
  };

  const fetchAllProducts = async (page = 1) => {
    setProductsLoading(true);
    try {
      const params = { 
        limit: allProductsPagination.limit,
        page: page
      };
      if (statusFilter !== 'all') {
        params.approval_status = statusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      console.log('Fetching all products with params:', params);
      const response = await productService.getAllProducts(params);
      console.log('All products response:', response);

      if (response.success) {
        // Handle nested data structure: response.data.products
        const products = Array.isArray(response.data?.products) ? response.data.products :
          Array.isArray(response.data) ? response.data :
            Array.isArray(response.products) ? response.products :
              Array.isArray(response) ? response : [];
        console.log('Processed all products:', products);
        setAllProducts(products);
        
        // Update pagination info
        const pagination = response.data?.pagination || response.pagination || {
          page: page,
          limit: allProductsPagination.limit,
          total: products.length,
          pages: 1
        };
        setAllProductsPagination(pagination);
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        // Handle case where response.data.products exists but success is false
        console.log('Using response.data.products despite success=false:', response.data.products);
        setAllProducts(response.data.products);
        setAllProductsPagination(response.data.pagination || {
          page: page,
          limit: allProductsPagination.limit,
          total: response.data.products.length,
          pages: 1
        });
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where response.data exists but success is false
        console.log('Using response.data despite success=false:', response.data);
        setAllProducts(response.data);
        setAllProductsPagination({
          page: page,
          limit: allProductsPagination.limit,
          total: response.data.length,
          pages: 1
        });
      } else if (Array.isArray(response)) {
        // Handle case where response is directly an array
        console.log('Response is directly an array:', response);
        setAllProducts(response);
        setAllProductsPagination({
          page: page,
          limit: allProductsPagination.limit,
          total: response.length,
          pages: 1
        });
      } else {
        console.log('All products response not successful and no valid data:', response);
        setAllProducts([]);
        setAllProductsPagination({
          page: 1,
          limit: allProductsPagination.limit,
          total: 0,
          pages: 0
        });
      }
    } catch (error) {
      console.error('Error fetching all products:', error);
      console.error('Error details:', error.message, error.stack);
      console.error('Product API might not be running at localhost:8080');
      setAllProducts([]);
      setAllProductsPagination({
        page: 1,
        limit: allProductsPagination.limit,
        total: 0,
        pages: 0
      });
    } finally {
      setProductsLoading(false);
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      const response = await productService.approveProduct(productId);
      if (response.success) {
        // Update local state
        if (activeTab === 'vendor-products') {
          setVendorProducts(prev => prev.filter(p => p._id !== productId));
          // Refresh vendor products to update pagination
          if (selectedVendor) {
            fetchVendorProducts(selectedVendor, vendorProductsPagination.page);
          }
        } else {
          setAllProducts(prev => prev.filter(p => p._id !== productId));
          // Refresh all products to update pagination
          fetchAllProducts(allProductsPagination.page);
        }
        fetchStats();
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
        // Update local state
        if (activeTab === 'vendor-products') {
          setVendorProducts(prev => prev.filter(p => p._id !== selectedProduct._id));
          // Refresh vendor products to update pagination
          if (selectedVendor) {
            fetchVendorProducts(selectedVendor, vendorProductsPagination.page);
          }
        } else {
          setAllProducts(prev => prev.filter(p => p._id !== selectedProduct._id));
          // Refresh all products to update pagination
          fetchAllProducts(allProductsPagination.page);
        }
        setShowRejectModal(false);
        setSelectedProduct(null);
        setRejectionReason('');
        fetchStats();
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
        const currentProducts = activeTab === 'vendor-products' ? vendorProducts : allProducts;
        const updatedProducts = currentProducts.filter(p => !selectedProducts.includes(p._id));

        if (activeTab === 'vendor-products') {
          setVendorProducts(updatedProducts);
          // Refresh vendor products to update pagination
          if (selectedVendor) {
            fetchVendorProducts(selectedVendor, vendorProductsPagination.page);
          }
        } else {
          setAllProducts(updatedProducts);
          // Refresh all products to update pagination
          fetchAllProducts(allProductsPagination.page);
        }
        setSelectedProducts([]);
        fetchStats();
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

  const toggleSelectAll = (products) => {
    if (!Array.isArray(products)) return;

    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVendorStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Comprehensive product and vendor management system</p>
        </div>
        <button
          onClick={() => {
            console.log('Manual stats refresh triggered');
            fetchStats();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Stats
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-sm text-gray-600">Total Vendors</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalVendors}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-sm text-gray-600">Total Products (All Vendors)</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <div className="text-sm text-yellow-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.pendingProducts}</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <div className="text-sm text-green-600">Approved</div>
              <div className="text-2xl font-bold text-green-700">{stats.approvedProducts}</div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <div className="text-sm text-red-600">Rejected</div>
              <div className="text-2xl font-bold text-red-700">{stats.rejectedProducts}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('vendors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'vendors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Vendors
            </button>
            <button
              onClick={() => setActiveTab('vendor-products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'vendor-products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              disabled={!selectedVendor}
            >
              <Store className="h-4 w-4 inline mr-2" />
              Vendor Products
              {selectedVendor && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {vendors.find(v => (v.id || v._id) === selectedVendor)?.business_name || 'Selected'}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all-products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all-products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              All Products
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Vendor List</h3>
            <p className="text-sm text-gray-600">Click on a vendor to view their products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(vendors) && vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {vendor.business_name?.charAt(0) || vendor.email?.charAt(0) || 'V'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.name || `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() || 'Unknown Vendor'}
                          </div>
                          <div className="text-sm text-gray-500">ID: {vendor.id?.slice(-8) || vendor._id?.slice(-8) || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.business_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVendorStatusColor(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.product_count || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          const vendorId = vendor.id || vendor._id;
                          fetchVendorProducts(vendorId);
                          setActiveTab('vendor-products');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Products
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vendor-products' && selectedVendor && (
        <div className="space-y-6">
          {/* Vendor Info Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Products for {vendors.find(v => (v.id || v._id) === selectedVendor)?.business_name || 'Selected Vendor'}
                </h3>
                <p className="text-sm text-gray-600">
                  Managing products for vendor: {vendors.find(v => (v.id || v._id) === selectedVendor)?.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total products for this vendor: {vendorProductsPagination.total}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setActiveTab('vendors');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Vendors
              </button>
            </div>
          </div>

          {/* Product Status Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
              >
                All Products
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
              >
                Rejected
              </button>
            </div>

            {selectedProducts.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleBulkApprove}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Approve Selected ({selectedProducts.length})
                </button>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {vendorLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={Array.isArray(vendorProducts) && selectedProducts.length === vendorProducts.length && vendorProducts.length > 0}
                        onChange={() => toggleSelectAll(vendorProducts || [])}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
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
                  {Array.isArray(vendorProducts) && vendorProducts
                    .filter(product => statusFilter === 'all' || product.approval_status === statusFilter)
                    .map((product) => (
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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.approval_status)}`}>
                            {product.approval_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowProductDetails(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {product.approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveProduct(product._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setShowRejectModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {(!Array.isArray(vendorProducts) || vendorProducts.length === 0) && !vendorLoading && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No products found for this vendor</p>
                <p className="text-xs text-gray-400 mt-2">
                  Check console for API response details
                </p>
                <p className="text-xs text-red-400 mt-1">
                  Note: Product API might not be running at localhost:8080
                </p>
              </div>
            )}
          </div>

          {/* Vendor Products Pagination */}
          {(vendorProductsPagination.pages > 1 || vendorProductsPagination.total > 0) && (
            <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  Showing {((vendorProductsPagination.page - 1) * vendorProductsPagination.limit) + 1} to{' '}
                  {Math.min(vendorProductsPagination.page * vendorProductsPagination.limit, vendorProductsPagination.total)} of{' '}
                  {vendorProductsPagination.total} products
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Show:</label>
                  <select
                    value={vendorProductsPagination.limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value);
                      setVendorProductsPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                      fetchVendorProducts(selectedVendor, 1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchVendorProducts(selectedVendor, vendorProductsPagination.page - 1)}
                  disabled={vendorProductsPagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {vendorProductsPagination.page} of {vendorProductsPagination.pages}
                </span>
                <button
                  onClick={() => fetchVendorProducts(selectedVendor, vendorProductsPagination.page + 1)}
                  disabled={vendorProductsPagination.page >= vendorProductsPagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'all-products' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-4 py-2 rounded-lg ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-4 py-2 rounded-lg ${statusFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-4 py-2 rounded-lg ${statusFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  Rejected
                </button>
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleBulkApprove}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Approve Selected ({selectedProducts.length})
                </button>
              </div>
            )}
          </div>

          {/* All Products Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {productsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={Array.isArray(allProducts) && selectedProducts.length === allProducts.length && allProducts.length > 0}
                        onChange={() => toggleSelectAll(allProducts || [])}
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
                  {Array.isArray(allProducts) && allProducts.map((product) => (
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.approval_status)}`}>
                          {product.approval_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {product.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveProduct(product._id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowRejectModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {(!Array.isArray(allProducts) || allProducts.length === 0) && !productsLoading && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
                <p className="text-xs text-gray-400 mt-2">
                  Check console for API response details
                </p>
                <p className="text-xs text-red-400 mt-1">
                  Note: Product API might not be running at localhost:8080
                </p>
              </div>
            )}
          </div>

          {/* All Products Pagination */}
          {(allProductsPagination.pages > 1 || allProductsPagination.total > 0) && (
            <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  Showing {((allProductsPagination.page - 1) * allProductsPagination.limit) + 1} to{' '}
                  {Math.min(allProductsPagination.page * allProductsPagination.limit, allProductsPagination.total)} of{' '}
                  {allProductsPagination.total} products
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Show:</label>
                  <select
                    value={allProductsPagination.limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value);
                      setAllProductsPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                      fetchAllProducts(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchAllProducts(allProductsPagination.page - 1)}
                  disabled={allProductsPagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {allProductsPagination.page} of {allProductsPagination.pages}
                </span>
                <button
                  onClick={() => fetchAllProducts(allProductsPagination.page + 1)}
                  disabled={allProductsPagination.page >= allProductsPagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
              <button
                onClick={() => {
                  setShowProductDetails(false);
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
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProduct.approval_status)}`}>
                          {selectedProduct.approval_status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedProduct.status === 'active' ? 'bg-green-100 text-green-800' :
                            selectedProduct.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              selectedProduct.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                          }`}>
                          {selectedProduct.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-medium ${selectedProduct.stock_quantity > 10 ? 'text-green-600' :
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
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Stock Quantity</label>
                        <p className="text-gray-900 font-medium">{selectedProduct.stock_quantity}</p>
                      </div>
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
                    </div>
                  </div>

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
            </div>

            {/* Actions */}
            {selectedProduct.approval_status === 'pending' && (
              <div className="mt-8 flex gap-3 justify-end border-t border-gray-200 pt-6 px-6">
                <button
                  onClick={() => {
                    setShowProductDetails(false);
                    setShowRejectModal(true);
                  }}
                  className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject Product
                </button>
                <button
                  onClick={() => {
                    handleApproveProduct(selectedProduct._id);
                    setShowProductDetails(false);
                  }}
                  className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve Product
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
}
