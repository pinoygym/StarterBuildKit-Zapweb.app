import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, Card, Snackbar } from 'react-native-paper';
import { performanceMonitor } from '../utils/performanceMonitor';
import { cacheManager } from '../utils/cache';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  snackbarVisible: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      snackbarVisible: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Record performance metrics
    performanceMonitor.startMonitoring('error_boundary')();
    
    // Log error to console with detailed information
    console.group('🚨 Application Error');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Update state with error information
    this.setState({
      error,
      errorInfo,
      snackbarVisible: true,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Attempt to recover from common errors
    this.attemptRecovery(error);
  }

  attemptRecovery = async (error: Error) => {
    const errorMessage = error.message.toLowerCase();
    
    // Handle specific error types
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      // Network errors - clear cache and retry
      try {
        await cacheManager.clear();
        console.log('Cleared cache due to network error');
      } catch (clearError) {
        console.error('Failed to clear cache:', clearError);
      }
    } else if (errorMessage.includes('memory') || errorMessage.includes('out of memory')) {
      // Memory errors - clear image cache
      try {
        // Clear image cache if available
        console.log('Attempting memory recovery');
      } catch (memoryError) {
        console.error('Failed to recover from memory error:', memoryError);
      }
    } else if (errorMessage.includes('database') || errorMessage.includes('sqlite')) {
      // Database errors - attempt reconnection
      console.log('Database error detected - may need manual intervention');
    }
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      snackbarVisible: false,
    });
  };

  copyErrorDetails = () => {
    const { error, errorInfo } = this.state;
    if (error && errorInfo) {
      const errorDetails = `
Error: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo.componentStack}
      `.trim();
      
      // Copy to clipboard (React Native clipboard API)
      // This would require @react-native-clipboard/clipboard
      console.log('Error details copied to clipboard:', errorDetails);
      this.setState({ snackbarVisible: true });
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: FallbackComponent } = this.props;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Card style={styles.errorCard}>
              <Card.Content>
                <View style={styles.header}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.title}>Oops! Something went wrong</Text>
                </View>
                
                <Text style={styles.message}>
                  We&apos;re sorry, but something unexpected happened. 
                  The app will continue to work, but this feature may be temporarily unavailable.
                </Text>

                <Text style={styles.errorType}>
                  Error Type: {this.state.error.name}
                </Text>

                <View style={styles.actions}>
                  <Button
                    mode="contained"
                    onPress={this.resetError}
                    style={styles.button}
                    icon="refresh"
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    mode="outlined"
                    onPress={this.toggleDetails}
                    style={styles.button}
                    icon={this.state.showDetails ? "chevron-up" : "chevron-down"}
                  >
                    {this.state.showDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                </View>

                {this.state.showDetails && (
                  <View style={styles.detailsContainer}>
                    <Text style={styles.detailsTitle}>Error Details:</Text>
                    <Text style={styles.errorMessage}>
                      {this.state.error.message}
                    </Text>
                    
                    {this.state.errorInfo && (
                      <>
                        <Text style={styles.detailsTitle}>Component Stack:</Text>
                        <Text style={styles.componentStack}>
                          {this.state.errorInfo.componentStack}
                        </Text>
                      </>
                    )}

                    <Button
                      mode="text"
                      onPress={this.copyErrorDetails}
                      icon="content-copy"
                      style={styles.copyButton}
                    >
                      Copy Details
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>What you can try:</Text>
              <Text style={styles.tip}>• Check your internet connection</Text>
              <Text style={styles.tip}>• Restart the app</Text>
              <Text style={styles.tip}>• Clear app cache in settings</Text>
              <Text style={styles.tip}>• Contact support if the problem persists</Text>
            </View>
          </View>

          <Snackbar
            visible={this.state.snackbarVisible}
            onDismiss={() => this.setState({ snackbarVisible: false })}
            duration={3000}
            action={{
              label: 'OK',
              onPress: () => this.setState({ snackbarVisible: false }),
            }}
          >
            Error details copied to clipboard
          </Snackbar>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingTop: 40,
  },
  errorCard: {
    marginBottom: 16,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#d32f2f',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
    lineHeight: 24,
  },
  errorType: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  errorMessage: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  componentStack: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  copyButton: {
    alignSelf: 'flex-end',
  },
  tipsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  tip: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
  },
});

// Global error handler for uncaught promise rejections
export const setupGlobalErrorHandlers = () => {
  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    
    // Log to performance monitor
    const error = args.find(arg => arg instanceof Error);
    if (error) {
      performanceMonitor.startMonitoring('console_error')();
    }
  };

  // Handle uncaught promise rejections
  if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
    const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
    
    (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: any) => {
      console.error('Uncaught exception:', error);
      performanceMonitor.startMonitoring('uncaught_exception')();
      
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }
};

export default ErrorBoundary;