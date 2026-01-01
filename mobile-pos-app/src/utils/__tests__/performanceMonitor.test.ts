import { performanceMonitor, usePerformanceMonitor } from '../performanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clearStats();
  });

  describe('Basic Monitoring', () => {
    it('should record successful operations', () => {
      const endMonitoring = performanceMonitor.startMonitoring('testOperation');
      
      // Simulate some work
      setTimeout(() => {
        endMonitoring();
      }, 100);

      // Wait for the operation to complete
      setTimeout(() => {
        const stats = performanceMonitor.getPerformanceStats('testOperation');
        expect(stats).toBeTruthy();
        expect(stats?.totalRequests).toBe(1);
        expect(stats?.successfulRequests).toBe(1);
        expect(stats?.failedRequests).toBe(0);
      }, 150);
    });

    it('should record failed operations', () => {
      const endMonitoring = performanceMonitor.startMonitoring('testOperation');
      const error = new Error('Test error');
      
      endMonitoring(error);

      const stats = performanceMonitor.getPerformanceStats('testOperation');
      expect(stats?.totalRequests).toBe(1);
      expect(stats?.successfulRequests).toBe(0);
      expect(stats?.failedRequests).toBe(1);
    });

    it('should calculate average duration correctly', () => {
      const endMonitoring1 = performanceMonitor.startMonitoring('testOperation');
      setTimeout(() => endMonitoring1(), 100);

      const endMonitoring2 = performanceMonitor.startMonitoring('testOperation');
      setTimeout(() => endMonitoring2(), 200);

      setTimeout(() => {
        const stats = performanceMonitor.getPerformanceStats('testOperation');
        expect(stats?.averageDuration).toBeGreaterThan(0);
        expect(stats?.minDuration).toBeLessThanOrEqual(stats?.averageDuration);
        expect(stats?.maxDuration).toBeGreaterThanOrEqual(stats?.averageDuration);
      }, 250);
    });
  });

  describe('Statistics', () => {
    it('should track multiple operations', () => {
      // Record multiple operations
      for (let i = 0; i < 5; i++) {
        const endMonitoring = performanceMonitor.startMonitoring('testOperation');
        endMonitoring();
      }

      const stats = performanceMonitor.getPerformanceStats('testOperation');
      expect(stats?.totalRequests).toBe(5);
      expect(stats?.successfulRequests).toBe(5);
    });

    it('should get all performance stats', () => {
      const endMonitoring1 = performanceMonitor.startMonitoring('operation1');
      endMonitoring1();

      const endMonitoring2 = performanceMonitor.startMonitoring('operation2');
      endMonitoring2();

      const allStats = performanceMonitor.getAllPerformanceStats();
      expect(allStats.size).toBe(2);
      expect(allStats.has('operation1')).toBe(true);
      expect(allStats.has('operation2')).toBe(true);
    });
  });

  describe('Performance Analysis', () => {
    it('should identify slow operations', () => {
      // Create a slow operation
      const endMonitoring = performanceMonitor.startMonitoring('slowOperation');
      setTimeout(() => endMonitoring(), 1500); // 1.5 seconds

      setTimeout(() => {
        const slowOps = performanceMonitor.getSlowOperations(1000); // threshold 1 second
        expect(slowOps.length).toBe(1);
        expect(slowOps[0].operation).toBe('slowOperation');
        expect(slowOps[0].avgDuration).toBeGreaterThan(1000);
      }, 1600);
    });

    it('should identify error-prone operations', () => {
      // Create operations with different error rates
      for (let i = 0; i < 10; i++) {
        const endMonitoring = performanceMonitor.startMonitoring('errorProneOperation');
        if (i < 3) { // 30% error rate
          endMonitoring(new Error('Test error'));
        } else {
          endMonitoring();
        }
      }

      const errorProneOps = performanceMonitor.getErrorProneOperations();
      expect(errorProneOps.length).toBe(1);
      expect(errorProneOps[0].operation).toBe('errorProneOperation');
      expect(errorProneOps[0].errorRate).toBeCloseTo(30, 0); // 30% error rate
    });
  });

  describe('Reports', () => {
    it('should generate performance report', () => {
      // Record some operations
      const endMonitoring1 = performanceMonitor.startMonitoring('operation1');
      endMonitoring1();

      const endMonitoring2 = performanceMonitor.startMonitoring('operation2');
      endMonitoring2(new Error('Test error'));

      const report = performanceMonitor.generatePerformanceReport();
      
      expect(report).toContain('=== Performance Report ===');
      expect(report).toContain('operation1');
      expect(report).toContain('operation2');
      expect(report).toContain('Total Requests: 2');
      expect(report).toContain('Successful: 1');
      expect(report).toContain('Failed: 1');
    });
  });

  describe('Recent Metrics', () => {
    it('should retrieve recent metrics', () => {
      // Record multiple operations
      for (let i = 0; i < 10; i++) {
        const endMonitoring = performanceMonitor.startMonitoring('testOperation');
        endMonitoring();
      }

      const recentMetrics = performanceMonitor.getRecentMetrics('testOperation', 5);
      expect(recentMetrics.length).toBe(5);
      
      const allMetrics = performanceMonitor.getRecentMetrics('testOperation', 20);
      expect(allMetrics.length).toBe(10); // Only 10 were recorded
    });
  });

  describe('Clear Operations', () => {
    it('should clear specific operation stats', () => {
      const endMonitoring = performanceMonitor.startMonitoring('testOperation');
      endMonitoring();

      let stats = performanceMonitor.getPerformanceStats('testOperation');
      expect(stats).toBeTruthy();

      performanceMonitor.clearStats('testOperation');
      stats = performanceMonitor.getPerformanceStats('testOperation');
      expect(stats).toBeNull();
    });

    it('should clear all operation stats', () => {
      const endMonitoring1 = performanceMonitor.startMonitoring('operation1');
      endMonitoring1();

      const endMonitoring2 = performanceMonitor.startMonitoring('operation2');
      endMonitoring2();

      performanceMonitor.clearStats();

      expect(performanceMonitor.getPerformanceStats('operation1')).toBeNull();
      expect(performanceMonitor.getPerformanceStats('operation2')).toBeNull();
    });
  });

  describe('Hook', () => {
    it('should provide performance monitoring hook', () => {
      const { startMonitoring, getStats, stats, isMonitoring } = usePerformanceMonitor('testOperation');
      
      expect(typeof startMonitoring).toBe('function');
      expect(typeof getStats).toBe('function');
      expect(isMonitoring).toBe(false);
      expect(stats).toBeNull();
    });
  });
});