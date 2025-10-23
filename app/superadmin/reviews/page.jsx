'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { 
  Star, 
  MessageSquare, 
  User, 
  Package, 
  Store, 
  TrendingUp, 
  Filter,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Calendar,
  ArrowUpDown,
  Award,
  BarChart3,
  Clock
} from 'lucide-react';
import reviewService from '../../../lib/services/reviewService';
import productService from '../../../lib/services/productService';
import vendorService from '../../../lib/services/vendorService';

const ReviewsPage = () => {
  const { user, isLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    fiveStarReviews: 0,
    oneStarReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [filters, setFilters] = useState({
    rating: 'all',
    status: 'all',
    product: 'all',
    vendor: 'all',
    dateRange: 'all',
    search: ''
  });

  useEffect(() => {
    if (!isLoading && user) {
      fetchData();
    }
  }, [isLoading, user]);

  useEffect(() => {
    applyFilters();
  }, [reviews, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reviews first (this is the main data we need)
      const reviewsResponse = await reviewService.getAllReviews();
      console.log('Reviews API Response:', reviewsResponse);

      if (reviewsResponse.success) {
        const reviewsData = reviewsResponse.data?.reviews || [];
        console.log('Reviews Data:', reviewsData);
        setReviews(reviewsData);
        calculateStats(reviewsData);
        calculateTopProducts(reviewsData);
      } else {
        console.error('Reviews API Error:', reviewsResponse.message);
      }

      // Try to fetch products and vendors, but don't fail if they're not accessible
      try {
        const productsResponse = await productService.getAllProducts();
        if (productsResponse.success && Array.isArray(productsResponse.data)) {
          setProducts(productsResponse.data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.warn('Could not fetch products:', error.message);
        setProducts([]);
      }

      try {
        const vendorsResponse = await vendorService.getAllVendors();
        if (vendorsResponse.success && Array.isArray(vendorsResponse.data)) {
          setVendors(vendorsResponse.data);
        } else {
          setVendors([]);
        }
      } catch (error) {
        console.warn('Could not fetch vendors (permission issue):', error.message);
        setVendors([]);
      }
    } catch (error) {
      console.error('Error fetching reviews data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsData) => {
    const total = reviewsData.length;
    const averageRating = total > 0 ? 
      reviewsData.reduce((sum, review) => sum + review.rating, 0) / total : 0;
    const fiveStar = reviewsData.filter(r => r.rating === 5).length;
    const oneStar = reviewsData.filter(r => r.rating === 1).length;
    const pending = reviewsData.filter(r => r.status === 'pending').length;
    const approved = reviewsData.filter(r => r.status === 'approved').length;
    const rejected = reviewsData.filter(r => r.status === 'rejected').length;

    setStats({
      totalReviews: total,
      averageRating,
      fiveStarReviews: fiveStar,
      oneStarReviews: oneStar,
      pendingReviews: pending,
      approvedReviews: approved,
      rejectedReviews: rejected
    });
  };

  const calculateTopProducts = (reviewsData) => {
    // Group reviews by product
    const productReviews = {};
    reviewsData.forEach(review => {
      const productId = review.productId;
      if (!productReviews[productId]) {
        productReviews[productId] = {
          productId,
          productName: review.productName || 'Unknown Product',
          reviews: [],
          totalRating: 0,
          averageRating: 0,
          reviewCount: 0
        };
      }
      productReviews[productId].reviews.push(review);
      productReviews[productId].totalRating += review.rating;
      productReviews[productId].reviewCount += 1;
    });

    // Calculate average ratings
    Object.values(productReviews).forEach(product => {
      product.averageRating = product.totalRating / product.reviewCount;
    });

    // Sort by review count and rating
    const sortedProducts = Object.values(productReviews)
      .sort((a, b) => {
        // First by review count, then by average rating
        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }
        return b.averageRating - a.averageRating;
      })
      .slice(0, 10); // Top 10 products

    setTopProducts(sortedProducts);
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    // Rating filter
    if (filters.rating !== 'all') {
      filtered = filtered.filter(r => r.rating === parseInt(filters.rating));
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // Product filter
    if (filters.product !== 'all') {
      filtered = filtered.filter(r => r.productId === filters.product);
    }

    // Vendor filter
    if (filters.vendor !== 'all') {
      filtered = filtered.filter(r => r.vendorId === filters.vendor);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(r => new Date(r.createdAt) >= filterDate);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(searchTerm) ||
        r.userId?.toLowerCase().includes(searchTerm) ||
        r.productId?.toLowerCase().includes(searchTerm) ||
        r.comment?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredReviews(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReviewAction = async (reviewId, action) => {
    try {
      let response;
      if (action === 'approve') {
        response = await reviewService.updateProductReview(reviewId, { status: 'approved' });
      } else if (action === 'reject') {
        response = await reviewService.updateProductReview(reviewId, { status: 'rejected' });
      }
      
      if (response.success) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error(`Error ${action}ing review:`, error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar userType="superadmin" user={user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
              <p className="text-gray-600 mt-1">Manage customer reviews and product ratings</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowUpDown className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ThumbsUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">5-Star Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.fiveStarReviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products Section */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Most Reviewed & Highly Rated Products
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topProducts.map((product, index) => (
                  <div key={product.productId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">
                        #{index + 1} {product.productName}
                      </h3>
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      {getRatingStars(Math.round(product.averageRating))}
                      <span className="ml-2 text-sm text-gray-600">
                        {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.reviewCount} total reviews
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className={`grid grid-cols-1 md:grid-cols-${Array.isArray(vendors) && vendors.length > 0 ? '6' : '5'} gap-4`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <select
                  value={filters.product}
                  onChange={(e) => handleFilterChange('product', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Products</option>
                  {Array.isArray(products) && products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>

              {Array.isArray(vendors) && vendors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor/Store</label>
                  <select
                    value={filters.vendor}
                    onChange={(e) => handleFilterChange('vendor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Vendors</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id || vendor.id} value={vendor._id || vendor.id}>
                        {vendor.name || vendor.businessName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer & Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store/Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReviews.map((review) => (
                    <tr key={review._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {review.title || review.userId || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Product ID: {review.productId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRatingStars(review.rating)}
                          <span className="ml-2 text-sm text-gray-600">
                            {review.rating}/5
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {review.comment || 'No comment'}
                        </div>
                        {review.images && review.images.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {review.images.length} image(s)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Store ID: {review.storeId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(review.createdAt).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {new Date(review.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {review.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleReviewAction(review._id, 'approve')}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReviewAction(review._id, 'reject')}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button className="text-blue-600 hover:text-blue-900" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-orange-600 hover:text-orange-900" title="Flag">
                            <Flag className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReviews.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.rating !== 'all' || filters.status !== 'all' || filters.product !== 'all' || filters.vendor !== 'all' || filters.dateRange !== 'all' || filters.search
                    ? 'Try adjusting your filters to see more results.'
                    : 'No reviews have been submitted yet.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReviewsPage;
