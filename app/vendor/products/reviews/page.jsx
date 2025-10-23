'use client';

import React, { useState, useEffect } from 'react';
import { Star, Filter, Search, Eye, MessageSquare, ThumbsUp, ThumbsDown, Calendar, User } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { reviewService } from '../../../../lib/services/reviewService';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const VendorProductReviewsPage = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rating: '',
    status: '',
    dateRange: '',
    search: ''
  });
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: {}
  });

  useEffect(() => {
    console.log('🔍 User object:', user);
    console.log('🔍 User vendorId:', user?.vendorId);
    if (user?.vendorId) {
      fetchVendorReviews();
      fetchReviewStats();
    } else {
      console.log('❌ No vendorId found in user object');
      setLoading(false);
    }
  }, [user, filters]);

  const fetchVendorReviews = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching reviews for vendor:', user?.vendorId);
      console.log('🔍 Filters:', filters);
      
      // Fetch reviews for products that belong to this vendor only
      const response = await reviewService.getVendorReviews({
        ...filters
      });
      
      console.log('📊 Vendor reviews response:', response);
      
      const reviewsData = Array.isArray(response) ? response : 
                         (response?.data && Array.isArray(response.data)) ? response.data :
                         (response?.reviews && Array.isArray(response.reviews)) ? response.reviews : [];
      
      setReviews(reviewsData);
      console.log('✅ Parsed vendor reviews:', reviewsData);
    } catch (error) {
      console.error('Error fetching vendor reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      console.log('🔍 Fetching review stats for vendor:', user.vendorId);
      const response = await reviewService.getVendorReviewStats(user.vendorId);
      console.log('📊 Review stats response:', response);
      const statsData = response?.data || response || {};
      setStats(statsData);
    } catch (error) {
      console.error('❌ Error fetching review stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="vendor"
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Reviews</h1>
              <p className="text-gray-600">
                Reviews for your products from customers
              </p>
            </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviews.filter(review => {
                    const reviewDate = new Date(review.createdAt);
                    const currentDate = new Date();
                    return reviewDate.getMonth() === currentDate.getMonth() && 
                           reviewDate.getFullYear() === currentDate.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Ratings</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow-sm">
          {reviews.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
              <p className="text-gray-600">
                You don't have any product reviews yet. Reviews will appear here once customers start reviewing your products.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reviews.map((review) => (
                <div key={review._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {review.customerName || 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(review.rating)}`}>
                          {review.rating} Star{review.rating !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {review.productName || 'Product Review'}
                        </h4>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>

                      {review.images && review.images.length > 0 && (
                        <div className="flex space-x-2 mb-4">
                          {review.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Review image ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">{review.likes || 0}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600">
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-sm">{review.dislikes || 0}</span>
                          </button>
                        </div>

                        {review.reply && (
                          <div className="flex items-center space-x-2 text-blue-600">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">Replied</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        review.status === 'approved' ? 'bg-green-100 text-green-800' :
                        review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                  </div>

                  {review.reply && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">Your Reply</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.reply.message}</p>
                    </div>
                  )}
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
};

export default VendorProductReviewsPage;
