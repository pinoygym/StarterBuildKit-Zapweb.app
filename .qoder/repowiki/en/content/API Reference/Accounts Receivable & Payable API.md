# Accounts Receivable & Payable API

<cite>
**Referenced Files in This Document**   
- [ar.types.ts](file://types/ar.types.ts)
- [ap.types.ts](file://types/ap.types.ts)
- [ar.service.ts](file://services/ar.service.ts)
- [ap.service.ts](file://services/ap.service.ts)
- [route.ts](file://app/api/ar/route.ts)
- [route.ts](file://app/api/ap/route.ts)
- [payment/route.ts](file://app/api/ar/[id]/payment/route.ts)
- [payment/route.ts](file://app/api/ap/[id]/payment/route.ts)
- [aging-report/route.ts](file://app/api/ar/aging-report/route.ts)
- [aging-report/route.ts](file://app/api/ap/aging-report/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Endpoints](#core-endpoints)
3. [ARInvoice and APIBill Response Schemas](#arinvoice-and-apibill-response-schemas)
4. [Payment Application Process](#payment-application-process)
5. [Aging Report Endpoints](#aging-report-endpoints)
6. [Integration with Sales/Purchase Orders and Financial Reporting](#integration-with-salespurchase-orders-and-financial-reporting)
7. [Reconciliation Scenarios and Error Handling](#reconciliation-scenarios-and-error-handling)
8. [Usage Examples](#usage-examples)

## Introduction
The Accounts Receivable (AR) and Accounts Payable (AP) modules provide a comprehensive API for managing customer invoices and supplier bills. These modules support full lifecycle management of receivables and payables, including creation, payment processing, and aging analysis. The system is designed to integrate seamlessly with sales and purchase order workflows, automatically creating AR records for credit sales and AP records when purchase orders are received. The API supports partial payments, overpayment handling, and provides detailed aging reports for collections management and financial analysis.

**Section sources**
- [ar.types.ts](file://types/ar.types.ts#L1-L58)
- [ap.types.ts](file://types/ap.types.ts#L1-L59)

## Core Endpoints
The AR and AP modules expose RESTful endpoints for managing invoices and bills. Both modules follow the same pattern with symmetric endpoints.

### AR Endpoints
- **GET /api/ar**: Retrieve all AR records with optional filters by branchId, status, customerName, and date range
- **POST /api/ar**: Create a new AR record for a customer invoice
- **GET /api/ar/[id]**: Retrieve a specific AR record by ID
- **POST /api/ar/[id]/payment**: Record a payment against an AR invoice
- **GET /api/ar/aging-report**: Generate aging report for accounts receivable

### AP Endpoints
- **GET /api/ap**: Retrieve all AP records with optional filters by branchId, supplierId, status, and date range
- **POST /api/ap**: Create a new AP record for a supplier bill
- **GET /api/ap/[id]**: Retrieve a specific AP record by ID
- **POST /api/ap/[id]/payment**: Record a payment against an AP bill
- **GET /api/ap/aging-report**: Generate aging report for accounts payable

The endpoints support standard HTTP status codes and return consistent JSON responses with success status, data, and error messages. All endpoints include comprehensive error handling for validation failures and server errors.

**Section sources**
- [route.ts](file://app/api/ar/route.ts#L1-L64)
- [route.ts](file://app/api/ap/route.ts#L1-L63)
- [payment/route.ts](file://app/api/ar/[id]/payment/route.ts#L1-L40)
- [payment/route.ts](file://app/api/ap/[id]/payment/route.ts#L1-L39)

## ARInvoice and APIBill Response Schemas
The AR and AP modules use standardized response schemas that include comprehensive information about invoices and bills.

### ARInvoice Schema
The ARInvoice response extends the AccountsReceivable model with related payments and branch information:
- **id**: Unique identifier for the AR record
- **branchId**: Reference to the branch associated with the invoice
- **customerName**: Name of the customer
- **salesOrderId**: Optional reference to the originating sales order
- **totalAmount**: Total invoice amount
- **paidAmount**: Amount already paid
- **balance**: Outstanding balance (totalAmount - paidAmount)
- **dueDate**: Payment due date
- **status**: Current status (pending, partial, paid, overdue)
- **createdAt**: Record creation timestamp
- **payments**: Array of payment records associated with the invoice
- **branch**: Branch information including name and location

### APIBill Schema
The APIBill response extends the AccountsPayable model with related payments, supplier, and branch information:
- **id**: Unique identifier for the AP record
- **branchId**: Reference to the branch associated with the bill
- **supplierId**: Reference to the supplier
- **purchaseOrderId**: Optional reference to the originating purchase order
- **totalAmount**: Total bill amount
- **paidAmount**: Amount already paid
- **balance**: Outstanding balance (totalAmount - paidAmount)
- **dueDate**: Payment due date
- **status**: Current status (pending, partial, paid, overdue)
- **createdAt**: Record creation timestamp
- **payments**: Array of payment records associated with the bill
- **branch**: Branch information including name and location
- **supplier**: Supplier information including company name and payment terms

Both schemas use Decimal type for monetary values to ensure precision in financial calculations.

**Section sources**
- [ar.types.ts](file://types/ar.types.ts#L1-L58)
- [ap.types.ts](file://types/ap.types.ts#L1-L59)

## Payment Application Process
The payment application process allows recording payments against invoices and bills, supporting both full and partial payments.

### Payment Creation Input
The PaymentCreateInput interface defines the required fields for recording payments:
- **arId/apId**: Identifier of the invoice or bill to apply the payment to
- **amount**: Payment amount (must be greater than 0 and not exceed the outstanding balance)
- **paymentMethod**: Method of payment (e.g., Cash, Check, Bank Transfer, Credit Card)
- **referenceNumber**: Optional payment reference or transaction number
- **paymentDate**: Date when the payment was made

### Payment Processing Logic
When a payment is recorded, the system performs the following operations in a database transaction:
1. Validates the payment amount against the outstanding balance
2. Creates a payment record with the provided details
3. Updates the invoice/bill balance and paid amount
4. Updates the status based on the remaining balance:
   - If balance equals zero: status changes to "paid"
   - If balance is less than total but greater than zero: status changes to "partial"
   - If due date has passed and balance is greater than zero: status changes to "overdue"

The system supports partial payments, allowing customers to pay a portion of their outstanding balance. Overpayments are prevented by validating that the payment amount does not exceed the outstanding balance.

**Section sources**
- [ar.service.ts](file://services/ar.service.ts#L22-L82)
- [ap.service.ts](file://services/ap.service.ts#L43-L99)
- [ar.types.ts](file://types/ar.types.ts#L43-L49)
- [ap.types.ts](file://types/ap.types.ts#L44-L50)

## Aging Report Endpoints
The aging report endpoints provide detailed analysis of outstanding balances grouped by due period, essential for collections management and financial analysis.

### Report Structure
The aging report categorizes outstanding balances into four time buckets:
- **0-30 days**: Current receivables/payables
- **31-60 days**: Overdue by 1-2 months
- **61-90 days**: Overdue by 2-3 months
- **90+ days**: Overdue by more than 3 months

### AR Aging Report
The AR aging report endpoint (GET /api/ar/aging-report) returns:
- **buckets**: Array of aging buckets with count and total amount for each period
- **totalOutstanding**: Sum of all outstanding receivables
- **byCustomer**: Breakdown of outstanding balances by customer, including total amount and aging distribution

### AP Aging Report
The AP aging report endpoint (GET /api/ap/aging-report) returns:
- **buckets**: Array of aging buckets with count and total amount for each period
- **totalOutstanding**: Sum of all outstanding payables
- **bySupplier**: Breakdown of outstanding balances by supplier, including total amount and aging distribution

Both reports support optional branch filtering to analyze outstanding balances for specific branches. The reports are calculated based on the difference between the current date and the due date of each invoice or bill.

**Section sources**
- [ar.service.ts](file://services/ar.service.ts#L97-L161)
- [ap.service.ts](file://services/ap.service.ts#L114-L177)
- [ar.types.ts](file://types/ar.types.ts#L19-L33)
- [ap.types.ts](file://types/ap.types.ts#L20-L34)
- [aging-report/route.ts](file://app/api/ar/aging-report/route.ts#L1-L20)
- [aging-report/route.ts](file://app/api/ap/aging-report/route.ts#L1-L20)

## Integration with Sales/Purchase Orders and Financial Reporting
The AR and AP modules are designed to integrate seamlessly with other financial systems and reporting tools.

### Sales Order Integration
The AR module integrates with the sales order system by:
- Automatically creating AR records when sales orders are marked as credit sales
- Linking AR invoices to their originating sales orders via the salesOrderId field
- Using the same branch context to ensure proper financial segregation
- Supporting the full order-to-cash cycle from order creation to payment collection

### Purchase Order Integration
The AP module integrates with the purchase order system by:
- Automatically creating AP records when purchase orders are received
- Calculating due dates based on supplier payment terms (Net 15, Net 30, Net 60, COD)
- Linking AP bills to their originating purchase orders via the purchaseOrderId field
- Supporting the procure-to-pay cycle from order placement to payment processing

### Financial Reporting Integration
Both modules support financial reporting by:
- Providing summary endpoints for key metrics (total outstanding, paid amounts, overdue amounts)
- Exposing detailed transaction data for audit and reconciliation
- Using precise decimal arithmetic for all financial calculations
- Supporting date-range filtering for period-based reporting
- Integrating with the dashboard module to display KPIs such as outstanding receivables and payables

The integration ensures data consistency across the financial system and enables comprehensive financial analysis and reporting.

**Section sources**
- [ar.service.ts](file://services/ar.service.ts#L7-L19)
- [ap.service.ts](file://services/ap.service.ts#L7-L20)
- [specs\inventory-pro-system\requirements.md](file://specs/inventory-pro-system/requirements.md#L268-L287)
- [TASK-COMPLETION-STATUS.md](file://TASK-COMPLETION-STATUS.md#L95-L264)

## Reconciliation Scenarios and Error Handling
The AR and AP modules include robust error handling and reconciliation mechanisms to ensure data integrity and prevent common accounting errors.

### Duplicate Payment Prevention
The system prevents duplicate payments through:
- Validation that payment amount does not exceed the outstanding balance
- Database transaction isolation to prevent race conditions
- Error messages that clearly indicate when a payment amount exceeds the balance
- Status updates that reflect partial payments without allowing overpayment

### Invalid Invoice Reference Handling
When an invalid invoice or bill reference is provided:
- The system returns a 404 Not Found error for non-existent records
- Input validation ensures required fields are present before processing
- Detailed error messages help identify the specific validation failure
- Server-side validation complements client-side validation for security

### Error Response Structure
All endpoints return standardized error responses:
- **success**: Boolean indicating operation success
- **error**: Descriptive error message
- **status**: Appropriate HTTP status code (400 for client errors, 500 for server errors)

Common error scenarios include:
- Missing required fields (400 Bad Request)
- Invalid payment amounts (400 Bad Request)
- Non-existent invoice/bill references (400 Bad Request)
- Server processing errors (500 Internal Server Error)

The error handling system logs detailed error information for troubleshooting while returning user-friendly messages to the client.

**Section sources**
- [ar.service.ts](file://services/ar.service.ts#L29-L41)
- [ap.service.ts](file://services/ap.service.ts#L49-L59)
- [route.ts](file://app/api/ar/route.ts#L36-L63)
- [route.ts](file://app/api/ap/route.ts#L35-L62)
- [payment/route.ts](file://app/api/ar/[id]/payment/route.ts#L11-L17)
- [payment/route.ts](file://app/api/ap/[id]/payment/route.ts#L11-L16)

## Usage Examples
This section provides practical examples of using the AR and AP API endpoints.

### Recording a Customer Payment Against an Invoice
To record a payment against a customer invoice:

1. Make a POST request to `/api/ar/{invoiceId}/payment`
2. Include the payment details in the request body:
```json
{
  "amount": 500.00,
  "paymentMethod": "Bank Transfer",
  "referenceNumber": "BTX-2025-001",
  "paymentDate": "2025-01-15T00:00:00Z"
}
```
3. The system will:
   - Validate that the payment amount does not exceed the invoice balance
   - Create a payment record
   - Update the invoice balance and status
   - Return the updated invoice with the new balance and payment history

### Generating an Aging Report for Collections Follow-up
To generate an aging report for collections management:

1. Make a GET request to `/api/ar/aging-report`
2. Optionally include a branchId parameter to filter by branch
3. The system will return a response containing:
   - Aging buckets with counts and totals for each period
   - Total outstanding receivables
   - Breakdown by customer with their total outstanding and aging distribution

This report can be used by collections teams to prioritize follow-up activities, focusing on customers with the oldest outstanding balances.

**Section sources**
- [payment/route.ts](file://app/api/ar/[id]/payment/route.ts#L1-L40)
- [aging-report/route.ts](file://app/api/ar/aging-report/route.ts#L1-L20)
- [ar.service.ts](file://services/ar.service.ts#L22-L82)
- [ar.service.ts](file://services/ar.service.ts#L97-L161)