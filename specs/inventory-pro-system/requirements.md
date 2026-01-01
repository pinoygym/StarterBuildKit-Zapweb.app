# Requirements Document

## Introduction

InventoryPro is a comprehensive inventory management and Point of Sale (POS) system designed for soft drinks wholesale delivery companies in the Philippines. The system provides real-time inventory tracking, supplier management, order fulfillment, and integrated POS capabilities with Philippine Peso (₱) as the default currency. The system uses Neon PostgreSQL database for data persistence and is built with Next.js 15, React 19, TypeScript, Prisma ORM, and Tailwind CSS v4.

## Glossary

- **InventoryPro System**: The complete inventory management and POS application
- **Product Module**: Component managing product catalog with UOM and pricing
- **Inventory Module**: Component tracking stock batches with average costing logic
- **Warehouse Module**: Component managing storage locations and capacity
- **Supplier Module**: Component managing supplier relationships and contacts
- **Purchase Order Module**: Component managing procurement workflow
- **Sales Order Module**: Component managing customer orders
- **POS Module**: Component processing point-of-sale transactions
- **Alert System**: Component monitoring stock levels and expiration dates
- **Dashboard**: Main interface displaying KPIs and analytics
- **AR/AP Module**: Component managing accounts receivable and accounts payable
- **Expense Module**: Component tracking business expenses and costs
- **Report Module**: Component generating business reports and analytics
- **Branch Module**: Component managing multiple business locations
- **UOM**: Unit of Measure (bottle, can, carton, pack, etc.)
- **Average Costing**: Weighted average cost inventory valuation method
- **Batch**: Group of inventory items with same expiration date
- **Accounts Receivable (AR)**: Money owed to business by customers
- **Accounts Payable (AP)**: Money owed by business to suppliers
- **Neon Database**: Serverless PostgreSQL database for data persistence
- **Prisma**: Type-safe ORM for database operations

## Requirements

### Requirement 1: Dashboard Analytics and KPIs

**User Story:** As an Operations Manager, I want to view real-time business metrics on a dashboard, so that I can monitor overall performance and identify issues quickly.

#### Acceptance Criteria

1. THE Dashboard SHALL display total products count with active status indicator
2. THE Dashboard SHALL display total stock units aggregated across all warehouses in base UOM
3. THE Dashboard SHALL display active sales orders count with conversion rate percentage
4. THE Dashboard SHALL display inventory value calculated using weighted average cost in Philippine Peso (₱) with thousand separators and 2 decimal places
5. THE Dashboard SHALL display today's POS sales transactions count and revenue in Philippine Peso (₱) with thousand separators and 2 decimal places
6. THE Dashboard SHALL display low stock alerts count with shortage indicators for products below minimum level
7. THE Dashboard SHALL display items expiring within 30 days count with batch details
8. THE Dashboard SHALL display top 5 selling products by revenue with quantity sold and revenue breakdown
9. THE Dashboard SHALL display warehouse utilization percentage with capacity tracking for each warehouse
10. THE Dashboard SHALL display total outstanding accounts receivable in Philippine Peso (₱)
11. THE Dashboard SHALL display total outstanding accounts payable in Philippine Peso (₱)
12. THE Dashboard SHALL display current month expenses total in Philippine Peso (₱)
13. THE Dashboard SHALL display overdue receivables count and overdue payables count
14. THE Dashboard SHALL refresh all KPI data automatically when underlying data changes

### Requirement 2: Product Management with Multiple UOM

**User Story:** As a Warehouse Manager, I want to manage products with multiple units of measure and separate selling prices, so that I can sell items in different quantities (bottles, packs, cartons) with appropriate pricing for each.

#### Acceptance Criteria

