# Design Document

## Overview

InventoryPro is a comprehensive inventory management and POS system built with Next.js 15, React 19, TypeScript, Prisma ORM, and Neon PostgreSQL. The system follows a modular architecture with clear separation of concerns, implementing a design system for UI consistency and using server-side rendering for optimal performance.

## Technical Stack

### Core Technologies
- **Framework:** Next.js 15 (App Router with React Server Components)
- **UI Library:** React 19
- **Language:** TypeScript 5.3+
- **Database:** Neon PostgreSQL (Serverless)
- **ORM:** Prisma 5.x
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts
- **Date Handling:** date-fns
- **Forms:** React Hook Form + Zod
- **State Management:** Zustand + TanStack Query
- **PDF Generation:** react-pdf
- **Excel Export:** xlsx
- **Deployment:** Vercel

### Why This Stack?
- **Next.js 15:** Latest stable version, App Router for better performance, built-in API routes
- **React 19:** Latest stable with improved performance and concurrent features
- **TypeScript 5.3+:** Latest stable with improved type inference
- **Neon PostgreSQL:** Serverless, auto-scaling, built-in branching for dev/staging
- **Prisma 5.x:** Latest stable, excellent TypeScript support, migration system
- **Tailwind CSS v4:** Latest stable, improved performance, better DX
- **shadcn/ui:** Actively maintained, accessible, customizable components

## Architecture


### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Next.js App Router + React Server Components)             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │   Products   │  │     POS      │     │
│  │    Pages     │  │    Pages     │  │    Pages     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│              (Next.js API Routes / Server Actions)           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Product    │  │  Inventory   │  │     POS      │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│                    (Prisma ORM)                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Product    │  │  Inventory   │  │     POS      │     │
│  │ Repository   │  │ Repository   │  │ Repository   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│              (Neon PostgreSQL)                               │
│                                                              │
│  Products │ Inventory │ Warehouses │ Suppliers │ Orders     │
│  POS Sales │ AR/AP │ Expenses │ Branches │ Users            │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
inventory-pro/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   ├── inventory/
│   │   │   ├── warehouses/
│   │   │   ├── branches/
│   │   │   ├── suppliers/
│   │   │   ├── purchase-orders/
│   │   │   ├── sales-orders/
│   │   │   ├── pos/
│   │   │   ├── ar-ap/
│   │   │   ├── expenses/
│   │   │   ├── alerts/
│   │   │   └── reports/
│   │   ├── api/
│   │   │   ├── products/
│   │   │   ├── inventory/
│   │   │   └── ...
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── pos/
│   │   └── shared/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   └── validations/
│   ├── services/
│   │   ├── product.service.ts
│   │   ├── inventory.service.ts
│   │   └── ...
│   ├── repositories/
│   │   ├── product.repository.ts
│   │   ├── inventory.repository.ts
│   │   └── ...
│   ├── types/
│   │   ├── product.types.ts
│   │   ├── inventory.types.ts
│   │   └── ...
│   └── hooks/
│       ├── useProducts.ts
│       ├── useInventory.ts
│       └── ...
├── public/
├── .env
├── next.config.js
├── tailwind.config.ts
└── package.json
```


## Data Models

### Prisma Schema Overview

```prisma
// Core Entities
model Branch {
  id          String   @id @default(uuid())
  name        String
  code        String   @unique
  location    String
  manager     String
  phone       String
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  warehouses      Warehouse[]
  purchaseOrders  PurchaseOrder[]
  salesOrders     SalesOrder[]
  posSales        POSSale[]
  expenses        Expense[]
  arRecords       AccountsReceivable[]
  apRecords       AccountsPayable[]
}

