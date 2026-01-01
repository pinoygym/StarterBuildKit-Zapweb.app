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
  ScrollView,
} from 'react-native';
import {
  Button,
  Card,
  TextInput as PaperTextInput,
  FAB,
  Searchbar,
  Chip,
  Divider,
  IconButton,
  Dialog,
  Portal,
  Provider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchInventoryBatches,
  addStock,
  deductStock,
  transferStock,
  adjustStock,
  selectInventoryBatches,
  selectInventoryLoading,
  selectInventoryError,
} from '../../store/slices/inventorySlice';
import { InventoryBatch, StockOperationType } from '../../types';

export default function InventoryScreen() {
  const dispatch = useAppDispatch();
  const batches = useAppSelector(selectInventoryBatches);
  const loading = useAppSelector(selectInventoryLoading);
  const error = useAppSelector(selectInventoryError);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stockDialogVisible, setStockDialogVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  const [stockOperation, setStockOperation] = useState<StockOperationType>('add');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInventory();
  }, [dispatch]);

  const loadInventory = async () => {
    try {
      await dispatch(fetchInventoryBatches()).unwrap();
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  const showStockDialog = (batch: InventoryBatch, operation: StockOperationType) => {
    setSelectedBatch(batch);
    setStockOperation(operation);
    setQuantity('');
    setNotes('');
    setStockDialogVisible(true);
  };

  const handleStockOperation = async () => {
    if (!selectedBatch || !quantity) return;

    try {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        return;
      }

      let result;
      switch (stockOperation) {
        case 'add':
          result = await dispatch(
            addStock({
              batchId: selectedBatch.id,
              quantity: qty,
              reason: notes,
            })
          ).unwrap();
          break;
        case 'deduct':
          result = await dispatch(
            deductStock({
              batchId: selectedBatch.id,
              quantity: qty,
              reason: notes,
            })
          ).unwrap();
          break;
        case 'adjust':
          result = await dispatch(
            adjustStock({
              batchId: selectedBatch.id,
              newQuantity: qty,
              reason: notes,
            })
          ).unwrap();
          break;
      }

      if (result) {
        Alert.alert('Success', `Stock ${stockOperation}ed successfully`);
        setStockDialogVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${stockOperation} stock`);
    }
  };

  const getOperationTitle = () => {
    switch (stockOperation) {
      case 'add': return 'Add Stock';
      case 'deduct': return 'Deduct Stock';
      case 'adjust': return 'Adjust Stock';
      case 'transfer': return 'Transfer Stock';
      default: return 'Stock Operation';
    }
  };

  const getOperationIcon = () => {
    switch (stockOperation) {
      case 'add': return 'plus';
      case 'deduct': return 'minus';
      case 'adjust': return 'tune';
      case 'transfer': return 'swap-horizontal';
      default: return 'pencil';
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = batch.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (selectedStatus === 'low') {
      matchesStatus = batch.currentStock <= batch.minStockLevel;
    } else if (selectedStatus === 'expiring') {
      const daysUntilExpiry = Math.ceil(
        (new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      matchesStatus = daysUntilExpiry <= 30;
    }
    
    return matchesSearch && matchesStatus;
  });

  const renderInventoryItem = ({ item }: { item: InventoryBatch }) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const isExpiringSoon = daysUntilExpiry <= 30;
    const isLowStock = item.currentStock <= item.minStockLevel;

    return (
      <Card style={[styles.batchCard, isExpiringSoon && styles.expiringCard]}>
        <Card.Content>
          <View style={styles.batchHeader}>
            <View style={styles.batchInfo}>
              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.batchNumber}>Batch: {item.batchNumber}</Text>
            </View>
            <View style={styles.stockIndicator}>
              <Chip
                mode="outlined"
                selected={isLowStock}
                selectedColor={isLowStock ? '#f44336' : '#4caf50'}
                style={styles.stockChip}
              >
                {item.currentStock} {item.uom}
              </Chip>
            </View>
          </View>

          <View style={styles.batchDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="warehouse" size={16} color="#666" />
              <Text style={styles.detailText}>Location: {item.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={16} color="#666" />
              <Text style={styles.detailText}>
                Expires: {new Date(item.expiryDate).toLocaleDateString()}
                {isExpiringSoon && (
                  <Text style={styles.expiryWarning}> ({daysUntilExpiry} days)</Text>
                )}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="cash" size={16} color="#666" />
              <Text style={styles.detailText}>Cost: ₱{item.costPrice.toFixed(2)}</Text>
            </View>
            {item.supplierName && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="truck" size={16} color="#666" />
                <Text style={styles.detailText}>Supplier: {item.supplierName}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => showStockDialog(item, 'add')}
              style={styles.actionButton}
              icon="plus"
              contentStyle={styles.buttonContent}
            >
              Add
            </Button>
            <Button
              mode="outlined"
              onPress={() => showStockDialog(item, 'deduct')}
              style={styles.actionButton}
              icon="minus"
              contentStyle={styles.buttonContent}
            >
              Deduct
            </Button>
            <Button
              mode="outlined"
              onPress={() => showStockDialog(item, 'adjust')}
              style={styles.actionButton}
              icon="tune"
              contentStyle={styles.buttonContent}
            >
              Adjust
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSummaryCard = () => {
    const totalProducts = new Set(batches.map(b => b.productId)).size;
    const totalValue = batches.reduce((sum, batch) => sum + (batch.currentStock * batch.costPrice), 0);
    const lowStockItems = batches.filter(b => b.currentStock <= b.minStockLevel).length;
    const expiringItems = batches.filter(b => {
      const daysUntilExpiry = Math.ceil(
        (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30;
    }).length;

    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.summaryTitle}>Inventory Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="package-variant" size={24} color="#6200ee" />
              <Text style={styles.summaryValue}>{totalProducts}</Text>
              <Text style={styles.summaryLabel}>Products</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="cash" size={24} color="#4caf50" />
              <Text style={styles.summaryValue}>₱{totalValue.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>Total Value</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="alert" size={24} color="#f44336" />
              <Text style={styles.summaryValue}>{lowStockItems}</Text>
              <Text style={styles.summaryLabel}>Low Stock</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="clock-alert" size={24} color="#ff9800" />
              <Text style={styles.summaryValue}>{expiringItems}</Text>
              <Text style={styles.summaryLabel}>Expiring</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && batches.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <Provider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Searchbar
            placeholder="Search inventory..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <Chip
              selected={selectedStatus === 'all'}
              onPress={() => setSelectedStatus('all')}
              style={styles.filterChip}
            >
              All Items
            </Chip>
            <Chip
              selected={selectedStatus === 'low'}
              onPress={() => setSelectedStatus('low')}
              style={styles.filterChip}
            >
              Low Stock
            </Chip>
            <Chip
              selected={selectedStatus === 'expiring'}
              onPress={() => setSelectedStatus('expiring')}
              style={styles.filterChip}
            >
              Expiring Soon
            </Chip>
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Summary Card */}
          {renderSummaryCard()}

          {/* Inventory List */}
          {filteredBatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="warehouse" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>No Inventory Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Inventory batches will appear here'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredBatches}
              renderItem={renderInventoryItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </ScrollView>

        {/* Stock Operation Dialog */}
        <Portal>
          <Dialog visible={stockDialogVisible} onDismiss={() => setStockDialogVisible(false)}>
            <Dialog.Title>{getOperationTitle()}</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogText}>
                Product: {selectedBatch?.productName}
              </Text>
              <Text style={styles.dialogText}>
                Batch: {selectedBatch?.batchNumber}
              </Text>
              <Text style={styles.dialogText}>
                Current Stock: {selectedBatch?.currentStock} {selectedBatch?.uom}
              </Text>
              
              <PaperTextInput
                mode="outlined"
                label={stockOperation === 'adjust' ? 'New Quantity' : 'Quantity'}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={styles.dialogInput}
                left={<PaperTextInput.Icon icon={getOperationIcon()} />}
              />
              
              <PaperTextInput
                mode="outlined"
                label="Notes (Optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={styles.dialogInput}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setStockDialogVisible(false)}>Cancel</Button>
              <Button onPress={handleStockOperation} mode="contained">
                {getOperationTitle()}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* FAB for adding new batch */}
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => {/* Navigate to add batch screen */}}
        />
      </View>
    </Provider>
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
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  batchCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  expiringCard: {
    borderColor: '#ff9800',
    borderWidth: 1,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  batchInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  batchNumber: {
    fontSize: 14,
    color: '#666',
  },
  stockIndicator: {
    alignItems: 'flex-end',
  },
  stockChip: {
    height: 32,
  },
  batchDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  expiryWarning: {
    color: '#ff9800',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
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
  dialogText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  dialogInput: {
    marginTop: 16,
  },
});