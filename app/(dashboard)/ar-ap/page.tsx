import { PageHeader } from '@/components/shared/page-header';

export default function ARAPPage() {
  return (
    <div>
      <PageHeader
        title="Accounts Receivable / Payable"
        description="Manage accounts receivable and payable"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AR/AP' },
        ]}
      />

      <div className="text-muted-foreground">
        AR/AP management coming soon...
      </div>
    </div>
  );
}
