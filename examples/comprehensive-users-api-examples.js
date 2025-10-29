/**
 * Example Usage of Comprehensive Users API
 * 
 * This demonstrates how to use the new API endpoints that include
 * user addresses and orders data
 */

// Example 1: Get all users with basic info only
const getBasicUsers = async () => {
  const response = await fetch('http://localhost:8888/api/auth/users?role=user&status=active&page=1&limit=20');
  const data = await response.json();
  
  console.log('Basic Users Response:', {
    usersCount: data.users.length,
    totalUsers: data.pagination.totalUsers,
    sampleUser: data.users[0]
  });
  
  return data;
};

// Example 2: Get users with addresses and orders (comprehensive)
const getUsersWithDetails = async () => {
  const response = await fetch('http://localhost:8888/api/auth/users-with-details?role=user&status=active&page=1&limit=20&includeAddresses=true&includeOrders=true');
  const data = await response.json();
  
  console.log('Comprehensive Users Response:', {
    usersCount: data.users.length,
    totalUsers: data.pagination.totalUsers,
    stats: data.stats,
    sampleUser: {
      id: data.users[0].id,
      name: data.users[0].name,
      email: data.users[0].email,
      addressesCount: data.users[0].addresses?.length || 0,
      ordersCount: data.users[0].orders?.length || 0,
      orderStats: data.users[0].orderStats
    }
  });
  
  return data;
};

// Example 3: Get single user with comprehensive details
const getSingleUserWithDetails = async (userId) => {
  const response = await fetch(`http://localhost:8888/api/auth/users-with-details/${userId}?includeAddresses=true&includeOrders=true&addressLimit=10&orderLimit=10`);
  const data = await response.json();
  
  console.log('Single User Details:', {
    user: data.user,
    hasAddresses: data.user.addresses?.length > 0,
    hasOrders: data.user.orders?.length > 0,
    orderStats: data.user.orderStats
  });
  
  return data;
};

// Example 4: Get users with only addresses (no orders)
const getUsersWithAddressesOnly = async () => {
  const response = await fetch('http://localhost:8888/api/auth/users-with-details?role=user&status=active&page=1&limit=20&includeAddresses=true&includeOrders=false');
  const data = await response.json();
  
  console.log('Users with Addresses Only:', {
    usersCount: data.users.length,
    sampleUser: {
      id: data.users[0].id,
      name: data.users[0].name,
      addressesCount: data.users[0].addresses?.length || 0,
      hasOrders: !!data.users[0].orders
    }
  });
  
  return data;
};

// Example 5: Search users with comprehensive details
const searchUsersWithDetails = async (searchTerm) => {
  const response = await fetch(`http://localhost:8888/api/auth/users-with-details?role=user&status=active&page=1&limit=20&search=${searchTerm}&includeAddresses=true&includeOrders=true`);
  const data = await response.json();
  
  console.log('Search Results:', {
    searchTerm,
    resultsCount: data.users.length,
    totalUsers: data.pagination.totalUsers,
    results: data.users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      addressesCount: user.addresses?.length || 0,
      ordersCount: user.orders?.length || 0
    }))
  });
  
  return data;
};

// Example 6: Get users with different status filters
const getUsersByStatus = async (status) => {
  const response = await fetch(`http://localhost:8888/api/auth/users-with-details?role=user&status=${status}&page=1&limit=20&includeAddresses=true&includeOrders=true`);
  const data = await response.json();
  
  console.log(`Users with status '${status}':`, {
    usersCount: data.users.length,
    totalUsers: data.pagination.totalUsers,
    stats: data.stats
  });
  
  return data;
};

// Example Response Structure for Comprehensive API:
const exampleResponse = {
  users: [
    {
      id: "6900830f2e32a0f25e4b515d",
      name: "Ali User",
      email: "aliuser1@mailinator.com",
      role: "user",
      status: "active",
      phone: "+971566666666",
      createdAt: "2025-10-28T08:47:11.159Z",
      cognitoUserId: "02f67034-30f1-7066-452d-84faba9974d6",
      verified: true,
      
      // Addresses (if includeAddresses=true)
      addresses: [
        {
          id: "address_id_1",
          type: "HOME",
          isDefault: true,
          fullName: "Ali User",
          phone: "+971566666666",
          email: "aliuser1@mailinator.com",
          addressLine1: "123 Main Street",
          addressLine2: "Apt 4B",
          city: "Dubai",
          state: "Dubai",
          postalCode: "12345",
          country: "UAE",
          landmark: "Near Mall",
          instructions: "Ring doorbell twice",
          createdAt: "2025-10-28T08:47:11.159Z"
        }
      ],
      
      // Orders (if includeOrders=true)
      orders: [
        {
          id: "order_id_1",
          orderNumber: "ORD-001",
          status: "delivered",
          totalAmount: 299.99,
          createdAt: "2025-10-28T08:47:11.159Z",
          updatedAt: "2025-10-28T10:30:00.000Z",
          items: [
            {
              productId: "product_1",
              name: "Sample Product",
              quantity: 2,
              price: 149.99
            }
          ],
          shippingAddress: {
            fullName: "Ali User",
            addressLine1: "123 Main Street",
            city: "Dubai",
            state: "Dubai",
            postalCode: "12345"
          },
          paymentMethod: "credit_card"
        }
      ],
      
      // Order Statistics
      orderStats: {
        totalOrders: 5,
        totalSpent: 1299.95,
        averageOrderValue: 259.99,
        lastOrderDate: "2025-10-28T08:47:11.159Z",
        firstOrderDate: "2025-10-20T08:47:11.159Z"
      }
    }
  ],
  
  pagination: {
    page: 1,
    limit: 20,
    totalUsers: 52,
    totalPages: 3,
    hasNextPage: true,
    hasPrevPage: false
  },
  
  stats: {
    totalUsers: 52,
    activeUsers: 48,
    suspendedUsers: 4,
    verifiedUsers: 45,
    totalRevenue: 12599.50,
    totalOrders: 156,
    averageOrderValue: 80.77
  },
  
  filters: {
    search: "",
    status: "active",
    role: "user",
    includeAddresses: true,
    includeOrders: true
  }
};

// Usage Examples:
console.log('🚀 Comprehensive Users API Examples');
console.log('=====================================');

// Run examples (uncomment to test)
// getBasicUsers();
// getUsersWithDetails();
// getSingleUserWithDetails('6900830f2e32a0f25e4b515d');
// getUsersWithAddressesOnly();
// searchUsersWithDetails('Ali');
// getUsersByStatus('active');

export {
  getBasicUsers,
  getUsersWithDetails,
  getSingleUserWithDetails,
  getUsersWithAddressesOnly,
  searchUsersWithDetails,
  getUsersByStatus,
  exampleResponse
};
