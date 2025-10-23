'use client';

import { useState, useEffect } from 'react';
import { vendorService } from '../../lib/services/vendorService';

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    verified: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionRate, setCommissionRate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [filter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await vendorService.getAllVendors(params);
      
      if (response.success) {
        setVendors(response.data || []);
        setStats(response.stats || {});
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendVendor = async (vendorId, reason) => {
    try {
      const response = await vendorService.suspendVendor(vendorId, reason);
      if (response.success) {
        alert('Vendor suspended successfully');
        fetchVendors();
        setShowRejectModal(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error suspending vendor:', error);
      alert('Failed to suspend vendor');
    }
  };

  const handleActivateVendor = async (vendorId) => {
    try {
      const response = await vendorService.activateVendor(vendorId);
      if (response.success) {
        alert('Vendor activated successfully');
        fetchVendors();
      }
    } catch (error) {
      console.error('Error activating vendor:', error);
      alert('Failed to activate vendor');
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedVendor || !commissionRate) {
      alert('Please enter a valid commission rate');
      return;
    }

    try {
      const response = await vendorService.updateVendorCommission(
        selectedVendor._id,
        parseFloat(commissionRate)
      );
      
      if (response.success) {
        alert('Commission updated successfully');
        fetchVendors();
        setShowCommissionModal(false);
        setSelectedVendor(null);
        setCommissionRate('');
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Failed to update commission');
    }
  };

  const handleVerifyVendor = async (vendorId, verified) => {
    try {
      const response = await vendorService.verifyVendor(vendorId, { verified });
      if (response.success) {
        alert(verified ? 'Vendor verified successfully' : 'Vendor verification rejected');
        fetchVendors();
      }
    } catch (error) {
      console.error('Error verifying vendor:', error);
      alert('Failed to verify vendor');
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
        <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
        <p className="text-gray-600 mt-1">Manage vendor accounts, commissions, and status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Vendors</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-600">Active</div>
          <div className="text-2xl font-bold text-green-700">{stats.active}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-sm text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-sm text-red-600">Suspended</div>
          <div className="text-2xl font-bold text-red-700">{stats.suspended}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="text-sm text-blue-600">Verified</div>
          <div className="text-2xl font-bold text-blue-700">{stats.verified}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('suspended')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'suspended' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Suspended
        </button>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
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
                Verified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors.map((vendor) => (
              <tr key={vendor.id || vendor._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                  <div className="text-sm text-gray-500">ID: {vendor.id || vendor._id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{vendor.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vendor.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : vendor.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {vendor.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vendor.isVerified || vendor.verified
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {vendor.isVerified || vendor.verified ? 'Verified' : 'Not Verified'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{vendor.commissionRate || 10}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    {vendor.status !== 'active' && (
                      <button
                        onClick={() => handleActivateVendor(vendor.id || vendor._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Activate
                      </button>
                    )}
                    {vendor.status === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setShowRejectModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Suspend
                      </button>
                    )}
                    {!(vendor.isVerified || vendor.verified) && (
                      <button
                        onClick={() => handleVerifyVendor(vendor.id || vendor._id, true)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setCommissionRate(vendor.commissionRate || '10');
                        setShowCommissionModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Commission
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {vendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No vendors found</p>
          </div>
        )}
      </div>

      {/* Commission Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update Commission Rate</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set commission rate for {selectedVendor?.name}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter commission rate"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCommissionModal(false);
                  setSelectedVendor(null);
                  setCommissionRate('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCommission}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject/Suspend Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Suspend Vendor</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide a reason for suspending {selectedVendor?.name}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suspension Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="4"
                placeholder="Enter reason for suspension"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedVendor(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspendVendor(selectedVendor?.id || selectedVendor?._id, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

