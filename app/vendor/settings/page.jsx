'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import FormInput from '../../../components/shared/FormInput';
import FormSelect from '../../../components/shared/FormSelect';
import { Settings, Save } from 'lucide-react';

export default function VendorSettingsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    taxId: '',
    bankAccount: '',
    notificationEmail: true,
    notificationSMS: false
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
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
        taxId: user.taxId || '',
        bankAccount: user.bankAccount || '',
        notificationEmail: true,
        notificationSMS: false
      });
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert('Settings saved successfully!');
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
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Business Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <FormInput
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <FormInput
                    label="Business Name"
                    name="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Tax ID"
                    name="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                  <FormInput
                    label="Bank Account"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.notificationEmail}
                      onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Email Notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.notificationSMS}
                      onChange={(e) => setFormData({ ...formData, notificationSMS: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>SMS Notifications</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

