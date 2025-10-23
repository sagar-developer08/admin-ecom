'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  UserCheck, 
  UserX, 
  Eye, 
  FileText, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  Clock
} from 'lucide-react';
import vendorService from '../../../../lib/services/vendorService';

export default function VendorVerification() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
      fetchVendors();
    }
  }, [user]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getAllVendors();
      console.log('API Response:', response);
      
      // Use the data as-is from the API (no transformation needed)
      const vendorsData = response.data || [];
      
      // Add default business name and documents if not present, and normalize ID field
      const transformedVendors = vendorsData.map(vendor => ({
        ...vendor,
        id: vendor.id || vendor._id, // Handle both id and _id fields
        businessName: vendor.businessName || 'N/A',
        documents: vendor.documents || {
          businessLicense: 'business_license.pdf',
          taxId: 'tax_id.pdf',
          bankAccount: 'bank_account.pdf'
        }
      }));
      
      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      // Fallback to mock data - matching real API response structure
      setVendors([
        {
          id: '68e603782be27293e45b44bb',
          name: 'Rohit singh',
          email: 'vendor@qliq.ae',
          role: 'vendor',
          status: 'active',
          verified: true,
          phone: '8689912326',
          createdAt: '2025-10-08T06:23:52.557Z',
          cognitoUserId: '3296c0f4-d0e1-7045-3d3c-9e842c5e009c',
          businessName: 'QLIQ',
          documents: {
            businessLicense: 'business_license_123.pdf',
            taxId: 'tax_id_123.pdf',
            bankAccount: 'bank_account_123.pdf'
          }
        },
        {
          id: '68df6a76c3f7bbb457643776',
          name: 'Default Vendor',
          email: 'vendor@qliq.com',
          role: 'vendor',
          status: 'inactive',
          verified: false,
          phone: '971500000002',
          createdAt: '2025-10-03T06:17:26.096Z',
          cognitoUserId: 'vendor@qliq.com',
          businessName: 'Default Business',
          documents: {
            businessLicense: 'business_license_456.pdf',
            taxId: 'tax_id_456.pdf',
            bankAccount: 'bank_account_456.pdf'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (vendorId) => {
    try {
      console.log('Verifying vendor with ID:', vendorId);
      if (!vendorId) {
        alert('Error: Vendor ID is missing');
        return;
      }
      await vendorService.verifyVendor(vendorId, { verified: true });
      fetchVendors();
      alert('Vendor verified successfully! You can now set commission rates for this vendor on the Commission Settings page.');
    } catch (error) {
      console.error('Error verifying vendor:', error);
      alert('Error verifying vendor: ' + error.message);
    }
  };

  const handleReject = async (vendorId, reason) => {
    try {
      const rejectionReason = reason || prompt('Please provide a reason for rejection:');
      if (rejectionReason) {
        await vendorService.verifyVendor(vendorId, { 
          verified: false, 
          rejectionReason
        });
        fetchVendors();
        alert('Vendor verification rejected.');
      }
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      alert('Error rejecting vendor: ' + error.message);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Use verified field from User model
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'pending' && !vendor.verified) ||
                         (filterStatus === 'verified' && vendor.verified) ||
                         (filterStatus === 'rejected' && !vendor.verified && vendor.rejectionReason);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: vendors.length,
    pending: vendors.filter(v => !v.isVerified && v.status !== 'rejected').length,
    verified: vendors.filter(v => v.isVerified).length,
    rejected: vendors.filter(v => v.status === 'rejected').length
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
                    <UserCheck className="h-8 w-8 text-blue-600" />
                    Vendor Verification
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Verify vendor documents and approve vendor accounts. After verification, you can set commission rates on the 
                    <a 
                      href="/superadmin/vendors/commission" 
                      className="text-blue-600 hover:text-blue-800 ml-1 underline"
                    >
                      Commission Settings page
                    </a>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
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
                    <option value="all">All Vendors</option>
                    <option value="pending">Pending Verification</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {vendor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                              <div className="text-sm text-gray-500">{vendor.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vendor.businessName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vendor.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vendor.verified 
                                ? 'bg-green-100 text-green-800' 
                                : vendor.rejectionReason
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {vendor.verified ? 'Verified' : vendor.rejectionReason ? 'Rejected' : 'Pending'}
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
                            {vendor.documents?.businessLicense && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">License</span>
                            )}
                            {vendor.documents?.taxId && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Tax ID</span>
                            )}
                            {vendor.documents?.bankAccount && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Bank</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {!vendor.verified && (
                              <>
                                <button
                                  onClick={() => handleVerify(vendor.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Verify"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(vendor.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject"
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
              </div>
            </div>

            {filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Vendor Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedVendor.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedVendor.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedVendor.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name</label>
                      <p className="text-sm text-gray-900">{selectedVendor.businessName}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                  <div className="space-y-2">
                    {selectedVendor.documents?.businessLicense && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">Business License</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                      </div>
                    )}
                    {selectedVendor.documents?.taxId && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">Tax ID</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                      </div>
                    )}
                    {selectedVendor.documents?.bankAccount && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">Bank Account</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                      </div>
                    )}
                  </div>
                </div>

                {!selectedVendor.verified && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleVerify(selectedVendor.id);
                        setShowModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Verify Vendor
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedVendor.id);
                        setShowModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject Vendor
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Fixed footer for action buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {!selectedVendor.verified ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleVerify(selectedVendor.id);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✓ Verify Vendor
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedVendor.id);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ✗ Reject Vendor
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-800 bg-green-50 p-4 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">This vendor has been verified (Commission Model)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
