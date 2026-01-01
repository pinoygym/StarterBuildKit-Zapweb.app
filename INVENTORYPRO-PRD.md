# InventoryPro Product Requirements Document (PRD)

## 1. Overview

### 1.1 Product Description
InventoryPro is a comprehensive inventory management and Point of Sale (POS) system specifically designed for soft drinks wholesale delivery companies in the Philippines. The system provides end-to-end management of inventory, sales, procurement, and financial operations with advanced features like multi-unit-of-measure (UOM) support, batch tracking, and weighted average costing.

### 1.2 Target Audience
- **Soft Drinks Wholesale Companies**: Businesses that distribute beverages like Coca-Cola, Pepsi, and other soft drinks
- **Multi-branch Operations**: Companies with multiple warehouse locations and sales branches
- **Philippine Market**: Designed specifically for Philippine business practices and regulations
- **Growing Businesses**: Companies needing scalable inventory and POS solutions

### 1.3 Business Objectives
- Streamline inventory management across multiple branches
- Provide accurate real-time stock levels and costing
- Enable efficient procurement and sales processes
- Ensure compliance with Philippine business regulations
- Support business growth through scalable operations
- Reduce operational costs through automation

### 1.4 Key Value Propositions
- **Multi-UOM Support**: Handle complex product packaging (bottles, cases, pallets)
- **Batch Tracking**: Full traceability with expiration monitoring
- **Weighted Average Costing**: Accurate inventory valuation
- **Integrated POS**: Seamless sales processing
- **Multi-branch Management**: Centralized oversight of distributed operations
- **Real-time Analytics**: Data-driven decision making

## 2. User Stories

### 2.1 User Personas

#### Branch Manager
- **Profile**: Oversees daily operations of a specific branch location
- **Goals**: Manage inventory, process sales, monitor performance, handle customer orders
- **Pain Points**: Manual stock counting, delayed inventory updates, cash handling errors

#### Warehouse Supervisor
- **Profile**: Manages warehouse operations and inventory control
- **Goals**: Track stock levels, manage receiving, optimize storage, prevent stockouts
- **Pain Points**: Inaccurate stock records, space utilization issues, expiry management

#### Procurement Officer
- **Profile**: Handles supplier relationships and purchase orders
- **Goals**: Source products, negotiate terms, manage deliveries, control costs
- **Pain Points**: Manual PO processing, supplier performance tracking, payment management

#### Sales Representative
- **Profile**: Manages customer relationships and sales orders
- **Goals**: Process orders, manage deliveries, track payments, build customer loyalty
- **Pain Points**: Order processing delays, payment collection issues, customer data management

#### Company Owner/CEO
- **Profile**: Oversees entire business operations
- **Goals**: Monitor business performance, make strategic decisions, ensure profitability
- **Pain Points**: Lack of real-time insights, manual reporting, operational inefficiencies

### 2.2 Key User Stories

#### Inventory Management
- As a warehouse supervisor, I want to track inventory by batch so that I can monitor product freshness and expiry dates
- As a branch manager, I want to view real-time stock levels across all warehouses so that I can make informed purchasing decisions
- As a procurement officer, I want to receive automated alerts for low stock items so that I can reorder before stockouts occur

#### Sales & POS
- As a sales representative, I want to process POS transactions quickly so that I can serve customers efficiently
- As a branch manager, I want to convert sales orders to POS sales so that I can fulfill customer orders seamlessly
- As a cashier, I want to apply discounts and handle multiple payment methods so that I can accommodate different customer needs

#### Procurement
- As a procurement officer, I want to create and track purchase orders so that I can manage supplier deliveries
- As a warehouse supervisor, I want to process receiving vouchers so that I can update inventory accurately
- As a finance officer, I want to track accounts payable so that I can manage supplier payments

#### Financial Management
- As a company owner, I want to view profit & loss statements so that I can monitor business performance
- As an accountant, I want to track accounts receivable so that I can manage customer payments
- As a branch manager, I want to record expenses so that I can track operational costs

#### Multi-branch Operations
- As a company owner, I want to switch between branches so that I can monitor different locations
- As an admin, I want to manage user access by branch so that I can control data security
- As a regional manager, I want to compare branch performance so that I can identify best practices

