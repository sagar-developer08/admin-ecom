'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { productService } from '../../../../lib/services/productService';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import DataTable from '../../../../components/shared/DataTable';
import StatsCard from '../../../../components/MetricCard';
import { 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  Store, 
  Search, 
  Eye,
  Edit
} from 'lucide-react';

const InventoryAlertsPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    critical: 0
  });
  
  const [filters, setFilters] = useState({
    store: 'all',
    search: '',
    stockLevel: 'all' // all, low, out, critical
  });
  
  const [stores, setStores] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchInventory();
    }
  }, [user, isLoading, router]);

  const fetchInventory = async (page = 1, limit = 100) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching inventory alerts for user:', user);
      console.log('🔍 Using vendorId:', user.vendorId || user.id);
      
      const response = await productService.getAllProducts({ 
        vendorId: user.vendorId || user.id,
        page,
        limit
      });
      console.log('📊 API Response:', response);
      
      const productsData = response.data?.products || response.data || [];
      console.log('📦 Products Data:', productsData);
      
      // If this is the first page, set all products, otherwise append
      if (page === 1) {
        setAllProducts(productsData);
      } else {
        setAllProducts(prev => [...prev, ...productsData]);
      }
      
      // Filter for low stock and out of stock products only
      const alertProducts = productsData.filter(product => {
        const stock = product.stock_quantity || 0;
        const minStock = product.min_stock_level || 10;
        return stock <= minStock;
      });
      
      if (page === 1) {
        setLowStockProducts(alertProducts);
      } else {
        setLowStockProducts(prev => [...prev, ...alertProducts]);
      }
      
      // Calculate stats from all products
      const allProductsForStats = page === 1 ? productsData : [...allProducts, ...productsData];
      const total = allProductsForStats.length;
      const lowStock = allProductsForStats.filter(p => {
        const stock = p.stock_quantity || 0;
        const minStock = p.min_stock_level || 10;
        return stock > 0 && stock <= minStock;
      }).length;
      const outOfStock = allProductsForStats.filter(p => (p.stock_quantity || 0) === 0).length;
      const critical = allProductsForStats.filter(p => {
        const stock = p.stock_quantity || 0;
        const minStock = p.min_stock_level || 10;
        return stock > 0 && stock <= (minStock * 0.5); // Critical if below 50% of min stock
      }).length;
      
      setStats({ total, lowStock, outOfStock, critical });
      
      // Extract unique stores
      const uniqueStores = [...new Set(allProductsForStats.map(p => p.store_id?.name || 'No Store'))];
      setStores(uniqueStores.map(name => ({ id: name, name })));
      
    } catch (error) {
      console.error('❌ Error fetching inventory alerts:', error);
      setLowStockProducts([]);
      setAllProducts([]);
      setStats({ total: 0, lowStock: 0, outOfStock: 0, critical: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct || !newStock) return;
    
    try {
      await productService.updateProduct(selectedProduct._id, {
        stock_quantity: parseInt(newStock)
      });
      
      // Refresh the data
      await fetchInventory();
      setShowUpdateModal(false);
      setSelectedProduct(null);
      setNewStock('');
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const getFilteredProducts = () => {
    let filtered = lowStockProducts;
    
    // Filter by stock level
    if (filters.stockLevel !== 'all') {
      filtered = filtered.filter(product => {
        const stock = product.stock_quantity || 0;
        const minStock = product.min_stock_level || 10;
        
        switch (filters.stockLevel) {
          case 'low':
            return stock > 0 && stock <= minStock;
          case 'out':
            return stock === 0;
          case 'critical':
            return stock > 0 && stock <= (minStock * 0.5);
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

  const getStockStatus = (product) => {
    const stock = product.stock_quantity || 0;
    const minStock = product.min_stock_level || 10;
    
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (stock <= (minStock * 0.5)) {
      return { label: 'Critical', color: 'text-red-800', bgColor: 'bg-red-200' };
    } else if (stock <= minStock) {
      return { label: 'Low Stock', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    }
    return { label: 'Normal', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const columns = [
    { 
      key: 'title', 
      label: 'Product', 
      render: (product) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{product.title}</div>
            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'store_id', 
      label: 'Store',
      render: (product) => (
        <div className="flex items-center space-x-2">
          <Store className="w-4 h-4 text-gray-400" />
          <span>{product.store_id?.name || 'No Store'}</span>
        </div>
      )
    },
    { 
      key: 'stock_quantity', 
      label: 'Current Stock',
      render: (product) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{product.stock_quantity || 0}</span>
          <span className="text-sm text-gray-500">/ {product.min_stock_level || 10} min</span>
        </div>
      )
    },
    { 
      key: 'stock_status', 
      label: 'Status',
      render: (product) => {
        const status = getStockStatus(product);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
            {status.label}
          </span>
        );
      }
    },
    { 
      key: 'price', 
      label: 'Price',
      render: (product) => (
        <span className="font-medium text-green-600">
          ${product.price?.toFixed(2) || '0.00'}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'View Product',
      icon: Eye,
      onClick: (product) => router.push(`/vendor/products/${product._id}`),
      className: 'text-blue-600 hover:text-blue-800'
    },
    {
      label: 'Update Stock',
      icon: Edit,
      onClick: (product) => {
        setSelectedProduct(product);
        setNewStock(product.stock_quantity?.toString() || '0');
        setShowUpdateModal(true);
      },
      className: 'text-green-600 hover:text-green-800'
    }
  ];

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  {[1, 2, 3, 4].map(i => (
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
              <h1 className="text-2xl font-bold text-gray-900">Inventory Alerts</h1>
              <p className="text-gray-600 mt-1">Monitor and manage low stock and out of stock products</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatsCard
                title="Total Products"
                value={allProducts.length}
                icon={Package}
                color="blue"
              />
              <StatsCard
                title="Low Stock"
                value={stats.lowStock}
                icon={AlertTriangle}
                color="yellow"
              />
              <StatsCard
                title="Out of Stock"
                value={stats.outOfStock}
                icon={TrendingDown}
                color="red"
              />
              <StatsCard
                title="Critical Stock"
                value={stats.critical}
                icon={AlertTriangle}
                color="red"
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Level
                  </label>
                  <select
                    value={filters.stockLevel}
                    onChange={(e) => handleFilterChange('stockLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Alerts</option>
                    <option value="low">Low Stock</option>
                    <option value="critical">Critical Stock</option>
                    <option value="out">Out of Stock</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({ store: 'all', search: '', stockLevel: 'all' })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Alerts Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
                <span className="text-sm text-gray-500">
                  {getFilteredProducts().length} products need attention
                </span>
              </div>
              <DataTable
                data={getFilteredProducts()}
                columns={columns}
                actions={actions}
                searchable={false}
                pagination={true}
                emptyMessage="No stock alerts found. All products are well stocked!"
              />
            </div>

            {/* Update Stock Modal */}
            {showUpdateModal && selectedProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Update Stock</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product: {selectedProduct.title}
                    </label>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store: {selectedProduct.store_id?.name || 'No Store'}
                    </label>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock: {selectedProduct.stock_quantity || 0}
                    </label>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new stock quantity"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleUpdateStock}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Stock
                    </button>
                    <button
                      onClick={() => {
                        setShowUpdateModal(false);
                        setSelectedProduct(null);
                        setNewStock('');
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

export default InventoryAlertsPage;
