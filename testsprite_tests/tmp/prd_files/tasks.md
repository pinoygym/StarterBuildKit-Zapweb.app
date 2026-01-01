# Implementation Plan

## Overview

This implementation plan breaks down the InventoryPro system into discrete, manageable coding tasks. Each task builds incrementally on previous tasks, ensuring a working system at each stage. Tasks are organized by module with clear objectives and requirements references.

## Task List

- [x] 1. Project Setup and Core Infrastructure
  - Initialize Next.js 15 project with TypeScript and App Router
  - Configure Tailwind CSS and install shadcn/ui components
  - Setup Neon PostgreSQL database connection
  - Configure Prisma ORM with initial schema
  - Setup environment variables and configuration files
  - _Requirements: 11.1, 11.2, 16.2_

  - [x] 1.1 Create base Prisma schema with core models
    - Define Branch, Product, ProductUOM, Warehouse, Supplier models
    - Add proper indexes for performance
    - Create initial migration
    - _Requirements: 2.1, 2.2, 4.1, 5.1, 15.1_

  - [x] 1.2 Setup project folder structure
    - Create app routes structure (dashboard, products, inventory, etc.)
    - Create services, repositories, and types folders
    - Setup shared components and UI components
    - _Requirements: 12.4_

  - [x] 1.3 Configure UI design system
    - Setup Tailwind config with color palette and spacing scale
    - Install and configure shadcn/ui base components (Button, Card, Form, Table)
    - Create typography and spacing utilities
    - _Requirements: 16.1, 16.3, 16.4, 16.5, 16.6_

  - [x] 1.4 Create database seed data
    - Write seed script for 8 sample products with multiple UOMs
    - Create 3 warehouses and 2 branches
    - Add sample suppliers and initial inventory batches
    - _Requirements: 11.3_

- [x] 2. Authentication and Layout (Optional - can be skipped for MVP)




  - Setup NextAuth.js or simple auth system
  - Create protected route middleware
  - Implement role-based access control
  - _Requirements: N/A (Future enhancement)_

- [x] 3. Navigation and Layout Components




  - [x] 3.1 Install additional shadcn/ui components

    - Install Form, Select, Dialog, Dropdown Menu, Popover, Separator, Tabs, Toast, Skeleton components
    - Install Accordion, Alert Dialog, Avatar, Checkbox components
    - Configure components with proper styling
    - _Requirements: 16.2_



  - [x] 3.2 Create main layout with sidebar navigation










    - Build responsive sidebar with desktop and mobile views
    - Implement navigation links for all modules (Dashboard, Products, Inventory, Warehouses, Branches, Suppliers, Purchase Orders, Sales Orders, POS, AR/AP, Expenses, Alerts, Reports)
    - Add branch selector in navigation header
    - Highlight active route
    - Add logo and branding


    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 15.17, 15.18_

  - [x] 3.3 Create shared UI components





    - Build loading skeleton components
    - Create toast notification system using shadcn/ui Toast
    - Build confirmation dialog component using shadcn/ui Alert Dialog


    - Create empty state component with icon and message
    - Create page header component with title and breadcrumbs
    - _Requirements: 12.6, 12.7, 12.8, 12.9, 16.13, 16.14, 16.15, 16.18_

  - [x] 3.4 Create branch context provider





    - Implement React context for active branch selection
    - Persist selected branch in localStorage
    - Provide branch data to all components
    - _Requirements: 15.17, 15.18_


- [x] 4. Branch Management Module




  - [x] 4.1 Create Branch repository and service


    - Create branch repository with CRUD operations (findAll, findById, create, update, delete)
    - Create branch service with business logic and validation
    - Implement branch validation using Zod schema
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 4.2 Create Branch API routes


    - Create GET /api/branches route to fetch all branches
    - Create GET /api/branches/[id] route to fetch single branch
    - Create POST /api/branches route to create branch
    - Create PUT /api/branches/[id] route to update branch
    - Create DELETE /api/branches/[id] route to delete branch
    - _Requirements: 15.1, 15.4, 15.5_

  - [x] 4.3 Build Branch management UI



    - Create branch list page with table showing name, code, location, manager, status
    - Build branch create/edit form with validation
    - Add branch status toggle (active/inactive)
    - Implement branch search and filtering
    - Add delete confirmation dialog
    - _Requirements: 15.4, 15.5_

- [x] 5. Product Management Module




  - [x] 5.1 Create Product repository and service


    - Create product repository with CRUD operations including UOM management
    - Create product service with business logic
    - Implement product validation using Zod schema (name, category, basePrice, minStockLevel, UOMs)
    - Add methods to handle alternate UOM creation, update, and deletion
    - _Requirements: 2.1, 2.2, 2.6, 2.11_

  - [x] 5.2 Create Product API routes


    - Create GET /api/products route to fetch all products with filters
    - Create GET /api/products/[id] route to fetch single product with UOMs
    - Create POST /api/products route to create product with UOMs
    - Create PUT /api/products/[id] route to update product and UOMs
    - Create DELETE /api/products/[id] route to delete product (inactive only)
    - _Requirements: 2.1, 2.5, 2.9, 2.10_

  - [x] 5.3 Create Product list page


    - Build product table with name, category, base price, base UOM, status
    - Add search by product name (real-time filtering)
    - Implement category filter dropdown
    - Add status filter (active/inactive)
    - Show all UOMs with prices in expandable row or modal
    - Add action buttons (Edit, Delete)
    - _Requirements: 2.10, 2.12_

  - [x] 5.4 Build Product create/edit form


    - Create form with product details fields (name, description, category, basePrice, baseUOM, minStockLevel, shelfLifeDays)
    - Add dynamic UOM fields (add/remove alternate UOMs)
    - Implement conversion factor and selling price inputs per UOM
    - Add form validation for all fields using react-hook-form and Zod
    - Display validation errors inline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8_

  - [x] 5.5 Add product image upload (Optional)






    - Integrate file upload for product images
    - Store image URLs in database
    - Display images in product list and forms
    - _Requirements: 2.1_

