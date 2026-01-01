import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  ActivityIndicator,
  Searchbar,
  FAB,
  Menu,
  Divider,
  Chip,
  Avatar,
  IconButton,
  TextInput,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CustomerFormData {
  customerCode: string;
  companyName?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  paymentTerms: string;
  creditLimit?: number;
  taxId?: string;
  customerType: 'regular' | 'wholesale' | 'retail';
  notes?: string;
}

const CustomersScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { customers, loading, error } = useSelector((state: RootState) => state.customers);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    customerCode: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    paymentTerms: 'Cash',
    creditLimit: 0,
    taxId: '',
    customerType: 'retail',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    // This would dispatch the actual fetch action
    // await dispatch(fetchCustomers());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'active' && customer.status === 'active') ||
      (filterType === 'inactive' && customer.status === 'inactive');
    
    return matchesSearch && matchesFilter;
  });

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      customerCode: `CUST${Date.now().toString().slice(-6)}`,
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      region: '',
      postalCode: '',
      paymentTerms: 'Cash',
      creditLimit: 0,
      taxId: '',
      customerType: 'retail',
      notes: '',
    });
    setDialogVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customerCode: customer.customerCode,
      companyName: customer.companyName || '',
      contactPerson: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      address: customer.address || '',
      city: customer.city || '',
      region: customer.region || '',
      postalCode: customer.postalCode || '',
      paymentTerms: customer.paymentTerms,
      creditLimit: customer.creditLimit || 0,
      taxId: customer.taxId || '',
      customerType: customer.customerType,
      notes: customer.notes || '',
    });
    setDialogVisible(true);
  };

  const handleSaveCustomer = () => {
    if (!formData.contactPerson || !formData.phone || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const customerData: Partial<Customer> = {
      ...formData,
      status: 'active',
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date(),
      updatedAt: new Date(),
    };

    if (editingCustomer) {
      // Dispatch update action
      // dispatch(updateCustomer({ id: editingCustomer.id, data: customerData }));
    } else {
      // Dispatch create action
      // dispatch(createCustomer(customerData));
    }

    setDialogVisible(false);
  };

  const handleToggleStatus = (customer: Customer) => {
    Alert.alert(
      'Confirm Status Change',
      `Are you sure you want to ${customer.status === 'active' ? 'deactivate' : 'activate'} this customer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            // Dispatch toggle status action
            // dispatch(toggleCustomerStatus(customer.id));
          }
        },
      ]
    );
  };

  const getCustomerInitials = (customer: Customer) => {
    const name = customer.contactPerson;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return initials.slice(0, 2);
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'wholesale': return '#ff9800';
      case 'retail': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <Card style={styles.customerCard}>
      <Card.Content>
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Avatar.Text
              size={48}
              label={getCustomerInitials(item)}
              style={styles.avatar}
            />
            <View style={styles.customerDetails}>
              <View style={styles.customerNameRow}>
                <Title style={styles.customerName}>{item.contactPerson}</Title>
                <Chip
                  mode="outlined"
                  selected={item.status === 'active'}
                  selectedColor={getCustomerTypeColor(item.customerType)}
                  style={styles.typeChip}
                >
                  {item.customerType}
                </Chip>
              </View>
              {item.companyName && (
                <Text style={styles.companyName}>{item.companyName}</Text>
              )}
              <View style={styles.contactInfo}>
                <Text style={styles.contactText}>📞 {item.phone}</Text>
                <Text style={styles.contactText}>✉️ {item.email}</Text>
              </View>
              {item.creditLimit && item.creditLimit > 0 && (
                <Text style={styles.creditLimit}>
                  Credit Limit: {formatCurrency(item.creditLimit)}
                </Text>
              )}
            </View>
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
              onPress={() => handleEditCustomer(item)} 
              title="Edit" 
              leadingIcon="pencil" 
            />
            <Menu.Item 
              onPress={() => handleToggleStatus(item)} 
              title={item.status === 'active' ? 'Deactivate' : 'Activate'} 
              leadingIcon={item.status === 'active' ? 'pause' : 'play'} 
            />
            <Divider />
            <Menu.Item 
              onPress={() => {}} 
              title="View History" 
              leadingIcon="history" 
            />
            <Menu.Item 
              onPress={() => {}} 
              title="Send Statement" 
              leadingIcon="email" 
            />
          </Menu>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="account-group" style={styles.emptyIcon} />
      <Title style={styles.emptyTitle}>No Customers Found</Title>
      <Text style={styles.emptyText}>
        {searchQuery || filterType !== 'all' 
          ? 'Try adjusting your search or filter criteria'
          : 'Start by adding your first customer'}
      </Text>
      <Button
        mode="contained"
        onPress={handleAddCustomer}
        style={styles.emptyButton}
        icon="plus"
      >
        Add Customer
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search customers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filterContainer}>
          <Chip
            selected={filterType === 'all'}
            onPress={() => setFilterType('all')}
            style={styles.filterChip}
          >
            All ({customers.length})
          </Chip>
          <Chip
            selected={filterType === 'active'}
            onPress={() => setFilterType('active')}
            style={styles.filterChip}
          >
            Active ({customers.filter(c => c.status === 'active').length})
          </Chip>
          <Chip
            selected={filterType === 'inactive'}
            onPress={() => setFilterType('inactive')}
            style={styles.filterChip}
          >
            Inactive ({customers.filter(c => c.status === 'inactive').length})
          </Chip>
        </View>
      </View>

      {/* Customer List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Add Customer FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddCustomer}
        label="Add Customer"
      />

      {/* Customer Form Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <View style={styles.formContainer}>
              <TextInput
                label="Customer Code *"
                value={formData.customerCode}
                onChangeText={(text) => setFormData({ ...formData, customerCode: text })}
                style={styles.input}
                disabled={!!editingCustomer}
              />
              
              <TextInput
                label="Company Name"
                value={formData.companyName}
                onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                style={styles.input}
              />
              
              <TextInput
                label="Contact Person *"
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                style={styles.input}
              />
              
              <TextInput
                label="Phone *"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                style={styles.input}
                keyboardType="phone-pad"
              />
              
              <TextInput
                label="Email *"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                label="Address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                style={styles.input}
                multiline
              />
              
              <View style={styles.rowInputs}>
                <TextInput
                  label="City"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Region"
                  value={formData.region}
                  onChangeText={(text) => setFormData({ ...formData, region: text })}
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              
              <TextInput
                label="Postal Code"
                value={formData.postalCode}
                onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                style={styles.input}
              />
              
              <TextInput
                label="Payment Terms"
                value={formData.paymentTerms}
                onChangeText={(text) => setFormData({ ...formData, paymentTerms: text })}
                style={styles.input}
              />
              
              <TextInput
                label="Credit Limit"
                value={formData.creditLimit?.toString() || ''}
                onChangeText={(text) => setFormData({ ...formData, creditLimit: parseFloat(text) || 0 })}
                style={styles.input}
                keyboardType="numeric"
              />
              
              <TextInput
                label="Tax ID"
                value={formData.taxId}
                onChangeText={(text) => setFormData({ ...formData, taxId: text })}
                style={styles.input}
              />
              
              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                style={styles.input}
                multiline
              />
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveCustomer} mode="contained">
              {editingCustomer ? 'Update' : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    elevation: 2,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  customerCard: {
    marginBottom: 12,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  creditLimit: {
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '500',
  },
  typeChip: {
    height: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  formContainer: {
    paddingVertical: 8,
  },
  input: {
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
});

export default CustomersScreen;