1. THE Product Module SHALL create products with name, description, category, image URL, base selling price, base UOM, minimum stock level, and shelf life
2. THE Product Module SHALL support alternate UOMs with conversion factors to base UOM and independent selling prices per alternate UOM
3. THE Product Module SHALL allow setting different selling prices for each UOM independent of conversion factor calculations
4. THE Product Module SHALL validate that each alternate UOM has a conversion factor greater than zero
5. THE Product Module SHALL validate that each UOM has a selling price greater than zero
6. THE Product Module SHALL validate product names for uniqueness within the system
7. THE Product Module SHALL validate minimum stock level as greater than zero
8. THE Product Module SHALL allow editing of product details including pricing and UOM configurations
9. THE Product Module SHALL allow deletion of inactive products only
10. THE Product Module SHALL filter products by category and active/inactive status
11. THE Product Module SHALL assign unique UUID identifiers to each product
12. WHEN displaying products in POS, THE Product Module SHALL show all available UOMs with their respective selling prices

### Requirement 3: Inventory Batch Tracking with Average Costing

**User Story:** As a Warehouse Manager, I want to track inventory in batches with expiration dates and use average costing for valuation, so that I can ensure product quality and maintain accurate cost tracking.

#### Acceptance Criteria

1. THE Inventory Module SHALL create inventory batches with unique batch number, warehouse location, quantity in base UOM, unit cost per base UOM, expiration date, and received date
2. WHEN new stock is added, THE Inventory Module SHALL convert quantities to base UOM using conversion factors from Product Module
3. WHEN new stock is added, THE Inventory Module SHALL recalculate weighted average cost as total cost of all base units divided by total base unit quantity
4. WHEN POS sales occur, THE Inventory Module SHALL deduct stock using weighted average cost for inventory valuation
5. WHEN POS sales occur with alternate UOM, THE Inventory Module SHALL convert sold quantity to base UOM before deducting from batches
6. THE Inventory Module SHALL prioritize deducting from batches with earliest expiration dates to minimize waste
7. THE Inventory Module SHALL record stock movements for additions, deductions, and transfers between warehouses
8. THE Inventory Module SHALL maintain complete movement history with timestamps and reasons
9. THE Inventory Module SHALL calculate current stock levels by aggregating active batches per product and warehouse in base UOM
10. THE Inventory Module SHALL mark batches as expired when expiration date is past current date
11. THE Inventory Module SHALL prevent stock deductions that exceed available quantity in batches
12. THE Inventory Module SHALL display current weighted average cost per base UOM per product per warehouse

### Requirement 4: Warehouse Capacity Management

**User Story:** As a Warehouse Manager, I want to monitor warehouse capacity and utilization, so that I can prevent overstocking and optimize space usage.

#### Acceptance Criteria

1. THE Warehouse Module SHALL create warehouses with name, location, manager name, and maximum storage capacity in base UOM units
2. THE Warehouse Module SHALL calculate current utilization as percentage of capacity based on total stock units in base UOM
3. WHEN utilization reaches 60 percent, THE Warehouse Module SHALL display yellow alert indicator
4. WHEN utilization reaches 80 percent, THE Warehouse Module SHALL display red alert indicator
5. THE Warehouse Module SHALL display product distribution across warehouse locations with quantities in base UOM
6. THE Warehouse Module SHALL prevent stock additions that would exceed warehouse maximum capacity
7. THE Warehouse Module SHALL allow editing of warehouse details including capacity adjustments
8. THE Warehouse Module SHALL assign unique UUID identifiers to each warehouse
9. THE Warehouse Module SHALL validate maximum capacity as greater than zero

### Requirement 5: Supplier Relationship Management

**User Story:** As a Procurement Manager, I want to manage supplier information and payment terms, so that I can maintain organized supplier relationships.

#### Acceptance Criteria

1. THE Supplier Module SHALL create suppliers with company name, contact person, phone, email, payment terms, and status
2. THE Supplier Module SHALL support payment terms of Net 15, Net 30, Net 60, and COD
3. THE Supplier Module SHALL validate email format for supplier email addresses
4. THE Supplier Module SHALL allow editing of supplier contact information and payment terms
5. THE Supplier Module SHALL perform soft delete for inactive suppliers maintaining historical data
6. THE Supplier Module SHALL filter suppliers by active and inactive status
7. THE Supplier Module SHALL search suppliers by company name

