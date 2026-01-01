import { PageHeader } from '@/components/shared/page-header';

export default function ExpensesPage() {
  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track business expenses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Expenses' },
        ]}
      />

      <div className="text-muted-foreground">
        Expense tracking coming soon...
      </div>
    </div>
  );
}
