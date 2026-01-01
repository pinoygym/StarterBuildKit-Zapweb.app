import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useAppStore, useCartStore } from '../../store';
import { databaseService } from '../../database/database';
import { runSyncOnce } from '../../sync/syncService';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  inventoryAlerts: number;
  pendingSync: number;
}

export default function DashboardScreen() {
  const { user, currentBranch } = useAuthStore();
  const { syncStatus, isOnline, lastSyncAt } = useAppStore();
  const { items: cartItems } = useCartStore();
  
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    inventoryAlerts: 0,
    pendingSync: 0,
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentBranch]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics from local database
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Mock data for now - in real app, query local SQLite database
      const mockStats: DashboardStats = {
        todaySales: 15420.50,
        todayTransactions: 47,
        inventoryAlerts: 3,
        pendingSync: syncStatus.pendingChanges || 0,
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleSyncNow = async () => {
    try {
      await runSyncOnce();
      Alert.alert('Sync', 'Sync completed successfully');
      await loadDashboardData();
    } catch (error) {
      console.error('Manual sync error:', error);
      Alert.alert('Sync Error', 'Failed to sync data');
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    subtitle 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statCardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </Card.Content>
    </Card>
  );

  const QuickActionCard = ({ 
    title, 
    subtitle, 
    icon, 
    color, 
    onPress 
  }: {
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <Card>
        <Card.Content style={styles.quickActionContent}>
          <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name={icon} size={20} color={color} />
          </View>
          <View style={styles.quickActionInfo}>
            <Text style={styles.quickActionTitle}>{title}</Text>
            <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
          <Text style={styles.branchInfo}>
            {currentBranch?.name || 'No Branch Selected'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <Chip
            icon={isOnline ? 'wifi' : 'wifi-off'}
            mode="outlined"
            style={[
              styles.connectionChip,
              { borderColor: isOnline ? '#4CAF50' : '#F44336' }
            ]}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Chip>
          
          {syncStatus.pendingChanges > 0 && (
            <Chip
              icon="sync"
              mode="outlined"
              style={styles.syncChip}
              onPress={handleSyncNow}
            >
              {syncStatus.pendingChanges} pending
            </Chip>
          )}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Today's Sales"
          value={`₱${stats.todaySales.toLocaleString()}`}
          icon="currency-php"
          color="#4CAF50"
          subtitle={`${stats.todayTransactions} transactions`}
        />
        
        <StatCard
          title="Cart Items"
          value={cartItems.length}
          icon="cart"
          color="#2196F3"
          subtitle="Current cart"
        />
        
        <StatCard
          title="Inventory Alerts"
          value={stats.inventoryAlerts}
          icon="alert-circle"
          color="#FF9800"
          subtitle="Low stock items"
        />
        
        <StatCard
          title="Pending Sync"
          value={stats.pendingSync}
          icon="sync"
          color="#9C27B0"
          subtitle={lastSyncAt ? `Last: ${lastSyncAt.toLocaleTimeString()}` : 'Never'}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <QuickActionCard
          title="Start New Sale"
          subtitle="Begin Point of Sale transaction"
          icon="cash-register"
          color="#4CAF50"
          onPress={() => {
            // Navigate to POS
          }}
        />
        
        <QuickActionCard
          title="Check Inventory"
          subtitle="View current stock levels"
          icon="warehouse"
          color="#2196F3"
          onPress={() => {
            // Navigate to inventory
          }}
        />
        
        <QuickActionCard
          title="Product Catalog"
          subtitle="Manage products and pricing"
          icon="package-variant"
          color="#FF9800"
          onPress={() => {
            // Navigate to products
          }}
        />
        
        <QuickActionCard
          title="View Reports"
          subtitle="Sales and analytics"
          icon="chart-bar"
          color="#9C27B0"
          onPress={() => {
            // Navigate to reports
          }}
        />
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <Card>
          <Card.Content>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="cash" size={20} color="#4CAF50" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Sale Completed</Text>
                <Text style={styles.activitySubtitle}>RCP-20241116-0001 - ₱450.00</Text>
              </View>
              <Text style={styles.activityTime}>2 min ago</Text>
            </View>
            
            <View style={styles.activityDivider} />
            
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="package-variant" size={20} color="#FF9800" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Low Stock Alert</Text>
                <Text style={styles.activitySubtitle}>Coca Cola 330ml - 5 units remaining</Text>
              </View>
              <Text style={styles.activityTime}>15 min ago</Text>
            </View>
            
            <View style={styles.activityDivider} />
            
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="sync" size={20} color="#9C27B0" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Data Synced</Text>
                <Text style={styles.activitySubtitle}>12 items synchronized with server</Text>
              </View>
              <Text style={styles.activityTime}>1 hour ago</Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Sync Status */}
      {!isOnline && (
        <View style={styles.section}>
          <Card style={styles.offlineCard}>
            <Card.Content style={styles.offlineContent}>
              <MaterialCommunityIcons name="wifi-off" size={24} color="#F44336" />
              <View style={styles.offlineInfo}>
                <Text style={styles.offlineTitle}>Working Offline</Text>
                <Text style={styles.offlineSubtitle}>
                  Changes will sync when connection is restored
                </Text>
              </View>
              {syncStatus.syncInProgress && (
                <MaterialCommunityIcons name="sync" size={20} color="#9C27B0" />
              )}
            </Card.Content>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  branchInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  connectionChip: {
    height: 32,
  },
  syncChip: {
    height: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statCard: {
    width: '48%',
    margin: 4,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActionCard: {
    marginBottom: 8,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionInfo: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  offlineCard: {
    backgroundColor: '#fff3e0',
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineInfo: {
    flex: 1,
    marginLeft: 12,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
  },
  offlineSubtitle: {
    fontSize: 12,
    color: '#F57C00',
    marginTop: 2,
  },
});