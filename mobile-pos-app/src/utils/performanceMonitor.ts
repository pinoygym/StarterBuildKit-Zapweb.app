import { Platform } from 'react-native';
import * as React from 'react';

interface PerformanceMetrics {
  timestamp: number;
  duration: number;
  memoryUsage?: number;
  success: boolean;
  error?: Error;
}

interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastRequestTime: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private stats: Map<string, PerformanceStats> = new Map();
  private readonly MAX_METRICS_PER_OPERATION = 100;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(operationName: string): (error?: Error) => void {
    const startTime = Date.now();
    const startMemory = this.getCurrentMemoryUsage();

    return (error?: Error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const endMemory = this.getCurrentMemoryUsage();
      const memoryUsage = endMemory - startMemory;

      const metrics: PerformanceMetrics = {
        timestamp: endTime,
        duration,
        memoryUsage: memoryUsage > 0 ? memoryUsage : undefined,
        success: !error,
        error,
      };

      this.recordMetrics(operationName, metrics);
      this.updateStats(operationName, metrics);
    };
  }

  private recordMetrics(operationName: string, metrics: PerformanceMetrics): void {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }

    const operationMetrics = this.metrics.get(operationName)!;
    operationMetrics.push(metrics);

    // Keep only recent metrics
    if (operationMetrics.length > this.MAX_METRICS_PER_OPERATION) {
      operationMetrics.shift();
    }
  }

  private updateStats(operationName: string, metrics: PerformanceMetrics): void {
    if (!this.stats.has(operationName)) {
      this.stats.set(operationName, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: -Infinity,
        lastRequestTime: 0,
      });
    }

    const stats = this.stats.get(operationName)!;
    stats.totalRequests++;
    stats.lastRequestTime = metrics.timestamp;

    if (metrics.success) {
      stats.successfulRequests++;
      stats.averageDuration = (stats.averageDuration * (stats.successfulRequests - 1) + metrics.duration) / stats.successfulRequests;
      stats.minDuration = Math.min(stats.minDuration, metrics.duration);
      stats.maxDuration = Math.max(stats.maxDuration, metrics.duration);
    } else {
      stats.failedRequests++;
    }
  }

  getPerformanceStats(operationName: string): PerformanceStats | null {
    return this.stats.get(operationName) || null;
  }

  getAllPerformanceStats(): Map<string, PerformanceStats> {
    return new Map(this.stats);
  }

  getRecentMetrics(operationName: string, count: number = 10): PerformanceMetrics[] {
    const metrics = this.metrics.get(operationName) || [];
    return metrics.slice(-count);
  }

  getSlowOperations(threshold: number = 1000): Array<{ operation: string; avgDuration: number }> {
    const slowOps: Array<{ operation: string; avgDuration: number }> = [];
    
    this.stats.forEach((stats, operation) => {
      if (stats.averageDuration > threshold) {
        slowOps.push({
          operation,
          avgDuration: stats.averageDuration,
        });
      }
    });

    return slowOps.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  getErrorProneOperations(): Array<{ operation: string; errorRate: number }> {
    const errorProneOps: Array<{ operation: string; errorRate: number }> = [];
    
    this.stats.forEach((stats, operation) => {
      if (stats.totalRequests > 0) {
        const errorRate = (stats.failedRequests / stats.totalRequests) * 100;
        if (errorRate > 5) { // Operations with >5% error rate
          errorProneOps.push({
            operation,
            errorRate,
          });
        }
      }
    });

    return errorProneOps.sort((a, b) => b.errorRate - a.errorRate);
  }

  clearStats(operationName?: string): void {
    if (operationName) {
      this.stats.delete(operationName);
      this.metrics.delete(operationName);
    } else {
      this.stats.clear();
      this.metrics.clear();
    }
  }

  generatePerformanceReport(): string {
    const report: string[] = [];
    const stats = this.getAllPerformanceStats();

    report.push('=== Performance Report ===');
    report.push(`Generated at: ${new Date().toISOString()}`);
    report.push(`Platform: ${Platform.OS} ${Platform.Version}`);
    report.push('');

    // Overall statistics
    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    stats.forEach((stat) => {
      totalRequests += stat.totalRequests;
      totalSuccessful += stat.successfulRequests;
      totalFailed += stat.failedRequests;
      totalDuration += stat.averageDuration * stat.successfulRequests;
    });

    report.push('Overall Statistics:');
    report.push(`  Total Requests: ${totalRequests}`);
    report.push(`  Successful: ${totalSuccessful} (${((totalSuccessful / totalRequests) * 100).toFixed(1)}%)`);
    report.push(`  Failed: ${totalFailed} (${((totalFailed / totalRequests) * 100).toFixed(1)}%)`);
    report.push(`  Average Duration: ${totalRequests > 0 ? (totalDuration / totalSuccessful).toFixed(2) : 0}ms`);
    report.push('');

    // Operation details
    report.push('Operation Details:');
    stats.forEach((stat, operation) => {
      report.push(`  ${operation}:`);
      report.push(`    Requests: ${stat.totalRequests}`);
      report.push(`    Success Rate: ${stat.totalRequests > 0 ? ((stat.successfulRequests / stat.totalRequests) * 100).toFixed(1) : 0}%`);
      report.push(`    Avg Duration: ${stat.averageDuration.toFixed(2)}ms`);
      report.push(`    Min/Max Duration: ${stat.minDuration === Infinity ? 0 : stat.minDuration}ms / ${stat.maxDuration === -Infinity ? 0 : stat.maxDuration}ms`);
      report.push(`    Last Request: ${new Date(stat.lastRequestTime).toLocaleString()}`);
    });

    // Performance issues
    const slowOps = this.getSlowOperations();
    if (slowOps.length > 0) {
      report.push('');
      report.push('Slow Operations (>1000ms):');
      slowOps.forEach(op => {
        report.push(`  ${op.operation}: ${op.avgDuration.toFixed(2)}ms`);
      });
    }

    const errorProneOps = this.getErrorProneOperations();
    if (errorProneOps.length > 0) {
      report.push('');
      report.push('Error-Prone Operations (>5% error rate):');
      errorProneOps.forEach(op => {
        report.push(`  ${op.operation}: ${op.errorRate.toFixed(1)}% error rate`);
      });
    }

    return report.join('\n');
  }

  private getCurrentMemoryUsage(): number {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // This is a simplified memory usage calculation
      // In a real app, you might use native modules for accurate memory tracking
      return 0;
    }
    return 0;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Performance hooks
export function usePerformanceMonitor(operationName: string) {
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const [stats, setStats] = React.useState<PerformanceStats | null>(null);

  const startMonitoring = React.useCallback(() => {
    setIsMonitoring(true);
    return performanceMonitor.startMonitoring(operationName);
  }, [operationName]);

  const getStats = React.useCallback(() => {
    const currentStats = performanceMonitor.getPerformanceStats(operationName);
    setStats(currentStats);
    return currentStats;
  }, [operationName]);

  React.useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        getStats();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring, getStats]);

  return {
    startMonitoring,
    getStats,
    stats,
    isMonitoring,
  };
}