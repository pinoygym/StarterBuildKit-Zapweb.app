import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  Button,
  Card,
  TextInput as PaperTextInput,
  FAB,
  Searchbar,
  Chip,
  Menu,
  Divider,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  selectProducts,
  selectProductsLoading,
  selectProductsError,
} from '../../store/slices/productsSlice';
import { Product, ProductStatus } from '../../types';

export default function ProductListScreen() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [dispatch]);

  const loadProducts = async () => {
    try {
      await dispatch(fetchProducts()).unwrap();
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProduct(product.id)).unwrap();
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await dispatch(
        updateProduct({
          id: product.id,
          data: { status: newStatus },
        })
      ).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to update product status');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const renderProductItem = ({ item }: { item: Product }) => (
    <Card style={styles.productCard}>
      <Card.Content>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
            {item.description && (
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item 
              onPress={() => {
                setMenuVisible(null);
                // Navigate to edit screen
              }} 
              title="Edit" 
              leadingIcon="pencil"
            />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(null);
                handleToggleStatus(item);
              }} 
              title={item.status === 'active' ? 'Deactivate' : 'Activate'}
              leadingIcon={item.status === 'active' ? 'pause' : 'play'}
            />
            <Divider />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(null);
                handleDeleteProduct(item);
              }} 
              title="Delete" 
              leadingIcon="delete"
              titleStyle={{ color: '#f44336' }}
            />
          </Menu>
        </View>

        <View style={styles.productDetails}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.priceValue}>₱{item.basePrice.toFixed(2)}</Text>
          </View>
          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>Stock:</Text>
            <Text style={[
              styles.stockValue,
              { color: item.minStockLevel && item.minStockLevel > 0 ? '#f44336' : '#4caf50' }
            ]}>
              {item.minStockLevel || 0} {item.baseUOM}
            </Text>
          </View>
        </View>

        <View style={styles.productFooter}>
          <Chip
            mode="outlined"
            selected={item.status === 'active'}
            selectedColor={item.status === 'active' ? '#4caf50' : '#f44336'}
            style={styles.statusChip}
          >
            {item.status}
          </Chip>
          <Text style={styles.updatedText}>
            Updated {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
          ? 'Try adjusting your filters'
          : 'Add your first product to get started'}
      </Text>
      <Button
        mode="contained"
        onPress={() => {/* Navigate to add product screen */}}
        style={styles.addButton}
      >
        Add Product
      </Button>
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search products..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map((category) => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={styles.filterChip}
                textStyle={styles.chipText}
              >
                {category === 'all' ? 'All Categories' : category}
              </Chip>
            ))}
          </ScrollView>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statusScroll}
          >
            <Chip
              selected={selectedStatus === 'all'}
              onPress={() => setSelectedStatus('all')}
              style={styles.filterChip}
            >
              All Status
            </Chip>
            <Chip
              selected={selectedStatus === 'active'}
              onPress={() => setSelectedStatus('active')}
              style={styles.filterChip}
            >
              Active
            </Chip>
            <Chip
              selected={selectedStatus === 'inactive'}
              onPress={() => setSelectedStatus('inactive')}
              style={styles.filterChip}
            >
              Inactive
            </Chip>
          </ScrollView>
        </View>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB for adding new product */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {/* Navigate to add product screen */}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
  },
  filterContainer: {
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  statusScroll: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  chipText: {
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    height: 28,
  },
  updatedText: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#6200ee',
  },
});