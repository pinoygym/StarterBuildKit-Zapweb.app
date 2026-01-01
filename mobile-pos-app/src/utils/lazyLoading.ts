import React, { ComponentType, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

interface LazyComponentProps {
  [key: string]: any;
}

export function withLazyLoad<P extends LazyComponentProps>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
) {
  const {
    fallback,
    errorComponent: ErrorComponent,
    retryCount = 3,
    retryDelay = 1000,
    timeout = 10000,
  } = options;

  return React.lazy(() => {
    return Promise.race([
      importFn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Component loading timeout')), timeout)
      )
    ]);
  });
}

export function LazyLoadContainer({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      {children}
    </React.Suspense>
  );
}

export function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

export function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Text style={styles.retryButton} onPress={retry}>
        Try Again
      </Text>
    </View>
  );
}

export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: { enabled?: boolean; staleTime?: number } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const fetchData = async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [...dependencies, retryCount]);

  return {
    data,
    loading,
    error,
    retry,
    refetch: fetchData,
  };
}

export function useInfiniteScroll<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>,
  pageSize: number = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, pageSize);
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setError(null);
    await loadMore();
  };

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#f44336',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
    padding: 8,
  },
});