model Product {
  id              String   @id @default(uuid())
  name            String   @unique
  description     String?
  category        String
  imageUrl        String?
  basePrice       Decimal  @db.Decimal(10, 2)
  baseUOM         String
  minStockLevel   Int
  shelfLifeDays   Int
  status          String   @default("active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  alternateUOMs   ProductUOM[]
  inventoryBatches InventoryBatch[]
  poItems         PurchaseOrderItem[]
  soItems         SalesOrderItem[]
  posItems        POSSaleItem[]
}

model ProductUOM {
  id              String   @id @default(uuid())
  productId       String
  name            String
  conversionFactor Decimal @db.Decimal(10, 4)
  sellingPrice    Decimal  @db.Decimal(10, 2)
  createdAt       DateTime @default(now())
  
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([productId, name])
}

model Warehouse {
  id              String   @id @default(uuid())
  name            String
  location        String
  manager         String
  maxCapacity     Int
  branchId        String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  branch          Branch   @relation(fields: [branchId], references: [id])
  inventoryBatches InventoryBatch[]
  purchaseOrders  PurchaseOrder[]
  salesOrders     SalesOrder[]
}

model InventoryBatch {
  id              String   @id @default(uuid())
  batchNumber     String   @unique
  productId       String
  warehouseId     String
  quantity        Decimal  @db.Decimal(10, 2)
  unitCost        Decimal  @db.Decimal(10, 2)
  expiryDate      DateTime
  receivedDate    DateTime
  status          String   @default("active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  product         Product  @relation(fields: [productId], references: [id])
  warehouse       Warehouse @relation(fields: [warehouseId], references: [id])
  movements       StockMovement[]
}

model StockMovement {
  id              String   @id @default(uuid())
  batchId         String
  type            String   // "IN", "OUT", "TRANSFER", "ADJUSTMENT"
  quantity        Decimal  @db.Decimal(10, 2)
  reason          String?
  referenceId     String?  // PO ID, SO ID, or POS Sale ID
  referenceType   String?  // "PO", "SO", "POS"
  createdAt       DateTime @default(now())
  
  batch           InventoryBatch @relation(fields: [batchId], references: [id])
}

model Supplier {
  id              String   @id @default(uuid())
  companyName     String
  contactPerson   String
  phone           String
  email           String
  paymentTerms    String   // "Net 15", "Net 30", "Net 60", "COD"
  status          String   @default("active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  purchaseOrders  PurchaseOrder[]
  apRecords       AccountsPayable[]
}


model PurchaseOrder {
  id                  String   @id @default(uuid())
  poNumber            String   @unique
  supplierId          String
  warehouseId         String
  branchId            String
  totalAmount         Decimal  @db.Decimal(10, 2)
  status              String   @default("draft")
  expectedDeliveryDate DateTime
  actualDeliveryDate  DateTime?
  notes               String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  supplier            Supplier @relation(fields: [supplierId], references: [id])
  warehouse           Warehouse @relation(fields: [warehouseId], references: [id])
  branch              Branch @relation(fields: [branchId], references: [id])
  items               PurchaseOrderItem[]
}

model PurchaseOrderItem {
  id              String   @id @default(uuid())
  poId            String
  productId       String
  quantity        Decimal  @db.Decimal(10, 2)
  unitPrice       Decimal  @db.Decimal(10, 2)
  subtotal        Decimal  @db.Decimal(10, 2)
  
  purchaseOrder   PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  product         Product @relation(fields: [productId], references: [id])
}

model SalesOrder {
  id              String   @id @default(uuid())
  orderNumber     String   @unique
  customerName    String
  customerPhone   String
  customerEmail   String
  deliveryAddress String
  warehouseId     String
  branchId        String
  totalAmount     Decimal  @db.Decimal(10, 2)
  status          String   @default("draft")
  salesOrderStatus String  @default("pending")
  deliveryDate    DateTime
  convertedToSaleId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  warehouse       Warehouse @relation(fields: [warehouseId], references: [id])
  branch          Branch @relation(fields: [branchId], references: [id])
  items           SalesOrderItem[]
}

model SalesOrderItem {
  id              String   @id @default(uuid())
  soId            String
  productId       String
  quantity        Decimal  @db.Decimal(10, 2)
  uom             String
  unitPrice       Decimal  @db.Decimal(10, 2)
  subtotal        Decimal  @db.Decimal(10, 2)
  
  salesOrder      SalesOrder @relation(fields: [soId], references: [id], onDelete: Cascade)
  product         Product @relation(fields: [productId], references: [id])
}

model POSSale {
  id                  String   @id @default(uuid())
  receiptNumber       String   @unique
  branchId            String
  subtotal            Decimal  @db.Decimal(10, 2)
  tax                 Decimal  @db.Decimal(10, 2)
  totalAmount         Decimal  @db.Decimal(10, 2)
  paymentMethod       String
  amountReceived      Decimal? @db.Decimal(10, 2)
  change              Decimal? @db.Decimal(10, 2)
  convertedFromOrderId String?
  createdAt           DateTime @default(now())
  
  branch              Branch @relation(fields: [branchId], references: [id])
  items               POSSaleItem[]
}

model POSSaleItem {
  id              String   @id @default(uuid())
  saleId          String
  productId       String
  quantity        Decimal  @db.Decimal(10, 2)
  uom             String
  unitPrice       Decimal  @db.Decimal(10, 2)
  subtotal        Decimal  @db.Decimal(10, 2)
  costOfGoodsSold Decimal  @db.Decimal(10, 2)
  
  sale            POSSale @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product         Product @relation(fields: [productId], references: [id])
}


model AccountsReceivable {
  id              String   @id @default(uuid())
  branchId        String
  customerName    String
  salesOrderId    String?
  totalAmount     Decimal  @db.Decimal(10, 2)
  paidAmount      Decimal  @db.Decimal(10, 2) @default(0)
  balance         Decimal  @db.Decimal(10, 2)
  dueDate         DateTime
  status          String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  branch          Branch @relation(fields: [branchId], references: [id])
  payments        ARPayment[]
}

model ARPayment {
  id              String   @id @default(uuid())
  arId            String
  amount          Decimal  @db.Decimal(10, 2)
  paymentMethod   String
  referenceNumber String?
  paymentDate     DateTime
  createdAt       DateTime @default(now())
  
  ar              AccountsReceivable @relation(fields: [arId], references: [id], onDelete: Cascade)
}

model AccountsPayable {
  id              String   @id @default(uuid())
  branchId        String
  supplierId      String
  purchaseOrderId String?
  totalAmount     Decimal  @db.Decimal(10, 2)
  paidAmount      Decimal  @db.Decimal(10, 2) @default(0)
  balance         Decimal  @db.Decimal(10, 2)
  dueDate         DateTime
  status          String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  branch          Branch @relation(fields: [branchId], references: [id])
  supplier        Supplier @relation(fields: [supplierId], references: [id])
  payments        APPayment[]
}

model APPayment {
  id              String   @id @default(uuid())
  apId            String
  amount          Decimal  @db.Decimal(10, 2)
  paymentMethod   String
  referenceNumber String?
  paymentDate     DateTime
  createdAt       DateTime @default(now())
  
  ap              AccountsPayable @relation(fields: [apId], references: [id], onDelete: Cascade)
}

model Expense {
  id              String   @id @default(uuid())
  branchId        String
  expenseDate     DateTime
  category        String
  amount          Decimal  @db.Decimal(10, 2)
  description     String
  paymentMethod   String
  vendor          String?
  receiptUrl      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  branch          Branch @relation(fields: [branchId], references: [id])
}
```

### Database Indexes

```prisma
// Add to models for performance
@@index([branchId])
@@index([status])
@@index([createdAt])
@@index([productId, warehouseId])
@@index([expiryDate])
@@index([receiptNumber])
@@index([orderNumber])
@@index([poNumber])
```


## Components and Interfaces

### Service Layer Pattern

Each module follows a consistent service pattern:

```typescript
// services/product.service.ts
export class ProductService {
  async createProduct(data: CreateProductInput): Promise<Product> {
    // Validation
    await this.validateProduct(data);
    
    // Business logic
    const product = await productRepository.create(data);
    
    // Side effects (if any)
    await this.notifyStockAlert(product);
    
    return product;
  }
  
  async calculateAverageCost(productId: string, warehouseId: string): Promise<number> {
    const batches = await inventoryRepository.getActiveBatches(productId, warehouseId);
    
    const totalCost = batches.reduce((sum, batch) => 
      sum + (batch.quantity * batch.unitCost), 0
    );
    const totalQuantity = batches.reduce((sum, batch) => 
      sum + batch.quantity, 0
    );
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }
}
```

### Repository Layer Pattern

```typescript
// repositories/product.repository.ts
export class ProductRepository {
  async create(data: CreateProductInput): Promise<Product> {
    return await prisma.product.create({
      data: {
        ...data,
        alternateUOMs: {
          create: data.alternateUOMs
        }
      },
      include: {
        alternateUOMs: true
      }
    });
  }
  
  async findById(id: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        alternateUOMs: true,
        inventoryBatches: {
          where: { status: 'active' }
        }
      }
    });
  }
  
  async findActiveProducts(): Promise<Product[]> {
    return await prisma.product.findMany({
      where: { status: 'active' },
      include: {
        alternateUOMs: true
      },
      orderBy: { name: 'asc' }
    });
  }
}
```

### API Route Pattern (Server Actions)

```typescript
// app/api/products/actions.ts
'use server'

