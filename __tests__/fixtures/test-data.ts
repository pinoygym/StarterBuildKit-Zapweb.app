import { Product, Warehouse, Branch, Supplier, InventoryBatch, ProductUOM } from '@prisma/client';

// Test Branches
export const mockBranches = {
  main: {
    id: 'branch-1',
    name: 'Main Branch',
    address: '123 Main St',
    phone: '555-0001',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Branch,
  secondary: {
    id: 'branch-2',
    name: 'Secondary Branch',
    address: '456 Second St',
    phone: '555-0002',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Branch,
};

// Test Warehouses
export const mockWarehouses = {
  main: {
    id: 'warehouse-1',
    name: 'Main Warehouse',
    location: 'Building A',
    capacity: 10000,
    branchId: 'branch-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Warehouse,
  secondary: {
    id: 'warehouse-2',
    name: 'Secondary Warehouse',
    location: 'Building B',
    capacity: 5000,
    branchId: 'branch-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Warehouse,
};

// Test Suppliers
export const mockSuppliers = {
  supplier1: {
    id: 'supplier-1',
    name: 'ABC Supplier',
    contactPerson: 'John Doe',
    email: 'john@abc.com',
    phone: '555-1001',
    address: '789 Supplier Ave',
    paymentTerms: 'NET_30',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Supplier,
};

// Test Products
export const mockProducts = {
  productA: {
    id: 'product-1',
    sku: 'PROD-001',
    name: 'Product A',
    description: 'Test Product A',
    category: 'Electronics',
    baseUOM: 'PIECE',
    reorderPoint: 10,
    imageUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Product,
  productB: {
    id: 'product-2',
    sku: 'PROD-002',
    name: 'Product B',
    description: 'Test Product B',
    category: 'Food',
    baseUOM: 'KILOGRAM',
    reorderPoint: 50,
    imageUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Product,
  productWithBox: {
    id: 'product-3',
    sku: 'PROD-003',
    name: 'Product with Box UOM',
    description: 'Test Product with Box',
    category: 'General',
    baseUOM: 'PIECE',
    reorderPoint: 20,
    imageUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Product,
};

// Test Product UOMs
export const mockProductUOMs = {
  productA_piece: {
    id: 'uom-1',
    productId: 'product-1',
    uom: 'PIECE',
    conversionFactor: 1,
    price: 100.00,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as ProductUOM,
  productB_kg: {
    id: 'uom-2',
    productId: 'product-2',
    uom: 'KILOGRAM',
    conversionFactor: 1,
    price: 50.00,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as ProductUOM,
  productB_gram: {
    id: 'uom-3',
    productId: 'product-2',
    uom: 'GRAM',
    conversionFactor: 0.001,
    price: 0.05,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as ProductUOM,
  product3_piece: {
    id: 'uom-4',
    productId: 'product-3',
    uom: 'PIECE',
    conversionFactor: 1,
    price: 10.00,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as ProductUOM,
  product3_box: {
    id: 'uom-5',
    productId: 'product-3',
    uom: 'BOX',
    conversionFactor: 12,
    price: 110.00,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as ProductUOM,
};

// Test Inventory Batches
export const mockInventoryBatches = {
  batch1: {
    id: 'batch-1',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    batchNumber: 'BATCH-20240101-0001',
    quantity: 100,
    unitCost: 80.00,
    expiryDate: new Date('2025-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as InventoryBatch,
  batch2: {
    id: 'batch-2',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    batchNumber: 'BATCH-20240115-0001',
    quantity: 50,
    unitCost: 85.00,
    expiryDate: new Date('2025-06-30'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  } as InventoryBatch,
  batch3: {
    id: 'batch-3',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    batchNumber: 'BATCH-20240201-0001',
    quantity: 75,
    unitCost: 90.00,
    expiryDate: new Date('2025-03-31'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  } as InventoryBatch,
  batch4_product2: {
    id: 'batch-4',
    productId: 'product-2',
    warehouseId: 'warehouse-1',
    batchNumber: 'BATCH-20240101-0002',
    quantity: 200,
    unitCost: 40.00,
    expiryDate: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as InventoryBatch,
};

// Helper to create mock data with custom values
export const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'test-product',
  sku: 'TEST-SKU',
  name: 'Test Product',
  description: 'Test Description',
  category: 'Test Category',
  baseUOM: 'PIECE' as any,
  reorderPoint: 10,
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockWarehouse = (overrides: Partial<Warehouse> = {}): Warehouse => ({
  id: 'test-warehouse',
  name: 'Test Warehouse',
  location: 'Test Location',
  capacity: 1000,
  branchId: 'test-branch',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBatch = (overrides: Partial<InventoryBatch> = {}): InventoryBatch => ({
  id: 'test-batch',
  productId: 'test-product',
  warehouseId: 'test-warehouse',
  batchNumber: 'TEST-BATCH',
  quantity: 100,
  unitCost: 50.00,
  expiryDate: new Date('2025-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProductUOM = (overrides: Partial<ProductUOM> = {}): ProductUOM => ({
  id: 'test-uom',
  productId: 'test-product',
  uom: 'PIECE' as any,
  conversionFactor: 1,
  price: 100.00,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
