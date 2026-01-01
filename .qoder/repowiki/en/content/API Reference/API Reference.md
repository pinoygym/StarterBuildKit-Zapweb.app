# API Reference

<cite>
**Referenced Files in This Document**   
- [route.ts](file://app/api/products/route.ts)
- [route.ts](file://app/api/inventory/route.ts)
- [route.ts](file://app/api/pos/sales/route.ts)
- [route.ts](file://app/api/purchase-orders/route.ts)
- [route.ts](file://app/api/sales-orders/route.ts)
- [product.types.ts](file://types/product.types.ts)
- [inventory.types.ts](file://types/inventory.types.ts)
- [pos.types.ts](file://types/pos.types.ts)
- [purchase-order.types.ts](file://types/purchase-order.types.ts)
- [sales-order.types.ts](file://types/sales-order.types.ts)
- [product.validation.ts](file://lib/validations/product.validation.ts)
- [pos.service.ts](file://services/pos.service.ts)
- [product.service.ts](file://services/product.service.ts)
- [inventory.service.ts](file://services/inventory.service.ts)
- [purchase-order.service.ts](file://services/purchase-order.service.ts)
- [sales-order.service.ts](file://services/sales-order.service.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Products API](#products-api)
3. [Inventory API](#inventory-api)
4. [POS API](#pos-api)
5. [Purchase Orders API](#purchase-orders-api)
6. [Sales Orders API](#sales-orders-api)
7. [Request Validation and Error Handling](#request-validation-and-error-handling)
8. [Authentication and Security](#authentication-and-security)
9. [Rate Limiting and Performance](#rate-limiting-and-performance)
10. [API Usage Examples](#api-usage-examples)

## Introduction
This document provides comprehensive reference documentation for the RESTful API endpoints exposed by the Next.js application. The APIs are organized into logical groups based on business domains: products, inventory, point of sale (POS), purchase orders, and sales orders. Each endpoint follows a consistent pattern of request validation using Zod, integration with service layers for business logic, and structured error responses. All routes are implemented using Next.js App Router's server-side route handlers.

## Products API

The Products API enables management of product catalog data including creation, retrieval, update, and deletion operations. Endpoints are located under `/api/products` and `/api/products/[id]`.

### Endpoints

#### GET /api/products
Retrieves a paginated list of all products. Supports optional query parameters for filtering and sorting.

**Query Parameters**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Text search on product name and SKU
- `category`: Filter by category ID

**Response Schema**
```typescript
Array<ProductListItem>
```

#### GET /api/products/[id]
Retrieves detailed information about a specific product by ID, including pricing, unit of measure configurations, and inventory levels.

**Response Schema**
```typescript
ProductDetail
```

#### POST /api/products
Creates a new product with full configuration including variants, pricing tiers, and UOM settings.

**Request Body**
```typescript
CreateProductInput
```

**Validation**: Uses `product.validation.ts` schema with Zod for comprehensive field validation including:
- Required fields: name, sku, price
- Numeric constraints on price and cost
- Unique SKU enforcement
- UOM configuration rules

#### PUT /api/products/[id]
Updates an existing product's details. Partial updates are supported.

**Request Body**
```typescript
UpdateProductInput
```

#### DELETE /api/products/[id]
Soft deletes a product (marks as inactive). Cannot be performed if the product has existing inventory or transaction history.

**Section sources**
- [route.ts](file://app/api/products/route.ts)
- [product.types.ts](file://types/product.types.ts)
- [product.validation.ts](file://lib/validations/product.validation.ts)
- [product.service.ts](file://services/product.service.ts)

## Inventory API

The Inventory API manages stock levels, movements, and transfers across warehouses and branches.

### Endpoints

#### GET /api/inventory
Returns current stock levels for all products with filtering options by warehouse, branch, or product category.

#### GET /api/inventory/[id]
Gets detailed inventory information for a specific product including:
- Current stock levels by location
- Recent movement history
- Reorder status

#### POST /api/inventory/add-stock
Adds stock to inventory through manual adjustment or receipt of goods.

**Request Body**
```typescript
AddStockInput
```

#### POST /api/inventory/deduct-stock
Removes stock from inventory for reasons such as damage or loss.

**Request Body**
```typescript
DeductStockInput
```

#### POST /api/inventory/transfer
Transfers inventory between warehouses or branches.

**Request Body**
```typescript
TransferStockInput
```

#### GET /api/inventory/stock-levels
Retrieves current stock levels with low-stock alerts.

**Response Schema**
```typescript
StockLevelReport
```

#### GET /api/inventory/movements
Returns inventory movement history with filtering by date range, location, and movement type.

**Section sources**
- [route.ts](file://app/api/inventory/route.ts)
- [inventory.types.ts](file://types/inventory.types.ts)
- [inventory.service.ts](file://services/inventory.service.ts)

## POS API

The Point of Sale API handles retail transactions, pending orders, and daily sales reporting.

### Endpoints

#### POST /api/pos/sales
Processes a complete POS sale with support for multiple payment methods, discounts, and tax calculations.

**Request Body**
```typescript
PosSaleInput
```

Includes support for:
- Multiple payment methods (cash, card, mobile)
- Split payments
- Customer association
- Discount applications
- Tax-inclusive pricing

#### GET /api/pos/sales/today-summary
Retrieves summary statistics for today's sales including:
- Total revenue
- Number of transactions
- Average order value
- Payment method distribution

**Response Schema**
```typescript
TodaySalesSummary
```

#### GET /api/pos/pending-orders
Lists all currently pending POS orders that have been saved but not completed.

#### GET /api/pos/products
Retrieves product data optimized for POS interface including pricing, images, and quick-search capabilities.

#### GET /api/pos/sales/[id]
Retrieves detailed information about a specific completed sale including:
- Line items
- Payment breakdown
- Receipt data
- Associated customer (if any)

**Section sources**
- [route.ts](file://app/api/pos/sales/route.ts)
- [pos.types.ts](file://types/pos.types.ts)
- [pos.service.ts](file://services/pos.service.ts)

## Purchase Orders API

Manages the procurement workflow from order creation to receipt of goods.

### Endpoints

#### GET /api/purchase-orders
Retrieves list of purchase orders with status filtering (draft, sent, partially received, completed, cancelled).

#### POST /api/purchase-orders
Creates a new purchase order with supplier, items, quantities, and pricing.

**Request Body**
```typescript
CreatePurchaseOrderInput
```

#### GET /api/purchase-orders/[id]
Retrieves detailed purchase order information including:
- Order items
- Supplier details
- Delivery information
- Receipt history

#### POST /api/purchase-orders/[id]/receive
Records receipt of goods against a purchase order. Can be partial receipt.

**Request Body**
```typescript
ReceivePurchaseOrderInput
```

#### POST /api/purchase-orders/[id]/cancel
Cancels a purchase order that has not been fully received.

**Section sources**
- [route.ts](file://app/api/purchase-orders/route.ts)
- [purchase-order.types.ts](file://types/purchase-order.types.ts)
- [purchase-order.service.ts](file://services/purchase-order.service.ts)

## Sales Orders API

Handles customer sales orders from creation to fulfillment.

### Endpoints

#### GET /api/sales-orders
Retrieves list of sales orders with status filtering (pending, confirmed, partially shipped, completed, cancelled).

#### POST /api/sales-orders
Creates a new sales order with customer, items, and shipping details.

**Request Body**
```typescript
CreateSalesOrderInput
```

#### GET /api/sales-orders/[id]
Retrieves detailed sales order information including:
- Order items
- Customer details
- Shipping information
- Fulfillment history

#### POST /api/sales-orders/[id]/cancel
Cancels a sales order that has not been shipped.

#### GET /api/sales-orders/pending
Retrieves sales orders that require fulfillment action.

**Section sources**
- [route.ts](file://app/api/sales-orders/route.ts)
- [sales-order.types.ts](file://types/sales-order.types.ts)
- [sales-order.service.ts](file://services/sales-order.service.ts)

## Request Validation and Error Handling

All API routes implement consistent validation and error handling patterns using Zod and centralized error types.

### Validation Process
1. Request data is validated against Zod schemas defined in `lib/validations/`
2. Validation occurs for:
   - Request body (POST, PUT)
   - URL parameters
   - Query string parameters
3. First error encountered is returned with detailed message

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error description",
    "details": {
      "field": "Invalid field name",
      "value": "Submitted value"
    }
  }
}
```

### Status Codes
| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation failure |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Business logic conflict (e.g., duplicate SKU) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

**Section sources**
- [errors.ts](file://lib/errors.ts)
- [product.validation.ts](file://lib/validations/product.validation.ts)
- [purchase-order.validation.ts](file://lib/validations/purchase-order.validation.ts)

## Authentication and Security

The API implements security best practices to protect data and prevent common vulnerabilities.

### Authentication
- All endpoints require authentication via Bearer token
- Tokens are issued through separate authentication flow
- Role-based access control (RBAC) enforces permissions
- Sensitive operations require elevated privileges

### Input Sanitization
- All string inputs are sanitized to prevent XSS
- Database queries use parameterized statements
- File uploads are validated for type and size
- Content-Type headers are strictly enforced

### Security Headers
API responses include security headers:
- Strict-Transport-Security
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Content-Security-Policy

**Section sources**
- [middleware configuration in Next.js]
- [authentication service implementation]

## Rate Limiting and Performance

The API implements rate limiting to prevent abuse and ensure system stability.

### Rate Limiting Strategy
- 100 requests per minute per authenticated user
- Burst capacity of up to 20 additional requests
- Headers indicate rate limit status:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time until reset (UTC timestamp)

### Performance Considerations
- Caching of frequently accessed data (product catalog, inventory levels)
- Database indexing on commonly queried fields
- Pagination for collection endpoints (default 20 items)
- Efficient querying through Prisma ORM

## API Usage Examples

### Creating a Product with UOM Configuration
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Coffee Beans",
    "sku": "COFF-001",
    "price": 24.99,
    "cost": 12.50,
    "uomConfig": {
      "baseUom": "kg",
      "conversionFactors": {
        "g": 0.001,
        "lb": 0.4536
      }
    },
    "category": "beverages"
  }'
```

### Processing a POS Sale with Multiple Payment Methods
```javascript
const response = await fetch('/api/pos/sales', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      { productId: 'PROD-001', quantity: 2, price: 24.99 },
      { productId: 'PROD-002', quantity: 1, price: 8.99 }
    ],
    payments: [
      { method: 'cash', amount: 50.00 },
      { method: 'card', amount: 9.97 }
    ],
    customer: 'CUST-001'
  })
});
```

### Checking Inventory Stock Levels
```bash
curl "http://localhost:3000/api/inventory/stock-levels?warehouse=WH-001&minStock=10" \
  -H "Authorization: Bearer <token>"
```

### Creating a Purchase Order
```javascript
fetch('/api/purchase-orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    supplierId: 'SUP-001',
    items: [
      { productId: 'PROD-001', quantity: 100, unitPrice: 12.50 },
      { productId: 'PROD-003', quantity: 50, unitPrice: 8.75 }
    ],
    expectedDelivery: "2025-12-01"
  })
});
```