### Requirement 6: Purchase Order Workflow with Auto-Inventory

**User Story:** As a Procurement Manager, I want to create purchase orders and automatically receive inventory, so that I can streamline the procurement process.

#### Acceptance Criteria

1. THE Purchase Order Module SHALL create purchase orders with auto-generated PO number, supplier selection, warehouse assignment, multiple product items with quantities in base UOM and unit cost prices, expected delivery date, and notes
2. THE Purchase Order Module SHALL support status workflow of Draft, Pending, Ordered, Received, and Cancelled
3. THE Purchase Order Module SHALL validate that selected supplier is active before creating PO
4. THE Purchase Order Module SHALL validate that all product items exist and are active before creating PO
5. WHEN PO status changes to Received, THE Purchase Order Module SHALL automatically create inventory batches for each product item in assigned warehouse
6. WHEN creating inventory batches from PO, THE Purchase Order Module SHALL auto-generate unique batch number
7. WHEN creating inventory batches from PO, THE Purchase Order Module SHALL calculate expiration date by adding product shelf life days to received date
8. WHEN creating inventory batches from PO, THE Purchase Order Module SHALL use unit cost from PO for batch unit cost
9. THE Purchase Order Module SHALL calculate total PO amount by summing all item subtotals with 2 decimal places
10. THE Purchase Order Module SHALL allow editing of PO in Draft and Pending status only
11. THE Purchase Order Module SHALL allow cancellation of PO with reason documentation
12. THE Purchase Order Module SHALL filter purchase orders by status and date range
13. THE Purchase Order Module SHALL assign unique UUID identifiers to each purchase order

### Requirement 7: Sales Order Management with POS Conversion

**User Story:** As a Sales Representative, I want to create sales orders and convert them to POS transactions, so that I can fulfill customer orders efficiently.

#### Acceptance Criteria

1. THE Sales Order Module SHALL create sales orders with auto-generated order number, customer name, customer phone, customer email, delivery address, multiple product items with quantities and selected UOM, delivery warehouse, delivery date, and total amount
2. THE Sales Order Module SHALL support status workflow of Draft, Pending, Converted, and Cancelled
3. THE Sales Order Module SHALL validate that ordered items have sufficient stock in assigned warehouse before creating order
4. THE Sales Order Module SHALL calculate total amount by summing item quantities multiplied by UOM selling prices with 2 decimal places
5. THE Sales Order Module SHALL validate customer phone format before creating order
6. THE Sales Order Module SHALL validate customer email format before creating order
7. THE Sales Order Module SHALL allow editing of sales orders in Draft and Pending status only
8. WHEN sales order is converted to POS, THE Sales Order Module SHALL mark salesOrderStatus as Converted
9. WHEN sales order is converted to POS, THE Sales Order Module SHALL link POS sale with convertedFromOrderId
10. THE Sales Order Module SHALL display conversion status indicating if order was saved in POS
11. THE Sales Order Module SHALL filter sales orders by status and date range
12. THE Sales Order Module SHALL assign unique UUID identifiers to each sales order

### Requirement 8: Point of Sale Transaction Processing

**User Story:** As a POS Operator, I want to process sales transactions with multiple payment methods including GCash, so that I can serve customers quickly and accurately.

#### Acceptance Criteria