- [x] 6. Warehouse Management Module





  - [x] 6.1 Create Warehouse repository and service


    - Create warehouse repository with CRUD operations
    - Create warehouse service with business logic
    - Implement capacity validation logic
    - Add calculateUtilization method (current stock / max capacity)
    - Create getWarehouseAlerts for capacity warnings (60% yellow, 80% red)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.9, 15.16_

  - [x] 6.2 Create Warehouse API routes


    - Create GET /api/warehouses route to fetch all warehouses with utilization
    - Create GET /api/warehouses/[id] route to fetch single warehouse
    - Create POST /api/warehouses route to create warehouse
    - Create PUT /api/warehouses/[id] route to update warehouse
    - Create DELETE /api/warehouses/[id] route to delete warehouse
    - _Requirements: 4.1, 4.7, 4.8_

  - [x] 6.3 Create Warehouse list page


    - Build warehouse table with name, location, branch, capacity, utilization
    - Display utilization percentage with color coding (yellow 60%, red 80%)
    - Show product distribution per warehouse in expandable row
    - Add branch filter dropdown
    - Add action buttons (Edit, Delete)
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 6.4 Build Warehouse create/edit form


    - Create form with warehouse details (name, location, manager, maxCapacity)
    - Add capacity input with validation (must be > 0)
    - Implement branch assignment dropdown
    - Add form validation using react-hook-form and Zod
    - _Requirements: 4.1, 4.7, 4.8_


- [x] 7. Supplier Management Module




  - [x] 7.1 Create Supplier repository and service


    - Create supplier repository with CRUD operations
    - Create supplier service with business logic
    - Implement email and phone validation using Zod
    - Add searchSuppliers by company name method
    - Implement soft delete (set status to inactive)
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.7_

  - [x] 7.2 Create Supplier API routes


    - Create GET /api/suppliers route to fetch all suppliers with filters
    - Create GET /api/suppliers/[id] route to fetch single supplier
    - Create POST /api/suppliers route to create supplier
    - Create PUT /api/suppliers/[id] route to update supplier
    - Create DELETE /api/suppliers/[id] route to soft delete supplier
    - _Requirements: 5.1, 5.4, 5.5_

  - [x] 7.3 Create Supplier list page


    - Build supplier table with company name, contact person, phone, email, payment terms, status
    - Add search by company name (real-time filtering)
    - Implement status filter (active/inactive)
    - Add action buttons (Edit, Delete)
    - _Requirements: 5.6, 5.7_

  - [x] 7.4 Build Supplier create/edit form


    - Create form with supplier details (companyName, contactPerson, phone, email, paymentTerms)
    - Add payment terms dropdown (Net 15, Net 30, Net 60, COD)
    - Implement email and phone validation
    - Add form validation using react-hook-form and Zod
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Inventory Module with Average Costing


  - [x] 8.1 Create Inventory repository and service

    - Create inventory batch repository with CRUD operations
    - Create stock movement repository
    - Create inventory service with business logic
    - Add helper methods for batch number generation
    - _Requirements: 3.1, 3.7, 3.8_

  - [x] 8.2 Implement weighted average cost calculation

    - Create calculateWeightedAverageCost service method
    - Calculate total cost (sum of quantity × unitCost for all active batches)
    - Calculate total quantity (sum of quantity for all active batches)
    - Return weighted average (totalCost / totalQuantity) per product per warehouse
    - Handle edge case when no batches exist (return 0)
    - _Requirements: 3.2, 3.3, 3.12_

  - [x] 8.3 Implement UOM conversion logic


    - Create convertToBaseUOM service method
    - Fetch product with alternate UOMs
    - If UOM is base UOM, return quantity as-is
    - Find matching alternate UOM and multiply quantity by conversion factor
    - Validate UOM exists for product (throw error if not found)
    - _Requirements: 3.2, 3.5_

  - [x] 8.4 Build add stock functionality

    - Create addStock service method
    - Convert quantity to base UOM using convertToBaseUOM
    - Generate unique batch number
    - Calculate expiry date (receivedDate + product.shelfLifeDays)
    - Create inventory batch with quantity, unitCost, expiryDate
    - Record stock movement (type: IN, quantity, referenceId, referenceType)
    - _Requirements: 3.1, 3.2, 3.7_

  - [x] 8.5 Build deduct stock functionality

    - Create deductStock service method
    - Convert quantity to base UOM
    - Fetch active batches ordered by expiryDate ASC (FIFO for physical stock)
    - Loop through batches and deduct quantity
    - Update batch quantities
    - Record stock movements (type: OUT) for each batch
    - Validate sufficient stock available (throw InsufficientStockError if not)
    - _Requirements: 3.4, 3.5, 3.6, 3.11_

  - [x] 8.6 Create Inventory API routes



    - Create GET /api/inventory route to fetch all batches with filters
    - Create GET /api/inventory/[id] route to fetch single batch
    - Create POST /api/inventory/add-stock route to add stock
    - Create POST /api/inventory/deduct-stock route to deduct stock
    - Create POST /api/inventory/transfer route to transfer between warehouses
    - Create GET /api/inventory/movements route to fetch stock movements
    - _Requirements: 3.1, 3.4, 3.7, 3.8_


  - [x] 8.7 Create Inventory list page


    - Build inventory table showing batches by product and warehouse
    - Display batch number, product name, warehouse, quantity in base UOM, unit cost, expiry date, status
    - Show weighted average cost per product per warehouse in summary section
    - Add filters for warehouse, product, and expiry date range
    - Color code batches expiring within 30 days (yellow) and expired (red)
    - Add action buttons (Adjust Stock, Transfer)
    - _Requirements: 3.9, 3.10, 3.12_


  - [x] 8.8 Build stock movement history view

    - Create stock movement table with type, product, warehouse, quantity, reason, reference, timestamp
    - Filter by product, warehouse, date range, movement type (IN, OUT, TRANSFER, ADJUSTMENT)
    - Show reference links to PO/SO/POS based on referenceType
    - Add export to CSV functionality
    - _Requirements: 3.7, 3.8_

  - [x] 8.9 Implement transfer between warehouses


    - Create transferStock service method
    - Deduct from source warehouse using deductStock
    - Add to destination warehouse using addStock
    - Record movements for both warehouses with type: TRANSFER
    - Wrap in Prisma transaction for atomicity
    - _Requirements: 3.7_


