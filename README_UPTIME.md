# QLIQ System Uptime Monitoring

This document explains how to monitor system uptime for all QLIQ services running on the `qliq.ae` domain.

## 🚀 Quick Start

### 1. Local Development Monitoring
```bash
# Start all services
cd qliq-backend-auth && npm run dev &
cd ../product-category-catalog-service && npm run dev &
cd ../search-filter-service && npm run dev &
cd ../qliq-backend-review && npm run dev &
cd ../qliq-cart-wishlist-payment-api && npm run dev &
cd ../frontend && npm run dev &
cd ../admin && npm run dev
```

### 2. Access Admin Dashboard
Visit `http://localhost:3000/admin` to view real-time system health.

## 📊 Monitoring Features

### Real-time Health Checks
- **Authentication Service** (Port 8888)
- **Product Catalog Service** (Port 8080)
- **Search & Filter Service** (Port 8081)
- **Review Service** (Port 3002)
- **Cart & Payment Service** (Port 3003)
- **Frontend Application** (Port 3000)
- **Admin Dashboard** (Port 3000)

### Metrics Tracked
- ✅ **Service Status** (Healthy/Unhealthy)
- ⏱️ **Response Time** (ms)
- 🕐 **Uptime** (Process uptime in seconds)
- 📈 **Health Percentage** (Overall system health)
- 🔄 **Last Check** (Timestamp of last health check)

## 🌐 Domain-based Monitoring

### Production URLs
When deployed to `qliq.ae` domain:

```
https://auth.qliq.ae/health      - Authentication Service
https://catalog.qliq.ae/health   - Product Catalog Service
https://search.qliq.ae/health    - Search & Filter Service
https://review.qliq.ae/health    - Review Service
https://payment.qliq.ae/health   - Cart & Payment Service
https://app.qliq.ae/             - Frontend Application
https://admin.qliq.ae/           - Admin Dashboard
```

### Development URLs
For local development:

```
http://localhost:8888/health     - Authentication Service
http://localhost:8003/health     - Product Catalog Service
http://localhost:8081/health     - Search & Filter Service
http://localhost:8008/health     - Review Service
http://localhost:8002/health     - Cart & Payment Service
http://localhost:3000/           - Frontend Application
http://localhost:3000/admin      - Admin Dashboard
```

## 🔧 Configuration

### Environment Variables
```env
# Development
NODE_ENV=development

# Production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://auth.qliq.ae
```

### Monitoring Intervals
- **Local Development**: 30 seconds
- **Production**: 60 seconds
- **Custom**: Configurable via `startMonitoring(intervalMs)`

## 📱 Dashboard Features

### System Health Overview
- Overall health percentage
- Average system uptime
- Average response time
- Services online/offline count

### Individual Service Cards
- Service status indicator
- Uptime display (formatted)
- Response time
- Port number
- Last check timestamp

### Service Endpoints
- Complete list of service URLs
- Port information
- Online/offline status

## 🛠️ API Integration

### Health Check Endpoints
All services expose a `/health` endpoint that returns:

```json
{
  "status": "ok",
  "service": "service-name",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Monitoring API
The uptime monitor provides:

```javascript
// Check all services
const status = await uptimeMonitor.checkAllServices();

// Get dashboard metrics
const metrics = uptimeMonitor.getDashboardMetrics();

// Start/stop monitoring
uptimeMonitor.startMonitoring(30000);
uptimeMonitor.stopMonitoring();
```

## 🚨 Alerting & Notifications

### Status Levels
- 🟢 **Healthy**: Service responding normally
- 🟡 **Degraded**: Some services offline
- 🔴 **Unhealthy**: Service not responding

### Automatic Monitoring
- Continuous health checks
- Real-time status updates
- Automatic refresh in dashboard
- Error logging and reporting

## 📈 Performance Metrics

### Response Time Tracking
- Individual service response times
- Average system response time
- Performance trends over time

### Uptime Calculation
- Process uptime from each service
- System-wide average uptime
- Formatted display (days, hours, minutes)

## 🔍 Troubleshooting

### Common Issues
1. **Service Offline**: Check if service is running
2. **High Response Time**: Check network connectivity
3. **Health Check Fails**: Verify `/health` endpoint
4. **CORS Issues**: Check service configuration

### Debug Mode
```javascript
// Enable debug logging
console.log('Service status:', uptimeMonitor.getSystemStatus());
```

## 🚀 Deployment

### Production Setup
1. Deploy all services to `qliq.ae` subdomains
2. Configure DNS for subdomains
3. Set up SSL certificates
4. Update environment variables
5. Start monitoring

### Docker Deployment
```bash
# Build and deploy services
docker-compose up -d

# Monitor health
docker-compose ps
docker-compose logs -f
```

## 📊 Monitoring Best Practices

### 1. Regular Health Checks
- Monitor continuously
- Set appropriate intervals
- Alert on failures

### 2. Performance Tracking
- Track response times
- Monitor uptime trends
- Set performance thresholds

### 3. Error Handling
- Log all failures
- Implement retry logic
- Graceful degradation

### 4. Security
- Secure health endpoints
- Implement authentication
- Monitor for attacks

## 🔗 Integration with External Tools

### Prometheus & Grafana
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'qliq-services'
    static_configs:
      - targets: ['auth.qliq.ae:8888', 'catalog.qliq.ae:8080']
```

### Uptime Robot
- Monitor external endpoints
- Set up alerts
- Track historical data

### New Relic / DataDog
- Application performance monitoring
- Infrastructure monitoring
- Custom dashboards

## 📞 Support

For issues with uptime monitoring:
1. Check service logs
2. Verify network connectivity
3. Test health endpoints manually
4. Contact system administrator

---

**Note**: This monitoring system is designed to work with the QLIQ microservices architecture and provides real-time visibility into system health and performance.