1. THE POS Module SHALL display product grid with images, names, all available UOM options with selling prices, and stock availability per product
2. THE POS Module SHALL search products by name in real-time with case-insensitive matching
3. THE POS Module SHALL filter products by category for quick navigation
4. THE POS Module SHALL display only active products with available stock in POS interface
5. THE POS Module SHALL allow adding items to cart with quantity adjustment and UOM selection per item
6. THE POS Module SHALL validate that selected quantity does not exceed available stock before adding to cart
7. THE POS Module SHALL calculate item subtotal as quantity multiplied by selected UOM selling price
8. THE POS Module SHALL calculate cart subtotal by summing all item subtotals with 2 decimal places
9. THE POS Module SHALL calculate tax as subtotal multiplied by 12 percent with 2 decimal places
10. THE POS Module SHALL calculate total amount as subtotal plus tax with 2 decimal places
11. THE POS Module SHALL support payment methods of Cash, Card, Check, GCash, and Online Transfer
12. WHEN payment method is Cash, THE POS Module SHALL validate that amount received is greater than or equal to total amount
13. WHEN payment method is Cash, THE POS Module SHALL calculate change as amount received minus total amount with 2 decimal places
14. WHEN POS sale is completed, THE POS Module SHALL deduct inventory quantities from batches prioritizing earliest expiration dates
15. WHEN POS sale is completed, THE POS Module SHALL record cost of goods sold using weighted average cost per product
16. THE POS Module SHALL generate unique receipt number with format RCP-YYYYMMDD-XXXX for each transaction
17. THE POS Module SHALL display receipt preview with all items showing product name, quantity, UOM, unit price, subtotal, cart subtotal, tax, and total
18. THE POS Module SHALL allow conversion of pending sales orders to POS transactions individually or in bulk
19. WHEN converting sales order to POS, THE POS Module SHALL pre-populate cart with order items and customer information
20. THE POS Module SHALL display today's POS summary with transaction count, total revenue, and average sale value
21. THE POS Module SHALL assign unique UUID identifiers to each POS sale
22. THE POS Module SHALL record timestamp for each POS sale transaction

### Requirement 9: Alert Monitoring System

**User Story:** As a Warehouse Manager, I want to receive alerts for low stock and expiring items, so that I can take proactive action to prevent stockouts and waste.

#### Acceptance Criteria

1. THE Alert System SHALL generate Low Stock alerts for products with current stock in base UOM below minimum stock level
2. THE Alert System SHALL generate Expiring Soon alerts for inventory batches expiring within 30 days from current date
3. THE Alert System SHALL generate Expired alerts for inventory batches past expiration date with critical severity
4. THE Alert System SHALL calculate alert counts by aggregating all active alerts per type
5. THE Alert System SHALL display alert counts on Dashboard with severity badges using color coding
6. THE Alert System SHALL allow filtering alerts by type and severity level
7. THE Alert System SHALL allow dismissing alerts after action is taken
8. THE Alert System SHALL provide direct action links from alerts to reorder products or remove expired items
9. THE Alert System SHALL refresh alert data automatically when inventory levels change
10. THE Alert System SHALL display alert details including product name, warehouse location, current quantity, and shortage amount for low stock alerts
11. THE Alert System SHALL display alert details including product name, batch number, expiration date, and days until expiration for expiring soon alerts

### Requirement 10: Reporting and Data Export

**User Story:** As an Operations Manager, I want to generate comprehensive reports including financial statements, so that I can analyze business performance and share insights with stakeholders.

#### Acceptance Criteria