import { revalidatePath } from 'next/cache';
import { productService } from '@/services/product.service';

export async function createProduct(formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      basePrice: parseFloat(formData.get('basePrice') as string),
      baseUOM: formData.get('baseUOM') as string,
      minStockLevel: parseInt(formData.get('minStockLevel') as string),
      shelfLifeDays: parseInt(formData.get('shelfLifeDays') as string),
    };
    
    const product = await productService.createProduct(data);
    
    revalidatePath('/products');
    
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### React Component Pattern

```typescript
// components/products/ProductForm.tsx
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validations/product';
import { createProduct } from '@/app/api/products/actions';

export function ProductForm() {
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      basePrice: 0,
      baseUOM: 'bottle',
      minStockLevel: 10,
      shelfLifeDays: 365,
    }
  });
  
  async function onSubmit(data: ProductFormData) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    const result = await createProduct(formData);
    
    if (result.success) {
      toast.success('Product created successfully');
      form.reset();
    } else {
      toast.error(result.error);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```


## Key Business Logic Implementations

### 1. Weighted Average Cost Calculation

```typescript
// services/inventory.service.ts
export class InventoryService {
  async calculateWeightedAverageCost(
    productId: string, 
    warehouseId: string
  ): Promise<number> {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        productId,
        warehouseId,
        status: 'active',
        quantity: { gt: 0 }
      }
    });
    
    if (batches.length === 0) return 0;
    
    const totalCost = batches.reduce((sum, batch) => 
      sum + (Number(batch.quantity) * Number(batch.unitCost)), 0
    );
    
    const totalQuantity = batches.reduce((sum, batch) => 
      sum + Number(batch.quantity), 0
    );
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }
  
  async addStock(data: AddStockInput): Promise<InventoryBatch> {
    // Convert to base UOM if needed
    const baseQuantity = await this.convertToBaseUOM(
      data.productId,
      data.quantity,
      data.uom
    );
    
    // Create batch
    const batch = await prisma.inventoryBatch.create({
      data: {
        batchNumber: await this.generateBatchNumber(),
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: baseQuantity,
        unitCost: data.unitCost,
        receivedDate: new Date(),
        expiryDate: await this.calculateExpiryDate(data.productId),
        status: 'active'
      }
    });
    
    // Record movement
    await prisma.stockMovement.create({
      data: {
        batchId: batch.id,
        type: 'IN',
        quantity: baseQuantity,
        reason: data.reason || 'Stock addition'
      }
    });
    
    // Recalculate average cost (happens automatically on next query)
    
    return batch;
  }
  
  async deductStock(
    productId: string,
    warehouseId: string,
    quantity: number,
    uom: string,
    referenceId: string,
    referenceType: string
  ): Promise<void> {
    // Convert to base UOM
    const baseQuantity = await this.convertToBaseUOM(productId, quantity, uom);
    
    // Get batches ordered by expiry date (FIFO for physical stock)
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        productId,
        warehouseId,
        status: 'active',
        quantity: { gt: 0 }
      },
      orderBy: { expiryDate: 'asc' }
    });
    
    let remainingToDeduct = baseQuantity;
    
    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;
      
      const deductFromBatch = Math.min(
        Number(batch.quantity),
        remainingToDeduct
      );
      
      // Update batch quantity
      await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          quantity: Number(batch.quantity) - deductFromBatch
        }
      });
      
      // Record movement
      await prisma.stockMovement.create({
        data: {
          batchId: batch.id,
          type: 'OUT',
          quantity: deductFromBatch,
          referenceId,
          referenceType
        }
      });
      
      remainingToDeduct -= deductFromBatch;
    }
    
    if (remainingToDeduct > 0) {
      throw new Error('Insufficient stock available');
    }
  }
}
```

