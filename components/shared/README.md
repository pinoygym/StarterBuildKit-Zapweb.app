# Shared UI Components

This directory contains reusable UI components that are used across the InventoryPro application. These components follow the design system requirements and provide consistent user experience.

## Components

### 1. Loading Skeleton

Loading skeleton components for different layouts while data is being fetched.

**Usage:**

```tsx
import { TableSkeleton, CardSkeleton, FormSkeleton, DashboardSkeleton } from '@/components/shared/loading-skeleton';

// In your component
function ProductList() {
  const { data, isLoading } = useProducts();
  
  if (isLoading) {
    return <TableSkeleton rows={10} />;
  }
  
  return <ProductTable data={data} />;
}
```

**Available Skeletons:**
- `TableSkeleton` - For table layouts (customizable row count)
- `CardSkeleton` - For card layouts
- `FormSkeleton` - For form layouts
- `DashboardSkeleton` - For dashboard with stats and charts

### 2. Toast Notifications

Toast notification system for user feedback. Positioned at top-right corner, max 3 visible, auto-dismiss after 5 seconds.

**Usage:**

```tsx
import { toast } from '@/hooks/use-toast';
import { toastHelpers } from '@/lib/toast-helpers';

// Basic usage
toast({
  title: "Success",
  description: "Product created successfully",
});

// Error toast
toast({
  title: "Error",
  description: "Failed to create product",
  variant: "destructive",
});

// Using helpers (recommended)
toastHelpers.success("Product created successfully");
toastHelpers.error("Failed to create product");
toastHelpers.created("Product");
toastHelpers.createError("Product", "Name already exists");
```

**Helper Functions:**
- `toastHelpers.success(message, description?)` - Success notification
- `toastHelpers.error(message, description?)` - Error notification
- `toastHelpers.info(message, description?)` - Info notification
- `toastHelpers.created(entityName)` - Entity created
- `toastHelpers.updated(entityName)` - Entity updated
- `toastHelpers.deleted(entityName)` - Entity deleted
- `toastHelpers.createError(entityName, error?)` - Create error
- `toastHelpers.updateError(entityName, error?)` - Update error
- `toastHelpers.deleteError(entityName, error?)` - Delete error
- `toastHelpers.fetchError(entityName, error?)` - Fetch error
- `toastHelpers.validationError(message?)` - Validation error
- `toastHelpers.networkError()` - Network error
- `toastHelpers.insufficientStock(productName)` - Stock error
- `toastHelpers.permissionError()` - Permission error

### 3. Confirmation Dialog

Alert dialog for confirming destructive actions.

**Usage:**

```tsx
'use client';

import { useState } from 'react';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';

function DeleteButton({ productId }: { productId: string }) {
  const [showDialog, setShowDialog] = useState(false);
  
  const handleDelete = async () => {
    // Perform delete action
    await deleteProduct(productId);
    setShowDialog(false);
  };
  
  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="destructive">
        Delete
      </Button>
      
      <ConfirmationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
```

**Props:**
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - State change handler
- `title: string` - Dialog title
- `description: string` - Dialog description
- `confirmText?: string` - Confirm button text (default: "Continue")
- `cancelText?: string` - Cancel button text (default: "Cancel")
- `onConfirm: () => void` - Confirm action handler
- `variant?: 'default' | 'destructive'` - Button variant (default: "default")

### 4. Empty State

Empty state component with icon, message, and optional action button.

**Usage:**

```tsx
import { EmptyState } from '@/components/shared/empty-state';
import { Package } from 'lucide-react';

function ProductList() {
  const { data } = useProducts();
  
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No products found"
        description="Get started by creating your first product"
        actionLabel="Create Product"
        onAction={() => router.push('/products/new')}
      />
    );
  }
  
  return <ProductTable data={data} />;
}
```

**Props:**
- `icon: LucideIcon` - Icon component from lucide-react
- `title: string` - Empty state title
- `description: string` - Empty state description
- `actionLabel?: string` - Action button label (optional)
- `onAction?: () => void` - Action button handler (optional)

### 5. Page Header

Page header component with title, description, breadcrumbs, and actions.

**Usage:**

```tsx
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog with multiple units of measure"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Products' },
        ]}
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        }
      />
      
      {/* Page content */}
    </div>
  );
}
```

**Props:**
- `title: string` - Page title
- `description?: string` - Page description (optional)
- `breadcrumbs?: { label: string; href?: string }[]` - Breadcrumb navigation (optional)
- `actions?: ReactNode` - Action buttons or elements (optional)

## Design System Compliance

All components follow the design system requirements:

- **Consistent Spacing**: Uses 4px increment spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
- **Typography**: Consistent heading hierarchy (h1, h2, h3) and body text sizes
- **Color Palette**: Uses semantic colors (primary, secondary, success, warning, danger)
- **Toast Positioning**: Top-right corner (Requirement 16.16)
- **Toast Limit**: Maximum 3 visible at a time (Requirement 16.17)
- **Toast Auto-dismiss**: 5 seconds (Requirement 16.17)
- **Loading States**: Skeleton loaders matching content layout (Requirement 16.13)
- **Empty States**: Icon, message, and call-to-action (Requirement 16.14)
- **Confirmation Dialogs**: For destructive actions (Requirement 12.8)
- **Page Layout**: Title, breadcrumbs, actions, and content area (Requirement 16.18)

## Requirements Mapping

- **12.6**: Loading skeleton loaders during page transitions ✓
- **12.7**: Toast notifications for success and error feedback ✓
- **12.8**: Confirmation dialogs for destructive actions ✓
- **12.9**: Empty states with helpful messages ✓
- **16.13**: Consistent loading states using skeleton loaders ✓
- **16.14**: Consistent empty states with icon, message, and CTA ✓
- **16.15**: Consistent error states (via toast notifications) ✓
- **16.16**: Toast notification positioning at top-right corner ✓
- **16.17**: Limit toast notifications to 3 visible with auto-dismiss after 5 seconds ✓
- **16.18**: Consistent page layouts with title, breadcrumbs, actions, and content ✓