- [x] 9. Purchase Order Module




  - [x] 9.1 Create Purchase Order repository and service


    - Create PO repository with CRUD operations
    - Create PO item repository
    - Create PO service with business logic
    - Add helper method to generate PO number (PO-YYYYMMDD-XXXX format)
    - Add helper method to calculate due date based on payment terms
    - _Requirements: 6.1, 6.13, 15.6_

  - [x] 9.2 Implement Purchase Order creation and management

    - Implement createPurchaseOrder with auto-generated PO number
    - Validate supplier is active
    - Validate all products exist and are active
    - Calculate total amount from items (sum of quantity × unitPrice)
    - Add updatePurchaseOrder (Draft/Pending status only)
    - Create cancelPurchaseOrder with reason (update status to Cancelled)
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.10, 6.11_

  - [x] 9.3 Implement PO receiving workflow

    - Create receivePurchaseOrder service method
    - Wrap entire operation in Prisma transaction
    - For each PO item: auto-generate batch number, calculate expiry date (receivedDate + product.shelfLifeDays)
    - Create inventory batches with PO unit costs
    - Record stock movements with type: IN, referenceId: PO.id, referenceType: 'PO'
    - Update PO status to "Received" and set actualDeliveryDate
    - Create Accounts Payable record with calculated due date based on supplier payment terms
    - _Requirements: 6.5, 6.6, 6.7, 6.8, 13.2_

  - [x] 9.4 Create Purchase Order API routes


    - Create GET /api/purchase-orders route to fetch all POs with filters
    - Create GET /api/purchase-orders/[id] route to fetch single PO with items
    - Create POST /api/purchase-orders route to create PO
    - Create PUT /api/purchase-orders/[id] route to update PO
    - Create POST /api/purchase-orders/[id]/receive route to receive PO
    - Create POST /api/purchase-orders/[id]/cancel route to cancel PO
    - _Requirements: 6.1, 6.5, 6.11, 6.12_

  - [x] 9.5 Create Purchase Order list page


    - Build PO table with PO number, supplier, warehouse, branch, total, status, expected delivery date, created date
    - Add status filter (Draft, Pending, Ordered, Received, Cancelled)
    - Implement date range filter
    - Show branch filter
    - Add action buttons (View, Edit, Receive, Cancel)
    - _Requirements: 6.12, 15.6_

  - [x] 9.6 Build Purchase Order create/edit form


    - Create form with supplier selection dropdown (active suppliers only)
    - Add warehouse and branch selection dropdowns
    - Build dynamic items table (add/remove products with quantity and unit price)
    - Calculate item subtotals (quantity × unitPrice) and total amount
    - Add expected delivery date picker
    - Implement notes field
    - Validate all fields using react-hook-form and Zod
    - _Requirements: 6.1, 6.3, 6.4, 6.9, 6.10_

  - [x] 9.7 Build PO detail view with receive action


    - Display PO details with all items in table
    - Show supplier info, warehouse, branch, dates, status
    - Add "Receive" button for Ordered status only
    - Show confirmation dialog before receiving
    - Display success message with created batches after receiving
    - Redirect to inventory page or show batch details
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

- [x] 10. Sales Order Module





  - [x] 10.1 Create Sales Order repository and service


    - Create SO repository with CRUD operations
    - Create SO item repository
    - Create SO service with business logic
    - Add helper method to generate order number (SO-YYYYMMDD-XXXX format)
    - Add method to validate stock availability for all items
    - _Requirements: 7.1, 7.9, 7.12, 15.7_

  - [x] 10.2 Implement Sales Order creation and management


    - Implement createSalesOrder with auto-generated order number
    - Validate customer email and phone formats using Zod
    - Validate sufficient stock in warehouse for all items
    - Get UOM selling price for each item from ProductUOM
    - Calculate total from items (sum of quantity × UOM selling price)
    - Add updateSalesOrder (Draft/Pending status only)
    - Create cancelSalesOrder (update status to Cancelled)
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 10.3 Create Sales Order API routes


    - Create GET /api/sales-orders route to fetch all SOs with filters
    - Create GET /api/sales-orders/[id] route to fetch single SO with items
    - Create POST /api/sales-orders route to create SO
    - Create PUT /api/sales-orders/[id] route to update SO
    - Create POST /api/sales-orders/[id]/cancel route to cancel SO
    - _Requirements: 7.1, 7.2, 7.10, 7.11_

  - [x] 10.4 Create Sales Order list page


    - Build SO table with order number, customer name, customer phone, total, status, salesOrderStatus, delivery date, created date
    - Add status filter (Draft, Pending, Converted, Cancelled)
    - Show conversion status badge (Converted badge when salesOrderStatus is "converted")
    - Implement date range filter
    - Add branch filter
    - Add action buttons (View, Edit, Convert to POS, Cancel)
    - Link to POS sale if converted (show convertedToSaleId)
    - _Requirements: 7.2, 7.8, 7.9, 7.10, 7.11, 15.7_

  - [x] 10.5 Build Sales Order create/edit form


    - Create form with customer details (customerName, customerPhone, customerEmail, deliveryAddress)
    - Add warehouse and branch selection dropdowns
    - Build dynamic items table (add/remove products with quantity and UOM selection)
    - Get UOM selling price from ProductUOM for selected UOM
    - Calculate item subtotals (quantity × UOM selling price) and total amount
    - Add delivery date picker
    - Validate stock availability before saving (show error if insufficient)
    - Validate all fields using react-hook-form and Zod
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6, 7.7_