### 2. UOM Conversion

```typescript
async convertToBaseUOM(
  productId: string,
  quantity: number,
  uom: string
): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { alternateUOMs: true }
  });
  
  if (!product) throw new Error('Product not found');
  
  // If already base UOM, return as is
  if (uom === product.baseUOM) {
    return quantity;
  }
  
  // Find conversion factor
  const alternateUOM = product.alternateUOMs.find(u => u.name === uom);
  
  if (!alternateUOM) {
    throw new Error(`UOM ${uom} not found for product`);
  }
  
  // Convert: quantity * conversionFactor = base units
  return quantity * Number(alternateUOM.conversionFactor);
}
```


### 3. POS Sale Processing

```typescript
// services/pos.service.ts
export class POSService {
  async processSale(data: POSSaleInput): Promise<POSSale> {
    return await prisma.$transaction(async (tx) => {
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.12; // 12% VAT
      const totalAmount = subtotal + tax;
      
      // Create POS sale
      const sale = await tx.pOSSale.create({
        data: {
          receiptNumber: await this.generateReceiptNumber(),
          branchId: data.branchId,
          subtotal,
          tax,
          totalAmount,
          paymentMethod: data.paymentMethod,
          amountReceived: data.amountReceived,
          change: data.amountReceived ? data.amountReceived - totalAmount : null,
          convertedFromOrderId: data.convertedFromOrderId
        }
      });
      
      // Process each item
      for (const item of data.items) {
        // Get weighted average cost
        const avgCost = await inventoryService.calculateWeightedAverageCost(
          item.productId,
          data.warehouseId
        );
        
        // Convert quantity to base UOM for COGS calculation
        const baseQuantity = await inventoryService.convertToBaseUOM(
          item.productId,
          item.quantity,
          item.uom
        );
        
        const costOfGoodsSold = avgCost * baseQuantity;
        
        // Create sale item
        await tx.pOSSaleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            uom: item.uom,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            costOfGoodsSold
          }
        });
        
        // Deduct inventory
        await inventoryService.deductStock(
          item.productId,
          data.warehouseId,
          item.quantity,
          item.uom,
          sale.id,
          'POS'
        );
      }
      
      // Update sales order if converted
      if (data.convertedFromOrderId) {
        await tx.salesOrder.update({
          where: { id: data.convertedFromOrderId },
          data: {
            salesOrderStatus: 'converted',
            convertedToSaleId: sale.id
          }
        });
      }
      
      return sale;
    });
  }
}
```

