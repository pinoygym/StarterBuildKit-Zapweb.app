import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

// Import Error Boundary
import ErrorBoundary, { setupGlobalErrorHandlers } from '../src/components/ErrorBoundary';

// Import screens
import LoginScreen from '../src/screens/auth/LoginScreen';
import DashboardScreen from '../src/screens/dashboard/DashboardScreen';
import ProductListScreen from '../src/screens/products/ProductListScreen';
import POSScreen from '../src/screens/pos/POSScreen';
import InventoryScreen from '../src/screens/inventory/InventoryScreen';
import ReportsScreen from '../src/screens/reports/ReportsScreen';
import ProfileScreen from '../src/screens/profile/ProfileScreen';

// Import stores
import { useAuthStore } from '../src/store';
import { databaseService } from '../src/database/database';
import { useAppStore } from '../src/store';
import { startSyncService } from '../src/sync/syncService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6200ee',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="POS" 
        component={POSScreen}
        options={{
          title: 'Point of Sale',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-register" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductListScreen}
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen}
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="warehouse" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile & Settings',
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { loadSettings } = useAppStore();
  const [isReady, setIsReady] = useState(false);
  
  const [fontsLoaded] = useFonts({
    // Add custom fonts if needed
  });

  const handleAppStateChange = useCallback(async (nextAppState: any) => {
    // Handle app state changes (background/foreground)
    if (nextAppState === 'active') {
      // App came to foreground, check for sync
      try {
        await loadUser();
      } catch (error) {
        console.error('Error loading user on app state change:', error);
      }
    }
  }, [loadUser]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Setup global error handlers
        setupGlobalErrorHandlers();
        
        // Initialize database
        await databaseService.init();
        
        // Load app settings
        await loadSettings();
        
        // Load user data if token exists
        await loadUser();

        // Start background sync service (offline/online sync)
        startSyncService();
        
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true); // Still set to true to prevent infinite loading
      }
    };

    initializeApp();
  }, [loadUser, loadSettings]);

  useEffect(() => {
    // Add app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  if (!isReady || !fontsLoaded) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={{ marginTop: 16, fontSize: 16 }}>Loading...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <ErrorBoundary>
      <PaperProvider>
        <StatusBar style="auto" />
        <NavigationContainer>
          {isAuthenticated ? <AppStack /> : <LoginScreen />}
        </NavigationContainer>
      </PaperProvider>
    </ErrorBoundary>
  );
}
