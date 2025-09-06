// Performance monitoring utilities for dashboard optimization

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();

  start(metricName: string): void {
    this.metrics.set(metricName, {
      name: metricName,
      startTime: performance.now()
    });
    console.log(`⏱️ ${metricName} - Started`);
  }

  end(metricName: string): number | null {
    const metric = this.metrics.get(metricName);
    if (!metric) {
      console.warn(`⚠️ Performance metric '${metricName}' not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    const color = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
    console.log(`${color} ${metricName} - Completed in ${duration.toFixed(2)}ms`);

    return duration;
  }

  getMetric(metricName: string): PerformanceMetric | undefined {
    return this.metrics.get(metricName);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clear(): void {
    this.metrics.clear();
  }

  logSummary(): void {
    const metrics = this.getAllMetrics().filter(m => m.duration !== undefined);
    if (metrics.length === 0) {
      console.log('📊 No performance metrics recorded');
      return;
    }

    console.group('📊 Performance Summary');
    metrics.forEach(metric => {
      const color = metric.duration! < 100 ? '🟢' : metric.duration! < 500 ? '🟡' : '🔴';
      console.log(`${color} ${metric.name}: ${metric.duration!.toFixed(2)}ms`);
    });
    
    const totalTime = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    console.log(`⏱️ Total measured time: ${totalTime.toFixed(2)}ms`);
    console.groupEnd();
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// Decorator for measuring function performance
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const metricName = `${target.constructor.name}.${propertyName}`;
    perfMonitor.start(metricName);
    
    try {
      const result = await method.apply(this, args);
      perfMonitor.end(metricName);
      return result;
    } catch (error) {
      perfMonitor.end(metricName);
      throw error;
    }
  };
  
  return descriptor;
}

// Utility to measure async operations
export async function measureAsync<T>(
  name: string, 
  operation: () => Promise<T>
): Promise<T> {
  perfMonitor.start(name);
  try {
    const result = await operation();
    perfMonitor.end(name);
    return result;
  } catch (error) {
    perfMonitor.end(name);
    throw error;
  }
}

// Utility to measure sync operations  
export function measureSync<T>(
  name: string,
  operation: () => T
): T {
  perfMonitor.start(name);
  try {
    const result = operation();
    perfMonitor.end(name);
    return result;
  } catch (error) {
    perfMonitor.end(name);
    throw error;
  }
}

// Cache performance utilities
export class CacheMetrics {
  private static hits = 0;
  private static misses = 0;
  private static totalRequests = 0;

  static recordHit(): void {
    this.hits++;
    this.totalRequests++;
  }

  static recordMiss(): void {
    this.misses++;
    this.totalRequests++;
  }

  static getStats(): { hits: number; misses: number; hitRate: number; totalRequests: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.totalRequests > 0 ? (this.hits / this.totalRequests) * 100 : 0,
      totalRequests: this.totalRequests
    };
  }

  static logStats(): void {
    const stats = this.getStats();
    console.log(`💾 Cache Stats - Hit Rate: ${stats.hitRate.toFixed(1)}% (${stats.hits}/${stats.totalRequests})`);
  }

  static reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.totalRequests = 0;
  }
}

// Development-only performance logging
export const isDev = process.env.NODE_ENV === 'development';

export function devLog(message: string, ...args: any[]): void {
  if (isDev) {
    console.log(`🔧 [DEV] ${message}`, ...args);
  }
}

export function devWarn(message: string, ...args: any[]): void {
  if (isDev) {
    console.warn(`⚠️ [DEV] ${message}`, ...args);
  }
}

export function devError(message: string, ...args: any[]): void {
  if (isDev) {
    console.error(`❌ [DEV] ${message}`, ...args);
  }
}