- [x] 11. Point of Sale (POS) Module






  - [x] 11.1 Create POS repository and service

    - Create POS sale repository with CRUD operations
    - Create POS sale item repository
    - Create POS service with business logic
    - Add helper method to generate receipt number (RCP-YYYYMMDD-XXXX format)
    - _Requirements: 8.21, 8.22, 15.8_



  - [x] 11.2 Implement POS sale processing

    - Implement processSale service method with Prisma transaction
    - Calculate subtotal (sum of item subtotals)
    - Calculate tax (subtotal × 0.12 for 12% VAT)
    - Calculate total (subtotal + tax)
    - For each item: get weighted average cost using calculateWeightedAverageCost
    - Convert quantities to base UOM for COGS calculation
    - Calculate COGS (weighted average cost × base quantity)
    - Deduct inventory using deductStock (FIFO for expiry dates)
    - Create POS sale and items with COGS
    - Generate unique receipt number
    - If convertedFromOrderId provided: update sales order status to "converted" and set convertedToSaleId
    - _Requirements: 8.7, 8.8, 8.9, 8.10, 8.13, 8.14, 8.15, 8.16, 8.19_


  - [x] 11.3 Create POS API routes

    - Create GET /api/pos/products route to fetch active products with stock
    - Create POST /api/pos/sales route to process sale
    - Create GET /api/pos/sales route to fetch sales with filters
    - Create GET /api/pos/sales/[id] route to fetch single sale with items
    - Create GET /api/pos/sales/today-summary route to fetch today's summary
    - Create GET /api/pos/pending-orders route to fetch pending sales orders
    - _Requirements: 8.1, 8.13, 8.18, 8.20_


  - [x] 11.4 Create POS product grid interface

    - Build product grid with images, names, and base prices
    - Display all available UOMs with selling prices per product (as buttons or dropdown)
    - Show stock availability indicator (green if in stock, red if out of stock)
    - Implement real-time search by product name (case-insensitive, filter as user types)
    - Add category filter buttons (All, Carbonated, Juices, Energy Drinks, Water)
    - Display only active products with available stock
    - Make product cards clickable to add to cart
    - _Requirements: 8.1, 8.2, 8.3, 8.4_


  - [x] 11.5 Build POS shopping cart

    - Create cart component with item list table
    - Allow quantity adjustment per item (+ and - buttons)
    - Add UOM selection dropdown per item (show all available UOMs with prices)
    - Calculate item subtotals (quantity × selected UOM price)
    - Display cart subtotal, tax (12%), and total
    - Validate quantity doesn't exceed available stock (show error if exceeded)
    - Add remove item button per item
    - Show empty cart state when no items
    - _Requirements: 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [x] 11.6 Implement payment processing


    - Create payment method selection (Cash, Card, Check, GCash, Online Transfer)
    - For Cash: add amount received input field
    - For Cash: calculate and display change (amountReceived - total)
    - For Cash: validate amount received >= total (show error if less)
    - For other methods: no amount received needed
    - Add "Complete Sale" button
    - Process sale on payment confirmation (call processSale API)
    - Show loading state during processing
    - _Requirements: 8.11, 8.12, 8.13_




  - [x] 11.7 Build receipt preview and generation





    - Create receipt component with all sale details
    - Display items table with product name, quantity, UOM, unit price, subtotal
    - Show cart subtotal, tax, and total
    - Add receipt number and timestamp
    - Show payment method and amount received/change (if Cash)
    - Implement print functionality (window.print() or print library)
    - Show receipt in modal after successful sale
    - Add "Print Receipt" and "New Sale" buttons
    - _Requirements: 8.16, 8.17_




  - [ ] 11.8 Create sales order conversion feature




    - Display pending sales orders section in POS (collapsible panel)
    - Show SO table with order number, customer name, total, delivery date
    - Add "Convert to POS" button for each order
    - On click: pre-populate cart with order items (product, quantity, UOM)
    - Show customer info in a section
    - Support bulk conversion (select multiple orders with checkboxes)
    - After processing sale: mark orders as "Converted" and link to POS sale
    - _Requirements: 8.18, 8.19_


  - [x] 11.9 Build today's POS summary widget

    - Display transaction count for today (count of sales where createdAt is today)
    - Show total revenue for today (sum of totalAmount for today's sales)
    - Calculate and display average sale value (total revenue / transaction count)
    - Update in real-time after each sale (refetch data)
    - Show in card format at top of POS page
    - _Requirements: 8.20_


- [ ] 12. Accounts Receivable (AR) Module
  - [ ] 12.1 Create AR repository and service
    - Create AR repository with CRUD operations
    - Create AR payment repository
    - Create AR service with business logic
    - Add method to calculate aging buckets (0-30, 31-60, 61-90, 90+ days)
    - Add method to determine status (pending, partial, paid, overdue)
    - _Requirements: 13.1, 13.14, 15.10_

  - [ ] 12.2 Implement AR creation and payment recording
    - Implement createAR from sales orders (optional feature for credit sales)
    - Add recordPayment method with partial payment support
    - Calculate balance (totalAmount - paidAmount)
    - Update AR status based on balance (paid if balance = 0, partial if 0 < balance < total, overdue if past due date)
    - Wrap payment recording in Prisma transaction
    - Generate overdue alerts based on due date (if dueDate < today and balance > 0)
    - _Requirements: 13.1, 13.3, 13.5, 13.6, 13.10_

  - [ ] 12.3 Create AR API routes
    - Create GET /api/ar route to fetch all AR records with filters
    - Create GET /api/ar/[id] route to fetch single AR with payments
    - Create POST /api/ar route to create AR
    - Create POST /api/ar/[id]/payment route to record payment
    - Create GET /api/ar/aging-report route to fetch aging report
    - _Requirements: 13.1, 13.5, 13.7, 13.12_

  - [ ] 12.4 Create AR list page
    - Build AR table with customer name, sales order number, total amount, paid amount, balance, due date, status
    - Add status filter (pending, partial, paid, overdue)
    - Implement date range filter
    - Show aging indicators with color coding (green: 0-30, yellow: 31-60, orange: 61-90, red: 90+)
    - Add branch filter
    - Add action buttons (View, Record Payment)
    - _Requirements: 13.12, 15.10_

  - [ ] 12.5 Build AR payment recording form
    - Create payment form modal with amount, payment method, reference number, payment date
    - Validate payment amount doesn't exceed balance (show error if exceeded)
    - Support partial payments (allow amount < balance)
    - Update AR balance after payment
    - Show success message after recording payment
    - Refresh AR list after payment
    - _Requirements: 13.5, 13.6_

  - [ ] 12.6 Create AR aging report
    - Generate aging report with buckets (0-30, 31-60, 61-90, 90+ days)
    - Group by customer name
    - Calculate totals per bucket
    - Show total outstanding balance
    - Add export to CSV functionality
    - Display in table format with customer breakdown
    - _Requirements: 13.7_

- [ ] 13. Accounts Payable (AP) Module
  - [ ] 13.1 Create AP repository and service
    - Create AP repository with CRUD operations
    - Create AP payment repository
    - Create AP service with business logic
    - Add method to calculate due date based on supplier payment terms (Net 15, Net 30, Net 60, COD)
    - Add method to calculate aging buckets (0-30, 31-60, 61-90, 90+ days)
    - Add method to determine status (pending, partial, paid, overdue)
    - _Requirements: 13.2, 13.14, 15.10_

  - [ ] 13.2 Implement AP creation and payment recording
    - Implement createAP from purchase orders (called automatically when PO is received)
    - Calculate due date based on supplier payment terms (Net 15: +15 days, Net 30: +30 days, Net 60: +60 days, COD: same day)
    - Add recordPayment method with partial payment support
    - Calculate balance (totalAmount - paidAmount)
    - Update AP status based on balance (paid if balance = 0, partial if 0 < balance < total, overdue if past due date)
    - Wrap payment recording in Prisma transaction
    - Generate overdue alerts based on due date (if dueDate < today and balance > 0)
    - _Requirements: 13.2, 13.4, 13.5, 13.6, 13.9, 13.11_

  - [ ] 13.3 Create AP API routes
    - Create GET /api/ap route to fetch all AP records with filters
    - Create GET /api/ap/[id] route to fetch single AP with payments
    - Create POST /api/ap route to create AP
    - Create POST /api/ap/[id]/payment route to record payment
    - Create GET /api/ap/aging-report route to fetch aging report
    - _Requirements: 13.2, 13.5, 13.8, 13.12_

  - [ ] 13.4 Create AP list page
    - Build AP table with supplier name, PO number, total amount, paid amount, balance, due date, status
    - Add status filter (pending, partial, paid, overdue)
    - Implement date range filter
    - Show aging indicators with color coding (green: 0-30, yellow: 31-60, orange: 61-90, red: 90+)
    - Add branch filter
    - Add action buttons (View, Record Payment)
    - _Requirements: 13.12, 15.10_

  - [ ] 13.5 Build AP payment recording form
    - Create payment form modal with amount, payment method, reference number, payment date
    - Validate payment amount doesn't exceed balance (show error if exceeded)
    - Support partial payments (allow amount < balance)
    - Update AP balance after payment
    - Show success message after recording payment
    - Refresh AP list after payment
    - _Requirements: 13.5, 13.6_

  - [ ] 13.6 Create AP aging report
    - Generate aging report with buckets (0-30, 31-60, 61-90, 90+ days)
    - Group by supplier name
    - Calculate totals per bucket
    - Show total outstanding balance
    - Add export to CSV functionality
    - Display in table format with supplier breakdown
    - _Requirements: 13.8_


- [ ] 14. Expense Management Module
  - [ ] 14.1 Create Expense repository and service
    - Create expense repository with CRUD operations
    - Create expense service with business logic
    - Add method to calculate total expenses by category for date range
    - Add method to calculate total expenses by vendor for date range
    - Add method to generate monthly expense trends
    - _Requirements: 14.1, 14.11, 15.9_

  - [ ] 14.2 Create Expense API routes
    - Create GET /api/expenses route to fetch all expenses with filters
    - Create GET /api/expenses/[id] route to fetch single expense
    - Create POST /api/expenses route to create expense
    - Create PUT /api/expenses/[id] route to update expense
    - Create DELETE /api/expenses/[id] route to delete expense
    - Create GET /api/expenses/reports/by-category route for category report
    - Create GET /api/expenses/reports/by-vendor route for vendor report
    - _Requirements: 14.1, 14.5, 14.6, 14.8_

  - [ ] 14.3 Create Expense list page
    - Build expense table with expense date, category, amount, vendor, payment method, description
    - Add category filter dropdown (Utilities, Rent, Salaries, Transportation, Marketing, Maintenance, Other)
    - Implement date range filter
    - Add payment method filter
    - Show branch filter
    - Display monthly totals at top
    - Add action buttons (Edit, Delete)
    - _Requirements: 14.8, 15.9_

  - [ ] 14.4 Build Expense create/edit form
    - Create form with expense date, category dropdown, amount, description
    - Add payment method dropdown (Cash, Card, Check, Online Transfer)
    - Add vendor input field (optional)
    - Implement amount validation (must be > 0)
    - Add receipt upload functionality (optional - store URL in receiptUrl field)
    - Validate all fields using react-hook-form and Zod
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 14.5 Create expense reports
    - Generate expense by category report (show total per category with percentage)
    - Generate expense by vendor report (show total per vendor)
    - Add date range filtering
    - Display totals and percentages
    - Show in table and chart formats (use Recharts)
    - Implement CSV export functionality
    - _Requirements: 14.5, 14.6, 14.9, 14.10_

- [ ] 15. Alert System
  - [ ] 15.1 Create Alert service
    - Create alert service with generateAlerts method
    - Implement low stock alert logic (query products where current stock < minStockLevel)
    - Implement expiring soon alert logic (query batches where expiryDate between today and today+30 days)
    - Implement expired alert logic (query batches where expiryDate < today)
    - Calculate alert counts by type
    - Support branch filtering (filter by warehouse.branchId)
    - Return alerts with type, severity, product info, warehouse info, details
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.9_

  - [ ] 15.2 Create Alert API routes
    - Create GET /api/alerts route to fetch all alerts with filters
    - Create GET /api/alerts/counts route to fetch alert counts by type
    - Create POST /api/alerts/[id]/dismiss route to dismiss alert (optional feature)
    - _Requirements: 9.5, 9.7_

  - [ ] 15.3 Create Alert list page
    - Build alert table with type, severity, product name, warehouse, details (shortage amount or days until expiry)
    - Add type filter (Low Stock, Expiring Soon, Expired)
    - Add severity filter (warning, critical)
    - Display color-coded severity badges (yellow for warning, red for critical)
    - Show shortage amount for low stock alerts (minStockLevel - currentStock)
    - Show days until expiry for expiring soon alerts
    - Add branch filter
    - _Requirements: 9.5, 9.6, 9.10, 9.11_

  - [ ] 15.4 Implement alert actions
    - Add "Reorder" button for low stock alerts (link to PO create with product pre-selected)
    - Add "View Inventory" button to see batch details
    - Add "Dismiss" button for alerts (optional feature)
    - Auto-refresh alerts when inventory changes (use React Query with refetch interval)
    - _Requirements: 9.7, 9.8, 9.9_

  - [ ] 15.5 Add alert count badges to Dashboard
    - Display low stock alert count card
    - Display expiring soon alert count card
    - Display expired alert count card
    - Use color coding for severity (yellow for warning, red for critical)
    - Make badges clickable to navigate to alerts page with filter applied
    - _Requirements: 1.6, 1.7, 9.5_


- [ ] 16. Dashboard and Analytics
  - [ ] 16.1 Create Dashboard service and API routes
    - Create dashboard service with methods to calculate all KPIs
    - Add method to get total products count (active products)
    - Add method to get total stock units (sum of all batch quantities in base UOM)
    - Add method to get active sales orders count and conversion rate
    - Add method to calculate inventory value (sum of quantity × weighted average cost)
    - Add method to get today's POS sales count and revenue
    - Add method to get outstanding AR total
    - Add method to get outstanding AP total
    - Add method to get current month expenses total
    - Add method to get overdue receivables and payables counts
    - Create GET /api/dashboard/kpis route to fetch all KPIs
    - Create GET /api/dashboard/top-products route for top selling products
    - Create GET /api/dashboard/warehouse-utilization route
    - Create GET /api/dashboard/branch-comparison route
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.10, 1.11, 1.12, 1.13, 1.8, 1.9, 15.12_

  - [ ] 16.2 Create Dashboard KPI cards
    - Build total products count card with active status indicator
    - Create total stock units card (aggregated across warehouses in base UOM)
    - Add active sales orders count with conversion rate percentage
    - Display inventory value using weighted average cost (₱ format)
    - Show today's POS sales count and revenue (₱ format)
    - Add outstanding AR total card (₱ format)
    - Add outstanding AP total card (₱ format)
    - Display current month expenses total (₱ format)
    - Show overdue receivables and payables counts with red badges
    - Use Card component for consistent styling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.10, 1.11, 1.12, 1.13_

  - [ ] 16.3 Build Dashboard analytics widgets
    - Create top 5 selling products widget (by revenue from POS sales)
    - Build warehouse utilization widget with capacity tracking (show percentage and color coding)
    - Add alert summary widget (low stock, expiring, expired counts with badges)
    - Create branch comparison widget (revenue, expenses, profit by branch in table or chart)
    - Use Recharts for visualizations
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 15.12_

  - [ ] 16.4 Implement Dashboard filtering
    - Add branch selector dropdown for filtering all KPIs
    - Add date range selector for time-based metrics (today, last 7 days, last 30 days, custom)
    - Auto-refresh data when filters change (use React Query)
    - Persist filter selections in localStorage
    - _Requirements: 1.14, 15.11_

  - [ ] 16.5 Create Dashboard charts
    - Build sales trend chart (last 30 days) using Recharts LineChart
    - Add expense trend chart by category using Recharts BarChart
    - Create inventory value trend chart using Recharts AreaChart
    - Implement warehouse utilization chart using Recharts BarChart
    - Make charts responsive
    - _Requirements: 1.8, 1.9_

- [ ] 17. Reporting Module
  - [ ] 17.1 Create report service and API routes
    - Create report service with methods for all report types
    - Create GET /api/reports/inventory/stock-levels route
    - Create GET /api/reports/inventory/value route
    - Create GET /api/reports/inventory/warehouse-utilization route
    - Create GET /api/reports/inventory/batch-tracking route
    - Create GET /api/reports/inventory/movements route
    - Create GET /api/reports/sales/pos-sales route
    - Create GET /api/reports/sales/best-selling route
    - Create GET /api/reports/sales/revenue-by-category route
    - Create GET /api/reports/sales/order-fulfillment route
    - Create GET /api/reports/procurement/po-status route
    - Create GET /api/reports/procurement/supplier-performance route
    - Create GET /api/reports/financial/profit-loss route
    - Create GET /api/reports/financial/cash-flow route
    - Create GET /api/reports/financial/balance-sheet route
    - Create GET /api/reports/branch-performance route
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.14_

  - [ ] 17.2 Create inventory reports page
    - Generate stock level by product report (in base UOM)
    - Create inventory value report using weighted average cost
    - Build warehouse utilization report
    - Generate batch tracking report with expiry dates
    - Create stock movement history report with timestamps
    - Add filters for warehouse, branch, product category
    - Display in table format
    - Add CSV export button
    - _Requirements: 10.1, 10.12_

  - [ ] 17.3 Create sales reports page
    - Generate POS sales by date range report
    - Build best-selling products report (by quantity and revenue)
    - Create revenue by product and category report
    - Generate sales order fulfillment status report with conversion rates
    - Calculate profit margins (selling price vs weighted average cost)
    - Add filters for payment method, branch, category
    - Display in table and chart formats
    - Add CSV export button
    - _Requirements: 10.2, 10.13, 10.18_

  - [ ] 17.4 Create procurement reports page
    - Generate purchase order status summary report
    - Build supplier performance metrics report (on-time delivery rate)
    - Create cost analysis by supplier report
    - Generate delivery timeline tracking report
    - Add filters for supplier, date range, status
    - Display in table format
    - Add CSV export button
    - _Requirements: 10.3_

  - [ ] 17.5 Create financial reports page
    - Generate Profit & Loss statement (revenue, COGS, gross profit, expenses, net profit)
    - Build Cash Flow statement (inflows from sales and AR payments, outflows for expenses and AP payments, net cash flow)
    - Create Balance Sheet (assets: inventory value + AR, liabilities: AP, equity: assets - liabilities)
    - Calculate gross profit margin percentage (gross profit / revenue × 100)
    - Calculate net profit margin percentage (net profit / revenue × 100)
    - Add branch filtering for multi-branch analysis
    - Display in formatted statement layout
    - Add CSV export button
    - _Requirements: 10.4, 10.5, 10.6, 10.14, 10.19, 10.20_

  - [ ] 17.6 Create AR/AP aging reports (already covered in AR/AP modules)
    - Link to AR aging report from reports page
    - Link to AP aging report from reports page
    - Link to expense by category report from reports page
    - Link to expense by vendor report from reports page
    - _Requirements: 10.7, 10.8, 10.9, 10.10_

  - [ ] 17.7 Implement report export functionality
    - Add CSV export for all reports using xlsx library
    - Implement column selection for exports (optional)
    - Format currency values (₱ X,XXX.XX)
    - Format dates consistently (YYYY-MM-DD or MMM DD, YYYY)
    - Add export button to all report pages
    - _Requirements: 10.15, 10.16, 10.17_

  - [ ] 17.8 Create report filtering interface
    - Build date range selector component (start and end date)
    - Add warehouse filter dropdown
    - Add branch filter dropdown (single or all branches)
    - Add category filter dropdown
    - Add payment method filter dropdown
    - Apply filters to all reports
    - _Requirements: 10.11, 10.12, 10.13, 10.14_

  - [ ] 17.9 Build branch performance report
    - Compare revenue across branches (from POS sales)
    - Compare expenses across branches
    - Calculate profit per branch (revenue - COGS - expenses)
    - Show inventory value per branch
    - Display in table and chart formats (use Recharts)
    - Add date range filter
    - Add CSV export
    - _Requirements: 10.14, 15.14_


- [ ] 18. Data Validation and Error Handling
  - [ ] 18.1 Create validation schemas with Zod
    - Define product validation schema (name, category, basePrice, minStockLevel, shelfLifeDays, UOMs)
    - Create inventory validation schema (quantity, unitCost, expiryDate)
    - Add purchase order validation schema (supplierId, warehouseId, items)
    - Create sales order validation schema (customerName, customerEmail, customerPhone, items)
    - Define POS sale validation schema (items, paymentMethod, amountReceived)
    - Add AR/AP validation schemas (amount, dueDate, paymentMethod)
    - Create expense validation schema (expenseDate, category, amount, description)
    - Create branch validation schema (name, code, location, manager, phone)
    - Create warehouse validation schema (name, location, maxCapacity, branchId)
    - Create supplier validation schema (companyName, email, phone, paymentTerms)
    - Store all schemas in lib/validations/ directory
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [ ] 18.2 Implement form validation
    - Use react-hook-form with zodResolver for all forms
    - Add inline validation error messages below input fields
    - Highlight invalid fields with red borders
    - Show validation summary at form top (optional)
    - Prevent form submission with invalid data
    - Display loading state during submission
    - _Requirements: 17.8_

  - [ ] 18.3 Enhance error handling utilities (already created in lib/errors.ts)
    - Verify AppError class hierarchy exists
    - Verify ValidationError, NotFoundError, InsufficientStockError classes exist
    - Implement global error handler for API routes (handleApiError function)
    - Add error logging with context (console.error or external service)
    - Use error classes in all services
    - _Requirements: 11.8_

  - [ ] 18.4 Implement client-side error handling
    - Create useApiMutation custom hook with error handling
    - Display toast notifications for errors using shadcn/ui Toast
    - Show user-friendly error messages (not technical stack traces)
    - Add retry functionality for failed requests (optional)
    - Create error boundary component for React errors
    - _Requirements: 12.7_

- [ ] 19. Performance Optimization
  - [ ] 19.1 Optimize database queries
    - Verify proper indexes exist on all models (already added in schema)
    - Implement pagination for large lists (products, inventory, orders, etc.)
    - Use Prisma select to limit returned fields where appropriate
    - Add database query logging for slow queries (Prisma log configuration)
    - Use Prisma include strategically (avoid over-fetching)
    - _Requirements: 11.4, 11.7_

  - [ ] 19.2 Implement caching strategies
    - Setup TanStack Query (React Query) for client-side caching
    - Configure staleTime and cacheTime for different data types
    - Use React Query for all data fetching in client components
    - Configure Next.js page caching with revalidate
    - Add stale-while-revalidate for data fetching
    - _Requirements: 11.4_

  - [ ] 19.3 Optimize images and assets
    - Use Next.js Image component for product images
    - Implement lazy loading for images
    - Add loading skeletons for async content (use shadcn/ui Skeleton)
    - Optimize image sizes and formats
    - _Requirements: 12.6_

  - [ ] 19.4 Implement code splitting
    - Lazy load heavy components (reports, charts) using dynamic imports
    - Split routes into separate bundles (Next.js does this automatically)
    - Use dynamic imports for modals and dialogs
    - Analyze bundle size with Next.js build analyzer
    - _Requirements: N/A (Performance best practice)_

- [ ] 20. Testing and Quality Assurance
  - [ ]* 20.1 Write unit tests for services (Optional)
    - Setup Vitest for unit testing
    - Test weighted average cost calculation
    - Test UOM conversion logic
    - Test inventory deduction logic (FIFO)
    - Test payment calculations
    - Test due date calculations
    - _Requirements: 3.2, 3.3, 3.4, 8.13_

  - [ ]* 20.2 Write integration tests for API routes (Optional)
    - Setup testing environment for API routes
    - Test POS sale processing end-to-end
    - Test purchase order receiving workflow
    - Test sales order to POS conversion
    - Test AR/AP payment recording
    - Test inventory add/deduct operations
    - _Requirements: 8.14, 6.5, 8.19, 13.5_

  - [ ]* 20.3 Perform manual testing (Recommended)
    - Test all CRUD operations for each module
    - Verify calculations (totals, averages, margins, COGS)
    - Test edge cases (insufficient stock, expired items, invalid inputs)
    - Verify responsive design on mobile and tablet
    - Test branch filtering across all modules
    - Test form validations
    - Test error handling
    - _Requirements: All_


- [ ] 21. Deployment and Production Setup
  - [ ] 21.1 Configure production environment
    - Setup Neon production database (create new database)
    - Configure environment variables in Vercel (DATABASE_URL, etc.)
    - Setup database connection pooling (Neon handles this automatically)
    - Configure CORS and security headers in next.config.ts
    - Setup environment-specific configurations
    - _Requirements: 11.1, 11.7_

  - [ ] 21.2 Run database migrations
    - Execute Prisma migrations on production database (npx prisma migrate deploy)
    - Run seed script for initial data (optional for production)
    - Verify database schema and indexes
    - Test database connection
    - _Requirements: 11.2, 11.3_

  - [ ] 21.3 Deploy to Vercel
    - Connect GitHub repository to Vercel
    - Configure build settings (build command, output directory)
    - Set environment variables in Vercel dashboard
    - Deploy to production
    - Verify deployment success
    - Test all features in production
    - _Requirements: N/A (Deployment)_

  - [ ] 21.4 Setup monitoring and logging (Optional)
    - Configure error tracking (Sentry or similar)
    - Setup performance monitoring (Vercel Analytics)
    - Add database query logging
    - Configure alerts for errors
    - _Requirements: 11.8_

  - [ ]* 21.5 Create user documentation (Optional)
    - Write user guide for each module
    - Document common workflows
    - Create troubleshooting guide
    - Add FAQ section
    - _Requirements: N/A (Documentation)_ase query logging
    - Configure alerts for errors
    - _Requirements: 11.8_

  - [ ] 21.5 Create user documentation
    - Write user guide for each module
    - Document common workflows
    - Create troubleshooting guide
    - Add FAQ section
    - _Requirements: N/A (Documentation)_

## Implementation Notes

### Development Approach
- Build features incrementally, testing each module before moving to the next
- Use React Server Components where possible for better performance
- Implement proper error boundaries and loading states
- Follow the design system strictly for UI consistency
- Write clean, maintainable code with proper TypeScript types

### Testing Strategy
- Focus on core business logic (weighted average costing, inventory deduction)
- Test critical workflows (POS sales, PO receiving, payment recording)
- Manual testing for UI/UX and edge cases
- Optional: E2E tests for complete user flows

### Priority Order
1. Core infrastructure and setup (Tasks 1-3)
2. Branch and Product management (Tasks 4-5)
3. Warehouse and Inventory with average costing (Tasks 6-8)
4. Purchase Orders and Suppliers (Tasks 7, 9)
5. Sales Orders and POS (Tasks 10-11)
6. Financial modules (AR/AP, Expenses) (Tasks 12-14)
7. Alerts and Dashboard (Tasks 15-16)
8. Reports (Task 17)
9. Polish and deployment (Tasks 18-21)

### Estimated Timeline
- Weeks 1-2: Tasks 1-3 (Setup and infrastructure)
- Weeks 3-4: Tasks 4-6 (Branch, Product, Warehouse)
- Weeks 5-6: Tasks 7-8 (Supplier, Inventory with average costing)
- Weeks 7-8: Tasks 9-10 (Purchase Orders, Sales Orders)
- Weeks 9-10: Tasks 11 (POS module)
- Weeks 11-12: Tasks 12-14 (AR/AP, Expenses)
- Week 13: Tasks 15-16 (Alerts, Dashboard)
- Week 14: Task 17 (Reports)
- Week 15: Tasks 18-19 (Validation, Performance)
- Week 16: Tasks 20-21 (Testing, Deployment)

Total: 16 weeks for complete implementation
