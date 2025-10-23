import React from 'react';
import MetricCard from './MetricCard';
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Package,
  Star,
  Users,
  CreditCard,
  BarChart3
} from 'lucide-react';

const VendorDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Good Morning!</h2>
            <p className="text-blue-100">Welcome to your Vendor Dashboard</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              + Create Gigs
            </button>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              My Networks
            </button>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Launch Tour
            </button>
          </div>
        </div>
      </div>

      {/* Account Health Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Account Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="My Rating"
            value="8/10"
            subtitle="Customer satisfaction"
            icon={Star}
            trend="up"
            trendValue="+0.2"
          />
          <MetricCard
            title="Order Acceptance Rate"
            value="60%"
            subtitle="Last 30 days"
            icon={ShoppingBag}
            trend="down"
            trendValue="-5%"
          />
          <MetricCard
            title="Order Fulfillment Rate"
            value="70%"
            subtitle="On-time delivery"
            icon={Package}
            trend="up"
            trendValue="+3%"
          />
          <MetricCard
            title="Late Dispatch Rate"
            value="80%"
            subtitle="Timely shipping"
            icon={TrendingUp}
            trend="up"
            trendValue="+2%"
          />
          <MetricCard
            title="Order Return Rate"
            value="15%"
            subtitle="Return requests"
            icon={BarChart3}
            trend="down"
            trendValue="-2%"
          />
        </div>
      </div>

      {/* Global Snapshot Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Global Snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Sales"
            value="AED 0.0"
            subtitle="Today so far"
            icon={DollarSign}
            trend="up"
            trendValue="+0%"
          />
          <MetricCard
            title="Total Potential Sales"
            value="500"
            subtitle="Pending orders"
            icon={TrendingUp}
            trend="up"
            trendValue="+25"
          />
          <MetricCard
            title="Open Orders"
            value="0"
            subtitle="Total Count"
            icon={ShoppingBag}
            trend="down"
            trendValue="-5"
          />
          <MetricCard
            title="Campaigns"
            value="0"
            subtitle="Active Campaigns"
            icon={BarChart3}
            trend="up"
            trendValue="+1"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="My Gigs"
            value="10"
            subtitle="Active Gigs"
            icon={Package}
            trend="up"
            trendValue="+2"
          />
          <MetricCard
            title="My Qoyn Wallet"
            value="5000"
            subtitle="Expires in 29 Days"
            icon={CreditCard}
            trend="up"
            trendValue="+500"
          />
          <MetricCard
            title="My Cash Wallet"
            value="$1000"
            subtitle="Available Balance"
            icon={DollarSign}
            trend="up"
            trendValue="+$150"
          />
          <MetricCard
            title="My Network"
            value="200"
            subtitle="Total connections"
            icon={Users}
            trend="up"
            trendValue="+12"
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Order #12345</span>
                  <p className="text-xs text-gray-500">Customer: John Doe</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">AED 150.00</span>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Order #12344</span>
                  <p className="text-xs text-gray-500">Customer: Jane Smith</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">AED 89.50</span>
                <p className="text-xs text-gray-500">Processing</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Order #12343</span>
                  <p className="text-xs text-gray-500">Customer: Mike Johnson</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">AED 245.00</span>
                <p className="text-xs text-gray-500">Shipped</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Order #12342</span>
                  <p className="text-xs text-gray-500">Customer: Sarah Wilson</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">AED 75.00</span>
                <p className="text-xs text-gray-500">Cancelled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Wireless Headphones</span>
                <span className="text-sm font-medium text-gray-900">45 sales</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Smart Watch</span>
                <span className="text-sm font-medium text-gray-900">32 sales</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Phone Case</span>
                <span className="text-sm font-medium text-gray-900">28 sales</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
                <span className="text-sm text-gray-600">4.8/5.0 average rating</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>"Great product quality and fast shipping!"</p>
                <p className="text-xs text-gray-500 mt-1">- Recent customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