## 3. Functional Requirements

### 3.1 Authentication & Authorization
- **FR-AUTH-001**: User login with email and password
- **FR-AUTH-002**: Role-based access control (Admin, Manager, Staff)
- **FR-AUTH-003**: Branch-specific data access
- **FR-AUTH-004**: Session management with automatic logout
- **FR-AUTH-005**: Password reset functionality

### 3.2 Branch Management
- **FR-BRANCH-001**: Create and manage multiple business locations
- **FR-BRANCH-002**: Branch-specific data isolation
- **FR-BRANCH-003**: Branch switching functionality
- **FR-BRANCH-004**: Branch performance analytics
- **FR-BRANCH-005**: User-branch access assignment

### 3.3 Product Management
- **FR-PROD-001**: Multi-UOM product configuration (base UOM + alternate UOMs)
- **FR-PROD-002**: Product categorization
- **FR-PROD-003**: Product image upload
- **FR-PROD-004**: Minimum stock level alerts
- **FR-PROD-005**: Shelf life and expiry tracking
- **FR-PROD-006**: Product status management (active/inactive)

### 3.4 Inventory Management
- **FR-INV-001**: Batch tracking with unique batch numbers
- **FR-INV-002**: Weighted average cost calculation
- **FR-INV-003**: FIFO inventory management
- **FR-INV-004**: Real-time stock level monitoring
- **FR-INV-005**: Stock movement audit trail
- **FR-INV-006**: Warehouse capacity management
- **FR-INV-007**: Inventory adjustments and corrections

### 3.5 Warehouse Management
- **FR-WH-001**: Multiple warehouse support per branch
- **FR-WH-002**: Warehouse capacity tracking
- **FR-WH-003**: Stock transfers between warehouses
- **FR-WH-004**: Warehouse utilization reports
- **FR-WH-005**: Warehouse manager assignment

### 3.6 Supplier Management
- **FR-SUPP-001**: Supplier information management
- **FR-SUPP-002**: Payment terms configuration
- **FR-SUPP-003**: Supplier performance tracking
- **FR-SUPP-004**: Supplier contact management

### 3.7 Purchase Order Management
- **FR-PO-001**: PO creation with multiple line items
- **FR-PO-002**: PO status workflow (Draft → Pending → Ordered → Received)
- **FR-PO-003**: Supplier assignment and expected delivery dates
- **FR-PO-004**: PO approval workflow
- **FR-PO-005**: PO tracking and status updates

### 3.8 Receiving Voucher Management
- **FR-RV-001**: RV creation from approved POs
- **FR-RV-002**: Quantity variance tracking
- **FR-RV-003**: Automatic inventory batch creation
- **FR-RV-004**: Quality inspection recording
- **FR-RV-005**: RV cancellation and corrections

### 3.9 Sales Order Management
- **FR-SO-001**: Customer order creation
- **FR-SO-002**: Stock availability validation
- **FR-SO-003**: Order status management
- **FR-SO-004**: Delivery date scheduling
- **FR-SO-005**: Order conversion to POS sales

### 3.10 Point of Sale (POS)
- **FR-POS-001**: Product search and selection
- **FR-POS-002**: Shopping cart management
- **FR-POS-003**: UOM selection and price calculation
- **FR-POS-004**: Discount application
- **FR-POS-005**: Multiple payment method support
- **FR-POS-006**: Receipt generation and printing
- **FR-POS-007**: Sales order integration
- **FR-POS-008**: Cash change calculation

### 3.11 Accounts Receivable (AR)
- **FR-AR-001**: AR creation from POS sales and orders
- **FR-AR-002**: Payment recording and tracking
- **FR-AR-003**: Aging analysis (0-30, 31-60, 61-90, 90+ days)
- **FR-AR-004**: Customer credit limit management
- **FR-AR-005**: AR reporting and analytics

### 3.12 Accounts Payable (AP)
- **FR-AP-001**: AP creation from receiving vouchers
- **FR-AP-002**: Payment terms and due date calculation
- **FR-AP-003**: Payment recording and tracking
- **FR-AP-004**: Supplier payment management
- **FR-AP-005**: AP aging and overdue tracking

