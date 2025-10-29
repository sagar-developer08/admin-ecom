import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  BarChart3, 
  Settings, 
  LogOut,
  Store,
  Package,
  CreditCard,
  FileText,
  ShoppingCart,
  Tags,
  FolderTree,
  TrendingUp,
  DollarSign,
  Truck,
  Megaphone,
  MessageSquare,
  Star,
  FileSpreadsheet,
  Bell,
  Activity,
  Shield,
  Globe,
  LifeBuoy,
  Award,
  Boxes,
  Wallet,
  BarChart2,
  ChevronDown,
  ChevronRight,
  Users2,
  Package2,
  ClipboardList,
  BadgePercent,
  Image,
  UserCheck,
  Building
} from 'lucide-react';

const Sidebar = ({ isOpen, onToggle, userType = 'superadmin', onLogout }) => {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState({});

  // Load expanded sections from localStorage on mount
  useEffect(() => {
    const savedExpandedSections = localStorage.getItem('qliq-admin-expanded-sections');
    if (savedExpandedSections) {
      try {
        setExpandedSections(JSON.parse(savedExpandedSections));
      } catch (error) {
        console.error('Error parsing expanded sections from localStorage:', error);
      }
    }
  }, []);

  // Auto-expand sections based on current path
  useEffect(() => {
    if (pathname) {
      const sectionsToExpand = {};
      
      // Check if current path matches any submenu items
      if (pathname.includes('/superadmin/vendors')) {
        sectionsToExpand.vendors = true;
      }
      if (pathname.includes('/superadmin/products')) {
        sectionsToExpand.products = true;
      }
      if (pathname.includes('/superadmin/categories')) {
        sectionsToExpand.categories = true;
      }
      if (pathname.includes('/superadmin/orders')) {
        sectionsToExpand.orders = true;
      }
      if (pathname.includes('/superadmin/customers')) {
        sectionsToExpand.customers = true;
      }
      if (pathname.includes('/superadmin/reports')) {
        sectionsToExpand.reports = true;
      }
      if (pathname.includes('/superadmin/promotions')) {
        sectionsToExpand.promotions = true;
      }
      if (pathname.includes('/superadmin/support')) {
        sectionsToExpand.support = true;
      }
      if (pathname.includes('/superadmin/settings')) {
        sectionsToExpand.settings = true;
      }
      
      // Vendor paths
      if (pathname.includes('/vendor/products')) {
        sectionsToExpand.products = true;
      }
      if (pathname.includes('/vendor/inventory')) {
        sectionsToExpand.inventory = true;
      }
      if (pathname.includes('/vendor/orders')) {
        sectionsToExpand.orders = true;
      }
      // if (pathname.includes('/vendor/shipping')) {
      //   sectionsToExpand.shipping = true;
      // }
      if (pathname.includes('/vendor/financial')) {
        sectionsToExpand.financial = true;
      }
      if (pathname.includes('/vendor/marketing')) {
        sectionsToExpand.marketing = true;
      }
      if (pathname.includes('/vendor/store')) {
        sectionsToExpand.store = true;
      }
      if (pathname.includes('/vendor/reports')) {
        sectionsToExpand.reports = true;
      }
      
      // Only update if there are sections to expand and they're not already expanded
      const hasNewExpansions = Object.keys(sectionsToExpand).some(
        section => sectionsToExpand[section] && !expandedSections[section]
      );
      
      if (hasNewExpansions) {
        setExpandedSections(prev => {
          const updated = { ...prev, ...sectionsToExpand };
          localStorage.setItem('qliq-admin-expanded-sections', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [pathname, expandedSections]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const updated = {
        ...prev,
        [sectionId]: !prev[sectionId]
      };
      // Save to localStorage
      localStorage.setItem('qliq-admin-expanded-sections', JSON.stringify(updated));
      return updated;
    });
  };

  const superAdminMenuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/admin' 
    },
    { 
      id: 'vendors',
      icon: Store, 
      label: 'Vendor Management',
      children: [
        { label: 'All Vendors', href: '/superadmin/vendors' },
        { label: 'Vendor Verification', href: '/superadmin/vendors/verification' },
        { label: 'Commission Settings', href: '/superadmin/vendors/commission' },
        { label: 'Payouts', href: '/superadmin/vendors/payouts' },
      ]
    },
    { 
      id: 'products',
      icon: Package, 
      label: 'Product Management',
      children: [
        { label: 'All Products', href: '/superadmin/products' },
        { label: 'Pending Approval', href: '/superadmin/products/pending' },
        { label: 'Product Attributes', href: '/superadmin/products/attributes' },
      ]
    },
    { 
      id: 'categories',
      icon: FolderTree, 
      label: 'Categories & Catalog',
      children: [
        { label: 'All Categories', href: '/superadmin/categories' },
        { label: 'Brands', href: '/superadmin/brands' },
        { label: 'Category Tree', href: '/superadmin/categories/tree' },
      ]
    },
    { 
      id: 'orders',
      icon: ShoppingCart, 
      label: 'Order Management',
      children: [
        { label: 'All Orders', href: '/superadmin/orders' },
        { label: 'Pending Orders', href: '/superadmin/orders/pending' },
        { label: 'Returns & Refunds', href: '/superadmin/orders/returns' },
      ]
    },
    { 
      id: 'customers',
      icon: Users, 
      label: 'Customer Management',
      children: [
        { label: 'All Customers', href: '/superadmin/customers' },
      ]
    },
    { 
      id: 'payments',
      icon: CreditCard, 
      label: 'Payments & Finance',
      children: [
        { label: 'Transactions', href: '/superadmin/payments/transactions' },
        { label: 'Commission Reports', href: '/superadmin/payments/commission' },
      ]
    },
    // { 
    //   id: 'shipping',
    //   icon: Truck, 
    //   label: 'Shipping & Logistics',
    //   children: [
    //     { label: 'Shipping Providers', href: '/superadmin/shipping/providers' },
    //     { label: 'Shipping Zones', href: '/superadmin/shipping/zones' },
    //     { label: 'Shipping Rates', href: '/superadmin/shipping/rates' },
    //   ]
    // },
    { 
      id: 'marketing',
      icon: Megaphone, 
      label: 'Marketing & Promos',
      children: [
        { label: 'Coupons', href: '/superadmin/marketing/coupons' },
        { label: 'Flash Sales', href: '/superadmin/marketing/flash-sales' },
        { label: 'Banners', href: '/superadmin/marketing/banners' },
        { label: 'Email Campaigns', href: '/superadmin/marketing/campaigns' },
      ]
    },
    { 
      icon: Star, 
      label: 'Reviews & Ratings', 
      href: '/superadmin/reviews' 
    },
    { 
      id: 'reports',
      icon: FileSpreadsheet, 
      label: 'Reports & Analytics',
      children: [
        { label: 'Sales Reports', href: '/superadmin/reports/sales' },
        { label: 'Vendor Reports', href: '/superadmin/reports/vendors' },
        { label: 'Custom Reports', href: '/superadmin/reports/custom' },
        { label: 'Export Data', href: '/superadmin/reports/export' },
      ]
    },
    { 
      id: 'cms',
      icon: FileText, 
      label: 'CMS & Content',
      children: [
        { label: 'Pages', href: '/superadmin/cms/pages' },
        { label: 'Blogs', href: '/superadmin/cms/blogs' },
        { label: 'FAQs', href: '/superadmin/cms/faqs' },
        { label: 'Media Library', href: '/superadmin/cms/media' },
      ]
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      href: '/superadmin/notifications' 
    },
    { 
      icon: Activity, 
      label: 'Marketplace Activity', 
      href: '/superadmin/activity' 
    },
    { 
      icon: LifeBuoy, 
      label: 'Support & Tickets', 
      href: '/superadmin/support' 
    },
    { 
      id: 'settings',
      icon: Settings, 
      label: 'System Settings',
      children: [
        { label: 'General Settings', href: '/superadmin/settings/general' },
        { label: 'Email Settings', href: '/superadmin/settings/email' },
        { label: 'SMS Settings', href: '/superadmin/settings/sms' },
        { label: 'API Settings', href: '/superadmin/settings/api' },
        { label: 'Security', href: '/superadmin/settings/security' },
      ]
    },
  ];

  const vendorMenuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/vendor' 
    },
    { 
      id: 'products',
      icon: Package, 
      label: 'Products',
      children: [
        { label: 'All Products', href: '/vendor/products' },
        { label: 'Add Product', href: '/vendor/products/add' },
        { label: 'Bulk Upload', href: '/vendor/products/bulk' },
        { label: 'Product Reviews', href: '/vendor/products/reviews' },
      ]
    },
    { 
      id: 'inventory',
      icon: Boxes, 
      label: 'Inventory',
      children: [
        { label: 'Stock Management', href: '/vendor/inventory' },
        { label: 'Low Stock Alerts', href: '/vendor/inventory/alerts' },
      ]
    },
    { 
      id: 'orders',
      icon: ShoppingCart, 
      label: 'Orders',
      children: [
        { label: 'All Orders', href: '/vendor/orders' },
        { label: 'Pending Orders', href: '/vendor/orders/pending' },
        { label: 'Returns', href: '/vendor/orders/returns' },
      ]
    },
    // { 
    //   id: 'shipping',
    //   icon: Truck, 
    //   label: 'Shipping',
    //   children: [
    //     { label: 'Shipping Methods', href: '/vendor/shipping/methods' },
    //     { label: 'Tracking', href: '/vendor/shipping/tracking' },
    //     { label: 'Delivery Zones', href: '/vendor/shipping/zones' },
    //   ]
    // },
    { 
      id: 'financial',
      icon: DollarSign, 
      label: 'Financial',
      children: [
        { label: 'Earnings Overview', href: '/vendor/financial/earnings' },
        { label: 'Transactions', href: '/vendor/financial/transactions' },
        { label: 'Payouts', href: '/vendor/financial/payouts' },
        { label: 'Commission Details', href: '/vendor/financial/commission' },
      ]
    },
    { 
      icon: BarChart2, 
      label: 'Analytics', 
      href: '/vendor/analytics' 
    },
    { 
      id: 'store',
      icon: Building, 
      label: 'Store Management',
      children: [
        { label: 'Store Profile', href: '/vendor/store/profile' },
        { label: 'Store Policies', href: '/vendor/store/policies' },
        { label: 'Business Documents', href: '/vendor/store/documents' },
      ]
    },
    { 
      icon: Star, 
      label: 'Reviews & Ratings', 
      href: '/vendor/reviews' 
    },
    { 
      id: 'reports',
      icon: FileText, 
      label: 'Reports',
      children: [
        { label: 'Sales Reports', href: '/vendor/reports/sales' },
        { label: 'Inventory Reports', href: '/vendor/reports/inventory' },
        { label: 'Export Data', href: '/vendor/reports/export' },
      ]
    },
    { 
      icon: LifeBuoy, 
      label: 'Support', 
      href: '/vendor/support' 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      href: '/vendor/settings' 
    },
  ];

  const menuItems = userType === 'superadmin' ? superAdminMenuItems : vendorMenuItems;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:z-auto"
      )}>
        <div className="flex flex-col h-full w-64">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-gray-900">QLIQ</span>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isExpanded = expandedSections[item.id];
              
              // If item has children, render dropdown
              if (item.children) {
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleSection(item.id)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Submenu */}
                    {isExpanded && (
                      <div className="mt-1 ml-8 space-y-1">
                        {item.children.map((child, childIndex) => (
                          <Link
                            key={childIndex}
                            href={child.href}
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === child.href
                                ? 'text-blue-600 bg-blue-50 font-medium'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Regular menu item without children
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">A</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {userType === 'superadmin' ? 'Super Admin' : 'Vendor'}
                </p>
                <p className="text-xs text-gray-500">admin@qliq.com</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
