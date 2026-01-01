# InventoryPro Documentation

## Table of Contents

1. [Introduction](#introduction)
   - [What is InventoryPro?](#what-is-inventorypro)
   - [Target Audience](#target-audience)
   - [Key Features](#key-features)
   - [Technology Stack](#technology-stack)

2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Database Setup](#database-setup)
   - [First Time Setup](#first-time-setup)
   - [Default Credentials](#default-credentials)

3. [User Guide](#user-guide)
   - [Core Concepts](#core-concepts)
   - [Navigation](#navigation)
   - [Branch Management](#branch-management)
   - [Product Management](#product-management)
   - [Inventory Management](#inventory-management)
   - [Warehouse Management](#warehouse-management)
   - [Supplier Management](#supplier-management)
   - [Purchase Orders](#purchase-orders)
   - [Receiving Vouchers](#receiving-vouchers)
   - [Sales Orders](#sales-orders)
   - [Point of Sale (POS)](#point-of-sale-pos)
   - [Accounts Receivable](#accounts-receivable)
   - [Accounts Payable](#accounts-payable)
   - [Expense Management](#expense-management)
   - [Alert System](#alert-system)
   - [Dashboard & Analytics](#dashboard--analytics)
   - [Reporting](#reporting)

4. [API Reference](#api-reference)
   - [Authentication](#authentication)
   - [Products API](#products-api)
   - [Inventory API](#inventory-api)
   - [POS API](#pos-api)
   - [Orders API](#orders-api)
   - [Financial API](#financial-api)
   - [Reports API](#reports-api)

5. [System Architecture](#system-architecture)
   - [Database Schema](#database-schema)
   - [Business Logic](#business-logic)
   - [Workflows](#workflows)
   - [Data Flow](#data-flow)

6. [Troubleshooting](#troubleshooting)
   - [Common Issues](#common-issues)
   - [Error Messages](#error-messages)
   - [Performance Issues](#performance-issues)
   - [Database Issues](#database-issues)

7. [FAQ](#faq)

8. [Appendices](#appendices)
   - [Glossary](#glossary)
   - [Configuration](#configuration)
   - [Best Practices](#best-practices)
   - [Support](#support)

---

## Introduction

### What is InventoryPro?

InventoryPro is a comprehensive inventory management and Point of Sale (POS) system specifically designed for soft drinks wholesale delivery companies in the Philippines. The system provides end-to-end management of inventory, sales, procurement, and financial operations with advanced features like multi-unit-of-measure (UOM) support, batch tracking, and weighted average costing.

### Target Audience

- **Soft Drinks Wholesale Companies**: Businesses that distribute beverages like Coca-Cola, Pepsi, and other soft drinks
- **Multi-branch Operations**: Companies with multiple warehouse locations and sales branches
- **Philippine Market**: Designed specifically for Philippine business practices and regulations
- **Growing Businesses**: Companies needing scalable inventory and POS solutions

### Key Features

#### Core Features
- **Multi-UOM Product Management**: Support for products with multiple units of measure (bottles, cases, pallets)
- **Batch Tracking**: Full traceability with expiration date monitoring and FIFO inventory management
- **Weighted Average Costing**: Accurate cost calculation for inventory valuation and profit analysis
- **Integrated POS System**: Complete point-of-sale with receipt generation and payment processing
- **Multi-Branch Support**: Manage multiple business locations with centralized oversight

#### Advanced Features
- **Real-time Inventory**: Live stock levels across all warehouses and branches
- **Automated Alerts**: Low stock, expiring items, and capacity warnings
- **Financial Management**: AR/AP tracking, expense management, and comprehensive reporting
- **Comprehensive Analytics**: Dashboard with KPIs, sales trends, and business intelligence
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, TypeScript
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma 5
- **Validation**: Zod
- **State Management**: Zustand, TanStack Query
- **Charts**: Recharts
- **Deployment**: Vercel

---

## Getting Started

### Prerequisites

Before installing InventoryPro, ensure you have the following:

- **Node.js**: Version 20+ (LTS recommended)
- **Database**: Neon PostgreSQL account (free tier available)
- **Git**: For cloning the repository
- **Web Browser**: Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd inventorypro
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

4. **Configure Database**
   Edit `.env` file and add your Neon PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/inventorypro?sslmode=require"
   ```

### Database Setup

1. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Run Database Migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed Database with Sample Data**
   ```bash
   npx prisma db seed
   ```

### First Time Setup

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Access Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

3. **Initial Login**
   Use the default admin credentials (see below)

### Default Credentials

After database seeding, use these credentials to log in:

- **Email**: cybergada@gmail.com
- **Password**: Qweasd145698@

> **⚠️ Security Note**: Change the default password immediately after first login in a production environment.

---

## User Guide

### Core Concepts

#### Units of Measure (UOM)
InventoryPro supports multiple units of measure for flexible product management:
- **Base UOM**: Primary unit (e.g., "bottle")
- **Alternate UOMs**: Additional units with conversion factors (e.g., "case" = 24 bottles)

#### Batch Tracking
Each inventory item is tracked by batch with:
- **Batch Number**: Unique identifier for each purchase batch
- **Expiration Date**: Shelf life monitoring
- **Unit Cost**: Purchase cost per unit
- **Quantity**: Available stock in the batch

#### Weighted Average Costing
Inventory valuation uses weighted average costing:
- **Formula**: Total Cost ÷ Total Quantity across all active batches
- **Real-time Updates**: Costs update with each purchase and sale
- **Accurate Valuation**: Reflects true inventory value

#### Branch Context
All operations are filtered by the selected branch:
- **Data Isolation**: Each branch sees only relevant data
- **Centralized Management**: Admin can access all branches
- **Branch Switching**: Easy switching between locations

### Navigation

#### Main Navigation
The sidebar contains all major modules:
- **Dashboard**: Overview and KPIs
- **Products**: Product catalog management
- **Inventory**: Stock levels and batch tracking
- **Warehouses**: Storage facility management
- **Branches**: Multi-location management
- **Suppliers**: Vendor management
- **Purchase Orders**: Procurement management
- **Sales Orders**: Customer order management
- **POS**: Point of sale interface
- **AR/AP**: Financial management
- **Expenses**: Cost tracking
- **Alerts**: System notifications
- **Reports**: Business analytics

#### Branch Selector
Located in the top navigation bar:
- **Current Branch**: Shows active branch
- **Switch Branches**: Dropdown to change context
- **Branch-specific Data**: All views filter by selected branch

### Branch Management

#### Overview
Manage multiple business locations with centralized oversight.

#### Creating a Branch
1. Navigate to **Branches** in the sidebar
2. Click **"Add Branch"**
3. Fill required fields:
   - **Name**: Branch display name
   - **Code**: Unique branch code
   - **Location**: Physical address
   - **Manager**: Branch manager name
   - **Phone**: Contact number
4. Click **"Save"**

#### Branch Operations
- **Edit**: Modify branch details
- **Activate/Deactivate**: Control branch status
- **View Details**: See branch information and statistics

### Product Management

#### Product Structure
Products support multiple UOMs for flexible pricing and inventory:

```
Product: Coca-Cola 8oz Bottle
├── Base UOM: Bottle (1 unit)
├── Alternate UOMs:
│   ├── Case (24 bottles)
│   └── Pallet (24 cases = 576 bottles)
└── Pricing: Different prices per UOM
```

#### Adding Products
1. Go to **Products** → **"Add Product"**
2. Enter basic information:
   - **Name**: Product name (must be unique)
   - **Description**: Optional product details
   - **Category**: Product classification
   - **Base Price**: Default selling price
   - **Base UOM**: Primary unit of measure
   - **Min Stock Level**: Reorder point
   - **Shelf Life Days**: Expiration monitoring
3. Add alternate UOMs:
   - **Name**: UOM name (e.g., "Case")
   - **Conversion Factor**: Units per base UOM (e.g., 24)
   - **Selling Price**: Price for this UOM
4. Upload product image (optional)
5. Click **"Save"**

#### Product Categories
Common categories for soft drinks:
- Carbonated Soft Drinks
- Juices
- Energy Drinks
- Water
- Other Beverages

### Inventory Management

#### Batch Tracking System
Each inventory receipt creates a batch with:
- **Batch Number**: Auto-generated unique identifier
- **Quantity**: Received quantity in base UOM
- **Unit Cost**: Purchase cost per unit
- **Expiry Date**: Calculated from shelf life
- **Warehouse**: Storage location
- **Status**: Active/Expired

#### Adding Stock
Stock is added through purchase order receiving:
1. Create and approve purchase order
2. Receive goods against the PO
3. System automatically creates inventory batches

#### Stock Deduction
Stock is reduced through sales:
1. POS sales deduct from available batches (FIFO)
2. Sales orders reserve stock until converted to POS
3. Manual adjustments for corrections

#### Stock Levels
Monitor inventory across all warehouses:
- **Available Stock**: Sum of all active batches
- **Reserved Stock**: Allocated to pending sales orders
- **Low Stock Alerts**: When below minimum level

### Warehouse Management

#### Warehouse Setup
1. Navigate to **Warehouses**
2. Click **"Add Warehouse"**
3. Configure:
   - **Name**: Warehouse identifier
   - **Location**: Physical address
   - **Manager**: Responsible person
   - **Max Capacity**: Storage limit
   - **Branch**: Associated branch

#### Capacity Management
- **Utilization Percentage**: Current stock vs capacity
- **Capacity Alerts**: Yellow (60%), Red (80%)
- **Product Distribution**: Stock levels by product

#### Stock Transfers
Move inventory between warehouses:
1. Go to **Inventory** → Select batch
2. Click **"Transfer"**
3. Choose destination warehouse
4. Enter transfer quantity
5. Confirm transfer

### Supplier Management

#### Supplier Information
Track vendor details and payment terms:
- **Company Name**: Supplier business name
- **Contact Person**: Primary contact
- **Payment Terms**: Net 15, Net 30, Net 60, COD
- **Contact Details**: Phone, email, address

#### Adding Suppliers
1. Go to **Suppliers** → **"Add Supplier"**
2. Enter supplier details
3. Set payment terms
4. Save supplier record

#### Supplier Performance
Monitor supplier metrics:
- **On-time Delivery**: Percentage of timely deliveries
- **Order Accuracy**: Quality of received goods
- **Payment Terms**: Credit terms compliance

### Purchase Orders

#### PO Workflow
```
Draft → Pending → Ordered → Received
```

#### Creating Purchase Orders
1. Navigate to **Purchase Orders** → **"Create PO"**
2. Select supplier and warehouse
3. Add products with quantities and prices
4. Set expected delivery date
5. Save as draft or submit

#### PO Status Management
- **Draft**: Editable, not sent to supplier
- **Pending**: Awaiting supplier confirmation
- **Ordered**: Confirmed with supplier
- **Received**: Goods received and inventoried
- **Cancelled**: Order cancelled

#### Receiving Process
1. Open approved PO
2. Click **"Receive"**
3. Enter actual received quantities
4. Note any variances or damages
5. System creates inventory batches automatically
6. Generates AP record for payment

### Receiving Vouchers

#### RV Creation
Receiving vouchers are created during PO receiving:
- **RV Number**: Auto-generated unique identifier
- **PO Reference**: Links to original purchase order
- **Received Items**: Actual quantities received
- **Variance Tracking**: Differences from ordered quantities

#### Variance Analysis
Track discrepancies between ordered and received:
- **Quantity Variance**: Over/under delivery
- **Quality Issues**: Damaged or incorrect items
- **Reason Codes**: Categorize variance causes

### Sales Orders

#### Order Processing
Customer order workflow:
```
Draft → Pending → Confirmed → Converted to POS
```

#### Creating Sales Orders
1. Go to **Sales Orders** → **"Create Order"**
2. Enter customer details:
   - **Customer Name**
   - **Phone** and **Email**
   - **Delivery Address**
3. Select warehouse and branch
4. Add products with quantities and UOMs
5. Set delivery date
6. Check stock availability
7. Save order

#### Stock Validation
- **Available Stock**: Must have sufficient inventory
- **UOM Conversion**: Automatic conversion to base UOM
- **Stock Reservation**: Orders reserve stock until fulfilled

#### Order Conversion
Convert sales orders to POS sales:
1. Open pending sales order
2. Click **"Convert to POS"**
3. Pre-populated cart with order items
4. Process payment through POS
5. Order marked as converted

### Point of Sale (POS)

#### POS Interface
The POS system provides:
- **Product Grid**: Visual product selection
- **Shopping Cart**: Order management
- **Payment Processing**: Multiple payment methods
- **Receipt Generation**: Professional receipts

#### Product Selection
- **Search**: Find products by name
- **Category Filter**: Filter by product type
- **Stock Indicators**: Green (available), Red (out of stock)
- **UOM Selection**: Choose appropriate unit of measure

#### Shopping Cart
- **Add/Remove Items**: Modify order quantities
- **UOM Changes**: Switch between available UOMs
- **Price Updates**: Automatic price recalculation
- **Stock Validation**: Prevent overselling

#### Payment Processing
Supported payment methods:
- **Cash**: Amount tendered and change calculation
- **Card**: Credit/debit card processing
- **Check**: Check payment recording
- **GCash**: Mobile payment
- **Online Transfer**: Bank transfer

#### Receipt Generation
- **Receipt Number**: Auto-generated unique identifier
- **Item Details**: Product, quantity, price, subtotal
- **Totals**: Subtotal, tax (12% VAT), total
- **Payment Info**: Method and amount received
- **Print Support**: Browser print functionality

#### Sales Order Integration
- **Pending Orders**: View pending sales orders
- **Bulk Conversion**: Convert multiple orders
- **Pre-population**: Auto-fill cart with order items

### Accounts Receivable

#### AR Overview
Track customer payments and outstanding balances:
- **Customer Invoices**: From POS sales and orders
- **Payment Terms**: Customer-specific terms
- **Aging Analysis**: 0-30, 31-60, 61-90, 90+ days
- **Payment Recording**: Track all customer payments

#### AR Creation
AR records are created from:
- **POS Sales**: Immediate AR creation
- **Sales Orders**: Optional credit sales
- **Manual Invoices**: Direct customer billing

#### Payment Recording
1. Open AR record
2. Click **"Record Payment"**
3. Enter payment details:
   - **Amount**: Payment amount
   - **Payment Method**: Cash, check, transfer, etc.
   - **Reference**: Check number, transaction ID
   - **Payment Date**: When payment was received
4. System updates balance and status

#### AR Aging Report
Analyze outstanding receivables:
- **Current**: 0-30 days
- **Overdue 1-30**: 31-60 days
- **Overdue 31-60**: 61-90 days
- **Overdue 60+**: 90+ days

### Accounts Payable

#### AP Overview
Manage supplier payments and obligations:
- **Purchase Order Integration**: AP created from PO receiving
- **Payment Terms**: Supplier-specific terms (Net 15/30/60, COD)
- **Due Date Calculation**: Based on payment terms
- **Payment Tracking**: Record all supplier payments

#### AP Workflow
```
PO Received → AP Created → Payment Due → Payment Recorded → Paid
```

#### Payment Processing
1. Navigate to **AR/AP** → **Payable** tab
2. Filter by status (pending, overdue)
3. Open AP record
4. Click **"Record Payment"**
5. Enter payment details
6. Update AP status

### Expense Management

#### Expense Categories
Track business expenses by category:
- **Utilities**: Electricity, water, internet
- **Rent**: Office and warehouse rental
- **Salaries**: Employee compensation
- **Transportation**: Vehicle and delivery costs
- **Marketing**: Advertising and promotion
- **Maintenance**: Equipment and facility maintenance
- **Other**: Miscellaneous expenses

#### Recording Expenses
1. Go to **Expenses** → **"Add Expense"**
2. Select category and date
3. Enter expense details:
   - **Amount**: Expense cost
   - **Description**: What was purchased
   - **Vendor**: Where expense occurred
   - **Payment Method**: How payment was made
4. Upload receipt (optional)
5. Save expense

#### Expense Reporting
- **Monthly Totals**: Expenses by month
- **Category Breakdown**: Spending by category
- **Vendor Analysis**: Spending by vendor
- **Trend Analysis**: Expense patterns over time

### Alert System

#### Alert Types
Automated notifications for:
- **Low Stock**: Products below minimum level
- **Expiring Soon**: Items expiring within 30 days
- **Expired**: Items past expiration date
- **Warehouse Capacity**: Storage nearing capacity limits

#### Alert Management
- **Alert Dashboard**: View all active alerts
- **Severity Levels**: Warning (yellow), Critical (red)
- **Action Items**: Quick links to resolve issues
- **Alert History**: Past alert tracking

#### Low Stock Alerts
Triggered when:
```
Current Stock < Minimum Stock Level
```

#### Expiry Alerts
- **Expiring Soon**: Expiry date within 30 days
- **Expired**: Expiry date in the past
- **Action Required**: Remove expired items from inventory

### Dashboard & Analytics

#### Key Performance Indicators
- **Total Products**: Active product count
- **Total Stock**: Sum of all inventory units
- **Inventory Value**: Total value using weighted average cost
- **Today's Sales**: Revenue for current day
- **Outstanding AR**: Total unpaid customer invoices
- **Outstanding AP**: Total unpaid supplier invoices
- **Monthly Expenses**: Current month expense total
- **Overdue Receivables**: AR past due date
- **Overdue Payables**: AP past due date

#### Analytics Widgets
- **Top Selling Products**: Best performing items
- **Warehouse Utilization**: Capacity usage by warehouse
- **Sales Trends**: Revenue over time
- **Expense Breakdown**: Spending by category
- **Branch Comparison**: Performance across locations

### Reporting

#### Available Reports

##### Inventory Reports
- **Stock Levels**: Current inventory by product and warehouse
- **Inventory Value**: Valuation using weighted average cost
- **Batch Tracking**: Detailed batch information with expiry dates
- **Stock Movements**: All inventory transactions with timestamps

##### Sales Reports
- **POS Sales**: Daily, weekly, monthly sales data
- **Best Selling Products**: Top products by revenue and quantity
- **Revenue by Category**: Sales performance by product category
- **Sales Order Fulfillment**: Order processing efficiency

##### Procurement Reports
- **Purchase Order Status**: PO workflow tracking
- **Supplier Performance**: Delivery time and quality metrics
- **Cost Analysis**: Purchase costs by supplier and product

##### Financial Reports
- **Profit & Loss**: Revenue, COGS, expenses, net profit
- **Cash Flow**: Operating, investing, financing activities
- **Balance Sheet**: Assets, liabilities, equity
- **AR/AP Aging**: Outstanding receivables and payables

#### Report Features
- **Date Range Filtering**: Custom date selections
- **Branch Filtering**: Location-specific reports
- **Export to CSV**: Download report data
- **Real-time Generation**: Current data in all reports

---

## API Reference

### Authentication

All API endpoints require authentication. Include the session token in the Authorization header:

```
Authorization: Bearer <session-token>
```

### Products API

#### Get All Products
```http
GET /api/products?category=beverages&status=active&search=coca
```

**Query Parameters:**
- `category`: Filter by product category
- `status`: Filter by status (active/inactive)
- `search`: Search by product name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Coca-Cola 8oz Bottle",
      "category": "Carbonated Soft Drinks",
      "basePrice": 15.00,
      "baseUOM": "bottle",
      "minStockLevel": 100,
      "status": "active",
      "productUOMs": [
        {
          "name": "case",
          "conversionFactor": 24,
          "sellingPrice": 350.00
        }
      ]
    }
  ]
}
```

#### Create Product
```http
POST /api/products
```

**Request Body:**
```json
{
  "name": "New Product",
  "category": "Beverages",
  "basePrice": 10.00,
  "baseUOM": "bottle",
  "minStockLevel": 50,
  "shelfLifeDays": 365,
  "productUOMs": [
    {
      "name": "case",
      "conversionFactor": 24,
      "sellingPrice": 240.00
    }
  ]
}
```

### Inventory API

#### Get Inventory Batches
```http
GET /api/inventory?productId=prod_123&warehouseId=wh_456
```

#### Add Stock
```http
POST /api/inventory/add-stock
```

**Request Body:**
```json
{
  "productId": "prod_123",
  "warehouseId": "wh_456",
  "quantity": 100,
  "unitCost": 12.00,
  "expiryDate": "2024-12-31"
}
```

#### Deduct Stock
```http
POST /api/inventory/deduct-stock
```

**Request Body:**
```json
{
  "productId": "prod_123",
  "warehouseId": "wh_456",
  "quantity": 10,
  "reason": "POS Sale"
}
```

### POS API

#### Get Products for POS
```http
GET /api/pos/products?category=beverages&search=coca
```

#### Process POS Sale
```http
POST /api/pos/sales
```

**Request Body:**
```json
{
  "branchId": "branch_123",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "uom": "bottle",
      "unitPrice": 15.00
    }
  ],
  "paymentMethod": "cash",
  "amountReceived": 35.00,
  "convertedFromOrderId": "so_456"
}
```

### Orders API

#### Get Sales Orders
```http
GET /api/sales-orders?status=pending&branchId=branch_123
```

#### Create Sales Order
```http
POST /api/sales-orders
```

**Request Body:**
```json
{
  "customerName": "Juan Dela Cruz",
  "customerPhone": "09123456789",
  "customerEmail": "juan@example.com",
  "deliveryAddress": "123 Main St, Manila",
  "warehouseId": "wh_123",
  "branchId": "branch_123",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 24,
      "uom": "case",
      "unitPrice": 350.00
    }
  ],
  "deliveryDate": "2024-12-01"
}
```

### Financial API

#### Get AR Records
```http
GET /api/ar?status=pending&branchId=branch_123
```

#### Record AR Payment
```http
POST /api/ar/{id}/payment
```

**Request Body:**
```json
{
  "amount": 5000.00,
  "paymentMethod": "cash",
  "paymentDate": "2024-11-20"
}
```

### Reports API

#### Get Sales Report
```http
GET /api/reports/sales/pos-sales?startDate=2024-11-01&endDate=2024-11-30
```

#### Get Inventory Report
```http
GET /api/reports/inventory/stock-levels?warehouseId=wh_123
```

---

## System Architecture

### Database Schema

#### Core Entities

**Branch**
- Multi-location support
- Branch-specific data isolation
- Manager and contact information

**Product**
- Multi-UOM support with conversion factors
- Category and pricing information
- Stock level monitoring

**ProductUOM**
- Alternate units of measure
- Conversion factors and pricing
- Independent pricing per UOM

**Warehouse**
- Storage facility management
- Capacity tracking and utilization
- Branch association

**InventoryBatch**
- Batch tracking with expiry dates
- FIFO inventory management
- Cost tracking per batch

**StockMovement**
- Complete audit trail
- Movement types: IN, OUT, TRANSFER, ADJUSTMENT
- Reference linking to source transactions

#### Transaction Entities

**PurchaseOrder & PurchaseOrderItem**
- Procurement workflow management
- Supplier and warehouse linkage
- Status tracking: Draft → Ordered → Received

**ReceivingVoucher & ReceivingVoucherItem**
- Goods receipt processing
- Variance tracking and analysis
- Automatic inventory batch creation

**SalesOrder & SalesOrderItem**
- Customer order management
- Stock reservation and validation
- POS conversion support

**POSSale & POSSaleItem**
- Point of sale transactions
- Cost of goods sold calculation
- Receipt generation

#### Financial Entities

**AccountsReceivable & ARPayment**
- Customer invoice tracking
- Payment recording and balance management
- Aging analysis support

**AccountsPayable & APPayment**
- Supplier invoice management
- Payment terms and due date calculation
- Payment recording

**Expense**
- Business expense tracking
- Category and vendor analysis
- Receipt attachment support

### Business Logic

#### Weighted Average Cost Calculation

The system maintains accurate inventory valuation using weighted average costing:

```
Total Cost = Sum(Quantity × Unit Cost for all active batches)
Total Quantity = Sum(Quantity for all active batches)
Weighted Average Cost = Total Cost ÷ Total Quantity
```

**When Updated:**
- New inventory batches added (purchase receiving)
- Existing batches deducted (sales)
- Cost adjustments or corrections

#### UOM Conversion Logic

Products support multiple units of measure with automatic conversion:

```
Base Quantity = Input Quantity × Conversion Factor
```

**Example:**
- Product: Coca-Cola Bottle (base UOM)
- Case = 24 bottles (conversion factor = 24)
- Pallet = 24 cases = 576 bottles (conversion factor = 576)

#### FIFO Inventory Management

Stock deduction follows First-In-First-Out principle:
1. Sort active batches by expiry date (ascending)
2. Deduct from oldest batches first
3. Update batch quantities accordingly
4. Record stock movements for audit trail

#### Payment Terms Processing

**Supplier Payment Terms:**
- Net 15: Due date = Invoice date + 15 days
- Net 30: Due date = Invoice date + 30 days
- Net 60: Due date = Invoice date + 60 days
- COD: Due date = Invoice date (same day)

### Workflows

#### Purchase to Pay Cycle
```
Supplier Selection → PO Creation → Supplier Approval → Goods Receipt → Quality Check → Invoice Processing → Payment
```

1. **Create Purchase Order**: Select supplier, add items, set delivery date
2. **Supplier Confirmation**: PO status changes to "Ordered"
3. **Goods Receiving**: Create receiving voucher, note variances
4. **Inventory Update**: Automatic batch creation with costs
5. **AP Creation**: Invoice recorded with payment terms
6. **Payment Processing**: Record payment when due

#### Order to Cash Cycle
```
Customer Order → Stock Validation → Order Confirmation → Picking → POS Sale → Payment → Delivery
```

1. **Sales Order Creation**: Customer details, items, delivery date
2. **Stock Reservation**: Validate availability, reserve stock
3. **Order Conversion**: Convert to POS sale or direct POS
4. **Payment Processing**: Multiple payment methods supported
5. **AR Creation**: Optional credit sales tracking
6. **Delivery**: Goods delivered to customer

#### Inventory Management Cycle
```
Stock Level Monitoring → Reorder Point → PO Creation → Goods Receipt → Stock Update → Sales Deduction → Reorder Trigger
```

1. **Stock Monitoring**: Real-time level tracking
2. **Alert Generation**: Low stock and expiry alerts
3. **Procurement**: PO creation for replenishment
4. **Receiving**: Batch creation with cost tracking
5. **Sales**: FIFO deduction with cost calculation
6. **Reporting**: Inventory value and movement analysis

### Data Flow

#### POS Sale Data Flow
```
POS Interface → Sale Validation → Inventory Deduction → COGS Calculation → Receipt Generation → AR Creation → Dashboard Update
```

#### Purchase Order Data Flow
```
PO Creation → Stock Validation → Supplier Notification → Goods Receipt → Batch Creation → AP Creation → Inventory Update
```

#### Report Generation Data Flow
```
Report Request → Parameter Validation → Data Aggregation → Calculation Logic → Export Processing → Response Generation
```

---

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem:** Unable to connect to database
**Symptoms:** Application fails to start, database errors in logs
**Solutions:**
1. Verify DATABASE_URL in .env file
2. Check Neon PostgreSQL credentials
3. Ensure SSL mode is set to "require"
4. Test connection with `npx prisma db push`

#### Stock Discrepancies

**Problem:** Inventory quantities don't match physical count
**Symptoms:** Negative stock, incorrect batch quantities
**Solutions:**
1. Check stock movement history for discrepancies
2. Verify FIFO logic in sales processing
3. Review receiving voucher variances
4. Use inventory adjustment feature for corrections

#### Performance Issues

**Problem:** Application running slowly
**Symptoms:** Slow page loads, delayed API responses
**Solutions:**
1. Check database query performance
2. Verify indexes are created: `npx prisma db push`
3. Clear browser cache and cookies
4. Check server resources (CPU, memory)

#### Login Problems

**Problem:** Unable to log in with correct credentials
**Symptoms:** "Invalid credentials" error
**Solutions:**
1. Verify email and password are correct
2. Check if account is active
3. Reset password if forgotten
4. Check database for user record

### Error Messages

#### "Insufficient Stock"
**Cause:** Attempting to sell more than available inventory
**Resolution:** Check current stock levels, adjust order quantity, or wait for replenishment

#### "Invalid UOM"
**Cause:** Selected unit of measure not configured for product
**Resolution:** Add the UOM to product configuration or select available UOM

#### "Branch Access Denied"
**Cause:** User trying to access data from unauthorized branch
**Resolution:** Switch to authorized branch or contact administrator

#### "Database Connection Failed"
**Cause:** Network or configuration issues
**Resolution:** Check database URL, network connectivity, and Neon status

### Performance Issues

#### Slow Dashboard Loading
**Cause:** Large dataset or complex calculations
**Solutions:**
- Add database indexes for frequently queried fields
- Implement pagination for large lists
- Cache expensive calculations
- Optimize database queries

#### Memory Usage High
**Cause:** Large result sets or memory leaks
**Solutions:**
- Implement proper pagination
- Close database connections
- Monitor for memory leaks
- Optimize image loading

### Database Issues

#### Migration Failures
**Problem:** Database migrations not applying
**Solutions:**
1. Check migration files for syntax errors
2. Verify database permissions
3. Reset database: `npx prisma migrate reset`
4. Manually apply migrations: `npx prisma db push`

#### Data Corruption
**Problem:** Inconsistent or corrupted data
**Solutions:**
1. Check data integrity constraints
2. Review transaction handling
3. Restore from backup if available
4. Use Prisma Studio to manually fix data

---

## FAQ

### Getting Started

**Q: How do I set up InventoryPro for the first time?**
A: Follow the installation guide in the Getting Started section. You'll need Node.js, a Neon PostgreSQL database, and to run the setup commands in order.

**Q: What are the default login credentials?**
A: Email: cybergada@gmail.com, Password: Qweasd145698@. Change this password immediately after first login.

**Q: Can I use a different database instead of Neon PostgreSQL?**
A: The system is designed for PostgreSQL. You can use any PostgreSQL-compatible database, but Neon is recommended for its serverless features.

### Product Management

**Q: How do I add multiple units of measure for a product?**
A: When creating or editing a product, add alternate UOMs with their conversion factors. For example, if bottles are your base UOM, a case might have a conversion factor of 24.

**Q: What is the difference between base price and UOM-specific prices?**
A: Base price is for the primary unit of measure. Each alternate UOM can have its own selling price, allowing for different pricing strategies (e.g., volume discounts).

**Q: How does the system handle product categories?**
A: Categories help organize products for reporting and filtering. Common categories include Carbonated Soft Drinks, Juices, Energy Drinks, and Water.

### Inventory Management

**Q: How does batch tracking work?**
A: Each purchase creates a batch with unique batch number, quantity, cost, and expiry date. Sales deduct from oldest batches first (FIFO) to ensure product freshness.

**Q: What is weighted average costing?**
A: The system calculates inventory value by averaging the cost of all active batches. This provides accurate valuation and profit calculations.

**Q: How do I handle expired inventory?**
A: The system automatically alerts for expiring (30 days) and expired items. Remove expired stock through inventory adjustments and update records accordingly.

### Sales and POS

**Q: Can I convert sales orders to POS sales?**
A: Yes, pending sales orders can be converted to POS sales. The system pre-populates the cart with order items for easy processing.

**Q: What payment methods are supported?**
A: Cash, Card, Check, GCash, and Online Transfer. Cash payments include change calculation.

**Q: How do I handle returns or refunds?**
A: Use inventory adjustments to add stock back, and record expense for refund amount if applicable.

### Financial Management

**Q: How are payment terms handled?**
A: Supplier payment terms (Net 15/30/60, COD) automatically calculate due dates. Customer payment terms can be set per customer.

**Q: What is the difference between AR and AP?**
A: AR (Accounts Receivable) tracks money owed by customers. AP (Accounts Payable) tracks money owed to suppliers.

**Q: How does the system calculate profit margins?**
A: Profit margin = (Selling Price - Cost of Goods Sold) ÷ Selling Price × 100. COGS uses weighted average cost from inventory batches.

### Reporting and Analytics

**Q: What reports are available?**
A: Inventory reports, sales reports, procurement reports, and financial statements including P&L, cash flow, and balance sheet.

**Q: Can I export reports to Excel?**
A: Yes, all reports support CSV export which can be opened in Excel or other spreadsheet applications.

**Q: How often is dashboard data updated?**
A: Dashboard data updates in real-time as transactions occur. Some analytics may have slight delays for complex calculations.

### Technical Questions

**Q: Is the system mobile-friendly?**
A: Yes, InventoryPro is fully responsive and works on desktop, tablet, and mobile devices.

**Q: Can multiple users access the system simultaneously?**
A: Yes, the system supports concurrent users with proper data isolation and transaction handling.

**Q: How secure is the system?**
A: The system uses secure authentication, HTTPS encryption, and proper data validation. However, always follow security best practices for production deployment.

**Q: Can I customize the system?**
A: The system is built with modern technologies (Next.js, TypeScript) making it highly customizable. Contact the development team for customizations.

---

## Appendices

### Glossary

**AR (Accounts Receivable)**: Money owed by customers for goods or services delivered.

**AP (Accounts Payable)**: Money owed to suppliers for goods or services received.

**Batch**: A group of inventory items from the same purchase, tracked with unique batch number, cost, and expiry date.

**Branch**: A business location or subsidiary with its own inventory and operations.

**COGS (Cost of Goods Sold)**: The direct cost of producing goods sold by a company.

**FIFO (First In, First Out)**: Inventory accounting method where oldest stock is sold first.

**PO (Purchase Order)**: Document sent to suppliers requesting goods or services.

**POS (Point of Sale)**: System for processing sales transactions and payments.

**RV (Receiving Voucher)**: Document created when goods are received from suppliers.

**SO (Sales Order)**: Document created when customers place orders.

**UOM (Unit of Measure)**: Standard unit for measuring quantity (e.g., bottle, case, pallet).

**Weighted Average Cost**: Inventory valuation method averaging costs across all batches.

### Configuration

#### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Application
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: External Services
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

#### Database Configuration

**Connection Pooling**: Neon handles connection pooling automatically.

**Indexes**: The following indexes are created for performance:
- Product name and category
- Inventory batch expiry dates
- Transaction dates
- Branch and warehouse associations

#### System Settings

**Company Information**: Configure in settings for receipts and reports.

**Tax Rates**: Default 12% VAT, configurable per location.

**Payment Methods**: Configurable list of accepted payment methods.

### Best Practices

#### Inventory Management
- Regularly review stock levels and reorder points
- Process receiving vouchers immediately upon delivery
- Monitor expiry dates and rotate stock using FIFO
- Conduct regular physical inventory counts

#### Sales Operations
- Train staff on POS system usage
- Verify customer information for credit sales
- Process refunds through proper channels
- Maintain accurate cash handling procedures

#### Financial Management
- Record expenses daily
- Reconcile bank statements monthly
- Review AR/AP aging reports weekly
- Monitor profit margins by product and category

#### System Maintenance
- Regular database backups
- Monitor system performance
- Keep dependencies updated
- Review user access permissions

#### Data Security
- Use strong passwords
- Enable two-factor authentication when available
- Regularly update system and dependencies
- Backup data frequently

### Support

#### Documentation
- **User Guide**: This comprehensive documentation
- **Quick Start Guide**: Basic setup and usage
- **API Reference**: Technical integration guide

#### Getting Help
- **Issue Reporting**: Use GitHub issues for bugs and feature requests
- **Community Support**: Check existing issues and discussions
- **Professional Support**: Contact the development team for customizations

#### System Requirements
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Network**: Stable internet connection for real-time features
- **Hardware**: Modern computer with 8GB RAM recommended

---

*This documentation is for InventoryPro v1.0. Last updated: November 21, 2024*