### 4. Purchase Order Receiving

```typescript
// services/purchase-order.service.ts
export class PurchaseOrderService {
  async receivePurchaseOrder(poId: string): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      // Get PO with items
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true }
      });
      
      if (!po) throw new Error('Purchase order not found');
      if (po.status === 'received') throw new Error('PO already received');
      
      // Create inventory batches for each item
      for (const item of po.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });
        
        if (!product) continue;
        
        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);
        
        // Create batch
        const batch = await tx.inventoryBatch.create({
          data: {
            batchNumber: await this.generateBatchNumber(),
            productId: item.productId,
            warehouseId: po.warehouseId,
            quantity: item.quantity,
            unitCost: item.unitPrice,
            receivedDate: new Date(),
            expiryDate,
            status: 'active'
          }
        });
        
        // Record movement
        await tx.stockMovement.create({
          data: {
            batchId: batch.id,
            type: 'IN',
            quantity: item.quantity,
            referenceId: po.id,
            referenceType: 'PO',
            reason: `Received from PO ${po.poNumber}`
          }
        });
      }
      
      // Update PO status
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'received',
          actualDeliveryDate: new Date()
        }
      });
      
      // Create accounts payable
      const supplier = await tx.supplier.findUnique({
        where: { id: po.supplierId }
      });
      
      if (supplier) {
        const dueDate = this.calculateDueDate(supplier.paymentTerms);
        
        await tx.accountsPayable.create({
          data: {
            branchId: po.branchId,
            supplierId: po.supplierId,
            purchaseOrderId: po.id,
            totalAmount: po.totalAmount,
            paidAmount: 0,
            balance: po.totalAmount,
            dueDate,
            status: 'pending'
          }
        });
      }
    });
  }
  
  private calculateDueDate(paymentTerms: string): Date {
    const dueDate = new Date();
    
    switch (paymentTerms) {
      case 'Net 15':
        dueDate.setDate(dueDate.getDate() + 15);
        break;
      case 'Net 30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'Net 60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'COD':
        // Due immediately
        break;
    }
    
    return dueDate;
  }
}
```


### 5. Alert Generation

