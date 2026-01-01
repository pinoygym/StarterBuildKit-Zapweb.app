'use client';

/**
 * Example usage of shared UI components
 * This file demonstrates how to use all shared components
 * Remove this file in production or use it as a reference
 */

import { useState } from 'react';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TableSkeleton, 
  CardSkeleton, 
  FormSkeleton, 
  DashboardSkeleton 
} from './loading-skeleton';
import { ConfirmationDialog } from './confirmation-dialog';
import { EmptyState } from './empty-state';
import { PageHeader } from './page-header';
import { toast } from '@/hooks/use-toast';
import { toastHelpers } from '@/lib/toast-helpers';

export function SharedComponentsExamples() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDestructiveDialog, setShowDestructiveDialog] = useState(false);
  const [showTableSkeleton, setShowTableSkeleton] = useState(false);
  const [showCardSkeleton, setShowCardSkeleton] = useState(false);
  const [showFormSkeleton, setShowFormSkeleton] = useState(false);
  const [showDashboardSkeleton, setShowDashboardSkeleton] = useState(false);

  const handleConfirm = () => {
    toastHelpers.success('Action confirmed!');
    setShowConfirmDialog(false);
  };

  const handleDelete = () => {
    toastHelpers.deleted('Item');
    setShowDestructiveDialog(false);
  };

  const toggleSkeleton = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean
  ) => {
    setter(!current);
    if (!current) {
      setTimeout(() => setter(false), 3000);
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Page Header Example */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Page Header Component</h2>
        <Card>
          <CardContent className="pt-6">
            <PageHeader
              title="Example Page"
              description="This is an example page header with breadcrumbs and actions"
              breadcrumbs={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Examples', href: '/examples' },
                { label: 'Current Page' },
              ]}
              actions={
                <>
                  <Button variant="outline">Secondary Action</Button>
                  <Button>Primary Action</Button>
                </>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Toast Notifications Example */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Toast Notifications</h2>
        <Card>
          <CardHeader>
            <CardTitle>Toast Examples</CardTitle>
            <CardDescription>
              Click buttons to see different toast notifications (max 3 visible, auto-dismiss after 5s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastHelpers.success('Success!', 'Operation completed successfully')}>
                Success Toast
              </Button>
              <Button onClick={() => toastHelpers.error('Error!', 'Something went wrong')} variant="destructive">
                Error Toast
              </Button>
              <Button onClick={() => toastHelpers.info('Info', 'This is an informational message')} variant="outline">
                Info Toast
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastHelpers.created('Product')} variant="secondary">
                Created Toast
              </Button>
              <Button onClick={() => toastHelpers.updated('Product')} variant="secondary">
                Updated Toast
              </Button>
              <Button onClick={() => toastHelpers.deleted('Product')} variant="secondary">
                Deleted Toast
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toastHelpers.createError('Product', 'Name already exists')} variant="outline">
                Create Error
              </Button>
              <Button onClick={() => toastHelpers.validationError('Please fill all required fields')} variant="outline">
                Validation Error
              </Button>
              <Button onClick={() => toastHelpers.insufficientStock('Coca Cola')} variant="outline">
                Stock Error
              </Button>
              <Button onClick={() => toastHelpers.networkError()} variant="outline">
                Network Error
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog Example */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Confirmation Dialogs</h2>
        <Card>
          <CardHeader>
            <CardTitle>Dialog Examples</CardTitle>
            <CardDescription>
              Confirmation dialogs for user actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={() => setShowConfirmDialog(true)}>
                Show Confirmation Dialog
              </Button>
              <Button onClick={() => setShowDestructiveDialog(true)} variant="destructive">
                Show Destructive Dialog
              </Button>
            </div>
          </CardContent>
        </Card>

        <ConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="Confirm Action"
          description="Are you sure you want to proceed with this action?"
          confirmText="Confirm"
          cancelText="Cancel"
          onConfirm={handleConfirm}
          variant="default"
        />

        <ConfirmationDialog
          open={showDestructiveDialog}
          onOpenChange={setShowDestructiveDialog}
          title="Delete Item"
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          variant="destructive"
        />
      </div>

      {/* Empty State Example */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Empty State Component</h2>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Package}
              title="No items found"
              description="Get started by creating your first item. It only takes a few seconds."
              actionLabel="Create Item"
              onAction={() => toastHelpers.info('Create action clicked')}
            />
          </CardContent>
        </Card>
      </div>

      {/* Loading Skeletons Example */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Loading Skeleton Components</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Table Skeleton</CardTitle>
              <CardDescription>Loading state for tables</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => toggleSkeleton(setShowTableSkeleton, showTableSkeleton)}
                className="mb-4"
              >
                {showTableSkeleton ? 'Hide' : 'Show'} Table Skeleton
              </Button>
              {showTableSkeleton && <TableSkeleton rows={5} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card Skeleton</CardTitle>
              <CardDescription>Loading state for cards</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => toggleSkeleton(setShowCardSkeleton, showCardSkeleton)}
                className="mb-4"
              >
                {showCardSkeleton ? 'Hide' : 'Show'} Card Skeleton
              </Button>
              {showCardSkeleton && <CardSkeleton />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Skeleton</CardTitle>
              <CardDescription>Loading state for forms</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => toggleSkeleton(setShowFormSkeleton, showFormSkeleton)}
                className="mb-4"
              >
                {showFormSkeleton ? 'Hide' : 'Show'} Form Skeleton
              </Button>
              {showFormSkeleton && <FormSkeleton />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Skeleton</CardTitle>
              <CardDescription>Loading state for dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => toggleSkeleton(setShowDashboardSkeleton, showDashboardSkeleton)}
                className="mb-4"
              >
                {showDashboardSkeleton ? 'Hide' : 'Show'} Dashboard Skeleton
              </Button>
              {showDashboardSkeleton && (
                <div className="scale-50 origin-top-left">
                  <DashboardSkeleton />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