### 3.13 Expense Management
- **FR-EXP-001**: Expense category management
- **FR-EXP-002**: Expense recording with receipts
- **FR-EXP-003**: Expense approval workflow
- **FR-EXP-004**: Expense reporting by category and period
- **FR-EXP-005**: Vendor expense tracking

### 3.14 Alert System
- **FR-ALERT-001**: Low stock alerts
- **FR-ALERT-002**: Expiring product alerts (30 days)
- **FR-ALERT-003**: Expired product alerts
- **FR-ALERT-004**: Warehouse capacity alerts
- **FR-ALERT-005**: Overdue payment alerts

### 3.15 Dashboard & Analytics
- **FR-DASH-001**: Real-time KPI display
- **FR-DASH-002**: Sales performance metrics
- **FR-DASH-003**: Inventory value tracking
- **FR-DASH-004**: Branch comparison analytics
- **FR-DASH-005**: Trend analysis and forecasting

### 3.16 Reporting
- **FR-REPORT-001**: Inventory reports (stock levels, movements, valuation)
- **FR-REPORT-002**: Sales reports (POS, orders, performance)
- **FR-REPORT-003**: Procurement reports (POs, suppliers, costs)
- **FR-REPORT-004**: Financial reports (P&L, cash flow, balance sheet)
- **FR-REPORT-005**: Export to CSV functionality
- **FR-REPORT-006**: Date range and branch filtering

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-PERF-001**: Page load time < 2 seconds for dashboard
- **NFR-PERF-002**: POS transaction processing < 1 second
- **NFR-PERF-003**: Search results return < 500ms
- **NFR-PERF-004**: Support 100+ concurrent users
- **NFR-PERF-005**: Handle 10,000+ products across branches

### 4.2 Security
- **NFR-SEC-001**: Data encryption at rest and in transit
- **NFR-SEC-002**: Role-based access control
- **NFR-SEC-003**: Audit logging for all transactions
- **NFR-SEC-004**: Secure password policies
- **NFR-SEC-005**: Session timeout after 30 minutes of inactivity

### 4.3 Scalability
- **NFR-SCALE-001**: Support unlimited branches
- **NFR-SCALE-002**: Handle 1M+ transactions per month
- **NFR-SCALE-003**: Database performance maintained with 100GB+ data
- **NFR-SCALE-004**: Auto-scaling infrastructure

### 4.4 Usability
- **NFR-USAB-001**: Intuitive navigation and workflows
- **NFR-USAB-002**: Mobile-responsive design
- **NFR-USAB-003**: Keyboard shortcuts for POS operations
- **NFR-USAB-004**: Clear error messages and validation
- **NFR-USAB-005**: Consistent UI/UX across all modules

### 4.5 Reliability
- **NFR-REL-001**: 99.9% uptime SLA
- **NFR-REL-002**: Automatic data backups
- **NFR-REL-003**: Transaction rollback on failures
- **NFR-REL-004**: Graceful error handling
- **NFR-REL-005**: Data integrity constraints

### 4.6 Maintainability
- **NFR-MAINT-001**: Modular architecture
- **NFR-MAINT-002**: Comprehensive API documentation
- **NFR-MAINT-003**: Automated testing coverage > 80%
- **NFR-MAINT-004**: Clear code documentation
- **NFR-MAINT-005**: Version control and deployment automation

## 5. Technical Specifications

### 5.1 Technology Stack
- **Frontend Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Component Library**: shadcn/ui
- **State Management**: Zustand, TanStack Query
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma 5
- **Validation**: Zod
- **Charts**: Recharts
- **Deployment**: Vercel

### 5.2 System Architecture

#### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - React Components│  │ - Business Logic │  │ - Prisma Schema │
│ - State Management│  │ - Validation     │  │ - Data Models    │
│ - UI/UX          │  │ - Authentication  │  │ - Relationships  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Data Flow Architecture
```
User Request → Middleware → API Route → Service Layer → Repository → Database
                      ↓
                Authentication & Authorization
                      ↓
                Response ← Business Logic ← Data Access ← Query Result
```

### 5.3 Database Schema