```typescript
// services/alert.service.ts
export class AlertService {
  async generateAlerts(branchId?: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    // Low stock alerts
    const lowStockProducts = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        p.minStockLevel,
        w.id as warehouseId,
        w.name as warehouseName,
        SUM(ib.quantity) as currentStock
      FROM "Product" p
      CROSS JOIN "Warehouse" w
      LEFT JOIN "InventoryBatch" ib ON ib.productId = p.id 
        AND ib.warehouseId = w.id 
        AND ib.status = 'active'
      WHERE p.status = 'active'
        ${branchId ? Prisma.sql`AND w.branchId = ${branchId}` : Prisma.empty}
      GROUP BY p.id, p.name, p.minStockLevel, w.id, w.name
      HAVING COALESCE(SUM(ib.quantity), 0) < p.minStockLevel
    `;
    
    alerts.push(...lowStockProducts.map(item => ({
      type: 'LOW_STOCK',
      severity: 'warning',
      productId: item.id,
      productName: item.name,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseName,
      currentStock: Number(item.currentStock) || 0,
      minStock: item.minStockLevel,
      shortage: item.minStockLevel - (Number(item.currentStock) || 0)
    })));
    
    // Expiring soon alerts (within 30 days)
    const expiringBatches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        quantity: { gt: 0 },
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        ...(branchId && {
          warehouse: { branchId }
        })
      },
      include: {
        product: true,
        warehouse: true
      }
    });
    
    alerts.push(...expiringBatches.map(batch => ({
      type: 'EXPIRING_SOON',
      severity: 'warning',
      productId: batch.productId,
      productName: batch.product.name,
      batchNumber: batch.batchNumber,
      warehouseId: batch.warehouseId,
      warehouseName: batch.warehouse.name,
      expiryDate: batch.expiryDate,
      daysUntilExpiry: Math.ceil(
        (batch.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      ),
      quantity: Number(batch.quantity)
    })));
    
    // Expired alerts
    const expiredBatches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        quantity: { gt: 0 },
        expiryDate: { lt: new Date() },
        ...(branchId && {
          warehouse: { branchId }
        })
      },
      include: {
        product: true,
        warehouse: true
      }
    });
    
    alerts.push(...expiredBatches.map(batch => ({
      type: 'EXPIRED',
      severity: 'critical',
      productId: batch.productId,
      productName: batch.product.name,
      batchNumber: batch.batchNumber,
      warehouseId: batch.warehouseId,
      warehouseName: batch.warehouse.name,
      expiryDate: batch.expiryDate,
      quantity: Number(batch.quantity)
    })));
    
    return alerts;
  }
}
```


## Error Handling

### Error Handling Strategy

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number, requested: number) {
    super(
      `Insufficient stock for ${productName}. Available: ${available}, Requested: ${requested}`,
      400,
      'INSUFFICIENT_STOCK'
    );
  }
}

// Global error handler for API routes
export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'A record with this value already exists',
        code: 'DUPLICATE_ERROR',
        statusCode: 400
      };
    }
    
    if (error.code === 'P2025') {
      return {
        success: false,
        error: 'Record not found',
        code: 'NOT_FOUND',
        statusCode: 404
      };
    }
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  };
}
```

### Client-Side Error Handling

```typescript
// hooks/useApiMutation.ts
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mutate = async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mutationFn(variables);
      
      if (!result.success) {
        setError(result.error || 'An error occurred');
        toast.error(result.error || 'An error occurred');
        return { success: false, error: result.error };
      }
      
      toast.success('Operation completed successfully');
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };
  
  return { mutate, isLoading, error };
}
```


## Testing Strategy

### Unit Testing

```typescript
// __tests__/services/inventory.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryService } from '@/services/inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  
  beforeEach(() => {
    service = new InventoryService();
  });
  
  describe('calculateWeightedAverageCost', () => {
    it('should calculate correct weighted average cost', async () => {
      // Mock data
      const batches = [
        { quantity: 100, unitCost: 10 }, // 1000
        { quantity: 50, unitCost: 12 },  // 600
      ];
      // Total: 1600 / 150 = 10.67
      
      const result = await service.calculateWeightedAverageCost(
        'product-id',
        'warehouse-id'
      );
      
      expect(result).toBeCloseTo(10.67, 2);
    });
    
    it('should return 0 when no batches exist', async () => {
      const result = await service.calculateWeightedAverageCost(
        'non-existent',
        'warehouse-id'
      );
      
      expect(result).toBe(0);
    });
  });
  
  describe('convertToBaseUOM', () => {
    it('should convert pack to bottles correctly', async () => {
      // 1 pack = 6 bottles
      const result = await service.convertToBaseUOM(
        'product-id',
        2, // 2 packs
        'pack'
      );
      
      expect(result).toBe(12); // 12 bottles
    });
    
    it('should return same quantity for base UOM', async () => {
      const result = await service.convertToBaseUOM(
        'product-id',
        10,
        'bottle' // base UOM
      );
      
      expect(result).toBe(10);
    });
  });
});
```

### Integration Testing

