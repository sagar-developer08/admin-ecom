'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import FormInput from '../../../../components/shared/FormInput';
import FormSelect from '../../../../components/shared/FormSelect';
import { Settings, Save } from 'lucide-react';

export default function GeneralSettingsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    siteName: 'QLIQ',
    siteDescription: '',
    defaultCurrency: 'USD',
    defaultLanguage: 'en',
    timezone: 'America/New_York',
    maintenanceMode: false,
    defaultCommissionRate: '12',
    taxRate: '8'
  });

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
            <p className="text-gray-600 mt-1">Configure system-wide settings</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Site Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Site Name" name="siteName" value={formData.siteName} onChange={(e) => setFormData({ ...formData, siteName: e.target.value })} />
                  <FormSelect label="Default Currency" name="defaultCurrency" value={formData.defaultCurrency} onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })} options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
                  <FormSelect label="Default Language" name="defaultLanguage" value={formData.defaultLanguage} onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })} options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }]} />
                  <FormSelect label="Timezone" name="timezone" value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} options={[{ value: 'America/New_York', label: 'Eastern Time' }, { value: 'America/Los_Angeles', label: 'Pacific Time' }]} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Business Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Default Commission Rate (%)" name="defaultCommissionRate" type="number" value={formData.defaultCommissionRate} onChange={(e) => setFormData({ ...formData, defaultCommissionRate: e.target.value })} />
                  <FormInput label="Tax Rate (%)" name="taxRate" type="number" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} />
                </div>
                
                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.maintenanceMode} onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })} className="w-4 h-4 text-blue-600" />
                    <span>Maintenance Mode</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