1. THE Report Module SHALL generate inventory reports showing stock level by product in base UOM, inventory value using weighted average cost, warehouse utilization percentage, batch tracking with expiration dates, and stock movement history with timestamps
2. THE Report Module SHALL generate sales reports showing POS sales by date range, best-selling products by quantity and revenue, revenue by product and category, and sales order fulfillment status with conversion rates
3. THE Report Module SHALL generate procurement reports showing purchase order status summary, supplier performance metrics including on-time delivery rate, cost analysis by supplier, and delivery timeline tracking
4. THE Report Module SHALL generate accounts receivable aging report showing outstanding balances by customer with aging buckets of 0-30, 31-60, 61-90, and over 90 days
5. THE Report Module SHALL generate accounts payable aging report showing outstanding balances by supplier with aging buckets of 0-30, 31-60, 61-90, and over 90 days
6. THE Report Module SHALL generate expense report by category showing total expenses per category for specified date range
7. THE Report Module SHALL generate expense report by vendor showing total expenses per vendor for specified date range
8. THE Report Module SHALL generate profit and loss statement showing total revenue, cost of goods sold, gross profit, total expenses, and net profit for specified date range
9. THE Report Module SHALL generate cash flow statement showing cash inflows from sales and AR payments, cash outflows for expenses and AP payments, and net cash flow for specified date range
10. THE Report Module SHALL generate balance sheet showing total assets including inventory value and accounts receivable, total liabilities including accounts payable, and equity
11. THE Report Module SHALL allow filtering reports by date range with start date and end date selection
12. THE Report Module SHALL allow filtering inventory reports by warehouse, branch, and product category
13. THE Report Module SHALL allow filtering sales reports by payment method, branch, and product category
14. THE Report Module SHALL allow filtering financial reports by branch for multi-branch analysis
15. THE Report Module SHALL export all reports to CSV format with column selection options
16. THE Report Module SHALL format all currency values in Philippine Peso (₱) with thousand separators and 2 decimal places
17. THE Report Module SHALL format all date values in consistent format YYYY-MM-DD
18. THE Report Module SHALL calculate profit margins by comparing selling prices with weighted average costs in sales reports
19. THE Report Module SHALL calculate gross profit margin percentage as gross profit divided by total revenue
20. THE Report Module SHALL calculate net profit margin percentage as net profit divided by total revenue

### Requirement 11: Data Persistence and Initialization

**User Story:** As a System User, I want my data to persist reliably in a database, so that I don't lose my work and can access it from any device.

#### Acceptance Criteria

1. THE InventoryPro System SHALL store all data in Neon PostgreSQL database
2. THE InventoryPro System SHALL use Prisma ORM for type-safe database operations
3. WHEN application loads for first time, THE InventoryPro System SHALL initialize seed data with 8 sample products, 3 warehouses, 2 branches, and sample orders
4. THE InventoryPro System SHALL retrieve data from database using optimized queries with proper indexing
5. THE InventoryPro System SHALL update database immediately after any data modification within transactions
6. THE InventoryPro System SHALL validate data integrity using database constraints and Prisma schema validation
7. THE InventoryPro System SHALL implement database connection pooling for optimal performance
8. THE InventoryPro System SHALL handle database errors gracefully with user-friendly error messages
9. THE InventoryPro System SHALL implement optimistic locking for concurrent data modifications
10. THE InventoryPro System SHALL perform database backups automatically through Neon's built-in backup system

### Requirement 12: Navigation and User Interface

**User Story:** As a System User, I want intuitive navigation and responsive design, so that I can access features easily on desktop and mobile devices.

#### Acceptance Criteria

1. THE InventoryPro System SHALL display fixed left sidebar navigation on desktop viewports
2. THE InventoryPro System SHALL display collapsible hamburger menu navigation on mobile viewports
3. THE InventoryPro System SHALL highlight active route in navigation menu
4. THE InventoryPro System SHALL provide navigation links to Dashboard, Products, Inventory, Warehouses, Branches, Suppliers, Purchase Orders, Sales Orders, POS, AR/AP, Expenses, Alerts, and Reports modules
5. THE InventoryPro System SHALL display brand logo section at top of navigation
6. THE InventoryPro System SHALL display loading skeleton loaders during page transitions
7. THE InventoryPro System SHALL display toast notifications for success and error feedback
8. THE InventoryPro System SHALL display confirmation dialogs for destructive actions
9. THE InventoryPro System SHALL display empty states with helpful messages when no data exists

### Requirement 13: Accounts Receivable and Accounts Payable

**User Story:** As an Operations Manager, I want to track accounts receivable from customers and accounts payable to suppliers, so that I can manage cash flow and outstanding balances.

#### Acceptance Criteria