```typescript
// __tests__/api/pos.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/pos/route';

describe('POS API', () => {
  it('should process sale and deduct inventory', async () => {
    const request = new Request('http://localhost/api/pos', {
      method: 'POST',
      body: JSON.stringify({
        branchId: 'branch-1',
        warehouseId: 'warehouse-1',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            uom: 'bottle',
            unitPrice: 25,
            subtotal: 50
          }
        ],
        paymentMethod: 'cash',
        amountReceived: 100
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data.totalAmount).toBe(56); // 50 + 12% tax
    expect(data.data.change).toBe(44);
  });
});
```

### E2E Testing (Optional)

```typescript
// e2e/pos-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete POS sale flow', async ({ page }) => {
  await page.goto('/pos');
  
  // Search for product
  await page.fill('[data-testid="product-search"]', 'Coca Cola');
  await page.click('[data-testid="product-item-1"]');
  
  // Add to cart
  await page.click('[data-testid="add-to-cart"]');
  
  // Verify cart
  await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  
  // Proceed to payment
  await page.click('[data-testid="checkout-button"]');
  
  // Select payment method
  await page.click('[data-testid="payment-cash"]');
  await page.fill('[data-testid="amount-received"]', '100');
  
  // Complete sale
  await page.click('[data-testid="complete-sale"]');
  
  // Verify receipt
  await expect(page.locator('[data-testid="receipt"]')).toBeVisible();
});
```


## UI/UX Design System

### Color Palette

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      }
    }
  }
}
```

### Typography Scale

```typescript
// Font sizes
text-sm: 14px
text-base: 16px
text-lg: 18px
text-xl: 20px
text-2xl: 24px
text-3xl: 30px

// Headings
h1: text-3xl font-bold
h2: text-2xl font-semibold
h3: text-xl font-semibold
```

### Spacing Scale

```typescript
// Based on 4px increments
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-6: 24px
space-8: 32px
space-12: 48px
space-16: 64px
```

### Component Patterns

#### Button Variants

```tsx
// components/ui/button.tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Action</Button>
<Button variant="ghost">Ghost Action</Button>
<Button variant="destructive">Delete</Button>
```

#### Form Layout

```tsx
// Consistent form pattern
<Form>
  <FormField>
    <FormLabel>Product Name</FormLabel>
    <FormControl>
      <Input placeholder="Enter product name" />
    </FormControl>
    <FormDescription>This will be displayed to customers</FormDescription>
    <FormMessage /> {/* Error message */}
  </FormField>
</Form>
```

#### Card Layout

```tsx
<Card>
  <CardHeader>
    <CardTitle>Product Details</CardTitle>
    <CardDescription>Manage product information</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