#### Core Entities
- **Branch**: Multi-location support with branch-specific data isolation
- **Product**: Multi-UOM products with base and alternate units
- **ProductUOM**: Conversion factors and pricing for alternate units
- **Warehouse**: Storage facilities with capacity management
- **Inventory**: Current stock levels by product and warehouse
- **StockMovement**: Complete audit trail of inventory changes

#### Transaction Entities
- **PurchaseOrder & PurchaseOrderItem**: Procurement workflow
- **ReceivingVoucher & ReceivingVoucherItem**: Goods receipt processing
- **SalesOrder & SalesOrderItem**: Customer order management
- **POSSale & POSSaleItem**: Point of sale transactions

#### Financial Entities
- **AccountsReceivable & ARPayment**: Customer invoice tracking
- **AccountsPayable & APPayment**: Supplier payment management
- **Expense**: Business expense tracking

#### User Management
- **User**: Authentication and authorization
- **Role & Permission**: Access control system
- **UserBranchAccess**: Branch-specific permissions

### 5.4 API Specifications

#### RESTful API Design
- **Base URL**: `/api/v1`
- **Authentication**: Bearer token in Authorization header
- **Response Format**: JSON with consistent structure
- **Error Handling**: Standardized error responses
- **Pagination**: Cursor-based pagination for large datasets

#### Key API Endpoints
- `GET/POST/PUT/DELETE /api/products` - Product management
- `GET/POST /api/inventory` - Stock level operations
- `POST /api/pos/sales` - POS transaction processing
- `GET/POST /api/sales-orders` - Order management
- `GET/POST /api/purchase-orders` - Procurement management
- `GET/POST /api/ar` - Accounts receivable
- `GET/POST /api/ap` - Accounts payable
- `GET /api/reports/*` - Reporting endpoints

### 5.5 Security Architecture
- **Authentication**: Session-based with JWT tokens
- **Authorization**: Role-based permissions with resource-level access
- **Data Protection**: SSL/TLS encryption, data sanitization
- **Audit Trail**: Comprehensive logging of all user actions
- **Input Validation**: Zod schemas for all API inputs

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Database schema design and implementation
- [ ] Authentication and user management
- [ ] Basic product and inventory management
- [ ] Branch management setup
- [ ] Core UI components and layouts

### Phase 2: Core Features (Weeks 5-12)
- [ ] Multi-UOM product management
- [ ] Batch tracking and weighted average costing
- [ ] Purchase order and receiving voucher system
- [ ] Sales order management
- [ ] Point of sale implementation
- [ ] Warehouse management

### Phase 3: Financial Management (Weeks 13-18)
- [ ] Accounts receivable system
- [ ] Accounts payable system
- [ ] Expense management
- [ ] Financial reporting
- [ ] Payment processing integration

### Phase 4: Advanced Features (Weeks 19-24)
- [ ] Alert system implementation
- [ ] Advanced analytics and dashboard
- [ ] Comprehensive reporting suite
- [ ] Mobile optimization
- [ ] Performance optimization

### Phase 5: Testing & Deployment (Weeks 25-28)
- [ ] Comprehensive testing (unit, integration, E2E)
- [ ] Security audit and penetration testing
- [ ] Performance testing and optimization
- [ ] Production deployment
- [ ] User training and documentation

### Phase 6: Post-Launch (Ongoing)
- [ ] User feedback collection
- [ ] Bug fixes and minor enhancements
- [ ] Feature enhancements based on user needs
- [ ] Performance monitoring and optimization
- [ ] Regular security updates

---

# Master Prompt for AI Agent

## Task: Clone and Replicate InventoryPro

You are an expert AI developer tasked with cloning and replicating the InventoryPro web application based on the provided Product Requirements Document (PRD). Your goal is to create a fully functional, identical copy of the application with all specified features, design, and behavior.

## Application Overview
InventoryPro is a comprehensive inventory management and Point of Sale (POS) system for soft drinks wholesale delivery companies in the Philippines. It features multi-unit-of-measure support, batch tracking, weighted average costing, and multi-branch operations.

## Technical Requirements
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Next.js API Routes with TypeScript
- **Database**: Neon PostgreSQL with Prisma 5 ORM
- **Validation**: Zod schemas
- **State Management**: Zustand and TanStack Query
- **Charts**: Recharts
- **Deployment**: Vercel-ready

