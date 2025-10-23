/**
 * Redis Pub/Sub Client for Real-time Updates
 * Handles real-time communication between microservices
 */

class RedisPubSubClient {
  constructor() {
    this.subscribers = {};
    this.connected = false;
    this.eventSource = null;
  }

  // Initialize SSE connection for real-time updates
  connect() {
    if (typeof window === 'undefined') return;

    const sseUrl = process.env.NEXT_PUBLIC_SSE_URL || 'http://localhost:8009/api/events';
    this.eventSource = new EventSource(sseUrl, { withCredentials: true });

    this.eventSource.onopen = () => {
      console.log('✅ Redis Pub/Sub connected via SSE');
      this.connected = true;
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ Redis Pub/Sub connection error:', error);
      this.connected = false;
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (!this.connected) {
          this.connect();
        }
      }, 5000);
    };

    // Listen for different event types
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Vendor events
    this.eventSource.addEventListener('vendor.approved', (event) => {
      this.handleEvent('vendor.approved', JSON.parse(event.data));
    });

    this.eventSource.addEventListener('vendor.rejected', (event) => {
      this.handleEvent('vendor.rejected', JSON.parse(event.data));
    });

    this.eventSource.addEventListener('vendor.commission', (event) => {
      this.handleEvent('vendor.commission', JSON.parse(event.data));
    });

    // Order events
    this.eventSource.addEventListener('order.created', (event) => {
      this.handleEvent('order.created', JSON.parse(event.data));
    });

    this.eventSource.addEventListener('order.status', (event) => {
      this.handleEvent('order.status', JSON.parse(event.data));
    });

    this.eventSource.addEventListener('order.refund', (event) => {
      this.handleEvent('order.refund', JSON.parse(event.data));
    });

    // Product events
    this.eventSource.addEventListener('product.approved', (event) => {
      this.handleEvent('product.approved', JSON.parse(event.data));
    });

    this.eventSource.addEventListener('product.rejected', (event) => {
      this.handleEvent('product.rejected', JSON.parse(event.data));
    });

    // Payout events
    this.eventSource.addEventListener('payout.request', (event) => {
      this.handleEvent('payout.request', JSON.parse(event.data));
    });

    this.eventSource.addEventListener('payout.approved', (event) => {
      this.handleEvent('payout.approved', JSON.parse(event.data));
    });

    // Flash sale events
    this.eventSource.addEventListener('flash-sale.start', (event) => {
      this.handleEvent('flash-sale.start', JSON.parse(event.data));
    });

    this.eventSource.addEventListener('flash-sale.end', (event) => {
      this.handleEvent('flash-sale.end', JSON.parse(event.data));
    });

    // Notification events
    this.eventSource.addEventListener('notification.send', (event) => {
      this.handleEvent('notification.send', JSON.parse(event.data));
    });

    // Config events
    this.eventSource.addEventListener('config.updated', (event) => {
      this.handleEvent('config.updated', JSON.parse(event.data));
    });

    // Customer events
    this.eventSource.addEventListener('customer.status', (event) => {
      this.handleEvent('customer.status', JSON.parse(event.data));
    });
  }

  handleEvent(channel, data) {
    console.log(`📨 Received event on ${channel}:`, data);
    
    // Notify all subscribers of this channel
    if (this.subscribers[channel]) {
      this.subscribers[channel].forEach(callback => callback(data));
    }
  }

  // Subscribe to a channel
  subscribe(channel, callback) {
    if (!this.subscribers[channel]) {
      this.subscribers[channel] = [];
    }
    
    this.subscribers[channel].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers[channel] = this.subscribers[channel].filter(cb => cb !== callback);
    };
  }

  // Publish to a channel (via HTTP POST to backend)
  async publish(channel, data) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8009'}/api/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ channel, data }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to publish message');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }

  // Disconnect
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.connected = false;
      console.log('🔌 Redis Pub/Sub disconnected');
    }
  }

  // Get connection status
  isConnected() {
    return this.connected;
  }
}

// Create singleton instance
const redisPubSub = new RedisPubSubClient();

// Auto-connect when module is loaded (client-side only)
if (typeof window !== 'undefined') {
  redisPubSub.connect();
}

export default redisPubSub;

// Convenience hooks for common subscriptions
export const useVendorEvents = (callback) => {
  if (typeof window === 'undefined') return;
  
  const unsubscribe1 = redisPubSub.subscribe('vendor.approved', callback);
  const unsubscribe2 = redisPubSub.subscribe('vendor.rejected', callback);
  const unsubscribe3 = redisPubSub.subscribe('vendor.commission', callback);
  
  return () => {
    unsubscribe1();
    unsubscribe2();
    unsubscribe3();
  };
};

export const useOrderEvents = (callback) => {
  if (typeof window === 'undefined') return;
  
  const unsubscribe1 = redisPubSub.subscribe('order.created', callback);
  const unsubscribe2 = redisPubSub.subscribe('order.status', callback);
  const unsubscribe3 = redisPubSub.subscribe('order.refund', callback);
  
  return () => {
    unsubscribe1();
    unsubscribe2();
    unsubscribe3();
  };
};

export const useProductEvents = (callback) => {
  if (typeof window === 'undefined') return;
  
  const unsubscribe1 = redisPubSub.subscribe('product.approved', callback);
  const unsubscribe2 = redisPubSub.subscribe('product.rejected', callback);
  
  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};

export const useNotificationEvents = (callback) => {
  if (typeof window === 'undefined') return;
  
  return redisPubSub.subscribe('notification.send', callback);
};

