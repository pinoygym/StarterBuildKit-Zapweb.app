import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  ActivityIndicator,
  useTheme,
  DataTable,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  fetchSales,
  fetchSalesSummary,
  fetchTodaySales,
  setFilters,
  clearFilters,
} from '../../store/slices/salesSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { POSSale } from '../../types';

const { width } = Dimensions.get('window');

interface DateRange {
  label: string;
  value: string;
  days: number;
}

const dateRanges: DateRange[] = [
  { label: 'Today', value: 'today', days: 0 },
  { label: 'Yesterday', value: 'yesterday', days: 1 },
  { label: 'Last 7 Days', value: '7days', days: 7 },
  { label: 'Last 30 Days', value: '30days', days: 30 },
  { label: 'This Month', value: 'month', days: 30 },
];

const ReportsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    sales, 
    todaySales, 
    salesSummary, 
    loading, 
    error, 
    filters 
  } = useSelector((state: RootState) => state.sales);
  
  const [selectedRange, setSelectedRange] = useState<string>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'transactions' | 'items'>('revenue');

  useEffect(() => {
    loadSalesData();
  }, [selectedRange]);

  const loadSalesData = async () => {
    const dateRange = getDateRange(selectedRange);
    await Promise.all([
      dispatch(fetchSales({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      })),
      dispatch(fetchSalesSummary({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      })),
      dispatch(fetchTodaySales()),
    ]);
  };

  const getDateRange = (range: string) => {
    const today = new Date();
    const from = new Date();
    const to = new Date();

    switch (range) {
      case 'today':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        from.setDate(today.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(today.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case '7days':
        from.setDate(today.getDate() - 7);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case '30days':
      case 'month':
        from.setDate(today.getDate() - 30);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      default:
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSalesData();
    setRefreshing(false);
  };

  const getSalesMetrics = () => {
    const totalRevenue = sales.reduce((sum: number, sale: POSSale) => sum + sale.totalAmount, 0);
    const totalTransactions = sales.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalItems = sales.reduce((sum: number, sale: POSSale) => 
      sum + sale.items.reduce((itemSum: number, item: { quantity: number }) => itemSum + item.quantity, 0), 0
    );

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      totalItems,
    };
  };

  const getPaymentMethodBreakdown = () => {
    const breakdown = sales.reduce((acc: Record<string, number>, sale: POSSale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(breakdown) as [string, number][];
    return entries.map(([method, amount]) => ({
      method,
      amount,
      percentage: (amount / getSalesMetrics().totalRevenue) * 100,
    }));
  };

  const getTopProducts = () => {
    const productSales = sales.reduce((acc: Record<string, { productId: string; productName: string; quantity: number; revenue: number }>, sale: POSSale) => {
      sale.items.forEach((item: { productId: string; productName: string; quantity: number; subtotal: number }) => {
        const key = item.productId;
        if (!acc[key]) {
          acc[key] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.subtotal;
      });
      return acc;
    }, {} as Record<string, { productId: string; productName: string; quantity: number; revenue: number }>);

    const productsArray = Object.values(productSales) as { productId: string; productName: string; quantity: number; revenue: number }[];
    return productsArray
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const getHourlySales = () => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      revenue: 0,
      transactions: 0,
    }));

    sales.forEach((sale: POSSale) => {
      const hour = new Date(sale.createdAt).getHours();
      hourlyData[hour].revenue += sale.totalAmount;
      hourlyData[hour].transactions += 1;
    });

    return hourlyData;
  };

  const metrics = getSalesMetrics();
  const paymentBreakdown: { method: string; amount: number; percentage: number }[] = getPaymentMethodBreakdown();
  const topProducts = getTopProducts();
  const hourlySales = getHourlySales();

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.title}>Sales Reports</Title>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item onPress={() => {}} title="Export Report" leadingIcon="download" />
          <Menu.Item onPress={() => {}} title="Print Summary" leadingIcon="printer" />
          <Divider />
          <Menu.Item onPress={() => {}} title="Refresh Data" leadingIcon="refresh" />
        </Menu>
      </View>

      {/* Date Range Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateRangeContainer}
      >
        {dateRanges.map((range) => (
          <Chip
            key={range.value}
            selected={selectedRange === range.value}
            onPress={() => setSelectedRange(range.value)}
            style={styles.dateChip}
            textStyle={styles.dateChipText}
          >
            {range.label}
          </Chip>
        ))}
      </ScrollView>

      {/* Key Metrics Cards */}
      <View style={styles.metricsContainer}>
        <Card style={styles.metricCard}>
          <Card.Content>
            <Text style={styles.metricLabel}>Total Revenue</Text>
            <Title style={[styles.metricValue, styles.revenueColor]}>
              {formatCurrency(metrics.totalRevenue)}
            </Title>
            <Text style={styles.metricChange}>vs yesterday</Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content>
            <Text style={styles.metricLabel}>Transactions</Text>
            <Title style={styles.metricValue}>
              {metrics.totalTransactions.toLocaleString()}
            </Title>
            <Text style={styles.metricChange}>
              Avg: {formatCurrency(metrics.averageTransactionValue)}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content>
            <Text style={styles.metricLabel}>Items Sold</Text>
            <Title style={styles.metricValue}>
              {metrics.totalItems.toLocaleString()}
            </Title>
            <Text style={styles.metricChange}>
              Avg: {metrics.totalTransactions > 0 ? Math.round(metrics.totalItems / metrics.totalTransactions) : 0} per transaction
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Payment Method Breakdown */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Payment Methods</Title>
          {paymentBreakdown.map((payment) => (
            <View key={payment.method} style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentMethod}>
                  {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                </Text>
                <Text style={styles.paymentPercentage}>
                  {payment.percentage.toFixed(1)}%
                </Text>
              </View>
              <Text style={[styles.paymentAmount, styles.revenueColor]}>
                {formatCurrency(payment.amount)}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Top Products */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Top Products</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Product</DataTable.Title>
              <DataTable.Title numeric>Qty</DataTable.Title>
              <DataTable.Title numeric>Revenue</DataTable.Title>
            </DataTable.Header>

            {topProducts.map((product, index) => (
              <DataTable.Row key={product.productId}>
                <DataTable.Cell>
                  <View style={styles.productCell}>
                    <Text style={styles.productRank}>#{index + 1}</Text>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.productName}
                    </Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell numeric>{product.quantity}</DataTable.Cell>
                <DataTable.Cell numeric style={styles.revenueColor as any}>
                  {formatCurrency(product.revenue)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      {/* Hourly Sales */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Hourly Sales</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.hourlyChart}>
              {hourlySales.map((hour) => (
                <View key={hour.hour} style={styles.hourBarContainer}>
                  <View style={styles.hourBar}>
                    <View
                      style={[
                        styles.hourBarFill,
                        {
                          height: `${Math.min(
                            (hour.revenue / Math.max(...hourlySales.map(h => h.revenue))) * 80,
                            80
                          )}%`,
                          backgroundColor: hour.revenue > 0 ? theme.colors.primary : '#f0f0f0',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.hourLabel}>{hour.hour.toString().padStart(2, '0')}</Text>
                  <Text style={styles.hourValue}>
                    {formatCurrency(hour.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Recent Transactions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Recent Transactions</Title>
            <Button mode="text" onPress={() => {}}>
              View All
            </Button>
          </View>
          
          {sales.slice(0, 5).map((sale: POSSale) => (
            <View key={sale.id} style={styles.transactionRow}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionId}>{sale.receiptNumber}</Text>
                <Text style={styles.transactionTime}>
                  {formatDate(sale.createdAt)}
                </Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[styles.transactionTotal, styles.revenueColor]}>
                  {formatCurrency(sale.totalAmount)}
                </Text>
                <Chip mode="outlined" style={styles.paymentChip}>
                  {sale.paymentMethod}
                </Chip>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateRangeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  dateChip: {
    marginRight: 8,
  },
  dateChipText: {
    fontSize: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  metricCard: {
    width: (width - 32) / 2 - 4,
    margin: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  revenueColor: {
    color: '#4caf50',
  },
  metricChange: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentPercentage: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productRank: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    width: 20,
  },
  productName: {
    fontSize: 14,
    flex: 1,
  },
  hourlyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingVertical: 16,
  },
  hourBarContainer: {
    alignItems: 'center',
    marginRight: 8,
    width: 30,
  },
  hourBar: {
    width: 24,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  hourBarFill: {
    borderRadius: 2,
  },
  hourLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  hourValue: {
    fontSize: 9,
    color: '#999',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentChip: {
    height: 24,
  },
});

export default ReportsScreen;