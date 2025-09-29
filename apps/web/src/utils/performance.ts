// Performance utilities for mobile and low-bandwidth optimization

// Network detection
export interface NetworkInfo {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export function getNetworkInfo(): NetworkInfo | null {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return null;
}

// Device detection
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  touchSupported: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipod/.test(userAgent);
  const isTablet = /tablet|ipad/.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  const touchSupported = 'ontouchstart' in window;

  const deviceMemory = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency;

  return {
    isMobile,
    isTablet,
    isDesktop,
    touchSupported,
    deviceMemory,
    hardwareConcurrency,
  };
}

// Performance optimization helpers
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private networkInfo: NetworkInfo | null = null;
  private deviceInfo: DeviceInfo | null = null;
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.init();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private init() {
    this.networkInfo = getNetworkInfo();
    this.deviceInfo = getDeviceInfo();
    this.setupPerformanceMonitoring();
    this.setupNetworkChangeListener();
  }

  private setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }

    // Monitor layout shifts
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if ((entry as any).value > 0.1) {
            console.warn('Large layout shift detected:', entry);
          }
        });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  private setupNetworkChangeListener() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.networkInfo = getNetworkInfo();
        this.optimizeForNetworkConditions();
      });
    }
  }

  private optimizeForNetworkConditions() {
    if (!this.networkInfo) return;

    const { effectiveType, saveData } = this.networkInfo;

    // Adjust image quality based on network
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
      this.enableLowQualityMode();
    } else if (effectiveType === '3g') {
      this.enableMediumQualityMode();
    } else {
      this.enableHighQualityMode();
    }
  }

  private enableLowQualityMode() {
    document.documentElement.classList.add('low-quality-mode');
    document.documentElement.classList.remove('medium-quality-mode', 'high-quality-mode');

    // Disable animations
    document.documentElement.style.setProperty('--animation-duration', '0ms');

    // Reduce image quality
    this.setImageQuality(0.3);

    // Prefetch fewer resources
    this.reducePrefetching();
  }

  private enableMediumQualityMode() {
    document.documentElement.classList.add('medium-quality-mode');
    document.documentElement.classList.remove('low-quality-mode', 'high-quality-mode');

    // Limit animations
    document.documentElement.style.setProperty('--animation-duration', '0.3s');

    // Medium image quality
    this.setImageQuality(0.6);

    // Moderate prefetching
    this.moderatePrefetching();
  }

  private enableHighQualityMode() {
    document.documentElement.classList.add('high-quality-mode');
    document.documentElement.classList.remove('low-quality-mode', 'medium-quality-mode');

    // Enable full animations
    document.documentElement.style.setProperty('--animation-duration', '');

    // High image quality
    this.setImageQuality(0.8);

    // Aggressive prefetching
    this.aggressivePrefetching();
  }

  private setImageQuality(quality: number) {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => {
      const src = img.getAttribute('data-src');
      if (src) {
        const url = new URL(src, window.location.origin);
        url.searchParams.set('quality', quality.toString());
        img.setAttribute('src', url.toString());
      }
    });
  }

  private reducePrefetching() {
    // Remove non-critical prefetch links
    const prefetchLinks = document.querySelectorAll('link[rel="prefetch"][data-priority="low"]');
    prefetchLinks.forEach(link => link.remove());
  }

  private moderatePrefetching() {
    // Only prefetch critical resources
    const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
    prefetchLinks.forEach(link => {
      if (link.getAttribute('data-priority') === 'low') {
        link.remove();
      }
    });
  }

  private aggressivePrefetching() {
    // Add prefetch for important resources
    const resources = [
      '/api/analytics/summary',
      '/api/products/featured',
    ];

    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      link.setAttribute('data-priority', 'high');
      document.head.appendChild(link);
    });
  }

  // Public methods
  public shouldLazyLoad(): boolean {
    if (!this.networkInfo) return false;
    return this.networkInfo.effectiveType === 'slow-2g' ||
           this.networkInfo.effectiveType === '2g' ||
           this.networkInfo.saveData;
  }

  public shouldReduceMotion(): boolean {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return prefersReducedMotion || this.shouldLazyLoad();
  }

  public getImageSize(): { width: number; height: number } {
    if (!this.deviceInfo?.isMobile) {
      return { width: 800, height: 600 };
    }

    if (this.networkInfo?.effectiveType === 'slow-2g' || this.networkInfo?.effectiveType === '2g') {
      return { width: 200, height: 150 };
    }

    return { width: 400, height: 300 };
  }

  public getOptimalCacheTime(): number {
    if (!this.networkInfo) return 300; // 5 minutes default

    switch (this.networkInfo.effectiveType) {
      case 'slow-2g':
        return 3600; // 1 hour
      case '2g':
        return 1800; // 30 minutes
      case '3g':
        return 600; // 10 minutes
      case '4g':
        return 300; // 5 minutes
      default:
        return 300;
    }
  }

  public async preloadCriticalResources() {
    const criticalResources = [
      '/api/auth/me',
      '/api/products?limit=10',
    ];

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Start prefetching when viewport is visible
            this.prefetchResources(criticalResources);
            observer.disconnect();
          }
        });
      });

      observer.observe(document.body);
    }
  }

  private async prefetchResources(resources: string[]) {
    if ('prefetch' in document.createElement('link')) {
      resources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        document.head.appendChild(link);
      });
    }
  }

  // Performance monitoring
  public measureComponent(name: string, callback: () => void) {
    const start = performance.now();
    callback();
    const end = performance.now();

    if (end - start > 16) { // More than one frame
      console.warn(`Slow component render: ${name} took ${end - start}ms`);
    }
  }

  // Cleanup
  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// React hooks
import { useEffect, useState } from 'react';

export function useNetworkInfo() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    const updateNetworkInfo = () => {
      setNetworkInfo(getNetworkInfo());
    };

    updateNetworkInfo();

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  return networkInfo;
}

export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  return deviceInfo;
}

export function usePerformanceOptimization() {
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const optimizer = PerformanceOptimizer.getInstance();

    const updateOptimizations = () => {
      setIsLowBandwidth(optimizer.shouldLazyLoad());
      setShouldReduceMotion(optimizer.shouldReduceMotion());
    };

    updateOptimizations();

    // Listen for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', updateOptimizations);

    return () => {
      motionQuery.removeEventListener('change', updateOptimizations);
    };
  }, []);

  return { isLowBandwidth, shouldReduceMotion };
}