1. THE AR/AP Module SHALL create accounts receivable records when sales orders are marked as credit sales
2. THE AR/AP Module SHALL create accounts payable records automatically when purchase orders are received
3. THE AR/AP Module SHALL calculate accounts receivable balance as total amount minus payments received
4. THE AR/AP Module SHALL calculate accounts payable balance as total amount minus payments made
5. THE AR/AP Module SHALL record payment transactions with payment date, amount, payment method, and reference number
6. THE AR/AP Module SHALL support partial payments for both accounts receivable and accounts payable
7. THE AR/AP Module SHALL display aging report for accounts receivable showing 0-30 days, 31-60 days, 61-90 days, and over 90 days
8. THE AR/AP Module SHALL display aging report for accounts payable showing 0-30 days, 31-60 days, 61-90 days, and over 90 days
9. THE AR/AP Module SHALL calculate due dates based on payment terms for accounts payable
10. THE AR/AP Module SHALL generate overdue alerts for accounts receivable past due date
11. THE AR/AP Module SHALL generate overdue alerts for accounts payable past due date
12. THE AR/AP Module SHALL allow filtering AR/AP records by customer, supplier, status, and date range
13. THE AR/AP Module SHALL display total outstanding receivables and payables on Dashboard
14. THE AR/AP Module SHALL assign unique UUID identifiers to each AR/AP record

### Requirement 14: Expense Management

**User Story:** As an Operations Manager, I want to track business expenses, so that I can monitor costs and analyze profitability.

#### Acceptance Criteria

1. THE Expense Module SHALL create expense records with expense date, category, amount, description, payment method, and vendor
2. THE Expense Module SHALL support expense categories including Utilities, Rent, Salaries, Transportation, Marketing, Maintenance, and Other
3. THE Expense Module SHALL validate expense amount as greater than zero
4. THE Expense Module SHALL allow attaching receipt images or documents to expense records
5. THE Expense Module SHALL calculate total expenses by category for specified date range
6. THE Expense Module SHALL calculate total expenses by vendor for specified date range
7. THE Expense Module SHALL display monthly expense trends on Dashboard
8. THE Expense Module SHALL allow filtering expenses by category, date range, and payment method
9. THE Expense Module SHALL export expense reports to CSV format with all expense details
10. THE Expense Module SHALL format all expense amounts in Philippine Peso (₱) with thousand separators and 2 decimal places
11. THE Expense Module SHALL assign unique UUID identifiers to each expense record
12. THE Expense Module SHALL record timestamp for each expense entry

### Requirement 15: Multi-Branch Management

**User Story:** As a Business Owner, I want to manage multiple branch locations with separate transaction recording, so that I can track performance across different locations.

#### Acceptance Criteria

1. THE Branch Module SHALL create branch records with branch name, location address, branch code, manager name, phone, and status
2. THE Branch Module SHALL assign unique UUID identifiers to each branch
3. THE Branch Module SHALL validate branch codes for uniqueness within the system
4. THE Branch Module SHALL allow editing of branch details including manager and contact information
5. THE Branch Module SHALL support active and inactive branch status
6. WHEN creating purchase orders, THE Purchase Order Module SHALL assign branch to each PO for tracking
7. WHEN creating sales orders, THE Sales Order Module SHALL assign branch to each order for tracking
8. WHEN processing POS sales, THE POS Module SHALL record branch identifier for each transaction
9. WHEN creating expenses, THE Expense Module SHALL assign branch to each expense record
10. WHEN creating AR/AP records, THE AR/AP Module SHALL assign branch to each record
11. THE Dashboard SHALL allow filtering KPIs by branch selection
12. THE Dashboard SHALL display branch comparison widget showing revenue, expenses, and profit by branch
13. THE Report Module SHALL allow filtering all reports by single branch or all branches
14. THE Report Module SHALL generate branch performance report comparing revenue, expenses, profit, and inventory value across branches
15. THE Inventory Module SHALL track stock levels per warehouse per branch
16. THE Warehouse Module SHALL assign each warehouse to a specific branch
17. THE InventoryPro System SHALL provide branch selector in navigation for users to switch active branch context
18. THE InventoryPro System SHALL display current active branch name in navigation header

### Requirement 16: UI/UX Design System and Consistency

**User Story:** As a System User, I want a consistent and intuitive user interface, so that I can navigate the system efficiently without confusion.

