import { PageHeader } from '@/components/shared/page-header';

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate comprehensive business reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
      />

      <div className="text-muted-foreground">
        Reporting module coming soon...
      </div>
    </div>
  );
}
