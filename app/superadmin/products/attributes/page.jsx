'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import { attributeService } from '../../../../lib/services/attributeService';

export default function AttributeManagementPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'text',
    dataType: 'string',
    required: false,
    minLength: '',
    maxLength: '',
    minValue: '',
    maxValue: '',
    options: [],
    categoryIds: [],
    displayOrder: 0,
    showInListing: false,
    showInDetail: true,
    showInComparison: false,
    searchable: true,
    filterable: true,
    facetable: true,
    status: 'active'
  });
  const [newOption, setNewOption] = useState({ value: '', displayName: '' });
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState({
    totalAttributes: 0,
    activeAttributes: 0,
    inactiveAttributes: 0,
    requiredAttributes: 0,
    optionalAttributes: 0,
    selectAttributes: 0,
    textAttributes: 0,
    numberAttributes: 0,
    booleanAttributes: 0,
    multiselectAttributes: 0,
    totalOptions: 0,
    lastUpdated: null
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user?.role !== 'superadmin') {
      router.push('/admin');
      return;
    }
    if (user) {
      fetchAttributes();
      fetchCategories();
    }
  }, [user, isLoading, router, searchTerm, statusFilter]);

  const calculateMetrics = (attributesData) => {
    const totalAttributes = attributesData.length;
    const activeAttributes = attributesData.filter(attr => attr.status === 'active').length;
    const inactiveAttributes = attributesData.filter(attr => attr.status === 'inactive').length;
    const requiredAttributes = attributesData.filter(attr => attr.required).length;
    const optionalAttributes = totalAttributes - requiredAttributes;
    
    const selectAttributes = attributesData.filter(attr => attr.type === 'select').length;
    const textAttributes = attributesData.filter(attr => attr.type === 'text').length;
    const numberAttributes = attributesData.filter(attr => attr.type === 'number').length;
    const booleanAttributes = attributesData.filter(attr => attr.type === 'boolean').length;
    const multiselectAttributes = attributesData.filter(attr => attr.type === 'multiselect').length;
    
    const totalOptions = attributesData.reduce((sum, attr) => {
      return sum + (attr.options ? attr.options.length : 0);
    }, 0);

    return {
      totalAttributes,
      activeAttributes,
      inactiveAttributes,
      requiredAttributes,
      optionalAttributes,
      selectAttributes,
      textAttributes,
      numberAttributes,
      booleanAttributes,
      multiselectAttributes,
      totalOptions,
      lastUpdated: new Date().toLocaleString()
    };
  };

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const response = await attributeService.getAllAttributes(params);
      
      if (response.success) {
        const attributesData = response.data || [];
        setAttributes(attributesData);
        setMetrics(calculateMetrics(attributesData));
        console.log('✅ Attributes fetched successfully:', attributesData.length, 'attributes');
      } else {
        console.error('❌ Failed to fetch attributes:', response.message);
        setAttributes([]);
        setMetrics(calculateMetrics([]));
      }
    } catch (error) {
      console.error('❌ Error fetching attributes:', error);
      setAttributes([]);
      setMetrics(calculateMetrics([]));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8003/api/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        minLength: formData.minLength ? parseInt(formData.minLength) : undefined,
        maxLength: formData.maxLength ? parseInt(formData.maxLength) : undefined,
        minValue: formData.minValue ? parseFloat(formData.minValue) : undefined,
        maxValue: formData.maxValue ? parseFloat(formData.maxValue) : undefined,
        displayOrder: parseInt(formData.displayOrder),
        categoryIds: formData.categoryIds
      };

      let response;
      if (editingAttribute) {
        response = await attributeService.updateAttribute(editingAttribute._id, submitData);
      } else {
        response = await attributeService.createAttribute(submitData);
      }
      
      if (response.success) {
        setShowCreateModal(false);
        setEditingAttribute(null);
        resetForm();
        fetchAttributes();
        console.log('✅ Attribute saved successfully');
      } else {
        alert(response.message || 'Failed to save attribute');
      }
    } catch (error) {
      console.error('❌ Error saving attribute:', error);
      alert('Failed to save attribute');
    }
  };

  const handleDelete = async (attributeId) => {
    if (confirm('Are you sure you want to delete this attribute?')) {
      try {
        const response = await attributeService.deleteAttribute(attributeId);
        
        if (response.success) {
          fetchAttributes();
          console.log('✅ Attribute deleted successfully');
        } else {
          alert(response.message || 'Failed to delete attribute');
        }
      } catch (error) {
        console.error('❌ Error deleting attribute:', error);
        alert('Failed to delete attribute');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      type: 'text',
      dataType: 'string',
      required: false,
      minLength: '',
      maxLength: '',
      minValue: '',
      maxValue: '',
      options: [],
      categoryIds: [],
      displayOrder: 0,
      showInListing: false,
      showInDetail: true,
      showInComparison: false,
      searchable: true,
      filterable: true,
      facetable: true,
      status: 'active'
    });
    setNewOption({ value: '', displayName: '' });
  };

  const openEditModal = (attribute) => {
    setEditingAttribute(attribute);
    setFormData({
      ...attribute,
      minLength: attribute.minLength || '',
      maxLength: attribute.maxLength || '',
      minValue: attribute.minValue || '',
      maxValue: attribute.maxValue || '',
      categoryIds: attribute.categoryIds?.map(cat => cat._id) || []
    });
    setShowCreateModal(true);
  };

  const addOption = () => {
    if (newOption.value && newOption.displayName) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { ...newOption, sortOrder: prev.options.length }]
      }));
      setNewOption({ value: '', displayName: '' });
    }
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Attributes</h1>
              <p className="text-gray-600 mt-1">Manage product attribute definitions</p>
              {metrics.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {metrics.lastUpdated}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAttributes}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Search className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingAttribute(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Attribute</span>
              </button>
            </div>
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Attributes */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">A</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Attributes</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalAttributes}</p>
                </div>
              </div>
            </div>

            {/* Active Attributes */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">✓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeAttributes}</p>
                </div>
              </div>
            </div>

            {/* Required Attributes */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-sm">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Required</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.requiredAttributes}</p>
                </div>
              </div>
            </div>

            {/* Total Options */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">O</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Options</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalOptions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attribute Types Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attribute Types Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-semibold text-sm">S</span>
                </div>
                <p className="text-sm font-medium text-gray-500">Select</p>
                <p className="text-xl font-bold text-gray-900">{metrics.selectAttributes}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-semibold text-sm">T</span>
                </div>
                <p className="text-sm font-medium text-gray-500">Text</p>
                <p className="text-xl font-bold text-gray-900">{metrics.textAttributes}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-yellow-600 font-semibold text-sm">#</span>
                </div>
                <p className="text-sm font-medium text-gray-500">Number</p>
                <p className="text-xl font-bold text-gray-900">{metrics.numberAttributes}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-semibold text-sm">B</span>
                </div>
                <p className="text-sm font-medium text-gray-500">Boolean</p>
                <p className="text-xl font-bold text-gray-900">{metrics.booleanAttributes}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-indigo-600 font-semibold text-sm">M</span>
                </div>
                <p className="text-sm font-medium text-gray-500">Multi-Select</p>
                <p className="text-xl font-bold text-gray-900">{metrics.multiselectAttributes}</p>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.totalAttributes}</div>
                <div className="text-sm text-gray-600">Total Attributes Created</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.activeAttributes} active, {metrics.inactiveAttributes} inactive
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.requiredAttributes}</div>
                <div className="text-sm text-gray-600">Required Attributes</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.optionalAttributes} optional
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.totalOptions}</div>
                <div className="text-sm text-gray-600">Total Options Available</div>
                <div className="text-xs text-gray-500 mt-1">
                  Across all select/multiselect attributes
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search attributes..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Attributes Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attributes.map((attribute) => (
                  <tr key={attribute._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{attribute.displayName}</div>
                        <div className="text-sm text-gray-500">{attribute.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {attribute.type}
                        </span>
                        {attribute.options && attribute.options.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {attribute.options.length} options
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        attribute.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {attribute.required ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        attribute.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {attribute.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attribute.categoryIds?.length > 0 ? (
                        <span>{attribute.categoryIds.length} categories</span>
                      ) : (
                        <span>All categories</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(attribute)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(attribute._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {attributes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No attributes found</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAttribute ? 'Edit Attribute' : 'Create New Attribute'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., color, size, material"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Color, Size, Material"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe this attribute..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="select">Select (Single)</option>
                      <option value="multiselect">Select (Multiple)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                {/* Options for select/multiselect */}
                {(formData.type === 'select' || formData.type === 'multiselect') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{option.value}:</span>
                          <span className="text-sm font-medium">{option.displayName}</span>
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newOption.value}
                          onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="Value"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={newOption.displayName}
                          onChange={(e) => setNewOption(prev => ({ ...prev, displayName: e.target.value }))}
                          placeholder="Display Name"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addOption}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation rules */}
                {formData.type === 'text' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Length</label>
                      <input
                        type="number"
                        value={formData.minLength}
                        onChange={(e) => setFormData(prev => ({ ...prev, minLength: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Length</label>
                      <input
                        type="number"
                        value={formData.maxLength}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxLength: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>
                )}

                {formData.type === 'number' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                      <input
                        type="number"
                        value={formData.minValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, minValue: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
                      <input
                        type="number"
                        value={formData.maxValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxValue: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                      className="mr-2"
                    />
                    Required
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showInListing}
                      onChange={(e) => setFormData(prev => ({ ...prev, showInListing: e.target.checked }))}
                      className="mr-2"
                    />
                    Show in Listing
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showInDetail}
                      onChange={(e) => setFormData(prev => ({ ...prev, showInDetail: e.target.checked }))}
                      className="mr-2"
                    />
                    Show in Detail
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.filterable}
                      onChange={(e) => setFormData(prev => ({ ...prev, filterable: e.target.checked }))}
                      className="mr-2"
                    />
                    Filterable
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingAttribute(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingAttribute ? 'Update' : 'Create'} Attribute
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