#### Acceptance Criteria

1. THE InventoryPro System SHALL implement a design system with consistent color palette, typography, spacing, and component styles
2. THE InventoryPro System SHALL use shadcn/ui components exclusively for all UI elements to ensure consistency
3. THE InventoryPro System SHALL define a maximum of 5 primary colors for semantic purposes: primary, secondary, success, warning, and danger
4. THE InventoryPro System SHALL use consistent spacing scale based on 4px increments (4, 8, 12, 16, 24, 32, 48, 64)
5. THE InventoryPro System SHALL use maximum of 3 font sizes for body text: small (14px), base (16px), and large (18px)
6. THE InventoryPro System SHALL use consistent heading hierarchy with h1, h2, h3 only
7. THE InventoryPro System SHALL implement consistent form layouts with labels above inputs and helper text below
8. THE InventoryPro System SHALL use consistent button styles with primary, secondary, outline, and ghost variants only
9. THE InventoryPro System SHALL implement consistent card layouts with header, body, and footer sections
10. THE InventoryPro System SHALL use consistent table layouts with sortable headers, pagination, and row actions
11. THE InventoryPro System SHALL implement consistent modal dialogs with header, body, and action footer
12. THE InventoryPro System SHALL use consistent icon sizes: small (16px), medium (20px), large (24px)
13. THE InventoryPro System SHALL implement consistent loading states using skeleton loaders matching content layout
14. THE InventoryPro System SHALL use consistent empty states with icon, message, and call-to-action button
15. THE InventoryPro System SHALL implement consistent error states with error icon, message, and retry action
16. THE InventoryPro System SHALL use consistent toast notification positioning at top-right corner
17. THE InventoryPro System SHALL limit toast notifications to 3 visible at a time with auto-dismiss after 5 seconds
18. THE InventoryPro System SHALL implement consistent page layouts with page title, breadcrumbs, actions, and content area
19. THE InventoryPro System SHALL use consistent data display formats: dates (MMM DD, YYYY), currency (₱ X,XXX.XX), numbers (X,XXX)
20. THE InventoryPro System SHALL implement responsive breakpoints at 640px (mobile), 768px (tablet), 1024px (desktop), 1280px (large desktop)
21. THE InventoryPro System SHALL ensure minimum touch target size of 44x44px for mobile interactions
22. THE InventoryPro System SHALL implement consistent navigation patterns with active state highlighting
23. THE InventoryPro System SHALL use consistent status badges with predefined colors: draft (gray), pending (yellow), active (green), cancelled (red)
24. THE InventoryPro System SHALL implement consistent data tables with alternating row colors for better readability
25. THE InventoryPro System SHALL use consistent form validation with inline error messages in red below inputs
26. THE InventoryPro System SHALL implement consistent confirmation dialogs for destructive actions with clear primary and secondary buttons
27. THE InventoryPro System SHALL maintain consistent white space and visual hierarchy throughout all pages
28. THE InventoryPro System SHALL implement dark mode support with consistent color mappings
29. THE InventoryPro System SHALL ensure WCAG 2.1 AA accessibility compliance for color contrast ratios
30. THE InventoryPro System SHALL document all design patterns in a component library for developer reference

### Requirement 17: Data Validation and Business Rules

**User Story:** As a System User, I want the system to validate my inputs, so that I can maintain data quality and prevent errors.

#### Acceptance Criteria

1. THE InventoryPro System SHALL enforce required field validation on all forms
2. THE InventoryPro System SHALL validate email format for email address fields
3. THE InventoryPro System SHALL validate phone number format for phone fields
4. THE InventoryPro System SHALL validate quantity and price fields as positive numbers
5. THE InventoryPro System SHALL validate expiration dates as future dates relative to received date
6. THE InventoryPro System SHALL validate UOM conversion factors as greater than zero
7. THE InventoryPro System SHALL validate unit cost as greater than zero
8. THE InventoryPro System SHALL display inline validation error messages with solutions
