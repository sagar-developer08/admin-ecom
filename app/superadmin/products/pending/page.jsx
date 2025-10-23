'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { productService } from '../../../../lib/services/productService';

export default function PendingByVendorPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'superadmin') {
      router.push('/vendor');
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await productService.getPendingVendorsSummary({ limit: 50 });
      if (res.success) {
        setVendors(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorProducts = async (vendorId) => {
    setSelectedVendor(vendorId);
    setProducts([]);
    try {
      const res = await productService.getVendorPendingProducts(vendorId, { limit: 50 });
      if (res.success) {
        // API returns array when approval_status specified
        setProducts(res.data || res.products || []);
      }
    } catch (e) {}
  };

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
          <h1 className="text-2xl font-bold mb-4">Pending Approval by Vendor</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Vendors</h2>
              <ul className="divide-y">
                {vendors.map((v) => (
                  <li key={v.vendor_id} className={`py-2 flex items-center justify-between ${selectedVendor === v.vendor_id ? 'bg-blue-50 rounded px-2' : ''}`}>
                    <div>
                      <div className="text-sm font-medium">{v.stores?.[0]?.name || 'Vendor'}</div>
                      <div className="text-xs text-gray-500">Pending products: {v.count}</div>
                    </div>
                    <button className="text-blue-600 text-sm" onClick={() => fetchVendorProducts(v.vendor_id)}>
                      View
                    </button>
                  </li>
                ))}
                {vendors.length === 0 && (
                  <li className="py-4 text-sm text-gray-500">No pending products</li>
                )}
              </ul>
            </div>

            <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">Products</h2>
              {products.length === 0 ? (
                <div className="text-sm text-gray-500">Select a vendor to view products</div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p._id} className="border rounded p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        {p.images?.[0]?.url && (
                          <img src={p.images[0].url} alt={p.title} className="h-12 w-12 rounded object-cover mr-3" />
                        )}
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Store: {p.store_id?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Brand: {p.brand_id?.name || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div>${p.price?.toFixed?.(2) || p.price}</div>
                        <div className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded inline-block mt-1">{p.approval_status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