## Core Features to Implement

### 1. Authentication & Authorization
- Email/password login system
- Role-based access control (Admin, Manager, Staff levels)
- Branch-specific data access and permissions
- Session management with automatic logout
- Password reset functionality

### 2. Multi-Branch Architecture
- Branch creation and management
- Branch-specific data isolation
- Branch switching functionality
- User-branch access assignment
- Branch performance analytics

### 3. Product Management
- Multi-UOM product configuration (base UOM + alternate UOMs with conversion factors)
- Product categorization and image upload
- Minimum stock level and shelf life settings
- Product status management (active/inactive)

### 4. Inventory Management
- Batch tracking with unique batch numbers and expiry dates
- Weighted average cost calculation algorithm
- FIFO (First-In-First-Out) inventory management
- Real-time stock level monitoring
- Stock movement audit trail
- Inventory adjustments and corrections

### 5. Warehouse Management
- Multiple warehouses per branch
- Warehouse capacity tracking and utilization alerts
- Stock transfers between warehouses
- Warehouse manager assignment

### 6. Procurement System
- Supplier management with payment terms
- Purchase order creation and approval workflow
- Receiving voucher processing with variance tracking
- Automatic inventory batch creation from receipts

### 7. Sales & POS System
- Sales order management with stock validation
- Integrated POS with product search and cart management
- Multiple payment methods (Cash, Card, Check, GCash, Online Transfer)
- Receipt generation and printing
- Sales order to POS conversion
- Discount application and change calculation

### 8. Financial Management
- Accounts receivable from sales transactions
- Accounts payable from purchase receipts
- Payment recording and tracking
- Aging analysis for AR/AP
- Expense management by category
- Financial reporting (P&L, balance sheet, cash flow)

### 9. Alert System
- Low stock alerts based on minimum levels
- Expiring product alerts (30 days warning)
- Expired product notifications
- Warehouse capacity alerts
- Overdue payment alerts

### 10. Analytics & Reporting
- Real-time dashboard with KPIs
- Sales performance metrics and trends
- Inventory valuation and analytics
- Branch comparison reports
- Comprehensive reporting with CSV export
- Date range and branch filtering

## Database Schema Requirements
Implement the complete Prisma schema with all entities, relationships, and indexes as specified in the PRD. Key entities include:

- Branch, User, Role, Permission
- Product, ProductUOM, Inventory, StockMovement
- Warehouse, PurchaseOrder, ReceivingVoucher
- SalesOrder, POSSale, POSReceipt
- AccountsReceivable, AccountsPayable, Expense
- And all related junction and supporting tables

## API Architecture
- RESTful API design with consistent response formats
- Bearer token authentication
- Comprehensive error handling
- Input validation with Zod
- Pagination for large datasets
- Audit logging for all operations

## UI/UX Requirements
- Modern, responsive design using shadcn/ui components
- Mobile-friendly interface
- Intuitive navigation with sidebar and branch selector
- Consistent styling with Tailwind CSS
- Loading states and error handling
- Toast notifications for user feedback

## Business Logic Implementation
- Weighted average costing calculations
- UOM conversion logic
- FIFO inventory management
- Payment terms and due date calculations
- Tax calculations (12% VAT)
- Discount calculations and validations

## Quality Assurance
- Comprehensive unit tests (>80% coverage)
- Integration tests for critical workflows
- End-to-end tests for POS and major features
- Performance testing and optimization
- Security testing and validation

## Deployment Readiness
- Environment configuration setup
- Database seeding with sample data
- Production build optimization
- Vercel deployment configuration
- Default admin user creation

## Success Criteria
- All functional requirements implemented and working
- All non-functional requirements met (performance, security, etc.)
- Complete feature parity with the original InventoryPro
- Clean, maintainable, and well-documented code
- Successful deployment and operation in production environment

## Implementation Guidelines
1. Start with database schema and authentication foundation
2. Implement core product and inventory management
3. Build procurement and sales workflows
4. Add financial management features
5. Implement analytics and reporting
6. Add alert system and advanced features
7. Comprehensive testing and optimization
8. Production deployment and documentation

Begin implementation following this roadmap, ensuring each phase builds upon the previous one and all requirements are met.