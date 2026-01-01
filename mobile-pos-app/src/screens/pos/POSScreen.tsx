import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Button, Card, TextInput, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity, 
  clearCart, 
  setPaymentMethod,
  setCustomerInfo,
  setAmountReceived
} from '../../store/slices/cartSlice';
import { fetchProducts } from '../../store/slices/productsSlice';
import { selectCurrentUser, selectCurrentBranch } from '../../store/slices/authSlice';
import { posService } from '../../services/pos/posService';
import { Product, CartItem } from '../../types';

export default function POSScreen() {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'digital'>('cash');
  
  // Redux selectors
  const cartItems = useAppSelector(state => state.cart.items);
  const subtotal = useAppSelector(state => state.cart.subtotal);
  const tax = useAppSelector(state => state.cart.tax);
  const total = useAppSelector(state => state.cart.total);
  const amountReceived = useAppSelector(state => state.cart.amountReceived);
  const customerId = useAppSelector(state => state.cart.customerId);
  const customerName = useAppSelector(state => state.cart.customerName);
  
  const user = useAppSelector(selectCurrentUser);
  const currentBranch = useAppSelector(selectCurrentBranch);
  const products = useAppSelector(state => state.products.items);

  useEffect(() => {
    // Load products when component mounts
    dispatch(fetchProducts());
  }, [dispatch]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = (product: Product) => {
    const cartItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      uom: product.baseUOM,
      unitPrice: product.basePrice,
      subtotal: product.basePrice,
      imageUrl: product.imageUrl,
    };
    dispatch(addToCart(cartItem));
  };

  const handlePaymentMethodChange = (method: 'cash' | 'card' | 'credit' | 'digital') => {
    setSelectedPaymentMethod(method);
    dispatch(setPaymentMethod(method));
  };

  const handleAmountReceivedChange = (amount: string) => {
    setAmountReceived(amount);
    dispatch(setAmountReceived(amount));
  };

  const handleCustomerInfoChange = (field: 'name' | 'phone' | 'email', value: string) => {
    if (field === 'name') {
      dispatch(setCustomerInfo({ customerId, customerName: value }));
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    if (selectedPaymentMethod === 'cash') {
      const received = parseFloat(amountReceived);
      if (received < total) {
        Alert.alert('Error', 'Insufficient amount received');
        return;
      }
    }

    if (selectedPaymentMethod === 'credit' && !customerName) {
      Alert.alert('Error', 'Customer information is required for credit payment');
      return;
    }

    try {
      const sale = await posService.createSale({
        items: cartItems,
        subtotal,
        tax,
        total,
        paymentMethod: selectedPaymentMethod,
        amountReceived: selectedPaymentMethod === 'cash' ? amountReceived : undefined,
        customerId,
        customerName,
        userId: user.id,
        branchId: currentBranch?.id || 'default',
      });

      Alert.alert(
        'Sale Complete',
        `Receipt: ${sale.receiptNumber}\nTotal: ₱${total.toFixed(2)}`,
        [
          {
            text: 'Print Receipt',
            onPress: () => handlePrintReceipt(),
          },
          {
            text: 'New Sale',
            onPress: () => dispatch(clearCart()),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error completing sale:', error);
      Alert.alert('Error', error?.message || 'Failed to complete sale');
    }
  };

  const handlePrintReceipt = () => {
    // In real app, this would integrate with receipt printer or generate PDF
    Alert.alert('Receipt', 'Receipt sent to printer');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <Card style={styles.cartItemCard}>
      <Card.Content style={styles.cartItemContent}>
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName}>{item.productName}</Text>
          <Text style={styles.cartItemPrice}>₱{item.unitPrice.toFixed(2)} / {item.uom}</Text>
        </View>
        
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => {
              if (item.quantity > 1) {
                dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity - 1 }));
              } else {
                dispatch(removeFromCart(item.id));
              }
            }}
          >
            <MaterialCommunityIcons name="minus" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity + 1 }))}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Product Search and List */}
      <View style={styles.leftPanel}>
        <View style={styles.searchContainer}>
          <TextInput
            mode="outlined"
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
          />
        </View>

        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => handleAddProduct(item)}
            >
              <Card>
                <Card.Content>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={styles.productPrice}>₱{item.price.toFixed(2)} / {item.uom}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          style={styles.productList}
        />
      </View>

      {/* Cart and Checkout Panel */}
      <View style={styles.rightPanel}>
        <ScrollView style={styles.cartContainer}>
          <Text style={styles.sectionTitle}>Current Sale</Text>
          
          {cartItems.length === 0 ? (
            <Text style={styles.emptyCartText}>No items in cart</Text>
          ) : (
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id}
              style={styles.cartList}
            />
          )}
        </ScrollView>

        <Divider style={styles.divider} />

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>₱{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (12%):</Text>
            <Text style={styles.totalValue}>₱{tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>₱{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {[
              { key: 'cash', label: 'Cash', icon: 'cash' },
              { key: 'card', label: 'Card', icon: 'credit-card' },
              { key: 'credit', label: 'Credit', icon: 'account-credit-card' },
              { key: 'digital', label: 'Digital', icon: 'cellphone' },
            ].map((method) => (
              <TouchableOpacity
                key={method.key}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.key && styles.selectedPaymentMethod,
                ]}
                onPress={() => handlePaymentMethodChange(method.key as any)}
              >
                <MaterialCommunityIcons
                  name={method.icon as any}
                  size={24}
                  color={selectedPaymentMethod === method.key ? '#fff' : '#6200ee'}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === method.key && styles.selectedPaymentMethodText,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cash Payment Input */}
        {selectedPaymentMethod === 'cash' && (
          <TextInput
            mode="outlined"
            label="Amount Received"
            value={amountReceived}
            onChangeText={handleAmountReceivedChange}
            keyboardType="numeric"
            style={styles.input}
          />
        )}

        {/* Credit Customer Info */}
        {selectedPaymentMethod === 'credit' && (
          <View>
            <TextInput
              mode="outlined"
              label="Customer Name"
              value={customerName || ''}
              onChangeText={(text) => handleCustomerInfoChange('name', text)}
              style={styles.input}
            />
          </View>
        )}

        {/* Checkout Button */}
        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          disabled={cartItems.length === 0}
        >
          Complete Sale
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 2,
    padding: 16,
  },
  rightPanel: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
  },
  productList: {
    flex: 1,
  },
  productCard: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: 'bold',
  },
  cartContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  cartList: {
    marginBottom: 16,
  },
  cartItemCard: {
    marginBottom: 8,
  },
  cartItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#6200ee',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  totalsContainer: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  paymentContainer: {
    marginBottom: 16,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6200ee',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedPaymentMethod: {
    backgroundColor: '#6200ee',
  },
  paymentMethodText: {
    color: '#6200ee',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedPaymentMethodText: {
    color: '#fff',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  checkoutButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
});