# Backend Architecture

<cite>
**Referenced Files in This Document**   
- [prisma.ts](file://lib/prisma.ts)
- [product.repository.ts](file://repositories/product.repository.ts)
- [inventory.repository.ts](file://repositories/inventory.repository.ts)
- [product.service.ts](file://services/product.service.ts)
- [inventory.service.ts](file://services/inventory.service.ts)
- [route.ts](file://app/api/products/route.ts)
- [add-stock/route.ts](file://app/api/inventory/add-stock/route.ts)
- [deduct-stock/route.ts](file://app/api/inventory/deduct-stock/route.ts)
- [transfer/route.ts](file://app/api/inventory/transfer/route.ts)
- [errors.ts](file://lib/errors.ts)
- [product.validation.ts](file://lib/validations/product.validation.ts)
</cite>

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Layered Architecture](#layered-architecture)
3. [Request Flow](#request-flow)
4. [Repository Pattern Implementation](#repository-pattern-implementation)
5. [Service Layer Implementation](#service-layer-implementation)
6. [Complex Operations and Transactions](#complex-operations-and-transactions)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Dependency Chain](#dependency-chain)

## Architecture Overview

The backend architecture follows a clean architecture pattern with distinct layers: API routes, service layer, repository layer, and data access through Prisma ORM. This separation ensures business logic is decoupled from HTTP concerns and database operations are abstracted through type-safe interfaces.

```mermaid
graph TB
A["API Routes\n(app/api/)"] --> B["Service Layer\n(services/)"]
B --> C["Repository Layer\n(repositories/)"]
C --> D["Prisma Client\n(lib/prisma.ts)"]
D --> E["Database\n(PostgreSQL)"]
```

**Diagram sources**
- [prisma.ts](file://lib/prisma.ts)
- [product.service.ts](file://services/product.service.ts)
- [inventory.service.ts](file://services/inventory.service.ts)
- [product.repository.ts](file://repositories/product.repository.ts)
- [inventory.repository.ts](file://repositories/inventory.repository.ts)

## Layered Architecture

The application implements a three-tier architecture with clear separation of concerns:

1. **API Layer**: Handles HTTP requests and responses
2. **Service Layer**: Contains business logic, validation, and transaction management
3. **Repository Layer**: Abstracts database operations with type-safe interfaces

This pattern ensures that business rules are not tied to HTTP concerns and database access is encapsulated in dedicated classes.

**Section sources**
- [product.service.ts](file://services/product.service.ts#L1-L193)
- [inventory.service.ts](file://services/inventory.service.ts#L1-L504)
- [product.repository.ts](file://repositories/product.repository.ts#L1-L127)
- [inventory.repository.ts](file://repositories/inventory.repository.ts#L1-L375)

## Request Flow

The request flow follows a consistent pattern across all endpoints:

1. API route receives HTTP request
2. Route handler parses and validates input
3. Service layer is called with validated data
4. Service executes business logic and calls repository methods
5. Repository performs database operations via Prisma
6. Response flows back through the same layers

For example, when creating a product:
```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "API Route"
participant Service as "ProductService"
participant Repository as "ProductRepository"
participant DB as "Prisma Client"
Client->>API : POST /api/products
API->>Service : createProduct(data)
Service->>Service : Validate input
Service->>Service : Check for duplicate name
Service->>Repository : create(data)
Repository->>DB : prisma.product.create()
DB-->>Repository : Created product
Repository-->>Service : ProductWithUOMs
Service-->>API : Created product
API-->>Client : 201 Created
```

**Diagram sources**
- [route.ts](file://app/api/products/route.ts)
- [product.service.ts](file://services/product.service.ts#L29-L65)
- [product.repository.ts](file://repositories/product.repository.ts#L58-L74)

## Repository Pattern Implementation

The repository pattern is implemented with dedicated classes for each domain entity, providing type-safe interfaces for database operations. Each repository abstracts Prisma operations and provides methods for common CRUD operations and queries.

Key features of the repository implementation:
- Type-safe methods using TypeScript interfaces
- Encapsulation of Prisma client operations
- Query building with proper filtering and sorting
- Inclusion of related entities through Prisma's include feature

```mermaid
classDiagram
class ProductRepository {
+findAll(filters? : ProductFilters) : Promise~ProductWithUOMs[]~
+findById(id : string) : Promise~ProductWithUOMs | null~
+findByName(name : string) : Promise~Product | null~
+findActive() : Promise~ProductWithUOMs[]~
+create(data : CreateProductInput) : Promise~ProductWithUOMs~
+update(id : string, data : UpdateProductInput) : Promise~ProductWithUOMs~
+delete(id : string) : Promise~Product~
+updateStatus(id : string, status : 'active' | 'inactive') : Promise~Product~
}
class InventoryRepository {
+findAllBatches(filters? : InventoryBatchFilters) : Promise~InventoryBatchWithRelations[]~
+findBatchById(id : string) : Promise~InventoryBatchWithRelations | null~
+findActiveBatches(productId : string, warehouseId : string) : Promise~InventoryBatch[]~
+createBatch(data : CreateInventoryBatchInput) : Promise~InventoryBatch~
+updateBatch(id : string, data : UpdateInventoryBatchInput) : Promise~InventoryBatch~
+getTotalStockByProduct(productId : string, warehouseId? : string) : Promise~number~
+getExpiringBatches(daysUntilExpiry : number) : Promise~InventoryBatchWithRelations[]~
+getExpiredBatches() : Promise~InventoryBatchWithRelations[]~
}
ProductRepository --> "uses" prisma : PrismaClient
InventoryRepository --> "uses" prisma : PrismaClient
```

**Diagram sources**
- [product.repository.ts](file://repositories/product.repository.ts#L5-L123)
- [inventory.repository.ts](file://repositories/inventory.repository.ts#L13-L371)
- [prisma.ts](file://lib/prisma.ts)

## Service Layer Implementation

The service layer encapsulates business logic, validation, and transaction management. Each service class coordinates operations between repositories and enforces business rules.

Key responsibilities of service classes:
- Input validation using Zod schemas
- Business rule enforcement (e.g., preventing deletion of active products)
- Transaction management for complex operations
- Coordination between multiple repositories when needed
- Error handling with domain-specific exceptions

```mermaid
classDiagram
class ProductService {
+getAllProducts(filters? : ProductFilters) : Promise~ProductWithUOMs[]~
+getProductById(id : string) : Promise~ProductWithUOMs~
+getActiveProducts() : Promise~ProductWithUOMs[]~
+createProduct(data : CreateProductInput) : Promise~ProductWithUOMs~
+updateProduct(id : string, data : UpdateProductInput) : Promise~ProductWithUOMs~
+deleteProduct(id : string) : Promise~void~
+toggleProductStatus(id : string) : Promise~Product~
+getProductUOMs(productId : string) : Promise~{ name : string; sellingPrice : number }[]~
+getUOMSellingPrice(productId : string, uomName : string) : Promise~number~
}
class InventoryService {
+generateBatchNumber() : Promise~string~
+calculateWeightedAverageCost(productId : string, warehouseId : string) : Promise~number~
+convertToBaseUOM(productId : string, quantity : number, uom : string) : Promise~number~
+getCurrentStockLevel(productId : string, warehouseId : string) : Promise~number~
+addStock(data : AddStockInput) : Promise~InventoryBatch~
+deductStock(data : DeductStockInput) : Promise~void~
+transferStock(data : TransferStockInput) : Promise~void~
+getStockLevel(productId : string, warehouseId : string) : Promise~StockLevel | null~
+getTotalStock(productId : string, warehouseId? : string) : Promise~number~
}
ProductService --> "depends on" ProductRepository
InventoryService --> "depends on" InventoryRepository
InventoryService --> "depends on" ProductService
```

**Diagram sources**
- [product.service.ts](file://services/product.service.ts#L11-L189)
- [inventory.service.ts](file://services/inventory.service.ts#L16-L500)
- [product.repository.ts](file://repositories/product.repository.ts)
- [inventory.repository.ts](file://repositories/inventory.repository.ts)

## Complex Operations and Transactions

Complex operations involving multiple model updates are handled within database transactions to ensure data consistency. The Prisma client's transaction feature is used to group related operations.

### Inventory Stock Adjustment Example

When adding stock to inventory, the system performs multiple operations within a single transaction:
1. Create a new inventory batch
2. Record a stock movement of type "IN"
3. Generate a unique batch number
4. Calculate expiry date based on product shelf life

```mermaid
flowchart TD
Start([Add Stock Request]) --> ValidateInput["Validate Product Exists"]
ValidateInput --> ConvertUOM["Convert Quantity to Base UOM"]
ConvertUOM --> ValidateQuantity["Validate Quantity > 0"]
ValidateQuantity --> ValidateCost["Validate Unit Cost > 0"]
ValidateCost --> GenerateBatch["Generate Batch Number"]
GenerateBatch --> CalculateExpiry["Calculate Expiry Date"]
CalculateExpiry --> BeginTransaction["Begin Transaction"]
BeginTransaction --> CreateBatch["Create Inventory Batch"]
CreateBatch --> RecordMovement["Record Stock Movement (IN)"]
RecordMovement --> Commit["Commit Transaction"]
Commit --> ReturnResult["Return Created Batch"]
ReturnResult --> End([Success])
ValidationError --> HandleError["Return Validation Error"]
HandleError --> EndError([Error Response])
```

**Diagram sources**
- [add-stock/route.ts](file://app/api/inventory/add-stock/route.ts)
- [inventory.service.ts](file://services/inventory.service.ts#L115-L180)
- [inventory.repository.ts](file://repositories/inventory.repository.ts)

### Warehouse Transfer Example

Transferring stock between warehouses involves a more complex transaction with multiple steps:
1. Deduct stock from source warehouse using FIFO (First In, First Out) logic
2. Record stock movement OUT from source warehouse
3. Create new batch in destination warehouse with weighted average cost
4. Record stock movement IN to destination warehouse

```mermaid
flowchart TD
Start([Transfer Stock Request]) --> ValidateWarehouses["Validate Source ≠ Destination"]
ValidateWarehouses --> ValidateProduct["Validate Product Exists"]
ValidateProduct --> ConvertUOM["Convert Quantity to Base UOM"]
ConvertUOM --> CheckAvailability["Check Stock Availability in Source"]
CheckAvailability --> CalculateCost["Calculate Weighted Average Cost"]
CalculateCost --> BeginTransaction["Begin Transaction"]
BeginTransaction --> DeductSource["Deduct from Source Warehouse (FIFO)"]
DeductSource --> RecordOut["Record Stock Movement OUT"]
RecordOut --> CreateDestination["Create New Batch in Destination"]
CreateDestination --> RecordIn["Record Stock Movement IN"]
RecordIn --> Commit["Commit Transaction"]
Commit --> ReturnSuccess["Return Success"]
ReturnSuccess --> End([Success])
ValidationError --> HandleError["Return Validation Error"]
HandleError --> EndError([Error Response])
```

**Diagram sources**
- [transfer/route.ts](file://app/api/inventory/transfer/route.ts)
- [inventory.service.ts](file://services/inventory.service.ts#L263-L383)
- [inventory.repository.ts](file://repositories/inventory.repository.ts)

## Error Handling Patterns

The application implements a comprehensive error handling system with domain-specific exceptions that separate business logic errors from HTTP concerns.

### Error Hierarchy

```mermaid
classDiagram
class AppError {
+message : string
+statusCode : number
+code? : string
}
class ValidationError {
+fields? : Record~string, string~
}
class NotFoundError {
}
class InsufficientStockError {
}
AppError <|-- ValidationError
AppError <|-- NotFoundError
AppError <|-- InsufficientStockError
```

**Diagram sources**
- [errors.ts](file://lib/errors.ts)

### Error Handling Flow

When an error occurs in the service layer, it propagates through the call stack to the API route, where it's converted to an appropriate HTTP response:

```mermaid
sequenceDiagram
participant Service as "Service Layer"
participant Repository as "Repository Layer"
participant API as "API Route"
participant Client as "Client"
Service->>Repository : Database operation
Repository->>Service : Throws error
Service->>Service : Enrich with business context
Service->>API : Propagate error
API->>API : Check error type
alt AppError instance
API->>Client : Return error with statusCode
else
API->>Client : Return 500 Internal Server Error
end
```

**Section sources**
- [errors.ts](file://lib/errors.ts)
- [add-stock/route.ts](file://app/api/inventory/add-stock/route.ts#L22-L35)
- [deduct-stock/route.ts](file://app/api/inventory/deduct-stock/route.ts#L17-L30)
- [product.service.ts](file://services/product.service.ts)

## Dependency Chain

The dependency chain follows a strict unidirectional flow from top to bottom:

```mermaid
graph TD
A["API Routes\n(e.g., /api/products)"] --> B["Service Classes\n(e.g., ProductService)"]
B --> C["Repository Classes\n(e.g., ProductRepository)"]
C --> D["Prisma Client\n(lib/prisma.ts)"]
D --> E["Database"]
style A fill:#f9f,stroke:#333
style B fill:#bbf,stroke:#333
style C fill:#f96,stroke:#333
style D fill:#6f9,stroke:#333
style E fill:#696,stroke:#333
```

Key dependency rules:
- API routes depend on service classes
- Service classes depend on repository classes
- Repository classes depend on the Prisma client singleton
- No reverse dependencies are allowed
- Services may depend on other services when business logic requires it (e.g., InventoryService depends on ProductService)

The Prisma client is instantiated as a singleton in `lib/prisma.ts` to ensure a single connection pool across the application:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Section sources**
- [prisma.ts](file://lib/prisma.ts)
- [product.service.ts](file://services/product.service.ts)
- [inventory.service.ts](file://services/inventory.service.ts)
- [product.repository.ts](file://repositories/product.repository.ts)
- [inventory.repository.ts](file://repositories/inventory.repository.ts)
- [route.ts](file://app/api/products/route.ts)
- [add-stock/route.ts](file://app/api/inventory/add-stock/route.ts)