#### Table Layout

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Product</TableHead>
      <TableHead>Stock</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {products.map(product => (
      <TableRow key={product.id}>
        <TableCell>{product.name}</TableCell>
        <TableCell>{product.stock}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Status Badges

```tsx
// Consistent status colors
<Badge variant="default">Draft</Badge>      {/* Gray */}
<Badge variant="warning">Pending</Badge>    {/* Yellow */}
<Badge variant="success">Active</Badge>     {/* Green */}
<Badge variant="destructive">Cancelled</Badge> {/* Red */}
```

#### Page Layout

```tsx
// Consistent page structure
<div className="container mx-auto p-6">
  {/* Page Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-3xl font-bold">Products</h1>
      <Breadcrumb>
        <BreadcrumbItem>Dashboard</BreadcrumbItem>
        <BreadcrumbItem>Products</BreadcrumbItem>
      </Breadcrumb>
    </div>
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Product
    </Button>
  </div>
  
  {/* Page Content */}
  <Card>
    {/* Content here */}
  </Card>
</div>
```


## Performance Optimization

### Database Query Optimization

```typescript
// Use select to limit fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    basePrice: true,
    // Only select needed fields
  }
});

// Use proper indexing
@@index([branchId, status])
@@index([productId, warehouseId])
@@index([expiryDate])

// Use pagination
const products = await prisma.product.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { name: 'asc' }
});

// Use aggregations for counts
const totalProducts = await prisma.product.count({
  where: { status: 'active' }
});
```

### React Server Components

```tsx
// app/(dashboard)/products/page.tsx
// This runs on the server
export default async function ProductsPage() {
  // Direct database query - no API call needed
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    include: { alternateUOMs: true }
  });
  
  return <ProductList products={products} />;
}
```

### Caching Strategy

```typescript
// Use Next.js caching
export const revalidate = 60; // Revalidate every 60 seconds

// Use React Query for client-side caching
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Use Neon connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Image Optimization

```tsx
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={200}
  height={200}
  className="rounded-lg"
  loading="lazy"
/>
```

### Code Splitting

```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const ReportGenerator = dynamic(
  () => import('@/components/reports/ReportGenerator'),
  { loading: () => <Skeleton /> }
);
```

## Security Considerations

### Input Validation

```typescript
// Use Zod for validation
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  basePrice: z.number().positive('Price must be positive'),
  minStockLevel: z.number().int().positive(),
  category: z.enum(['Carbonated', 'Juices', 'Energy Drinks', 'Water']),
});

// Validate in server actions
export async function createProduct(data: unknown) {
  const validated = productSchema.parse(data);
  // Proceed with validated data
}
```

### SQL Injection Prevention

```typescript
// Prisma automatically prevents SQL injection
// Safe - parameterized query
const products = await prisma.product.findMany({
  where: {
    name: { contains: userInput } // Safe
  }
});

// For raw queries, use Prisma.sql
const result = await prisma.$queryRaw`
  SELECT * FROM "Product" 
  WHERE name = ${userInput}
`; // Safe - parameterized
```

### Environment Variables

```bash
# .env
DATABASE_URL="postgresql://user:password@host/database"
NEXT_PUBLIC_APP_URL="https://inventorypro.com"

# Never commit .env to git
# Use .env.example for documentation
```

### Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```


## Deployment Strategy

### Environment Setup

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Database migrations
npx prisma migrate dev
npx prisma migrate deploy # Production

# Seed database
npx prisma db seed
```

### Vercel Deployment

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "env": {
    "DATABASE_URL": "@database-url"
  }
}
```

### Database Branching (Neon)

```bash
# Create branch for development
neon branches create --name dev

# Create branch for staging
neon branches create --name staging

# Production uses main branch
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Monitoring and Logging

### Error Tracking

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Use in error boundaries
export function logError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}
```

### Performance Monitoring

```typescript
// Use Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Database Monitoring

```typescript
// Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Monitor slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query detected:', e.query);
  }
});
```

## Migration Path

### Phase 1: Core Setup (Week 1-2)
1. Initialize Next.js project
2. Setup Neon database
3. Configure Prisma schema
4. Setup shadcn/ui components
5. Implement authentication (if needed)

### Phase 2: Core Modules (Week 3-6)
1. Products module
2. Inventory module with average costing
3. Warehouses module
4. Suppliers module
5. Purchase Orders module

### Phase 3: Sales & POS (Week 7-9)
1. Sales Orders module
2. POS module
3. Receipt generation
4. Inventory deduction logic

### Phase 4: Financial (Week 10-12)
1. AR/AP module
2. Expenses module
3. Financial reports
4. Dashboard KPIs

### Phase 5: Multi-Branch & Reports (Week 13-14)
1. Branch management
2. Branch-specific filtering
3. Comprehensive reports
4. Export functionality

### Phase 6: Polish & Deploy (Week 15-16)
1. UI/UX refinements
2. Performance optimization
3. Testing
4. Production deployment

## Design Decisions

### Why Next.js 15 App Router?
- Server Components reduce client-side JavaScript
- Built-in API routes eliminate need for separate backend
- Excellent TypeScript support
- Automatic code splitting
- Image optimization out of the box

### Why Neon PostgreSQL?
- Serverless with auto-scaling
- Database branching for dev/staging
- Built-in connection pooling
- Excellent performance
- Free tier for development

### Why Prisma?
- Type-safe database queries
- Excellent TypeScript integration
- Migration system
- Schema-first approach
- Great developer experience

### Why shadcn/ui?
- Copy-paste components (no package bloat)
- Built on Radix UI (accessible)
- Fully customizable
- Consistent design system
- Active community

### Why Weighted Average Costing?
- Simpler than FIFO for accounting
- Better for products with frequent price changes
- Matches Philippine accounting standards
- Easier to calculate and understand
- Still uses FIFO for physical stock (expiry dates)

## Conclusion

This design provides a solid foundation for InventoryPro with:
- Modern, maintainable tech stack
- Clear separation of concerns
- Type safety throughout
- Performance optimization
- Scalability for growth
- Comprehensive error handling
- Consistent UI/UX
- Production-ready architecture

The system is designed to handle the complexities of inventory management, POS operations, and financial tracking while maintaining code quality and developer experience.
