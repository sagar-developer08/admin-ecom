'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import DataTable from '../../../components/shared/DataTable';
import StatsCard from '../../../components/shared/StatsCard';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import productService from '../../../lib/services/productService';
import Modal from '../../../components/shared/Modal';

export default function VendorProductsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryLevel, setCategoryLevel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    pending: 0
  });

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
      fetchProducts(1);
    }
  }, [user, isLoading, router]);

  // Debounced search effect
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        fetchProducts(1); // Reset to page 1 when searching
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, categoryLevel, categoryId]);

  const fetchProducts = async (pageToLoad = 1, showTableLoading = true) => {
    try {
      if (showTableLoading) {
        setTableLoading(true);
      }
      const query = {
        vendor_id: user.id,
        vendorId: user.id,
        page: pageToLoad,
        limit: pagination.limit || 10,
      };
      if (search) query.search = search;
      if (statusFilter) query.status = statusFilter;
      if (categoryLevel && categoryId) query[categoryLevel] = categoryId;

      const response = await productService.getAllProducts(query);
      const list = response?.data?.products || [];
      const pag = response?.data?.pagination || { page: pageToLoad, limit: pagination.limit || 10, total: list.length, pages: 1 };
      setProducts(list);
      setPagination({ page: Number(pag.page) || 1, limit: Number(pag.limit) || 10, total: Number(pag.total) || list.length, pages: Number(pag.pages) || 1 });

      // Fetch stats separately to get all vendor products, not just current page
      await fetchStats();
      
      // Set main loading to false after initial data fetch
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Set loading to false even on error to prevent infinite loading
      setLoading(false);
    } finally {
      if (showTableLoading) {
        setTableLoading(false);
      }
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      // Get all products for stats calculation (no pagination)
      const statsQuery = {
        vendor_id: user.id,
        vendorId: user.id,
        limit: 1000, // Get a large number to get all products for stats
      };
      
      const statsResponse = await productService.getAllProducts(statsQuery);
      const allProducts = statsResponse?.data?.products || [];
      
      const total = allProducts.length;
      const active = allProducts.filter(p => p.status === 'active').length;
      const outOfStock = allProducts.filter(p => (p.stock_quantity ?? 0) === 0).length;
      const pending = allProducts.filter(p => p.approval_status === 'pending' || p.status === 'pending').length;
      setStats({ total, active, outOfStock, pending });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        fetchProducts(pagination.page, false); // Don't show table loading for delete
      } catch (error) {
        console.error('Error deleting product:', error);
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
          {row.images && row.images[0]?.url ? (
            <img src={row.images[0]?.url} alt={value} className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-400" />
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
      key: 'price', 
      label: 'Price', 
      sortable: true,
      render: (value) => `$${Number(value || 0).toFixed(2)}`
    },
    { 
      key: 'stock_quantity', 
      label: 'Stock', 
      sortable: true,
      render: (value) => (
        <span className={value > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {value}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedProduct(row);
          setDetailsOpen(true);
        }}
        className="p-2 text-gray-700 hover:bg-gray-50 rounded"
        title="Details"
      >
        Details
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/vendor/products/edit/${row._id}`);
        }}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row._id);
        }}
        className="p-2 text-red-600 hover:bg-red-50 rounded"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
              <p className="text-gray-600 mt-1">Manage your product catalog</p>
            </div>
            <button
              onClick={() => router.push('/vendor/products/add')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Level</label>
              <select
                value={categoryLevel}
                onChange={(e) => setCategoryLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="level1">Level 1</option>
                <option value="level2">Level 2</option>
                <option value="level3">Level 3</option>
                <option value="level4">Level 4</option>
              </select>
            </div>
            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
              <input
                type="text"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                placeholder="Paste category ObjectId"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <button
                onClick={() => { 
                  setSearch(''); 
                  setStatusFilter(''); 
                  setCategoryLevel(''); 
                  setCategoryId(''); 
                  setPagination(prev => ({ ...prev, page: 1 }));
                  fetchProducts(1); 
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard
              title="Total Products"
              value={statsLoading ? "..." : stats.total}
              icon={Package}
              color="blue"
            />
            <StatsCard
              title="Active Products"
              value={statsLoading ? "..." : stats.active}
              icon={Package}
              color="green"
            />
            <StatsCard
              title="Out of Stock"
              value={statsLoading ? "..." : stats.outOfStock}
              icon={Package}
              color="red"
            />
            <StatsCard
              title="Pending Approval"
              value={statsLoading ? "..." : stats.pending}
              icon={Package}
              color="yellow"
            />
          </div>

          {/* Products Table */}
          <div className="relative">
            {tableLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading products...</span>
                </div>
              </div>
            )}
            <DataTable
              data={products}
              columns={columns}
              actions={actions}
              searchable={false}
              pagination={false}
              emptyMessage="No products found. Click 'Add Product' to get started."
            />
          </div>

          {/* Server-side Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">Page {pagination.page} of {pagination.pages} • Total {pagination.total}</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchProducts(Math.max(1, pagination.page - 1), false)}
                  disabled={pagination.page <= 1 || tableLoading}
                  className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => fetchProducts(Math.min(pagination.pages, pagination.page + 1), false)}
                  disabled={pagination.page >= pagination.pages || tableLoading}
                  className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Details Modal */}
          <ProductDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} product={selectedProduct} />
        </main>
      </div>
    </div>
  );
}

function ProductDetailsModal({ open, onClose, product }) {
  if (!open) return null;
  if (!product) return null;
  const images = Array.isArray(product.images) ? product.images : [];
  const normalizedImages = images.map((img) => typeof img === 'string' ? { url: img } : img);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = normalizedImages[selectedIndex];

  return (
    <Modal isOpen={open} onClose={onClose} title="Product Details" size="xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="aspect-square w-full bg-gray-50 rounded-lg border flex items-center justify-center overflow-hidden">
            {current?.url ? (
              <img src={current.url} alt={product.title} className="w-full h-full object-contain" />
            ) : (
              <div className="text-gray-400">No image</div>
            )}
          </div>
          {normalizedImages.length > 1 && (
            <div className="mt-3 flex space-x-2 overflow-x-auto">
              {normalizedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`h-16 w-16 border rounded-md overflow-hidden flex-shrink-0 ${selectedIndex === idx ? 'ring-2 ring-blue-500' : 'hover:border-gray-400'}`}
                  title={`Image ${idx + 1}`}
                >
                  {img.url ? (
                    <img src={img.url} alt={`thumb-${idx}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gray-100" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">SKU: {product.sku || '-'}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                product.status === 'active' ? 'bg-green-100 text-green-700' :
                product.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>{product.status}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">Approval: {product.approval_status || '-'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Price</div>
              <div className="font-medium">${Number(product.price || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500">Discount Price</div>
              <div className="font-medium">${Number(product.discount_price || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-500">Stock</div>
              <div className="font-medium">{product.stock_quantity}</div>
            </div>
            <div>
              <div className="text-gray-500">Store</div>
              <div className="font-medium">{product.store_id?.name || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Brand</div>
              <div className="font-medium">{product.brand_id?.name || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Vendor</div>
              <div className="font-medium">{product.vendor_id || '-'}</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Categories</h4>
            <div className="text-sm text-gray-800 space-x-2 space-y-1">
              {product.level1?.name && <span className="px-2 py-0.5 bg-gray-100 rounded">{product.level1?.name}</span>}
              {product.level2?.name && <span className="px-2 py-0.5 bg-gray-100 rounded">{product.level2?.name}</span>}
              {product.level3?.name && <span className="px-2 py-0.5 bg-gray-100 rounded">{product.level3?.name}</span>}
              {product.level4?.name && <span className="px-2 py-0.5 bg-gray-100 rounded">{product.level4?.name}</span>}
            </div>
          </div>

          {(product.short_description || product.description) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
              {product.short_description && (
                <p className="text-sm text-gray-800 mb-1">{product.short_description}</p>
              )}
              {product.description && (
                <p className="text-sm text-gray-700 whitespace-pre-line">{product.description}</p>
              )}
            </div>
          )}

          {(product.meta_title || product.meta_description) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">SEO</h4>
              {product.meta_title && <div className="text-sm"><span className="text-gray-500">Meta Title:</span> {product.meta_title}</div>}
              {product.meta_description && <div className="text-sm"><span className="text-gray-500">Meta Description:</span> {product.meta_description}</div>}
            </div>
          )}

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {(product.attributes || product.specifications) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Attributes & Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {product.attributes && Object.entries(product.attributes).map(([k, v]) => (
                  <div key={`attr-${k}`} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-800">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
                {product.specifications && Object.entries(product.specifications).map(([k, v]) => (
                  <div key={`spec-${k}`} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-800">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Created:</span> {product.createdAt ? new Date(product.createdAt).toLocaleString() : '-'}</div>
            <div><span className="text-gray-500">Updated:</span> {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '-'}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

