'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import StatsCard from '../../../components/shared/StatsCard';
import Modal from '../../../components/shared/Modal';
import FormInput from '../../../components/shared/FormInput';
import { Boxes, AlertTriangle, CheckCircle, TrendingDown, Edit, Store, Filter, Search, Eye } from 'lucide-react';
import productService from '../../../lib/services/productService';

export default function VendorInventoryPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [filters, setFilters] = useState({
    stockStatus: 'all', // all, inStock, lowStock, outOfStock
    store: 'all',
    search: ''
  });
  const [stores, setStores] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [activeTab, setActiveTab] = useState('all'); // all, inStock, lowStock, outOfStock
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 20
  });
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/admin');
      return;
    }
    if (user) {
      fetchInventory();
    }
  }, [user, isLoading, router]);

  const fetchInventory = async (page = 1, limit = 100) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching inventory for user:', user);
      console.log('🔍 Using vendorId:', user.vendorId || user.id);
      console.log('🔍 Fetching page:', page, 'limit:', limit);
      
      const response = await productService.getAllProducts({ 
        vendorId: user.vendorId || user.id,
        page,
        limit
      });
      console.log('📊 API Response:', response);
      
      const productsData = response.data?.products || response.data || [];
      const paginationData = response.data?.pagination || response.pagination;
      
      console.log('📦 Products Data:', productsData);
      console.log('📄 Pagination Data:', paginationData);
      
      // If this is the first page, set all products, otherwise append
      if (page === 1) {
        setAllProducts(productsData);
      } else {
        setAllProducts(prev => [...prev, ...productsData]);
      }
      
      setProducts(productsData);
      
      // Update pagination state
      if (paginationData) {
        setPagination({
          currentPage: paginationData.page || page,
          totalPages: paginationData.pages || 1,
          totalProducts: paginationData.total || productsData.length,
          limit: paginationData.limit || limit
        });
      }
      
      // Calculate stats from all products
      const allProductsForStats = page === 1 ? productsData : [...allProducts, ...productsData];
      const total = allProductsForStats.length;
      const inStock = allProductsForStats.filter(p => p.stock_quantity > 10).length;
      const lowStock = allProductsForStats.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length;
      const outOfStock = allProductsForStats.filter(p => p.stock_quantity === 0).length;
      
      setStats({ total, inStock, lowStock, outOfStock });
      
      // Group products by store from all products
      const groupedByStore = allProductsForStats.reduce((acc, product) => {
        const storeId = product.store_id?._id || product.store_id || 'no-store';
        const storeName = product.store_id?.name || 'No Store';
        
        if (!acc[storeId]) {
          acc[storeId] = {
            storeName,
            products: []
          };
        }
        acc[storeId].products.push(product);
        return acc;
      }, {});
      
      setGroupedProducts(groupedByStore);
      
      // Extract unique stores
      const uniqueStores = Object.values(groupedByStore).map(store => ({
        id: store.storeName,
        name: store.storeName
      }));
      setStores(uniqueStores);
      
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      setProducts([]);
      setAllProducts([]);
      setStats({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct || !newStock) return;
    
    try {
      await productService.updateProduct(selectedProduct._id, { stock_quantity: parseInt(newStock) });
      setShowModal(false);
      setSelectedProduct(null);
      setNewStock('');
      fetchInventory();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const getFilteredProducts = () => {
    let filtered = allProducts;
    
    // Filter by stock status
    if (activeTab !== 'all') {
      filtered = filtered.filter(product => {
        const stock = product.stock_quantity || 0;
        switch (activeTab) {
          case 'inStock':
            return stock > 10;
          case 'lowStock':
            return stock > 0 && stock <= 10;
          case 'outOfStock':
            return stock === 0;
          default:
            return true;
        }
      });
    }
    
    // Filter by store
    if (filters.store !== 'all') {
      filtered = filtered.filter(product => {
        const storeName = product.store_id?.name || 'No Store';
        return storeName === filters.store;
      });
    }
    
    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(product => 
        product.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.sku?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const loadMoreProducts = async () => {
    if (pagination.currentPage < pagination.totalPages) {
      await fetchInventory(pagination.currentPage + 1, pagination.limit);
    }
  };

  const loadAllProducts = async () => {
    if (pagination.currentPage < pagination.totalPages) {
      // Load all remaining pages
      const remainingPages = pagination.totalPages - pagination.currentPage;
      for (let i = 1; i <= remainingPages; i++) {
        await fetchInventory(pagination.currentPage + i, pagination.limit);
      }
    }
  };

  const columns = [
    { 
      key: 'title', 
      label: 'Product', 
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          {row.images && row.images[0] ? (
            <img src={row.images[0].url} alt={value} className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <Boxes className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-gray-500">{row.sku}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'store_id', 
      label: 'Store', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Store className="w-4 h-4 text-gray-500" />
          <span className="text-sm">{value?.name || 'No Store'}</span>
        </div>
      )
    },
    { 
      key: 'stock_quantity', 
      label: 'Stock Level', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${
            value === 0 ? 'text-red-600' :
            value <= 10 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {value || 0}
          </span>
          {value === 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
          {value > 0 && value <= 10 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
        </div>
      )
    },
    { 
      key: 'min_stock_level', 
      label: 'Min Stock', 
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">{value || 0}</span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value, row) => {
        const stock = row.stock_quantity || 0;
        const minStock = row.min_stock_level || 0;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            stock === 0 ? 'bg-red-100 text-red-800' :
            stock <= minStock ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {stock === 0 ? 'Out of Stock' : stock <= minStock ? 'Low Stock' : 'In Stock'}
          </span>
        );
      }
    },
    { 
      key: 'price', 
      label: 'Price', 
      sortable: true,
      render: (value) => `$${value?.toFixed(2) || '0.00'}`
    },
  ];

  const actions = (row) => (
    <div className="flex space-x-2">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedProduct(row);
          setNewStock(row.stock_quantity?.toString() || '0');
        setShowModal(true);
      }}
      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
      title="Update Stock"
    >
      <Edit className="w-4 h-4" />
    </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          // View product details
          router.push(`/vendor/products/${row._id}`);
        }}
        className="p-2 text-green-600 hover:bg-green-50 rounded"
        title="View Product"
      >
        <Eye className="w-4 h-4" />
      </button>
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
        userType="vendor"
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          userType="vendor"
          user={user}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Manage your product stock levels across all stores</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Products"
              value={allProducts.length}
              icon={Boxes}
              color="blue"
            />
            <StatsCard
              title="In Stock"
              value={allProducts.filter(p => (p.stock_quantity || 0) > 10).length}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title="Low Stock Alert"
              value={allProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length}
              icon={AlertTriangle}
              color="yellow"
            />
            <StatsCard
              title="Out of Stock"
              value={allProducts.filter(p => (p.stock_quantity || 0) === 0).length}
              icon={TrendingDown}
              color="red"
            />
          </div>

          {/* Filters and Tabs */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* Stock Status Tabs */}
            <div className="flex space-x-1 mb-4">
              {[
                { key: 'all', label: 'All Products', count: allProducts.length },
                { key: 'inStock', label: 'In Stock', count: allProducts.filter(p => (p.stock_quantity || 0) > 10).length },
                { key: 'lowStock', label: 'Low Stock', count: allProducts.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length },
                { key: 'outOfStock', label: 'Out of Stock', count: allProducts.filter(p => (p.stock_quantity || 0) === 0).length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name or SKU..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Store
                </label>
                <select
                  value={filters.store}
                  onChange={(e) => handleFilterChange('store', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.name}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ stockStatus: 'all', store: 'all', search: '' })}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {allProducts.length} of {pagination.totalProducts} products
                  {pagination.currentPage < pagination.totalPages && (
                    <span className="text-blue-600 ml-2">
                      ({pagination.totalPages - pagination.currentPage} more pages available)
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {pagination.currentPage < pagination.totalPages && (
                    <>
                      <button
                        onClick={loadMoreProducts}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Load Next Page
                      </button>
                      <button
                        onClick={loadAllProducts}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Load All Products
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(pagination.currentPage / pagination.totalPages) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
              </div>
            </div>
          )}

          {/* Store-wise Organization */}
          {Object.keys(groupedProducts).length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Store-wise Inventory</h2>
              <div className="space-y-4">
                {Object.entries(groupedProducts).map(([storeId, storeData]) => {
                  const storeProducts = getFilteredProducts().filter(p => 
                    (p.store_id?._id || p.store_id || 'no-store') === storeId
                  );
                  
                  if (storeProducts.length === 0) return null;
                  
                  const storeStats = {
                    total: storeData.products.length,
                    inStock: storeData.products.filter(p => (p.stock_quantity || 0) > 10).length,
                    lowStock: storeData.products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length,
                    outOfStock: storeData.products.filter(p => (p.stock_quantity || 0) === 0).length,
                  };
                  
                  return (
                    <div key={storeId} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Store className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-medium text-gray-900">{storeData.storeName}</h3>
                        </div>
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>Total: {storeStats.total}</span>
                          <span className="text-green-600">In Stock: {storeStats.inStock}</span>
                          <span className="text-yellow-600">Low Stock: {storeStats.lowStock}</span>
                          <span className="text-red-600">Out of Stock: {storeStats.outOfStock}</span>
                        </div>
                      </div>
                      <DataTable
                        data={storeProducts}
                        columns={columns}
                        actions={actions}
                        searchable={false}
                        pagination={false}
                        emptyMessage={`No products in ${storeData.storeName}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Products Table */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Products</h2>
          <DataTable
              data={getFilteredProducts()}
            columns={columns}
            actions={actions}
              searchable={false}
            pagination={true}
              emptyMessage="No products found matching your filters"
          />
          </div>

          {/* Update Stock Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedProduct(null);
              setNewStock('');
            }}
            title="Update Stock Level"
            size="md"
            footer={
              <>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStock}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Stock
                </button>
              </>
            }
          >
            {selectedProduct && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Product</label>
                  <p className="text-gray-900 font-medium">{selectedProduct.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Stock</label>
                  <p className="text-gray-900">{selectedProduct.stock_quantity || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Store</label>
                  <p className="text-gray-900">{selectedProduct.store_id?.name || 'No Store'}</p>
                </div>
                <FormInput
                  label="New Stock Level"
                  name="newStock"
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Enter new stock level"
                  required
                />
              </div>
            )}
          </Modal>
        </main>
      </div>
    </div>
  );
}

