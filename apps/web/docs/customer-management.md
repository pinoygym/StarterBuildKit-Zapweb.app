# Customer Management

The Customer Management module provides tools for maintaining detailed profiles of business clients, tracking their credit, and viewing transaction history.

## Key Features

- **Detailed Profiles**: Store company names, contact persons, phone numbers, emails, and physical addresses.
- **Customer Codes**: Automatic generation of unique customer codes (e.g., `CUST-0001`).
- **Credit Limit Tracking**: Set credit limits for customers and automatically check available credit during transactions.
- **Status Management**: Toggle customers between "active" and "inactive" statuses.
- **Soft Deletion**: Customers are marked as inactive rather than physically deleted if they have transaction history.
- **Dashboard Stats**: View real-time statistics for each customer, including outstanding balances and total orders.

## API Endpoints

- `GET /api/customers`: List and filter customers.
- `POST /api/customers`: Create a new customer.
- `GET /api/customers/[id]`: Get detailed customer profile and statistics.
- `PATCH /api/customers/[id]`: Update customer information.
- `DELETE /api/customers/[id]`: Soft delete/deactivate a customer.

## Technical Details

- **Service**: `CustomerService` in `services/customer.service.ts`.
- **Repository**: `CustomerRepository` in `repositories/customer.repository.ts`.
- **Validation**: Uses Zod schemas in `lib/validations/customer.validation.ts` for consistent data integrity.
