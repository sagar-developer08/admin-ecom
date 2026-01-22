'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  Settings, 
  Users, 
  Package, 
  DollarSign, 
  Save, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { commissionService } from '../../../../lib/services/commissionService';
import vendorService from '../../../../lib/services/vendorService';

export default function CommissionSettings() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [commissionRate, setCommissionRate] = useState('');

  // Commission settings state
  const [globalSettings, setGlobalSettings] = useState({
    defaultCommission: 10,
    minimumCommission: 5,
    maximumCommission: 25,
    taxIncluded: true,
    processingFee: 2.5
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && user.role !== 'superadmin') {
      router.push('/admin');
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      loadCommissionData();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      loadCommissionData();
    }
  }, [searchTerm]);

  const loadCommissionData = async () => {
    setLoading(true);
    try {
      // Load global settings
      const globalResponse = await commissionService.getGlobalSettings();
      if (globalResponse.success) {
        console.log('Global Settings:', globalResponse.data);
        setGlobalSettings(globalResponse.data);
      } else {
        console.log('Failed to load global settings:', globalResponse);
      }

      // Load vendors for commission setting - use commission-specific endpoint
      const vendorResponse = await commissionService.getAllVendorCommissionSettings({ search: searchTerm });
      if (vendorResponse.success) {
        // The commission endpoint returns only active vendors with commission data and verification status
        const transformedVendors = vendorResponse.data.map(vendor => ({
          ...vendor,
          // Normalize ID field - handle both id and _id formats
          id: vendor.id || vendor._id || vendor.vendorId,
          // Ensure both verification fields are consistent
          verified: vendor.verified || false,
          isVerified: vendor.verified || false,
          businessName: vendor.businessName || 'N/A'
        }));
        console.log('🔍 Transformed vendors:', transformedVendors.map(v => ({ id: v.id, name: v.name, email: v.email })));
        setVendors(transformedVendors);
      }
    } catch (error) {
      console.error('Error loading commission data:', error);
      // No fallback to mock data - use empty array if API fails
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSettingsSave = async () => {
    setLoading(true);
    try {
      const response = await commissionService.updateGlobalSettings(globalSettings);
      if (response.success) {
        alert('Global commission settings saved successfully!');
        setGlobalSettings(response.data);
      } else {
        alert('Error saving global settings: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving global settings:', error);
      alert('Error saving global settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorCommissionUpdate = async (vendorId, newCommissionRate) => {
    if (!vendorId || vendorId === 'undefined') {
      console.error('❌ Invalid vendor ID:', vendorId);
      alert('Error: Invalid vendor ID. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('🔄 Updating commission for vendor:', vendorId, 'to rate:', newCommissionRate);
      const response = await commissionService.updateVendorCommission(vendorId, newCommissionRate);
      if (response.success) {
        // Update local state
        setVendors(prev => 
          prev.map(vendor => {
            const normalizedVendorId = vendor.id || vendor._id || vendor.vendorId;
            return normalizedVendorId === vendorId
              ? { ...vendor, commissionRate: newCommissionRate, hasCustomCommission: true }
              : vendor;
          })
        );
        alert('Vendor commission updated successfully!');
      } else {
        alert('Error updating vendor commission: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating vendor commission:', error);
      alert('Error updating vendor commission: ' + error.message);
    }
  };

  const openCommissionModal = (vendor) => {
    setSelectedVendor(vendor);
    setCommissionRate(vendor.commissionRate || globalSettings.defaultCommission);
    setShowCommissionModal(true);
  };

  const closeCommissionModal = () => {
    setShowCommissionModal(false);
    setSelectedVendor(null);
    setCommissionRate('');
  };

  const handleCommissionSubmit = async () => {
    if (!selectedVendor || !commissionRate) return;
    
    const vendorId = selectedVendor.id || selectedVendor._id || selectedVendor.vendorId;
    if (!vendorId || vendorId === 'undefined') {
      alert('Error: Invalid vendor ID. Please refresh the page and try again.');
      return;
    }
    
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Please enter a valid commission rate between 0 and 100');
      return;
    }

    try {
      await handleVendorCommissionUpdate(vendorId, rate);
      closeCommissionModal();
    } catch (error) {
      console.error('Error updating commission:', error);
    }
  };


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-blue-600" />
                    Commission Settings
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Manage commission rates for vendors and categories
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Upload className="h-4 w-4" />
                    Import
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'global', label: 'Global Settings', icon: Settings },
                    { id: 'vendors', label: 'Vendor Commissions', icon: Users }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Global Settings Tab */}
            {activeTab === 'global' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Global Commission Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      value={globalSettings.defaultCommission}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, defaultCommission: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default commission rate for all verified vendors</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      value={globalSettings.minimumCommission}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, minimumCommission: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum allowed commission rate</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      value={globalSettings.maximumCommission}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, maximumCommission: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum allowed commission rate</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Processing Fee (%)
                    </label>
                    <input
                      type="number"
                      value={globalSettings.processingFee}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, processingFee: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Additional processing fee</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={globalSettings.taxIncluded}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, taxIncluded: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Tax included in commission calculation</span>
                  </label>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleGlobalSettingsSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Global Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Vendor Commissions Tab */}
            {activeTab === 'vendors' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Vendor Commission Rates</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Set commission rates for active vendors. Only verified vendors can have custom commission rates.
                        <a 
                          href="/superadmin/vendors/verification" 
                          className="text-blue-600 hover:text-blue-800 ml-1 underline"
                        >
                          Manage vendor verification here
                        </a>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search vendors..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Active Vendors</option>
                        <option value="verified">Verified Only</option>
                        <option value="custom">Custom Commission</option>
                      </select>
                      <button
                        onClick={loadCommissionData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Refresh vendor data"
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendors
                        .filter(vendor => {
                          const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
                          
                          const matchesFilter = filterStatus === 'all' || 
                                               (filterStatus === 'verified' && (vendor.verified || vendor.isVerified)) ||
                                               (filterStatus === 'custom' && vendor.hasCustomCommission);
                          
                          return matchesSearch && matchesFilter;
                        })
                        .map((vendor) => (
                        <tr key={vendor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{vendor.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                vendor.verified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {vendor.verified ? 'Verified' : 'Unverified'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                vendor.status === 'active' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {vendor.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {vendor.verified ? (
                                <>
                                  <input
                                    type="number"
                                    value={vendor.commissionRate || 10}
                                    onChange={(e) => {
                                      const vendorId = vendor.id || vendor._id || vendor.vendorId;
                                      if (!vendorId) {
                                        console.error('❌ Vendor ID is missing:', vendor);
                                        alert('Error: Vendor ID is missing. Please refresh the page.');
                                        return;
                                      }
                                      handleVendorCommissionUpdate(vendorId, parseFloat(e.target.value));
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                  />
                                  <span className="text-sm text-gray-500">%</span>
                                  {vendor.hasCustomCommission && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Custom</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Verify first</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {vendor.verified ? (
                                <>
                                  <button 
                                    onClick={() => openCommissionModal(vendor)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit Commission Rate"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (confirm(`Reset commission rate for ${vendor.name} to global default?`)) {
                                        // Reset to global default
                                        handleVendorCommissionUpdate(vendor.id, globalSettings.defaultCommission);
                                      }
                                    }}
                                    className="text-orange-600 hover:text-orange-900"
                                    title="Reset to Default"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => {
                                    alert('Please verify this vendor first on the Vendor Verification page before setting commission rates.');
                                  }}
                                  className="text-gray-400 cursor-not-allowed"
                                  title="Verify vendor first"
                                  disabled
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Commission Rate Modal */}
      {showCommissionModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Set Commission Rate</h2>
                <button
                  onClick={closeCommissionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor: {selectedVendor.name}
                </label>
                <p className="text-sm text-gray-500 mb-4">{selectedVendor.email}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={globalSettings.minimumCommission}
                    max={globalSettings.maximumCommission}
                    step="0.1"
                    placeholder={`${globalSettings.minimumCommission} - ${globalSettings.maximumCommission}%`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be between {globalSettings.minimumCommission}% and {globalSettings.maximumCommission}%
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <button
                    onClick={closeCommissionModal}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex-1">
                  <button
                    onClick={handleCommissionSubmit}
                    disabled={loading || !commissionRate}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Commission'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
