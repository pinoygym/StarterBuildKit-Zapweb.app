import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Provider as PaperProvider, DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

// Import Redux store
import { store, persistor } from '../store';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { selectAppSettings } from '../store/slices/appSlice';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import POSScreen from '../screens/pos/POSScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Import services
import { databaseService, syncService } from '../services';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Custom theme
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    accent: '#03dac4',
    background: '#121212',
    surface: '#121212',
    text: '#ffffff',
  },
};

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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
      <Tab.Screen 
        name="Customers" 
        component={CustomersScreen}
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#6200ee',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={MainTabNavigator}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile & Settings',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

function AppContent() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const settings = useAppSelector(selectAppSettings);
  const [isReady, setIsReady] = useState(false);
  
  const [fontsLoaded] = useFonts({
    // Add custom fonts if needed
  });

  const theme = settings.theme === 'dark' ? darkTheme : 
                settings.theme === 'auto' ? (false ? darkTheme : lightTheme) : lightTheme;

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await databaseService.initialize();
        
        // Initialize sync service
        await syncService.initialize();
        
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true); // Still set to true to prevent infinite loading
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, check for sync
        syncService.checkAndSync();
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        {isAuthenticated ? <DrawerNavigator /> : <LoginScreen />}
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={{ marginTop: 16, fontSize: 16 }}>Loading app data...</Text>
          </View>
        }
        persistor={persistor}
      >
        <AppContent />
      </PersistGate>
    </Provider>
  );
}