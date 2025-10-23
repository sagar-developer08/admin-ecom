# Admin Panel Environment Variables Setup

## Overview
This document describes all environment variables required for the admin panel application.

## Setup Instructions

1. Create a `.env.local` file in the root of the `admin` directory
2. Copy the variables below and update with your actual values
3. Never commit `.env.local` to version control

## Environment Variables

### Core API Services

```bash
# Authentication Service
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8888/api/auth

# Admin API (Consolidated Admin Services)
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:8009/api

# Product Catalog Service
NEXT_PUBLIC_PRODUCT_API_URL=http://localhost:8003/api

# Cart & Wishlist Service
NEXT_PUBLIC_CART_API_URL=http://localhost:8002/api

# Review Service
NEXT_PUBLIC_REVIEW_API_URL=http://localhost:8008/api

# Search & Filter Service
NEXT_PUBLIC_SEARCH_API_URL=http://localhost:8081/api
```

### Consolidated Admin Services

All these services are consolidated in `qliq-admin-api` (port 8009):

```bash
NEXT_PUBLIC_VENDOR_API_URL=http://localhost:8009/api
NEXT_PUBLIC_COMMISSION_API_URL=http://localhost:8009/api
NEXT_PUBLIC_CUSTOMER_API_URL=http://localhost:8009/api
NEXT_PUBLIC_PROMOTION_API_URL=http://localhost:8009/api
NEXT_PUBLIC_REPORT_API_URL=http://localhost:8009/api
NEXT_PUBLIC_SHIPPING_API_URL=http://localhost:8009/api
NEXT_PUBLIC_CMS_API_URL=http://localhost:8009/api
NEXT_PUBLIC_NOTIFICATION_API_URL=http://localhost:8009/api
NEXT_PUBLIC_CONFIG_API_URL=http://localhost:8009/api
NEXT_PUBLIC_SUPPORT_API_URL=http://localhost:8009/api
```

## Production Configuration

For production deployment, update the URLs:

```bash
NEXT_PUBLIC_AUTH_API_URL=https://backendauth.qliq.ae/api/auth
NEXT_PUBLIC_ADMIN_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_PRODUCT_API_URL=https://backendcatalog.qliq.ae/api
NEXT_PUBLIC_CART_API_URL=https://backendcart.qliq.ae/api
NEXT_PUBLIC_REVIEW_API_URL=https://review.qliq.ae/api
NEXT_PUBLIC_SEARCH_API_URL=https://search.qliq.ae/api

# Consolidated services (all point to admin API)
NEXT_PUBLIC_VENDOR_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_COMMISSION_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_CUSTOMER_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_PROMOTION_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_REPORT_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_SHIPPING_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_CMS_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_NOTIFICATION_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_CONFIG_API_URL=https://admin-api.qliq.ae/api
NEXT_PUBLIC_SUPPORT_API_URL=https://admin-api.qliq.ae/api
```

## Where These Variables Are Used

- **`admin/lib/apiClient.js`**: Centralized API client configuration
- **`admin/lib/api.js`**: Authentication API service
- **`admin/app/superadmin/categories/tree/page.jsx`**: Category management

## API Client Usage

The admin panel uses a centralized API client system:

```javascript
import { productApi, adminApi, authApi } from '@/lib/apiClient'

// Example usage
const categories = await productApi.get('/categories')
const vendors = await adminApi.get('/vendors')
```

## Notes

- All frontend environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
- Fallback values are defined in `lib/apiClient.js` but should not be relied upon for production
- The API client handles authentication automatically using stored tokens
- Restart the development server after changing environment variables

